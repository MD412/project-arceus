import json
import pathlib
import pytest

from worker.pokemon_tcg_api import identify_card_from_crop

# Directory containing image crops and json metadata
FIXTURES_DIR = pathlib.Path(__file__).resolve().parents[2] / "worker" / "test_fixtures"

# Build param list: (image_path, meta_path)
params = []
for img_path in FIXTURES_DIR.glob("*.*"):
    if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        continue
    meta_path = img_path.with_suffix(".json")
    if meta_path.exists():
        params.append((img_path, meta_path))

if not params:
    pytest.skip(
        "No test fixtures found in worker/test_fixtures — add images plus matching .json files to enable OCR tests.",
        allow_module_level=True,
    )


@pytest.mark.parametrize("img_path,meta_path", params)
def test_identify_card_from_crop(img_path: pathlib.Path, meta_path: pathlib.Path):
    """Verify OCR + enrichment identifies the expected card name (substring match)."""
    expected = json.loads(meta_path.read_text())
    expected_name = expected.get("name")
    assert expected_name, f"Fixture meta file {meta_path.name} must contain a 'name' field."

    result = identify_card_from_crop(str(img_path))

    assert result.get("success"), f"Identification failed for {img_path.name}: {result.get('error')}"
    actual_name = result.get("name", "").lower()
    assert expected_name.lower() in actual_name, (
        f"Expected '{expected_name}' in result name '{actual_name}' for {img_path.name}"
    ) 