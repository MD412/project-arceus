import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path
from urllib.parse import urlparse

def load_environment():
    """
    Find and load the .env.local file from the project root.
    Handles being run from any subdirectory.
    """
    # In production (like Render), environment variables are set directly.
    # We only need to load a .env file for local development.
    if os.getenv('RENDER'):
        print("[OK] Running in Render environment. Skipping .env file.")
        return

    current_path = Path(__file__).resolve()
    project_root = None
    for parent in current_path.parents:
        if (parent / ".git").exists() or (parent / "app").exists():
            project_root = parent
            break
    
    if project_root:
        dotenv_path = project_root / '.env.local'
        if dotenv_path.exists():
            print(f"[OK] Loading environment from: {dotenv_path}")
            load_dotenv(dotenv_path=dotenv_path, override=True)
            return
    
    print("[WARN] .env.local not found. Relying on container environment variables.")


def _clean_env_value(raw: str | None) -> str:
    """Sanitize environment variable strings: strip whitespace/quotes and remove newlines."""
    if not raw:
        return ""
    cleaned = raw.strip().strip("\"\"").strip("'\'")
    # Remove any stray newlines/carriage returns that may slip in from dashboard copy/paste
    cleaned = cleaned.replace("\r", "").replace("\n", "")
    return cleaned


def _validate_url(url: str) -> None:
    """Raise ValueError if URL is clearly invalid."""
    parsed = urlparse(url)
    if not (parsed.scheme in ("http", "https") and parsed.netloc):
        raise ValueError(f"Invalid Supabase URL after sanitization: '{url}'")


def get_supabase_client() -> Client:
    """
    Initialize and return a Supabase client using environment variables.
    """
    load_environment()
    
    supabase_url = _clean_env_value(os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
    supabase_service_key = _clean_env_value(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

    if not supabase_url or not supabase_service_key:
        print("[ERROR] Critical: Missing Supabase environment variables!")
        print("Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
        # exit(1) # This terminates the process abruptly
        raise ValueError("Missing Supabase environment variables.")

    # Normalize and validate URL; avoid leaking secrets in logs
    try:
        _validate_url(supabase_url)
    except ValueError as url_err:
        print(f"[ERROR] {url_err}")
        raise

    # Debug logging (do not print full secrets)
    print(f"[DEBUG] Supabase URL (sanitized): {supabase_url}")
    print(f"[DEBUG] Service key length: {len(supabase_service_key)}, starts with: {supabase_service_key[:20]}...")

    print("Initializing Supabase client...")
    try:
        client: Client = create_client(supabase_url, supabase_service_key)
        print("[OK] Supabase client initialized successfully.")
        
        # Test the client with a simple query
        print("[TEST] Testing client with a simple query...")
        try:
            test_response = client.from_("job_queue").select("id").limit(1).execute()
            print("[OK] Test query successful - client is working!")
        except Exception as test_error:
            print(f"[ERROR] Test query failed: {test_error}")
            raise  # Re-raise the exception to be caught by the caller
            
        return client
    except Exception as e:
        print(f"[ERROR] Failed to initialize Supabase client: {e}")
        # exit(1) # This terminates the process abruptly
        raise # Re-raise the exception to be caught by the caller

# Do not initialize automatically. The worker script will call get_supabase_client().
# supabase_client = get_supabase_client() 


def is_gpt_fallback_enabled() -> bool:
    """Return True if GPT fallback is enabled (default). Set DISABLE_GPT_FALLBACK=1/true to disable."""
    return os.getenv("DISABLE_GPT_FALLBACK", "false").lower() not in ("1", "true", "yes") 

# ------------------------------
# Vision retrieval configuration
# ------------------------------
# Phase 1: backbone + TTA flags (future-proof for phases 3/4)
VISION_MODEL = os.getenv("VISION_MODEL", "vit_l_14_336")
TTA_VIEWS = int(os.getenv("TTA_VIEWS", "2"))
FUSION_WEIGHTS = tuple(
    float(x) for x in os.getenv("FUSION_WEIGHTS", "0.7,0.3").split(",")
)
UNKNOWN_THRESHOLD = float(os.getenv("UNKNOWN_THRESHOLD", "0.0"))
USE_CUDA_IF_AVAILABLE = os.getenv("USE_CUDA_IF_AVAILABLE", "1") == "1"

# ------------------------------
# Vision retrieval implementation
# ------------------------------
RETRIEVAL_IMPL = os.getenv("RETRIEVAL_IMPL", "legacy").lower()
RETRIEVAL_TOPK = int(os.getenv("RETRIEVAL_TOPK", "100"))  # Must be ≥100 to avoid query planner timeout
SET_PREFILTER = os.getenv("SET_PREFILTER", "0").lower() in ("1", "true", "yes")
