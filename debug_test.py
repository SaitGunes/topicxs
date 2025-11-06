#!/usr/bin/env python3
"""
Debug specific failing tests
"""

import requests
import json

BASE_URL = "https://drivercommunity.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def debug_duplicate_registration():
    print("=== Testing Duplicate Registration ===")
    
    # First registration
    user_data1 = {
        "username": "debug_user_test",
        "email": "debug1@example.com",
        "password": "SecurePass123!",
        "full_name": "Debug User 1"
    }
    
    response1 = requests.post(f"{BASE_URL}/auth/register", headers=HEADERS, json=user_data1)
    print(f"First registration - Status: {response1.status_code}")
    print(f"First registration - Response: {response1.text}")
    
    # Second registration with same username
    user_data2 = {
        "username": "debug_user_test",  # Same username
        "email": "debug2@example.com",
        "password": "SecurePass123!",
        "full_name": "Debug User 2"
    }
    
    response2 = requests.post(f"{BASE_URL}/auth/register", headers=HEADERS, json=user_data2)
    print(f"Duplicate registration - Status: {response2.status_code}")
    print(f"Duplicate registration - Response: {response2.text}")

def debug_invalid_login():
    print("\n=== Testing Invalid Login ===")
    
    login_data = {
        "username": "nonexistent_user",
        "password": "WrongPassword"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", headers=HEADERS, json=login_data)
    print(f"Invalid login - Status: {response.status_code}")
    print(f"Invalid login - Response: {response.text}")

def debug_unauthorized_access():
    print("\n=== Testing Unauthorized Access ===")
    
    # Try to access protected endpoint without token
    response = requests.get(f"{BASE_URL}/auth/me", headers=HEADERS)
    print(f"No auth - Status: {response.status_code}")
    print(f"No auth - Response: {response.text}")
    
    # Try with invalid token
    headers_with_invalid_token = HEADERS.copy()
    headers_with_invalid_token["Authorization"] = "Bearer invalid_token_here"
    
    response2 = requests.get(f"{BASE_URL}/auth/me", headers=headers_with_invalid_token)
    print(f"Invalid token - Status: {response2.status_code}")
    print(f"Invalid token - Response: {response2.text}")

if __name__ == "__main__":
    debug_duplicate_registration()
    debug_invalid_login()
    debug_unauthorized_access()