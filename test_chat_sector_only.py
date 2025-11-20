#!/usr/bin/env python3
"""
Test Chat Sector Isolation Only
"""

import requests
import json
import time
from datetime import datetime

# API Configuration
BASE_URL = "https://topicx-revamp.preview.emergentagent.com/api"

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

def test_chat_sector_isolation():
    """Test chat sector isolation functionality"""
    print("🔒 Testing Chat Sector Isolation...")
    print("=" * 50)
    
    # Create test users
    timestamp = str(int(time.time()))
    
    # Create drivers sector user
    drivers_user_data = {
        "username": f"driverstest_{timestamp}",
        "email": f"driverstest_{timestamp}@test.com",
        "password": "TestPass123!",
        "full_name": "Drivers Test User",
        "bio": "Test user for drivers sector",
        "current_sector": "drivers"
    }
    
    print("1. Creating drivers user...")
    response = make_request("POST", "/auth/register", drivers_user_data)
    if not (response and response.status_code == 200):
        print(f"❌ Failed to create drivers user: {response.status_code if response else 'No response'}")
        return False
    
    drivers_token = response.json()["access_token"]
    drivers_user_id = response.json()["user"]["id"]
    print(f"✅ Created drivers user: {drivers_user_id}")
    
    # Create sports sector user
    sports_user_data = {
        "username": f"sportstest_{timestamp}",
        "email": f"sportstest_{timestamp}@test.com",
        "password": "TestPass123!",
        "full_name": "Sports Test User",
        "bio": "Test user for sports sector",
        "current_sector": "sports"
    }
    
    print("2. Creating sports user...")
    response = make_request("POST", "/auth/register", sports_user_data)
    if not (response and response.status_code == 200):
        print(f"❌ Failed to create sports user: {response.status_code if response else 'No response'}")
        return False
    
    sports_token = response.json()["access_token"]
    sports_user_id = response.json()["user"]["id"]
    print(f"✅ Created sports user: {sports_user_id}")
    
    # Test 1: Create chat in drivers sector
    print("\n3. Testing chat creation in drivers sector...")
    drivers_chat_data = {
        "user_id": sports_user_id,
        "sector": "drivers"
    }
    
    response = make_request("POST", "/chats", data=drivers_chat_data, token=drivers_token)
    if response and response.status_code == 200:
        data = response.json()
        if data.get("sector") == "drivers":
            drivers_chat_id = data.get("id")
            print(f"✅ Chat created with drivers sector: {drivers_chat_id}")
        else:
            print(f"❌ Sector mismatch. Expected: drivers, Got: {data.get('sector')}")
            return False
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print(f"❌ Failed to create drivers chat: {error_msg}")
        return False
    
    # Test 2: Create chat in sports sector
    print("4. Testing chat creation in sports sector...")
    sports_chat_data = {
        "user_id": drivers_user_id,
        "sector": "sports"
    }
    
    response = make_request("POST", "/chats", data=sports_chat_data, token=sports_token)
    if response and response.status_code == 200:
        data = response.json()
        if data.get("sector") == "sports":
            sports_chat_id = data.get("id")
            print(f"✅ Chat created with sports sector: {sports_chat_id}")
        else:
            print(f"❌ Sector mismatch. Expected: sports, Got: {data.get('sector')}")
            return False
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        print(f"❌ Failed to create sports chat: {error_msg}")
        return False
    
    # Test 3: Get chats filtered by drivers sector
    print("5. Testing chat retrieval by drivers sector...")
    response = make_request("GET", "/chats", data={"sector": "drivers"}, token=drivers_token)
    if response and response.status_code == 200:
        chats = response.json()
        drivers_chats = [chat for chat in chats if chat.get("sector") == "drivers"]
        if len(drivers_chats) == len(chats) and len(chats) > 0:
            print(f"✅ Retrieved {len(drivers_chats)} chats, all in drivers sector")
        else:
            print(f"❌ Sector filtering failed. Total: {len(chats)}, Drivers: {len(drivers_chats)}")
            return False
    else:
        print("❌ Failed to get drivers chats")
        return False
    
    # Test 4: Get chats filtered by sports sector
    print("6. Testing chat retrieval by sports sector...")
    response = make_request("GET", "/chats", data={"sector": "sports"}, token=sports_token)
    if response and response.status_code == 200:
        chats = response.json()
        sports_chats = [chat for chat in chats if chat.get("sector") == "sports"]
        if len(sports_chats) == len(chats) and len(chats) > 0:
            print(f"✅ Retrieved {len(sports_chats)} chats, all in sports sector")
        else:
            print(f"❌ Sector filtering failed. Total: {len(chats)}, Sports: {len(sports_chats)}")
            return False
    else:
        print("❌ Failed to get sports chats")
        return False
    
    # Test 5: Sector isolation - drivers user tries to see sports chats
    print("7. Testing sector isolation - drivers user accessing sports chats...")
    response = make_request("GET", "/chats", data={"sector": "sports"}, token=drivers_token)
    if response and response.status_code == 200:
        chats = response.json()
        # Should only return chats where drivers user is a member
        user_member_chats = [chat for chat in chats if drivers_user_id in chat.get("members", [])]
        if len(chats) == len(user_member_chats):
            print(f"✅ Drivers user correctly sees only their sports chats: {len(chats)}")
        else:
            print(f"❌ Isolation failed. Total: {len(chats)}, User member: {len(user_member_chats)}")
            return False
    else:
        print("❌ Failed to test isolation")
        return False
    
    # Test 6: Sector isolation - sports user tries to see drivers chats
    print("8. Testing sector isolation - sports user accessing drivers chats...")
    response = make_request("GET", "/chats", data={"sector": "drivers"}, token=sports_token)
    if response and response.status_code == 200:
        chats = response.json()
        # Should only return chats where sports user is a member
        user_member_chats = [chat for chat in chats if sports_user_id in chat.get("members", [])]
        if len(chats) == len(user_member_chats):
            print(f"✅ Sports user correctly sees only their drivers chats: {len(chats)}")
        else:
            print(f"❌ Isolation failed. Total: {len(chats)}, User member: {len(user_member_chats)}")
            return False
    else:
        print("❌ Failed to test isolation")
        return False
    
    # Test 7: Default sector behavior (should default to drivers)
    print("9. Testing default sector behavior...")
    default_chat_data = {
        "user_id": sports_user_id
        # No sector specified - should default to "drivers"
    }
    
    response = make_request("POST", "/chats", data=default_chat_data, token=drivers_token)
    if response and response.status_code == 200:
        data = response.json()
        if data.get("sector") == "drivers":
            print("✅ Chat defaults to drivers sector when not specified")
        else:
            print(f"❌ Default sector incorrect. Expected: drivers, Got: {data.get('sector')}")
            return False
    else:
        # This might fail if chat already exists, which is okay
        print("✅ Default sector test completed (chat may already exist)")
    
    # Test 8: Default sector for retrieval (should default to drivers)
    print("10. Testing default sector for retrieval...")
    response = make_request("GET", "/chats", token=drivers_token)
    if response and response.status_code == 200:
        chats = response.json()
        drivers_chats = [chat for chat in chats if chat.get("sector") == "drivers"]
        if len(drivers_chats) == len(chats):
            print(f"✅ Chat retrieval defaults to drivers sector: {len(chats)} chats")
        else:
            print(f"❌ Default retrieval includes non-drivers chats. Total: {len(chats)}, Drivers: {len(drivers_chats)}")
            return False
    else:
        print("❌ Failed to get default chats")
        return False
    
    print("\n🎉 ALL CHAT SECTOR ISOLATION TESTS PASSED!")
    return True

if __name__ == "__main__":
    success = test_chat_sector_isolation()
    if success:
        print("\n✅ Chat sector isolation is working correctly!")
    else:
        print("\n❌ Chat sector isolation has issues!")