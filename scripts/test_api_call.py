import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(".env.local")

CARD_ID = "sm7-90"
API_URL = f"https://api.pokemontcg.io/v2/cards/{CARD_ID}"
API_KEY = os.getenv("POKEMONTCG_API_KEY")

headers = {
    "X-Api-Key": API_KEY
} if API_KEY else {}

print(f"Requesting card '{CARD_ID}' from {API_URL}...")
if API_KEY:
    print("Using API Key.")
else:
    print("No API Key found.")

try:
    response = requests.get(API_URL, headers=headers, timeout=20)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response JSON:")
        print(response.json())
    else:
        print("Response Text:")
        print(response.text)
except Exception as e:
    print(f"An error occurred: {e}") 