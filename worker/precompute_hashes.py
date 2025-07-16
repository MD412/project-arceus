import requests
from PIL import Image
import io
from imagehash import phash
from config import supabase_client
from pokemon_tcg_api import PokemonTCGAPI, HASH_KEY_FIELD

api = PokemonTCGAPI()

# Get all cards (paginated)
page = 1
while True:
    cards = api.search_cards(f'page:{page} pageSize:250')
    if not cards:
        break
    
    for card in cards:
        cand_id = card['id']
        # Check if already cached
        if supabase_client.from_('card_hashes').select('phash').eq(HASH_KEY_FIELD, cand_id).execute().data:
            continue
        
        img_url = card['images']['large']
        img_data = requests.get(img_url).content
        cand_img = Image.open(io.BytesIO(img_data))
        cand_hash = phash(cand_img)
        supabase_client.from_('card_hashes').insert({HASH_KEY_FIELD: cand_id, 'phash': str(cand_hash)}).execute()
        print(f"Cached {card['name']}")
    
    page += 1 