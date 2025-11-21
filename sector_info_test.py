#!/usr/bin/env python3
"""
Specific test for Edit Profile - sector_info Update Endpoint
Testing the exact scenario requested in the review
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://community-sectors.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def test_sector_info_update():
    """Test the sector_info update functionality"""
    print("🔧 Testing Edit Profile - sector_info Update Endpoint")
    print("=" * 60)
    
    session = requests.Session()
    
    # Step 1: Login as admin
    print("Step 1: Logging in as admin...")
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD,
        "current_sector": "drivers"
    }
    
    try:
        response = session.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
        
        data = response.json()
        token = data.get("access_token")
        if not token:
            print("❌ No access token received")
            return False
        
        print(f"✅ Successfully logged in as {ADMIN_USERNAME}")
        
        # Set authorization header
        session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Get current profile and check sector_info
    print("\nStep 2: Getting current user profile...")
    try:
        response = session.get(f"{BASE_URL}/auth/me")
        if response.status_code != 200:
            print(f"❌ Failed to get profile: {response.status_code} - {response.text}")
            return False
        
        initial_profile = response.json()
        initial_sector_info = initial_profile.get("sector_info", {})
        
        print(f"✅ Retrieved profile for user: {initial_profile.get('username')}")
        print(f"   Initial sector_info: {initial_sector_info}")
        
    except Exception as e:
        print(f"❌ Profile retrieval error: {e}")
        return False
    
    # Step 3: Update profile with sector_info data
    print("\nStep 3: Updating profile with sector_info...")
    
    sector_info_data = {
        "drivers": {
            "user_types": [
                {"type": "taxi_driver", "workplace": "Uber Istanbul"},
                {"type": "professional_driver", "workplace": "DHL Turkey"}
            ],
            "custom_type": ""
        }
    }
    
    update_data = {
        "sector_info": sector_info_data
    }
    
    try:
        response = session.put(f"{BASE_URL}/auth/me", json=update_data)
        if response.status_code != 200:
            print(f"❌ Profile update failed: {response.status_code} - {response.text}")
            return False
        
        updated_profile = response.json()
        returned_sector_info = updated_profile.get("sector_info", {})
        
        print("✅ Profile update successful")
        print(f"   Sent data: {sector_info_data}")
        print(f"   Returned data: {returned_sector_info}")
        
        # Verify immediate response
        if returned_sector_info != sector_info_data:
            print("❌ Returned data doesn't match sent data")
            return False
        
        print("✅ Returned data matches sent data")
        
    except Exception as e:
        print(f"❌ Profile update error: {e}")
        return False
    
    # Step 4: Get updated profile again to verify persistence
    print("\nStep 4: Verifying sector_info persistence...")
    try:
        response = session.get(f"{BASE_URL}/auth/me")
        if response.status_code != 200:
            print(f"❌ Failed to get updated profile: {response.status_code} - {response.text}")
            return False
        
        final_profile = response.json()
        final_sector_info = final_profile.get("sector_info", {})
        
        print(f"✅ Retrieved updated profile")
        print(f"   Final sector_info: {final_sector_info}")
        
    except Exception as e:
        print(f"❌ Final profile retrieval error: {e}")
        return False
    
    # Step 5: Verify data structure and content
    print("\nStep 5: Verifying data structure...")
    
    success = True
    issues = []
    
    # Check if sector_info exists and is dict
    if not isinstance(final_sector_info, dict):
        success = False
        issues.append(f"sector_info is not a dict, got {type(final_sector_info)}")
    
    # Check drivers section
    if "drivers" not in final_sector_info:
        success = False
        issues.append("'drivers' key missing from sector_info")
    else:
        drivers_data = final_sector_info["drivers"]
        
        # Check user_types array
        if "user_types" not in drivers_data:
            success = False
            issues.append("'user_types' key missing from drivers section")
        else:
            user_types = drivers_data["user_types"]
            
            # Verify it's an array
            if not isinstance(user_types, list):
                success = False
                issues.append(f"user_types is not an array, got {type(user_types)}")
            else:
                # Verify array length
                if len(user_types) != 2:
                    success = False
                    issues.append(f"Expected 2 user_types, got {len(user_types)}")
                
                # Verify each user_type object
                for i, user_type in enumerate(user_types):
                    if not isinstance(user_type, dict):
                        success = False
                        issues.append(f"user_types[{i}] is not an object, got {type(user_type)}")
                    else:
                        if "type" not in user_type:
                            success = False
                            issues.append(f"user_types[{i}] missing 'type' field")
                        if "workplace" not in user_type:
                            success = False
                            issues.append(f"user_types[{i}] missing 'workplace' field")
        
        # Check custom_type
        if "custom_type" not in drivers_data:
            success = False
            issues.append("'custom_type' key missing from drivers section")
        elif drivers_data["custom_type"] != "":
            success = False
            issues.append(f"custom_type should be empty string, got: {drivers_data['custom_type']}")
    
    # Verify exact data match
    data_matches = final_sector_info == sector_info_data
    if not data_matches:
        success = False
        issues.append("Final data doesn't match expected structure exactly")
    
    if success and data_matches:
        print("✅ Data structure validation passed")
        
        # Additional verification: Check specific values
        drivers_section = final_sector_info["drivers"]
        user_types = drivers_section["user_types"]
        
        # Find and verify specific entries
        taxi_driver = next((ut for ut in user_types if ut["type"] == "taxi_driver"), None)
        professional_driver = next((ut for ut in user_types if ut["type"] == "professional_driver"), None)
        
        if taxi_driver and taxi_driver["workplace"] == "Uber Istanbul":
            print(f"✅ Taxi driver data correct: {taxi_driver}")
        else:
            print(f"❌ Taxi driver data incorrect: {taxi_driver}")
            return False
        
        if professional_driver and professional_driver["workplace"] == "DHL Turkey":
            print(f"✅ Professional driver data correct: {professional_driver}")
        else:
            print(f"❌ Professional driver data incorrect: {professional_driver}")
            return False
        
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ sector_info update functionality is working correctly")
        return True
    else:
        print("❌ Data structure validation failed:")
        for issue in issues:
            print(f"   - {issue}")
        return False

if __name__ == "__main__":
    success = test_sector_info_update()
    sys.exit(0 if success else 1)