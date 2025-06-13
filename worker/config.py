import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

def load_environment():
    """
    Find and load the .env.local file from the project root.
    Handles being run from any subdirectory.
    """
    # In production (like Render), environment variables are set directly.
    # We only need to load a .env file for local development.
    if os.getenv('RENDER'):
        print("✅ Running in Render environment. Skipping .env file.")
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
            print(f"✅ Loading environment from: {dotenv_path}")
            load_dotenv(dotenv_path=dotenv_path, override=True)
            return
    
    print("⚠️  .env.local not found. Relying on container environment variables.")


def get_supabase_client() -> Client:
    """
    Initialize and return a Supabase client using environment variables.
    """
    load_environment()
    
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_service_key:
        print("🔥 Critical: Missing Supabase environment variables!")
        print("Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
        exit(1)

    # Debug logging
    print(f"🔍 Supabase URL: {supabase_url}")
    print(f"🔑 Service key length: {len(supabase_service_key)}, starts with: {supabase_service_key[:20]}...")

    print("Initializing Supabase client...")
    try:
        client: Client = create_client(supabase_url, supabase_service_key)
        print("✅ Supabase client initialized successfully.")
        
        # Test the client with a simple query
        print("🧪 Testing client with a simple query...")
        try:
            test_response = client.from_("job_queue").select("count").execute()
            print("✅ Test query successful - client is working!")
        except Exception as test_error:
            print(f"❌ Test query failed: {test_error}")
            
        return client
    except Exception as e:
        print(f"🔥 Failed to initialize Supabase client: {e}")
        exit(1)

# Initialize client once to be imported by other scripts
supabase_client = get_supabase_client() 