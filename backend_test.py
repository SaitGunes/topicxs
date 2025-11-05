#!/usr/bin/env python3
"""
Backend API Test Suite for Driver Forum Application
Tests all backend endpoints with realistic data and scenarios
"""

import requests
import json
import time
from datetime import datetime
import base64

# Configuration
BASE_URL = "https://driverschat-i18n.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.test_user_id = None
        self.test_post_id = None
        self.test_chat_id = None
        self.second_user_token = None
        self.second_user_id = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper headers and authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            return response
        except requests.exceptions.Timeout:
            self.log(f"Request timeout for {method} {url}", "ERROR")
            return None
        except requests.exceptions.ConnectionError:
            self.log(f"Connection error for {method} {url}", "ERROR")
            return None
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed for {method} {url}: {e}", "ERROR")
            return None
            
    def test_auth_register(self):
        """Test user registration"""
        self.log("Testing user registration...")
        
        # Test successful registration
        user_data = {
            "username": "test_driver_2024",
            "email": "driver2024@example.com", 
            "password": "SecurePass123!",
            "full_name": "Ahmet Yılmaz",
            "bio": "Profesyonel şoför, 10 yıllık deneyim"
        }
        
        response = self.make_request("POST", "/auth/register", user_data, auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("access_token")
            self.test_user_id = data.get("user", {}).get("id")
            self.log(f"✅ Registration successful - User ID: {self.test_user_id}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Registration failed: {error_msg}", "ERROR")
            return False
            
    def test_auth_register_duplicate(self):
        """Test registration with duplicate username"""
        self.log("Testing duplicate username registration...")
        
        user_data = {
            "username": "test_driver_2024",  # Same username
            "email": "different@example.com",
            "password": "SecurePass123!",
            "full_name": "Different User"
        }
        
        response = self.make_request("POST", "/auth/register", user_data, auth_required=False)
        
        if response and response.status_code == 400:
            self.log("✅ Duplicate username correctly rejected")
            return True
        else:
            self.log("❌ Duplicate username should be rejected", "ERROR")
            return False
            
    def test_auth_login(self):
        """Test user login"""
        self.log("Testing user login...")
        
        login_data = {
            "username": "test_driver_2024",
            "password": "SecurePass123!"
        }
        
        response = self.make_request("POST", "/auth/login", login_data, auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                self.log("✅ Login successful")
                return True
        
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        self.log(f"❌ Login failed: {error_msg}", "ERROR")
        return False
        
    def test_auth_login_invalid(self):
        """Test login with invalid credentials"""
        self.log("Testing invalid login...")
        
        login_data = {
            "username": "test_driver_2024",
            "password": "WrongPassword"
        }
        
        response = self.make_request("POST", "/auth/login", login_data, auth_required=False)
        
        if response and response.status_code == 401:
            self.log("✅ Invalid credentials correctly rejected")
            return True
        else:
            self.log("❌ Invalid credentials should be rejected", "ERROR")
            return False
            
    def test_auth_me(self):
        """Test getting current user info"""
        self.log("Testing get current user...")
        
        response = self.make_request("GET", "/auth/me")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("username") == "test_driver_2024":
                self.log("✅ Get current user successful")
                return True
                
        self.log("❌ Get current user failed", "ERROR")
        return False
        
    def create_second_user(self):
        """Create a second user for testing interactions"""
        self.log("Creating second test user...")
        
        user_data = {
            "username": "driver_mehmet",
            "email": "mehmet@example.com",
            "password": "SecurePass456!",
            "full_name": "Mehmet Demir",
            "bio": "Kamyon şoförü"
        }
        
        response = self.make_request("POST", "/auth/register", user_data, auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            self.second_user_token = data.get("access_token")
            self.second_user_id = data.get("user", {}).get("id")
            self.log(f"✅ Second user created - ID: {self.second_user_id}")
            return True
        else:
            self.log("❌ Failed to create second user", "ERROR")
            return False
            
    def test_posts_create(self):
        """Test creating a new post"""
        self.log("Testing post creation...")
        
        # Create a simple base64 image (1x1 pixel)
        sample_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        post_data = {
            "content": "Bugün İstanbul-Ankara arası güzel bir yolculuk yaptım. Trafik akıcıydı ve hava durumu mükemmeldi! 🚛",
            "image": sample_image
        }
        
        response = self.make_request("POST", "/posts", post_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.test_post_id = data.get("id")
            self.log(f"✅ Post created successfully - ID: {self.test_post_id}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Post creation failed: {error_msg}", "ERROR")
            return False
            
    def test_posts_get_all(self):
        """Test getting all posts"""
        self.log("Testing get all posts...")
        
        response = self.make_request("GET", "/posts")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log(f"✅ Retrieved {len(data)} posts")
                return True
            else:
                self.log("✅ No posts found (empty list)")
                return True
        else:
            self.log("❌ Failed to get posts", "ERROR")
            return False
            
    def test_posts_get_user_posts(self):
        """Test getting user's posts"""
        self.log("Testing get user posts...")
        
        if not self.test_user_id:
            self.log("❌ No test user ID available", "ERROR")
            return False
            
        response = self.make_request("GET", f"/posts/user/{self.test_user_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ Retrieved {len(data)} user posts")
            return True
        else:
            self.log("❌ Failed to get user posts", "ERROR")
            return False
            
    def test_posts_like_toggle(self):
        """Test liking and unliking a post"""
        self.log("Testing post like toggle...")
        
        if not self.test_post_id:
            self.log("❌ No test post ID available", "ERROR")
            return False
            
        # First like
        response = self.make_request("POST", f"/posts/{self.test_post_id}/like")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("liked") == True:
                self.log("✅ Post liked successfully")
                
                # Now unlike
                response2 = self.make_request("POST", f"/posts/{self.test_post_id}/like")
                
                if response2 and response2.status_code == 200:
                    data2 = response2.json()
                    if data2.get("liked") == False:
                        self.log("✅ Post unliked successfully - Toggle working")
                        return True
                    else:
                        self.log("❌ Post unlike failed", "ERROR")
                        return False
                else:
                    self.log("❌ Second like request failed", "ERROR")
                    return False
            else:
                self.log("❌ Post like failed", "ERROR")
                return False
        else:
            self.log("❌ Post like request failed", "ERROR")
            return False
            
    def test_comments_create(self):
        """Test creating a comment"""
        self.log("Testing comment creation...")
        
        if not self.test_post_id:
            self.log("❌ No test post ID available", "ERROR")
            return False
            
        comment_data = {
            "content": "Harika paylaşım! Ben de bu rotayı sık kullanırım."
        }
        
        response = self.make_request("POST", f"/posts/{self.test_post_id}/comments", comment_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ Comment created successfully - ID: {data.get('id')}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Comment creation failed: {error_msg}", "ERROR")
            return False
            
    def test_comments_get(self):
        """Test getting comments for a post"""
        self.log("Testing get comments...")
        
        if not self.test_post_id:
            self.log("❌ No test post ID available", "ERROR")
            return False
            
        response = self.make_request("GET", f"/posts/{self.test_post_id}/comments")
        
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ Retrieved {len(data)} comments")
            return True
        else:
            self.log("❌ Failed to get comments", "ERROR")
            return False
            
    def test_users_get_by_id(self):
        """Test getting user by ID"""
        self.log("Testing get user by ID...")
        
        if not self.test_user_id:
            self.log("❌ No test user ID available", "ERROR")
            return False
            
        response = self.make_request("GET", f"/users/{self.test_user_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get("username") == "test_driver_2024":
                self.log("✅ Get user by ID successful")
                return True
                
        self.log("❌ Get user by ID failed", "ERROR")
        return False
        
    def test_users_search(self):
        """Test searching users"""
        self.log("Testing user search...")
        
        # Search with query
        response = self.make_request("GET", "/users?q=driver")
        
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ User search returned {len(data)} results")
            return True
        else:
            self.log("❌ User search failed", "ERROR")
            return False
            
    def test_chats_create(self):
        """Test creating a chat"""
        self.log("Testing chat creation...")
        
        if not self.second_user_id:
            self.log("❌ No second user ID available", "ERROR")
            return False
            
        chat_data = {
            "name": "Şoför Sohbeti",
            "is_group": False,
            "members": [self.second_user_id]
        }
        
        response = self.make_request("POST", "/chats", chat_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.test_chat_id = data.get("id")
            self.log(f"✅ Chat created successfully - ID: {self.test_chat_id}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Chat creation failed: {error_msg}", "ERROR")
            return False
            
    def test_chats_get(self):
        """Test getting user's chats"""
        self.log("Testing get chats...")
        
        response = self.make_request("GET", "/chats")
        
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ Retrieved {len(data)} chats")
            return True
        else:
            self.log("❌ Failed to get chats", "ERROR")
            return False
            
    def test_messages_send(self):
        """Test sending a message"""
        self.log("Testing send message...")
        
        if not self.test_chat_id:
            self.log("❌ No test chat ID available", "ERROR")
            return False
            
        message_data = {
            "chat_id": self.test_chat_id,
            "content": "Merhaba! Nasıl gidiyor işler?"
        }
        
        response = self.make_request("POST", f"/chats/{self.test_chat_id}/messages", message_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ Message sent successfully - ID: {data.get('id')}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log(f"❌ Send message failed: {error_msg}", "ERROR")
            return False
            
    def test_messages_get(self):
        """Test getting messages from a chat"""
        self.log("Testing get messages...")
        
        if not self.test_chat_id:
            self.log("❌ No test chat ID available", "ERROR")
            return False
            
        response = self.make_request("GET", f"/chats/{self.test_chat_id}/messages")
        
        if response and response.status_code == 200:
            data = response.json()
            self.log(f"✅ Retrieved {len(data)} messages")
            return True
        else:
            self.log("❌ Failed to get messages", "ERROR")
            return False
            
    def test_unauthorized_access(self):
        """Test accessing protected endpoints without authentication"""
        self.log("Testing unauthorized access...")
        
        # Temporarily remove auth token
        original_token = self.auth_token
        self.auth_token = None
        
        response = self.make_request("GET", "/auth/me")
        
        # Restore token
        self.auth_token = original_token
        
        if response and response.status_code in [401, 403]:
            self.log("✅ Unauthorized access correctly blocked")
            return True
        else:
            self.log(f"❌ Unauthorized access should be blocked, got status: {response.status_code if response else 'No response'}", "ERROR")
            return False
            
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("=" * 60)
        self.log("STARTING BACKEND API TESTS")
        self.log("=" * 60)
        
        test_results = {}
        
        # Authentication Tests
        test_results["auth_register"] = self.test_auth_register()
        test_results["auth_register_duplicate"] = self.test_auth_register_duplicate()
        test_results["auth_login"] = self.test_auth_login()
        test_results["auth_login_invalid"] = self.test_auth_login_invalid()
        test_results["auth_me"] = self.test_auth_me()
        
        # Create second user for interaction tests
        test_results["create_second_user"] = self.create_second_user()
        
        # Posts Tests
        test_results["posts_create"] = self.test_posts_create()
        test_results["posts_get_all"] = self.test_posts_get_all()
        test_results["posts_get_user"] = self.test_posts_get_user_posts()
        test_results["posts_like_toggle"] = self.test_posts_like_toggle()
        
        # Comments Tests
        test_results["comments_create"] = self.test_comments_create()
        test_results["comments_get"] = self.test_comments_get()
        
        # Users Tests
        test_results["users_get_by_id"] = self.test_users_get_by_id()
        test_results["users_search"] = self.test_users_search()
        
        # Chat Tests
        test_results["chats_create"] = self.test_chats_create()
        test_results["chats_get"] = self.test_chats_get()
        test_results["messages_send"] = self.test_messages_send()
        test_results["messages_get"] = self.test_messages_get()
        
        # Security Tests
        test_results["unauthorized_access"] = self.test_unauthorized_access()
        
        # Summary
        self.log("=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            
        self.log("=" * 60)
        self.log(f"TOTAL: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
        else:
            self.log(f"⚠️  {total - passed} tests failed")
            
        return test_results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()