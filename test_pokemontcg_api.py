#!/usr/bin/env python3
import requests, os, json
headers = {}
api_key = os.getenv('POKEMONTCG_API_KEY')
if api_key:
    headers['X-Api-Key'] = api_key
url = 'https://api.pokemontcg.io/v2/cards'
params = {'page': 1, 'pageSize': 10}
r = requests.get(url, headers=headers, params=params, timeout=15)
print('status', r.status_code)
print('total', r.headers.get('Total-Count'))
try:
    data = r.json().get('data', [])
    print('len', len(data))
    if data:
        print(data[0])
except Exception as e:
    print('json error', e)
    print(r.text[:500]) 