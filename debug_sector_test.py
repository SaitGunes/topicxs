#!/usr/bin/env python3
"""
Debug Chat Sector Isolation Issue
"""

import requests
import json
import time
from datetime import datetime

# API Configuration
BASE_URL = "https://topicx-app.preview.emergentagent.com/api"

def make_request(method, endpoint, data=None, headers=None, token=None):
    """Make HTTP request with proper error handling"""
    url = f"{BASE_URL}{endpoint}"
    
    # Set up headers
    request_headers = {"Content-Type": "application/json"}
    if headers:
        request_headers.update(headers)
    if token:
        request_headers["Authorization"] = f"Bearer {token}"
        
    try:
        session = requests.Session()
        if method.upper() == "GET":
            response = session.get(url, headers=request_headers, params=data)
        elif method.upper() == "POST":
            response = session.post(url, headers=request_headers, json=data)
        elif method.upper() == "PUT":
            response = session.put(url, headers=request_headers, json=data)
        elif method.upper() == "DELETE":
            response = session.delete(url, headers=request_headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except Exception as e:
        print(f"Request error: {e}")
        return None

def debug_chat_sector():
    print("🔍 Debugging Chat Sector Isolation Issue")
    print("=" * 50)
    
    # Create test users
    timestamp = str(int(time.time()))
    
    # Create drivers sector user
    drivers_user_data = {
        "username": f"debugdrivers_{timestamp}",
        "email": f"debugdrivers_{timestamp}@test.com",
        "password": "TestPass123!",
        "full_name": "Debug Drivers User",
        "bio": "Debug user for drivers sector",
        "current_sector": "drivers"
    }
    
    print("Creating drivers user...")
    response = make_request("POST", "/auth/register", drivers_user_data)
    if not (response and response.status_code == 200):
        print(f"❌ Failed to create drivers user: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return
    
    drivers_token = response.json()["access_token"]
    drivers_user_id = response.json()["user"]["id"]
    print(f"✅ Created drivers user: {drivers_user_id}")
    
    # Create sports sector user
    sports_user_data = {
        "username": f"debugsports_{timestamp}",
        "email": f"debugsports_{timestamp}@test.com",
        "password": "TestPass123!",
        "full_name": "Debug Sports User",
        "bio": "Debug user for sports sector",
        "current_sector": "sports"
    }
    
    print("Creating sports user...")
    response = make_request("POST", "/auth/register", sports_user_data)
    if not (response and response.status_code == 200):
        print(f"❌ Failed to create sports user: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return
    
    sports_token = response.json()["access_token"]
    sports_user_id = response.json()["user"]["id"]
    print(f"✅ Created sports user: {sports_user_id}")
    
    # Test 1: Create chat in drivers sector
    print("\n🚗 Testing drivers sector chat creation...")
    drivers_chat_data = {
        "user_id": sports_user_id,
        "sector": "drivers"
    }
    
    print(f"Request data: {json.dumps(drivers_chat_data, indent=2)}")
    response = make_request("POST", "/chats", data=drivers_chat_data, token=drivers_token)
    
    if response:
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response data: {json.dumps(data, indent=2)}")
            print(f"Chat sector: {data.get('sector')}")
            drivers_chat_id = data.get("id")
        else:
            print(f"Error response: {response.text}")
            return
    else:
        print("❌ No response received")
        return
    
    # Test 2: Create chat in sports sector
    print("\n⚽ Testing sports sector chat creation...")
    sports_chat_data = {
        "user_id": drivers_user_id,
        "sector": "sports"
    }
    
    print(f"Request data: {json.dumps(sports_chat_data, indent=2)}")
    response = make_request("POST", "/chats", data=sports_chat_data, token=sports_token)
    
    if response:
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response data: {json.dumps(data, indent=2)}")
            print(f"Chat sector: {data.get('sector')}")
            sports_chat_id = data.get("id")
        else:
            print(f"Error response: {response.text}")
            return
    else:
        print("❌ No response received")
        return
    
    # Test 3: Check if existing chat logic is the issue
    print("\n🔍 Testing existing chat logic...")
    print("Trying to create the same sports chat again...")
    
    response = make_request("POST", "/chats", data=sports_chat_data, token=sports_token)
    
    if response:
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response data: {json.dumps(data, indent=2)}")
            print(f"Chat sector: {data.get('sector')}")
            print(f"Is this the same chat ID? {data.get('id') == sports_chat_id if 'sports_chat_id' in locals() else 'N/A'}")
        else:
            print(f"Error response: {response.text}")
    else:
        print("❌ No response received")
    
    # Test 4: Check what chats exist for each user
    print("\n📋 Checking existing chats...")
    
    print("Drivers user chats (drivers sector):")
    response = make_request("GET", "/chats", data={"sector": "drivers"}, token=drivers_token)
    if response and response.status_code == 200:
        chats = response.json()
        print(f"Found {len(chats)} chats:")
        for chat in chats:
            print(f"  - ID: {chat.get('id')}, Sector: {chat.get('sector')}, Members: {chat.get('members')}")
    
    print("\nSports user chats (sports sector):")
    response = make_request("GET", "/chats", data={"sector": "sports"}, token=sports_token)
    if response and response.status_code == 200:
        chats = response.json()
        print(f"Found {len(chats)} chats:")
        for chat in chats:
            print(f"  - ID: {chat.get('id')}, Sector: {chat.get('sector')}, Members: {chat.get('members')}")
    
    print("\nDrivers user chats (sports sector):")
    response = make_request("GET", "/chats", data={"sector": "sports"}, token=drivers_token)
    if response and response.status_code == 200:
        chats = response.json()
        print(f"Found {len(chats)} chats:")
        for chat in chats:
            print(f"  - ID: {chat.get('id')}, Sector: {chat.get('sector')}, Members: {chat.get('members')}")

if __name__ == "__main__":
    debug_chat_sector()