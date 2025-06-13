import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

def load_environment():
    """
    Find and load the .env.local file from the project root.
    Handles being run from any subdirectory.
    """
    # Start from the current file's directory and move up until we find the project root
    current_path = Path(__file__).resolve()
    project_root = None
    for parent in current_path.parents:
        if (parent / ".git").exists() or (parent / "app").exists():
            project_root = parent
            break
    
    if project_root:
        dotenv_path = project_root / '.env.local'
        if dotenv_path.exists():
            print(f"✅ Loading environment from: {dotenv_path}")
            load_dotenv(dotenv_path=dotenv_path, override=True)
            return
    
    print("⚠️ Could not find .env.local, checking parent directories...")
    # Fallback for simple cases if the above fails
    try:
        dotenv_path = Path(__file__).parent.parent / '.env.local'
        if dotenv_path.exists():
            print(f"✅ Loading environment from fallback path: {dotenv_path}")
            load_dotenv(dotenv_path=dotenv_path, override=True)
            return
    except Exception:
        pass

    print("⚠️  .env.local not found. Continuing with environment variables set in the container…")

def get_supabase_client() -> Client:
    """
    Initialize and return a Supabase client with service role key.
    """
    load_environment()
    
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_service_key:
        print("🔥 Missing Supabase environment variables!")
        print("Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY")
        exit(1)

    print("Initializing Supabase client...")
    try:
        client: Client = create_client(supabase_url, supabase_service_key)
        print("✅ Supabase client initialized successfully.")
        return client
    except Exception as e:
        print(f"🔥 Failed to initialize Supabase client: {e}")
        exit(1)

# Initialize client once to be imported by other scripts
supabase_client = get_supabase_client() 