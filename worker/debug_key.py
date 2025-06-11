import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
project_root = Path(__file__).resolve().parent.parent
dotenv_path = project_root / '.env.local'
load_dotenv(dotenv_path=dotenv_path, override=True)

key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"🔍 Key length: {len(key) if key else 'None'}")
print(f"🔍 Key starts with: {key[:20] if key else 'None'}")
print(f"🔍 Key ends with: {key[-20:] if key else 'None'}")
print(f"🔍 Key has newlines: {repr(key.count(chr(10))) if key else 'None'}")
print(f"🔍 Key has carriage returns: {repr(key.count(chr(13))) if key else 'None'}")

# Check for common JWT format
if key and key.startswith('eyJ'):
    parts = key.split('.')
    print(f"🔍 JWT parts count: {len(parts)} (should be 3)")
    print(f"🔍 Part 1 length: {len(parts[0])}")
    print(f"🔍 Part 2 length: {len(parts[1]) if len(parts) > 1 else 'Missing'}")
    print(f"🔍 Part 3 length: {len(parts[2]) if len(parts) > 2 else 'Missing'}")
else:
    print("❌ Key doesn't look like a JWT token")

# Print raw bytes to check for encoding issues
if key:
    print(f"🔍 Raw key (first 50 chars): {repr(key[:50])}") 