#!/usr/bin/env python3
"""
Find the correct TCGdx API domain by testing common patterns
"""

import requests

# Common API domain patterns for tcgdx.dev
test_domains = [
    "https://api.tcgdx.dev/v2",
    "https://tcgdx.dev/api/v2", 
    "https://api.tcgdx.net/v2",
    "https://tcgdx.net/api/v2",
    "https://api.tcgdx.com/v2",
    "https://tcgdx.com/api/v2"
]

print("🔍 Testing TCGdx API domains...")

for domain in test_domains:
    test_url = f"{domain}/en/cards"
    try:
        print(f"Testing: {test_url}")
        response = requests.get(test_url, timeout=10)
        print(f"  ✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  🎉 SUCCESS! Found {len(data)} cards")
            print(f"  📍 Working API base: {domain}")
            
            # Show sample data
            if data and len(data) > 0:
                sample = data[0]
                print(f"  📋 Sample response type: {type(sample)}")
                if isinstance(sample, dict):
                    print(f"  📋 Sample keys: {list(sample.keys())}")
                else:
                    print(f"  📋 Sample value: {sample}")
            break
            
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n🏁 Test complete") 