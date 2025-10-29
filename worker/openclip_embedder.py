import os
from typing import Optional

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageOps

import open_clip

_CLIP_MEAN = (0.48145466, 0.4578275, 0.40821073)
_CLIP_STD = (0.26862954, 0.26130258, 0.27577711)


def set_torch_deterministic(seed: int = 1337):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def _resize_short_side_keep_ar(img: Image.Image, target_short: int = 336) -> Image.Image:
    w, h = img.size
    if w <= 0 or h <= 0:
        raise ValueError("Invalid image size")
    if w < h:
        new_w = target_short
        new_h = int(round(h * (target_short / w)))
    else:
        new_h = target_short
        new_w = int(round(w * (target_short / h)))
    return img.resize((new_w, new_h), resample=Image.Resampling.BICUBIC)


def _pad_to_square_center(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = max(w, h)
    delta_w = side - w
    delta_h = side - h
    padding = (delta_w // 2, delta_h // 2, delta_w - (delta_w // 2), delta_h - (delta_h // 2))
    return ImageOps.expand(img, padding, fill=0)


def _to_clip_tensor(img: Image.Image, device: torch.device) -> torch.Tensor:
    arr = np.asarray(img).astype("float32") / 255.0
    if arr.ndim == 2:
        arr = np.repeat(arr[..., None], 3, axis=2)
    if arr.shape[2] == 4:
        rgb = arr[..., :3] * arr[..., 3:4] + (1.0 - arr[..., 3:4]) * 0.0
        arr = rgb
    chw = np.transpose(arr, (2, 0, 1))
    for c in range(3):
        chw[c] = (chw[c] - _CLIP_MEAN[c]) / _CLIP_STD[c]
    t = torch.from_numpy(chw).unsqueeze(0).to(device)
    return t


def strict_preprocess(pil: Image.Image, target_short: int = 336) -> Image.Image:
    if pil.mode not in ("RGB", "RGBA"):
        pil = pil.convert("RGB")
    resized = _resize_short_side_keep_ar(pil, target_short)
    squared = _pad_to_square_center(resized)
    if squared.size != (target_short, target_short):
        squared = squared.resize((target_short, target_short), resample=Image.Resampling.BICUBIC)
    return squared


class OpenClipEmbedder:
    """
    ViT-L/14@336 image embedder with strict transforms and 2-view TTA.
    Output: L2-normalized float32 numpy vector of dim=768.
    """

    def __init__(
        self,
        model_name: str = "ViT-L-14-336",
        pretrained: str = "openai",
        target_short: int = 336,
        use_cuda_if_available: bool = True,
        deterministic_seed: int = 1337,
    ) -> None:
        set_torch_deterministic(deterministic_seed)

        device = (
            torch.device("cuda")
            if (use_cuda_if_available and torch.cuda.is_available())
            else torch.device("cpu")
        )
        self.device = device
        self.target_short = target_short

        # Set persistent cache directory for model weights
        cache_dir = os.getenv("OPENCLIP_CACHE_DIR", "/tmp/open_clip")
        os.makedirs(cache_dir, exist_ok=True)

        model, _, _ = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained, cache_dir=cache_dir
        )
        self.model = model.eval().to(device)
        with torch.no_grad():
            self._embed_dim = (
                self.model.text_projection.shape[1]
                if hasattr(self.model, "text_projection")
                else 768
            )
        if self._embed_dim != 768:
            print(f"[openclip_embedder] Warning: embed dim is {self._embed_dim}, not 768.")

    @staticmethod
    def _l2(x: torch.Tensor) -> torch.Tensor:
        return F.normalize(x, dim=-1)

    @torch.no_grad()
    def embed(self, pil: Image.Image, tta_views: int = 2) -> np.ndarray:
        base = strict_preprocess(pil, target_short=self.target_short)
        views = [base]
        if tta_views >= 2:
            views.append(base.transpose(Image.FLIP_LEFT_RIGHT))

        embs = []
        for v in views:
            t = _to_clip_tensor(v, self.device)
            e = self.model.encode_image(t).float()
            e = self._l2(e)
            embs.append(e)

        e_mean = torch.mean(torch.cat(embs, dim=0), dim=0, keepdim=True)
        e_out = self._l2(e_mean).squeeze(0)
        return e_out.cpu().numpy().astype("float32")
    
    @torch.no_grad()
    def embed_image_bytes(self, image_bytes: bytes, tta_views: int = 2) -> np.ndarray:
        """Embed image from raw bytes (for processing downloaded crops)."""
        from io import BytesIO
        pil = Image.open(BytesIO(image_bytes))
        return self.embed(pil, tta_views=tta_views)

    @property
    def embed_dim(self) -> int:
        return self._embed_dim

    @property
    def device_str(self) -> str:
        return str(self.device)


def build_default_embedder() -> OpenClipEmbedder:
    use_cuda = os.getenv("USE_CUDA_IF_AVAILABLE", "1") == "1"
    return OpenClipEmbedder(
        model_name="ViT-L-14-336",
        pretrained="openai",  # ViT-L-14-336 DOES exist on OpenAI
        target_short=336,
        use_cuda_if_available=use_cuda,
        deterministic_seed=1337,
    )


# Alias for consistency with other parts of codebase
OpenCLIPEmbedder = OpenClipEmbedder



