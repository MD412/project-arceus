import os
from dotenv import load_dotenv
from pathlib import Path
import supabase

# Load environment variables
project_root = Path(__file__).resolve().parent.parent
dotenv_path = project_root / '.env.local'

if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path, override=True)
    print(f"✅ Loaded environment variables from: {dotenv_path}")
else:
    print(f"❌ .env.local file not found at {dotenv_path}")
    exit(1)

# Test connection
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"🔗 Testing connection to: {url}")
print(f"🔑 Using service key: {key[:20]}..." if key else "❌ No service key found")

if not url or not key:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

try:
    client = supabase.create_client(url, key)
    print("✅ Supabase client created successfully!")
    
    # Test a simple query to verify the connection works
    result = client.table('cards').select('count').execute()
    print("✅ Database connection test successful!")
    print(f"📊 Cards table accessible")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    exit(1)

print("🎉 All tests passed! Your credentials are working correctly.") 