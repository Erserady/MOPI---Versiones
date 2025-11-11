#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import urllib.request
import json

url = "http://localhost:8000/api/users/login/"
data = {
    "username": "Restaurante",
    "password": "Contraseña123"
}

req = urllib.request.Request(
    url,
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print('✅ Success:', response.read().decode())
except urllib.error.HTTPError as e:
    print(f'❌ Error {e.code}')
    print('Response:', e.read().decode())
