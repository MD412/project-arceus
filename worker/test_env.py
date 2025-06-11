from env_config import get_supabase_config

def test_environment():
    """Test environment variable loading with proper fallbacks."""
    print("🔍 Testing Environment Configuration")
    print("-----------------------------------")
    
    # Test Supabase config
    supabase_url, supabase_key = get_supabase_config()
    
    if supabase_url and supabase_key:
        # Mask the key for security
        masked_key = f"{supabase_key[:6]}...{supabase_key[-4:]}" if len(supabase_key) > 10 else "***"
        print("✅ Supabase Configuration:")
        print(f"  URL: {supabase_url}")
        print(f"  Key: {masked_key}")
    else:
        print("❌ Supabase Configuration Incomplete")
        print("  Please check your .env.local file contains:")
        print("  - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
        print("  - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY")

if __name__ == "__main__":
    test_environment() 