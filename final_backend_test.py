#!/usr/bin/env python3
"""
Final Backend API Test Suite for Driver Forum Application
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://trucknet-hub-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def log_test(message, status="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{status}] {message}")

def test_auth_endpoints():
    """Test all authentication endpoints"""
    log_test("=== TESTING AUTHENTICATION ENDPOINTS ===")
    
    results = {}
    
    # Test 1: User Registration
    log_test("Testing user registration...")
    user_data = {
        "username": f"test_driver_{int(time.time())}",
        "email": f"driver{int(time.time())}@example.com",
        "password": "SecurePass123!",
        "full_name": "Test Driver User",
        "bio": "Professional driver with 10 years experience"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            auth_token = data.get("access_token")
            user_id = data.get("user", {}).get("id")
            log_test("✅ Registration successful")
            results["auth_register"] = {"success": True, "token": auth_token, "user_id": user_id}
        else:
            log_test(f"❌ Registration failed: {response.text}")
            results["auth_register"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Registration error: {e}")
        results["auth_register"] = {"success": False}
    
    # Test 2: Duplicate Registration
    log_test("Testing duplicate username registration...")
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data, headers=HEADERS, timeout=10)
        if response.status_code == 400:
            log_test("✅ Duplicate username correctly rejected")
            results["auth_register_duplicate"] = {"success": True}
        else:
            log_test(f"❌ Duplicate should be rejected, got: {response.status_code}")
            results["auth_register_duplicate"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Duplicate test error: {e}")
        results["auth_register_duplicate"] = {"success": False}
    
    # Test 3: Login
    log_test("Testing user login...")
    login_data = {
        "username": user_data["username"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            log_test("✅ Login successful")
            results["auth_login"] = {"success": True}
        else:
            log_test(f"❌ Login failed: {response.text}")
            results["auth_login"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Login error: {e}")
        results["auth_login"] = {"success": False}
    
    # Test 4: Invalid Login
    log_test("Testing invalid login...")
    invalid_login = {
        "username": "nonexistent_user",
        "password": "WrongPassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=invalid_login, headers=HEADERS, timeout=10)
        if response.status_code == 401:
            log_test("✅ Invalid credentials correctly rejected")
            results["auth_login_invalid"] = {"success": True}
        else:
            log_test(f"❌ Invalid login should be rejected, got: {response.status_code}")
            results["auth_login_invalid"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Invalid login test error: {e}")
        results["auth_login_invalid"] = {"success": False}
    
    # Test 5: Get Current User (with auth)
    if results.get("auth_register", {}).get("success"):
        log_test("Testing get current user...")
        auth_headers = HEADERS.copy()
        auth_headers["Authorization"] = f"Bearer {results['auth_register']['token']}"
        
        try:
            response = requests.get(f"{BASE_URL}/auth/me", headers=auth_headers, timeout=10)
            if response.status_code == 200:
                log_test("✅ Get current user successful")
                results["auth_me"] = {"success": True}
            else:
                log_test(f"❌ Get current user failed: {response.text}")
                results["auth_me"] = {"success": False}
        except Exception as e:
            log_test(f"❌ Get current user error: {e}")
            results["auth_me"] = {"success": False}
    
    return results

def test_posts_endpoints(auth_token, user_id):
    """Test all posts endpoints"""
    log_test("=== TESTING POSTS ENDPOINTS ===")
    
    results = {}
    auth_headers = HEADERS.copy()
    auth_headers["Authorization"] = f"Bearer {auth_token}"
    
    # Test 1: Create Post
    log_test("Testing post creation...")
    post_data = {
        "content": "Bugün İstanbul-Ankara arası güzel bir yolculuk yaptım. Trafik akıcıydı! 🚛",
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    }
    
    try:
        response = requests.post(f"{BASE_URL}/posts", json=post_data, headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            post_id = data.get("id")
            log_test(f"✅ Post created successfully - ID: {post_id}")
            results["posts_create"] = {"success": True, "post_id": post_id}
        else:
            log_test(f"❌ Post creation failed: {response.text}")
            results["posts_create"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Post creation error: {e}")
        results["posts_create"] = {"success": False}
    
    # Test 2: Get All Posts
    log_test("Testing get all posts...")
    try:
        response = requests.get(f"{BASE_URL}/posts", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test(f"✅ Retrieved {len(data)} posts")
            results["posts_get_all"] = {"success": True}
        else:
            log_test(f"❌ Get posts failed: {response.text}")
            results["posts_get_all"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Get posts error: {e}")
        results["posts_get_all"] = {"success": False}
    
    # Test 3: Get User Posts
    log_test("Testing get user posts...")
    try:
        response = requests.get(f"{BASE_URL}/posts/user/{user_id}", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test(f"✅ Retrieved {len(data)} user posts")
            results["posts_get_user"] = {"success": True}
        else:
            log_test(f"❌ Get user posts failed: {response.text}")
            results["posts_get_user"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Get user posts error: {e}")
        results["posts_get_user"] = {"success": False}
    
    # Test 4: Like/Unlike Post
    if results.get("posts_create", {}).get("success"):
        post_id = results["posts_create"]["post_id"]
        log_test("Testing post like toggle...")
        
        try:
            # Like post
            response1 = requests.post(f"{BASE_URL}/posts/{post_id}/like", headers=auth_headers, timeout=10)
            if response1.status_code == 200:
                data1 = response1.json()
                if data1.get("liked") == True:
                    log_test("✅ Post liked successfully")
                    
                    # Unlike post
                    response2 = requests.post(f"{BASE_URL}/posts/{post_id}/like", headers=auth_headers, timeout=10)
                    if response2.status_code == 200:
                        data2 = response2.json()
                        if data2.get("liked") == False:
                            log_test("✅ Post unliked successfully - Toggle working")
                            results["posts_like_toggle"] = {"success": True}
                        else:
                            log_test("❌ Post unlike failed")
                            results["posts_like_toggle"] = {"success": False}
                    else:
                        log_test(f"❌ Unlike request failed: {response2.text}")
                        results["posts_like_toggle"] = {"success": False}
                else:
                    log_test("❌ Post like failed")
                    results["posts_like_toggle"] = {"success": False}
            else:
                log_test(f"❌ Like request failed: {response1.text}")
                results["posts_like_toggle"] = {"success": False}
        except Exception as e:
            log_test(f"❌ Like toggle error: {e}")
            results["posts_like_toggle"] = {"success": False}
    
    return results

def test_comments_endpoints(auth_token, post_id):
    """Test comments endpoints"""
    log_test("=== TESTING COMMENTS ENDPOINTS ===")
    
    results = {}
    auth_headers = HEADERS.copy()
    auth_headers["Authorization"] = f"Bearer {auth_token}"
    
    if not post_id:
        log_test("❌ No post ID available for comment tests")
        return {"comments_create": {"success": False}, "comments_get": {"success": False}}
    
    # Test 1: Create Comment
    log_test("Testing comment creation...")
    comment_data = {
        "content": "Harika paylaşım! Ben de bu rotayı sık kullanırım."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/posts/{post_id}/comments", json=comment_data, headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test(f"✅ Comment created successfully - ID: {data.get('id')}")
            results["comments_create"] = {"success": True}
        else:
            log_test(f"❌ Comment creation failed: {response.text}")
            results["comments_create"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Comment creation error: {e}")
        results["comments_create"] = {"success": False}
    
    # Test 2: Get Comments
    log_test("Testing get comments...")
    try:
        response = requests.get(f"{BASE_URL}/posts/{post_id}/comments", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test(f"✅ Retrieved {len(data)} comments")
            results["comments_get"] = {"success": True}
        else:
            log_test(f"❌ Get comments failed: {response.text}")
            results["comments_get"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Get comments error: {e}")
        results["comments_get"] = {"success": False}
    
    return results

def test_users_endpoints(auth_token, user_id):
    """Test users endpoints"""
    log_test("=== TESTING USERS ENDPOINTS ===")
    
    results = {}
    auth_headers = HEADERS.copy()
    auth_headers["Authorization"] = f"Bearer {auth_token}"
    
    # Test 1: Get User by ID
    log_test("Testing get user by ID...")
    try:
        response = requests.get(f"{BASE_URL}/users/{user_id}", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test("✅ Get user by ID successful")
            results["users_get_by_id"] = {"success": True}
        else:
            log_test(f"❌ Get user by ID failed: {response.text}")
            results["users_get_by_id"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Get user by ID error: {e}")
        results["users_get_by_id"] = {"success": False}
    
    # Test 2: Search Users
    log_test("Testing user search...")
    try:
        response = requests.get(f"{BASE_URL}/users?q=driver", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test(f"✅ User search returned {len(data)} results")
            results["users_search"] = {"success": True}
        else:
            log_test(f"❌ User search failed: {response.text}")
            results["users_search"] = {"success": False}
    except Exception as e:
        log_test(f"❌ User search error: {e}")
        results["users_search"] = {"success": False}
    
    return results

def test_chats_endpoints(auth_token, second_user_id):
    """Test chat endpoints"""
    log_test("=== TESTING CHAT ENDPOINTS ===")
    
    results = {}
    auth_headers = HEADERS.copy()
    auth_headers["Authorization"] = f"Bearer {auth_token}"
    
    if not second_user_id:
        log_test("❌ No second user ID available for chat tests")
        return {
            "chats_create": {"success": False},
            "chats_get": {"success": False},
            "messages_send": {"success": False},
            "messages_get": {"success": False}
        }
    
    # Test 1: Create Chat
    log_test("Testing chat creation...")
    chat_data = {
        "name": "Şoför Sohbeti",
        "is_group": False,
        "members": [second_user_id]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chats", json=chat_data, headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            chat_id = data.get("id")
            log_test(f"✅ Chat created successfully - ID: {chat_id}")
            results["chats_create"] = {"success": True, "chat_id": chat_id}
        else:
            log_test(f"❌ Chat creation failed: {response.text}")
            results["chats_create"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Chat creation error: {e}")
        results["chats_create"] = {"success": False}
    
    # Test 2: Get Chats
    log_test("Testing get chats...")
    try:
        response = requests.get(f"{BASE_URL}/chats", headers=auth_headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test(f"✅ Retrieved {len(data)} chats")
            results["chats_get"] = {"success": True}
        else:
            log_test(f"❌ Get chats failed: {response.text}")
            results["chats_get"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Get chats error: {e}")
        results["chats_get"] = {"success": False}
    
    # Test 3: Send Message
    if results.get("chats_create", {}).get("success"):
        chat_id = results["chats_create"]["chat_id"]
        log_test("Testing send message...")
        
        message_data = {
            "chat_id": chat_id,
            "content": "Merhaba! Nasıl gidiyor işler?"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/chats/{chat_id}/messages", json=message_data, headers=auth_headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                log_test(f"✅ Message sent successfully - ID: {data.get('id')}")
                results["messages_send"] = {"success": True}
            else:
                log_test(f"❌ Send message failed: {response.text}")
                results["messages_send"] = {"success": False}
        except Exception as e:
            log_test(f"❌ Send message error: {e}")
            results["messages_send"] = {"success": False}
        
        # Test 4: Get Messages
        log_test("Testing get messages...")
        try:
            response = requests.get(f"{BASE_URL}/chats/{chat_id}/messages", headers=auth_headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                log_test(f"✅ Retrieved {len(data)} messages")
                results["messages_get"] = {"success": True}
            else:
                log_test(f"❌ Get messages failed: {response.text}")
                results["messages_get"] = {"success": False}
        except Exception as e:
            log_test(f"❌ Get messages error: {e}")
            results["messages_get"] = {"success": False}
    
    return results

def test_security():
    """Test security endpoints"""
    log_test("=== TESTING SECURITY ===")
    
    results = {}
    
    # Test unauthorized access
    log_test("Testing unauthorized access...")
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=HEADERS, timeout=10)
        if response.status_code in [401, 403]:
            log_test("✅ Unauthorized access correctly blocked")
            results["unauthorized_access"] = {"success": True}
        else:
            log_test(f"❌ Unauthorized access should be blocked, got: {response.status_code}")
            results["unauthorized_access"] = {"success": False}
    except Exception as e:
        log_test(f"❌ Unauthorized access test error: {e}")
        results["unauthorized_access"] = {"success": False}
    
    return results

def create_second_user():
    """Create a second user for testing interactions"""
    log_test("Creating second test user...")
    
    user_data = {
        "username": f"driver_mehmet_{int(time.time())}",
        "email": f"mehmet{int(time.time())}@example.com",
        "password": "SecurePass456!",
        "full_name": "Mehmet Demir",
        "bio": "Kamyon şoförü"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            data = response.json()
            second_user_id = data.get("user", {}).get("id")
            log_test(f"✅ Second user created - ID: {second_user_id}")
            return second_user_id
        else:
            log_test(f"❌ Failed to create second user: {response.text}")
            return None
    except Exception as e:
        log_test(f"❌ Second user creation error: {e}")
        return None

def main():
    """Run all backend tests"""
    log_test("=" * 60)
    log_test("STARTING COMPREHENSIVE BACKEND API TESTS")
    log_test("=" * 60)
    
    all_results = {}
    
    # Test Authentication
    auth_results = test_auth_endpoints()
    all_results.update(auth_results)
    
    # Get auth token and user ID for subsequent tests
    auth_token = auth_results.get("auth_register", {}).get("token")
    user_id = auth_results.get("auth_register", {}).get("user_id")
    
    if auth_token and user_id:
        # Create second user
        second_user_id = create_second_user()
        
        # Test Posts
        posts_results = test_posts_endpoints(auth_token, user_id)
        all_results.update(posts_results)
        
        # Test Comments
        post_id = posts_results.get("posts_create", {}).get("post_id")
        comments_results = test_comments_endpoints(auth_token, post_id)
        all_results.update(comments_results)
        
        # Test Users
        users_results = test_users_endpoints(auth_token, user_id)
        all_results.update(users_results)
        
        # Test Chats
        chats_results = test_chats_endpoints(auth_token, second_user_id)
        all_results.update(chats_results)
    
    # Test Security
    security_results = test_security()
    all_results.update(security_results)
    
    # Summary
    log_test("=" * 60)
    log_test("TEST RESULTS SUMMARY")
    log_test("=" * 60)
    
    passed = sum(1 for result in all_results.values() if result.get("success", False))
    total = len(all_results)
    
    for test_name, result in all_results.items():
        status = "✅ PASS" if result.get("success", False) else "❌ FAIL"
        log_test(f"{test_name}: {status}")
    
    log_test("=" * 60)
    log_test(f"TOTAL: {passed}/{total} tests passed")
    
    if passed == total:
        log_test("🎉 ALL TESTS PASSED!")
    else:
        log_test(f"⚠️  {total - passed} tests failed")
    
    return all_results

if __name__ == "__main__":
    main()