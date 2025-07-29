#!/usr/bin/env python3
"""
Debug script to understand the GitHub repository structure
"""

import requests
import json

GITHUB_API_BASE = "https://api.github.com/repos/PokemonTCG/pokemon-tcg-data/contents"
CARDS_PATH = "cards/en"

def download_file_from_github(path: str) -> dict:
    """Download a single file from GitHub repository"""
    url = f"{GITHUB_API_BASE}/{path}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    # GitHub API returns file info, we need to get the content
    file_info = response.json()
    if file_info.get("type") == "file":
        # Get the raw content
        content_url = file_info["download_url"]
        content_response = requests.get(content_url, timeout=30)
        content_response.raise_for_status()
        return json.loads(content_response.text)
    else:
        raise ValueError(f"Path {path} is not a file")

def list_files_in_directory(path: str) -> list:
    """List all files in a GitHub directory"""
    url = f"{GITHUB_API_BASE}/{path}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    files = []
    for item in response.json():
        if item["type"] == "file" and item["name"].endswith(".json"):
            files.append(item["name"])
    return files

if __name__ == "__main__":
    print("🔍 Debugging GitHub repository structure...")
    
    # List files
    files = list_files_in_directory(CARDS_PATH)
    print(f"Found {len(files)} files")
    print(f"First 5 files: {files[:5]}")
    
    # Download and examine first file
    if files:
        first_file = files[0]
        print(f"\n📄 Examining {first_file}...")
        
        try:
            data = download_file_from_github(f"{CARDS_PATH}/{first_file}")
            print(f"Type: {type(data)}")
            print(f"Length: {len(data) if isinstance(data, (list, dict)) else 'N/A'}")
            
            if isinstance(data, list):
                print(f"First item type: {type(data[0])}")
                print(f"First item keys: {list(data[0].keys()) if isinstance(data[0], dict) else 'N/A'}")
                print(f"Sample first item: {json.dumps(data[0], indent=2)[:500]}...")
            elif isinstance(data, dict):
                print(f"Keys: {list(data.keys())}")
                print(f"Sample data: {json.dumps(data, indent=2)[:500]}...")
            
        except Exception as e:
            print(f"❌ Error: {e}") 