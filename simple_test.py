#!/usr/bin/env python3
import requests
import json

BASE_URL = "https://driversocial.preview.emergentagent.com/api"

def test_simple_registration():
    print("Testing simple registration...")
    
    user_data = {
        "username": "simple_test_user",
        "email": "simple@example.com",
        "password": "SecurePass123!",
        "full_name": "Simple Test User"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register", 
            json=user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    test_simple_registration()