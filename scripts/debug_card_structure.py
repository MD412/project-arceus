#!/usr/bin/env python3
"""
Debug script to examine card data structure from GitHub repository
"""

import requests
import json

GITHUB_API_BASE = "https://api.github.com/repos/PokemonTCG/pokemon-tcg-data/contents"

def download_file_from_github(path: str) -> dict:
    """Download a single file from GitHub repository"""
    url = f"{GITHUB_API_BASE}/{path}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    # GitHub API returns file info, we need to get the content
    file_info = response.json()
    
    # Handle both single file and directory listings
    if isinstance(file_info, list):
        # This is a directory listing
        return file_info
    elif isinstance(file_info, dict) and file_info.get("type") == "file":
        # This is a single file
        content_url = file_info["download_url"]
        content_response = requests.get(content_url, timeout=30)
        content_response.raise_for_status()
        return content_response.json()
    else:
        return file_info

def examine_card_structure():
    """Examine the structure of card data"""
    print("🔍 Examining card data structure...")
    
    # Get list of card files
    card_files_response = download_file_from_github("cards/en")
    card_files = [item["name"] for item in card_files_response if item["type"] == "file"]
    
    # Examine first few cards from first file
    if card_files:
        first_file = card_files[0]
        print(f"📄 Examining {first_file}...")
        
        cards_data = download_file_from_github(f"cards/en/{first_file}")
        
        if cards_data and len(cards_data) > 0:
            first_card = cards_data[0]
            print("📋 First card structure:")
            print(json.dumps(first_card, indent=2))
            
            print("\n🔑 Available fields:")
            for key, value in first_card.items():
                print(f"  {key}: {type(value).__name__} = {value}")
            
            # Check if there are multiple cards with different structures
            if len(cards_data) > 1:
                second_card = cards_data[1]
                print(f"\n📋 Second card structure:")
                print(json.dumps(second_card, indent=2))

if __name__ == "__main__":
    examine_card_structure() 