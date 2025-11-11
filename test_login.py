#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para probar el endpoint de login"""

import requests
import json

# URL del endpoint
url = "http://localhost:8000/api/users/login/"

# Credenciales
data = {
    "username": "Restaurante",
    "password": "Contraseña123"
}

print("🔍 Probando login con:")
print(f"   Usuario: {data['username']}")
print(f"   Contraseña: {data['password']}")
print(f"   URL: {url}\n")

try:
    response = requests.post(
        url,
        json=data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"📊 Status Code: {response.status_code}")
    print(f"📝 Response:\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 200:
        print("\n✅ Login exitoso!")
    else:
        print("\n❌ Login fallido!")
        
except requests.exceptions.ConnectionError:
    print("❌ Error: No se pudo conectar al servidor. ¿Está corriendo el backend?")
except Exception as e:
    print(f"❌ Error: {e}")
