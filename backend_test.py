#!/usr/bin/env python3
"""
Backend API Testing for Driver Forum Application - Admin Panel Endpoints
Testing all admin endpoints with proper authentication and authorization
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://drivercommunity.preview.emergentagent.com/api"

# Test credentials - Sait is admin user
ADMIN_USER = {
    "username": "Sait",
    "password": "password123"
}

# Regular user for authorization testing
REGULAR_USER = {
    "username": "testuser",
    "email": "testuser@example.com", 
    "password": "password123",
    "full_name": "Test User",
    "bio": "Regular user for testing"
}

class AdminEndpointTester:
    def __init__(self):
        self.admin_token = None
        self.regular_token = None
        self.test_results = []
        self.admin_user_id = None
        self.regular_user_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def authenticate_admin(self):
        """Authenticate admin user and get token"""
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_USER)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["access_token"]
                self.admin_user_id = data["user"]["id"]
                self.log_result("Admin Authentication", True, "Admin user authenticated successfully")
                return True
            else:
                self.log_result("Admin Authentication", False, f"Failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Authentication", False, f"Exception occurred: {str(e)}")
            return False
    
    def create_and_authenticate_regular_user(self):
        """Create and authenticate regular user for authorization testing"""
        try:
            # Try to register regular user
            response = requests.post(f"{BASE_URL}/auth/register", json=REGULAR_USER)
            if response.status_code == 200:
                data = response.json()
                self.regular_token = data["access_token"]
                self.regular_user_id = data["user"]["id"]
                self.log_result("Regular User Creation", True, "Regular user created and authenticated")
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                # User exists, try to login
                login_data = {"username": REGULAR_USER["username"], "password": REGULAR_USER["password"]}
                response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
                if response.status_code == 200:
                    data = response.json()
                    self.regular_token = data["access_token"]
                    self.regular_user_id = data["user"]["id"]
                    self.log_result("Regular User Authentication", True, "Regular user authenticated (existing user)")
                    return True
            
            self.log_result("Regular User Setup", False, f"Failed with status {response.status_code}", response.text)
            return False
        except Exception as e:
            self.log_result("Regular User Setup", False, f"Exception occurred: {str(e)}")
            return False
    
    def get_headers(self, use_admin=True):
        """Get authorization headers"""
        token = self.admin_token if use_admin else self.regular_token
        return {"Authorization": f"Bearer {token}"}
    
    def test_admin_stats(self):
        """Test GET /api/admin/stats endpoint"""
        try:
            # Test with admin user
            response = requests.get(f"{BASE_URL}/admin/stats", headers=self.get_headers(True))
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_users", "total_posts", "total_comments", "total_reports", 
                                 "pending_reports", "recent_users_7d", "recent_posts_7d"]
                
                missing_fields = [field for field in required_fields if field not in data]
                if not missing_fields:
                    self.log_result("Admin Stats - Data Structure", True, 
                                  f"All required fields present: {list(data.keys())}", data)
                else:
                    self.log_result("Admin Stats - Data Structure", False, 
                                  f"Missing fields: {missing_fields}", data)
            else:
                self.log_result("Admin Stats - Admin Access", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test authorization - regular user should get 403
            if self.regular_token:
                response = requests.get(f"{BASE_URL}/admin/stats", headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Stats - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Stats - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Stats", False, f"Exception occurred: {str(e)}")
    
    def test_admin_reports(self):
        """Test GET /api/admin/reports endpoint"""
        try:
            # Test getting all reports
            response = requests.get(f"{BASE_URL}/admin/reports", headers=self.get_headers(True))
            if response.status_code == 200:
                reports = response.json()
                self.log_result("Admin Reports - Get All", True, 
                              f"Retrieved {len(reports)} reports", f"Sample: {reports[:1] if reports else 'No reports'}")
            else:
                self.log_result("Admin Reports - Get All", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test with status filter
            for status in ["pending", "reviewed", "resolved", "dismissed"]:
                response = requests.get(f"{BASE_URL}/admin/reports?status={status}", headers=self.get_headers(True))
                if response.status_code == 200:
                    filtered_reports = response.json()
                    self.log_result(f"Admin Reports - Filter {status}", True, 
                                  f"Retrieved {len(filtered_reports)} {status} reports")
                else:
                    self.log_result(f"Admin Reports - Filter {status}", False, 
                                  f"Failed with status {response.status_code}", response.text)
            
            # Test authorization
            if self.regular_token:
                response = requests.get(f"{BASE_URL}/admin/reports", headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Reports - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Reports - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Reports", False, f"Exception occurred: {str(e)}")
    
    def test_admin_users(self):
        """Test GET /api/admin/users endpoint"""
        try:
            # Test getting all users
            response = requests.get(f"{BASE_URL}/admin/users", headers=self.get_headers(True))
            if response.status_code == 200:
                users = response.json()
                self.log_result("Admin Users - Get All", True, 
                              f"Retrieved {len(users)} users", f"Sample user fields: {list(users[0].keys()) if users else 'No users'}")
            else:
                self.log_result("Admin Users - Get All", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test pagination
            response = requests.get(f"{BASE_URL}/admin/users?skip=0&limit=5", headers=self.get_headers(True))
            if response.status_code == 200:
                paginated_users = response.json()
                self.log_result("Admin Users - Pagination", True, 
                              f"Retrieved {len(paginated_users)} users with pagination (limit=5)")
            else:
                self.log_result("Admin Users - Pagination", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test authorization
            if self.regular_token:
                response = requests.get(f"{BASE_URL}/admin/users", headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Users - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Users - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Users", False, f"Exception occurred: {str(e)}")
    
    def test_admin_toggle_admin(self):
        """Test PUT /api/admin/users/{user_id}/toggle-admin endpoint"""
        if not self.regular_user_id:
            self.log_result("Admin Toggle Admin", False, "No regular user ID available for testing")
            return
        
        try:
            # Toggle regular user to admin
            response = requests.put(f"{BASE_URL}/admin/users/{self.regular_user_id}/toggle-admin", 
                                  headers=self.get_headers(True))
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Toggle Admin - Make Admin", True, 
                              f"User admin status toggled: {data.get('message', 'Success')}", data)
            else:
                self.log_result("Admin Toggle Admin - Make Admin", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Toggle back to regular user
            response = requests.put(f"{BASE_URL}/admin/users/{self.regular_user_id}/toggle-admin", 
                                  headers=self.get_headers(True))
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Toggle Admin - Remove Admin", True, 
                              f"User admin status toggled back: {data.get('message', 'Success')}", data)
            else:
                self.log_result("Admin Toggle Admin - Remove Admin", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test with non-existent user
            response = requests.put(f"{BASE_URL}/admin/users/nonexistent123/toggle-admin", 
                                  headers=self.get_headers(True))
            if response.status_code == 404:
                self.log_result("Admin Toggle Admin - Non-existent User", True, "Correctly returned 404 for non-existent user")
            else:
                self.log_result("Admin Toggle Admin - Non-existent User", False, 
                              f"Expected 404, got {response.status_code}", response.text)
            
            # Test authorization
            if self.regular_token:
                response = requests.put(f"{BASE_URL}/admin/users/{self.regular_user_id}/toggle-admin", 
                                      headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Toggle Admin - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Toggle Admin - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Toggle Admin", False, f"Exception occurred: {str(e)}")
    
    def test_admin_ban_user(self):
        """Test PUT /api/admin/users/{user_id}/ban endpoint"""
        if not self.regular_user_id:
            self.log_result("Admin Ban User", False, "No regular user ID available for testing")
            return
        
        try:
            # Ban user
            response = requests.put(f"{BASE_URL}/admin/users/{self.regular_user_id}/ban?ban=true", 
                                  headers=self.get_headers(True))
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Ban User - Ban", True, 
                              f"User banned successfully: {data.get('message', 'Success')}", data)
            else:
                self.log_result("Admin Ban User - Ban", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Unban user
            response = requests.put(f"{BASE_URL}/admin/users/{self.regular_user_id}/ban?ban=false", 
                                  headers=self.get_headers(True))
            if response.status_code == 200:
                data = response.json()
                self.log_result("Admin Ban User - Unban", True, 
                              f"User unbanned successfully: {data.get('message', 'Success')}", data)
            else:
                self.log_result("Admin Ban User - Unban", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test self-banning prevention
            response = requests.put(f"{BASE_URL}/admin/users/{self.admin_user_id}/ban?ban=true", 
                                  headers=self.get_headers(True))
            if response.status_code == 400:
                self.log_result("Admin Ban User - Self-ban Prevention", True, "Correctly prevented self-banning (400)")
            else:
                self.log_result("Admin Ban User - Self-ban Prevention", False, 
                              f"Expected 400, got {response.status_code}", response.text)
            
            # Test authorization
            if self.regular_token:
                response = requests.put(f"{BASE_URL}/admin/users/{self.regular_user_id}/ban?ban=true", 
                                      headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Ban User - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Ban User - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Ban User", False, f"Exception occurred: {str(e)}")
    
    def test_admin_posts(self):
        """Test GET /api/admin/posts endpoint"""
        try:
            # Test getting all posts
            response = requests.get(f"{BASE_URL}/admin/posts", headers=self.get_headers(True))
            if response.status_code == 200:
                posts = response.json()
                self.log_result("Admin Posts - Get All", True, 
                              f"Retrieved {len(posts)} posts", f"Sample post fields: {list(posts[0].keys()) if posts else 'No posts'}")
            else:
                self.log_result("Admin Posts - Get All", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test pagination
            response = requests.get(f"{BASE_URL}/admin/posts?skip=0&limit=5", headers=self.get_headers(True))
            if response.status_code == 200:
                paginated_posts = response.json()
                self.log_result("Admin Posts - Pagination", True, 
                              f"Retrieved {len(paginated_posts)} posts with pagination (limit=5)")
            else:
                self.log_result("Admin Posts - Pagination", False, 
                              f"Failed with status {response.status_code}", response.text)
            
            # Test authorization
            if self.regular_token:
                response = requests.get(f"{BASE_URL}/admin/posts", headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Posts - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Posts - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Posts", False, f"Exception occurred: {str(e)}")
    
    def test_admin_delete_post(self):
        """Test DELETE /api/admin/posts/{post_id} endpoint"""
        try:
            # First create a test post to delete
            test_post = {"content": "Test post for admin deletion", "image": None}
            response = requests.post(f"{BASE_URL}/posts", json=test_post, headers=self.get_headers(False))
            
            if response.status_code == 200:
                post_data = response.json()
                post_id = post_data["id"]
                self.log_result("Admin Delete Post - Create Test Post", True, f"Created test post with ID: {post_id}")
                
                # Now delete it as admin
                response = requests.delete(f"{BASE_URL}/admin/posts/{post_id}", headers=self.get_headers(True))
                if response.status_code == 200:
                    self.log_result("Admin Delete Post - Delete", True, "Post deleted successfully by admin")
                else:
                    self.log_result("Admin Delete Post - Delete", False, 
                                  f"Failed with status {response.status_code}", response.text)
            else:
                self.log_result("Admin Delete Post - Create Test Post", False, 
                              f"Failed to create test post: {response.status_code}", response.text)
            
            # Test deleting non-existent post
            response = requests.delete(f"{BASE_URL}/admin/posts/nonexistent123", headers=self.get_headers(True))
            if response.status_code == 404:
                self.log_result("Admin Delete Post - Non-existent Post", True, "Correctly returned 404 for non-existent post")
            else:
                self.log_result("Admin Delete Post - Non-existent Post", False, 
                              f"Expected 404, got {response.status_code}", response.text)
            
            # Test authorization
            if self.regular_token:
                response = requests.delete(f"{BASE_URL}/admin/posts/somepostid", headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Delete Post - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Delete Post - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Delete Post", False, f"Exception occurred: {str(e)}")
    
    def test_admin_resolve_report(self):
        """Test PUT /api/admin/reports/{report_id}/resolve endpoint"""
        try:
            # First, try to get existing reports to test with
            response = requests.get(f"{BASE_URL}/admin/reports", headers=self.get_headers(True))
            if response.status_code == 200:
                reports = response.json()
                if reports:
                    report_id = reports[0]["id"]
                    
                    # Test resolving report with different statuses
                    for status in ["reviewed", "resolved", "dismissed"]:
                        response = requests.put(f"{BASE_URL}/admin/reports/{report_id}/resolve?status={status}", 
                                              headers=self.get_headers(True))
                        if response.status_code == 200:
                            self.log_result(f"Admin Resolve Report - {status}", True, 
                                          f"Report status updated to {status}")
                        else:
                            self.log_result(f"Admin Resolve Report - {status}", False, 
                                          f"Failed with status {response.status_code}", response.text)
                else:
                    self.log_result("Admin Resolve Report", False, "No reports available for testing")
            
            # Test with invalid status
            response = requests.put(f"{BASE_URL}/admin/reports/someid/resolve?status=invalid", 
                                  headers=self.get_headers(True))
            if response.status_code == 400:
                self.log_result("Admin Resolve Report - Invalid Status", True, "Correctly rejected invalid status (400)")
            else:
                self.log_result("Admin Resolve Report - Invalid Status", False, 
                              f"Expected 400, got {response.status_code}", response.text)
            
            # Test with non-existent report
            response = requests.put(f"{BASE_URL}/admin/reports/nonexistent123/resolve?status=resolved", 
                                  headers=self.get_headers(True))
            if response.status_code == 404:
                self.log_result("Admin Resolve Report - Non-existent Report", True, "Correctly returned 404 for non-existent report")
            else:
                self.log_result("Admin Resolve Report - Non-existent Report", False, 
                              f"Expected 404, got {response.status_code}", response.text)
            
            # Test authorization
            if self.regular_token:
                response = requests.put(f"{BASE_URL}/admin/reports/someid/resolve?status=resolved", 
                                      headers=self.get_headers(False))
                if response.status_code == 403:
                    self.log_result("Admin Resolve Report - Authorization", True, "Regular user correctly denied access (403)")
                else:
                    self.log_result("Admin Resolve Report - Authorization", False, 
                                  f"Expected 403, got {response.status_code}", response.text)
            
        except Exception as e:
            self.log_result("Admin Resolve Report", False, f"Exception occurred: {str(e)}")
    
    def run_all_tests(self):
        """Run all admin endpoint tests"""
        print("🚀 Starting Admin Panel Backend API Tests")
        print("=" * 60)
        
        # Setup authentication
        if not self.authenticate_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        self.create_and_authenticate_regular_user()
        
        # Run all tests
        print("\n📊 Testing Admin Statistics Endpoint...")
        self.test_admin_stats()
        
        print("\n📋 Testing Admin Reports Endpoints...")
        self.test_admin_reports()
        self.test_admin_resolve_report()
        
        print("\n👥 Testing Admin Users Endpoints...")
        self.test_admin_users()
        self.test_admin_toggle_admin()
        self.test_admin_ban_user()
        
        print("\n📝 Testing Admin Posts Endpoints...")
        self.test_admin_posts()
        self.test_admin_delete_post()
        
        # Summary
        print("\n" + "=" * 60)
        print("📈 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if "✅ PASS" in r["status"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AdminEndpointTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)