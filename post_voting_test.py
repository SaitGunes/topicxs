#!/usr/bin/env python3
"""
Post Voting Functionality Test Suite
Tests the like/dislike voting system with comprehensive scenarios
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://trucknet-hub-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class PostVotingTester:
    def __init__(self):
        self.users = []
        self.tokens = []
        self.test_post_id = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def create_test_users(self):
        """Create multiple test users for voting scenarios"""
        print("\n=== Creating Test Users ===")
        
        for i in range(15):  # Create 15 users to test auto-delete threshold
            username = f"voter_user_{i}_{int(time.time())}"
            user_data = {
                "username": username,
                "email": f"{username}@test.com",
                "password": "testpass123",
                "full_name": f"Voter User {i}",
                "bio": f"Test user {i} for voting tests"
            }
            
            try:
                response = requests.post(f"{BASE_URL}/auth/register", 
                                       json=user_data, headers=HEADERS)
                
                if response.status_code == 200:
                    data = response.json()
                    self.users.append(data["user"])
                    self.tokens.append(data["access_token"])
                    self.log_result(f"Create User {i}", True, 
                                  f"User {username} created successfully")
                else:
                    self.log_result(f"Create User {i}", False, 
                                  f"Failed to create user: {response.text}")
                    
            except Exception as e:
                self.log_result(f"Create User {i}", False, 
                              f"Exception creating user: {str(e)}")
    
    def create_test_post(self):
        """Create a test post for voting"""
        print("\n=== Creating Test Post ===")
        
        if not self.tokens:
            self.log_result("Create Test Post", False, "No users available")
            return
            
        # Use first user to create post
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[0]}"
        }
        
        post_data = {
            "content": "This is a test post for voting functionality testing",
            "privacy": {
                "level": "public",
                "specific_user_ids": []
            }
        }
        
        try:
            response = requests.post(f"{BASE_URL}/posts/enhanced", 
                                   json=post_data, headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                self.test_post_id = data["id"]
                self.log_result("Create Test Post", True, 
                              f"Post created with ID: {self.test_post_id}")
            else:
                self.log_result("Create Test Post", False, 
                              f"Failed to create post: {response.text}")
                
        except Exception as e:
            self.log_result("Create Test Post", False, 
                          f"Exception creating post: {str(e)}")
    
    def test_like_post(self):
        """Test liking a post"""
        print("\n=== Testing Like Post ===")
        
        if not self.test_post_id or len(self.tokens) < 2:
            self.log_result("Like Post", False, "Prerequisites not met")
            return
            
        # Use second user to like the post
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[1]}"
        }
        
        vote_data = {"vote_type": "like"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                if self.users[1]["id"] in data.get("likes", []):
                    self.log_result("Like Post", True, 
                                  f"Post liked successfully. Likes: {len(data.get('likes', []))}")
                else:
                    self.log_result("Like Post", False, 
                                  "User ID not found in likes array", data)
            else:
                self.log_result("Like Post", False, 
                              f"Failed to like post: {response.text}")
                
        except Exception as e:
            self.log_result("Like Post", False, 
                          f"Exception liking post: {str(e)}")
    
    def test_dislike_post(self):
        """Test disliking a post"""
        print("\n=== Testing Dislike Post ===")
        
        if not self.test_post_id or len(self.tokens) < 3:
            self.log_result("Dislike Post", False, "Prerequisites not met")
            return
            
        # Use third user to dislike the post
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[2]}"
        }
        
        vote_data = {"vote_type": "dislike"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                if self.users[2]["id"] in data.get("dislikes", []):
                    self.log_result("Dislike Post", True, 
                                  f"Post disliked successfully. Dislikes: {len(data.get('dislikes', []))}")
                else:
                    self.log_result("Dislike Post", False, 
                                  "User ID not found in dislikes array", data)
            else:
                self.log_result("Dislike Post", False, 
                              f"Failed to dislike post: {response.text}")
                
        except Exception as e:
            self.log_result("Dislike Post", False, 
                          f"Exception disliking post: {str(e)}")
    
    def test_toggle_like(self):
        """Test toggling like (like -> unlike)"""
        print("\n=== Testing Toggle Like ===")
        
        if not self.test_post_id or len(self.tokens) < 2:
            self.log_result("Toggle Like", False, "Prerequisites not met")
            return
            
        # Use second user again to unlike the post
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[1]}"
        }
        
        vote_data = {"vote_type": "like"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                if self.users[1]["id"] not in data.get("likes", []):
                    self.log_result("Toggle Like", True, 
                                  f"Like toggled off successfully. Likes: {len(data.get('likes', []))}")
                else:
                    self.log_result("Toggle Like", False, 
                                  "User ID still found in likes array", data)
            else:
                self.log_result("Toggle Like", False, 
                              f"Failed to toggle like: {response.text}")
                
        except Exception as e:
            self.log_result("Toggle Like", False, 
                          f"Exception toggling like: {str(e)}")
    
    def test_toggle_dislike(self):
        """Test toggling dislike (dislike -> remove dislike)"""
        print("\n=== Testing Toggle Dislike ===")
        
        if not self.test_post_id or len(self.tokens) < 3:
            self.log_result("Toggle Dislike", False, "Prerequisites not met")
            return
            
        # Use third user again to remove dislike
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[2]}"
        }
        
        vote_data = {"vote_type": "dislike"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                if self.users[2]["id"] not in data.get("dislikes", []):
                    self.log_result("Toggle Dislike", True, 
                                  f"Dislike toggled off successfully. Dislikes: {len(data.get('dislikes', []))}")
                else:
                    self.log_result("Toggle Dislike", False, 
                                  "User ID still found in dislikes array", data)
            else:
                self.log_result("Toggle Dislike", False, 
                              f"Failed to toggle dislike: {response.text}")
                
        except Exception as e:
            self.log_result("Toggle Dislike", False, 
                          f"Exception toggling dislike: {str(e)}")
    
    def test_switch_like_to_dislike(self):
        """Test switching from like to dislike"""
        print("\n=== Testing Switch Like to Dislike ===")
        
        if not self.test_post_id or len(self.tokens) < 4:
            self.log_result("Switch Like to Dislike", False, "Prerequisites not met")
            return
            
        # Use fourth user to first like, then dislike
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[3]}"
        }
        
        # First like the post
        vote_data = {"vote_type": "like"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code != 200:
                self.log_result("Switch Like to Dislike", False, 
                              f"Failed to like post first: {response.text}")
                return
            
            # Now dislike the post
            vote_data = {"vote_type": "dislike"}
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                user_in_dislikes = self.users[3]["id"] in data.get("dislikes", [])
                user_not_in_likes = self.users[3]["id"] not in data.get("likes", [])
                
                if user_in_dislikes and user_not_in_likes:
                    self.log_result("Switch Like to Dislike", True, 
                                  f"Successfully switched from like to dislike")
                else:
                    self.log_result("Switch Like to Dislike", False, 
                                  "User not properly moved from likes to dislikes", data)
            else:
                self.log_result("Switch Like to Dislike", False, 
                              f"Failed to dislike post: {response.text}")
                
        except Exception as e:
            self.log_result("Switch Like to Dislike", False, 
                          f"Exception switching vote: {str(e)}")
    
    def test_switch_dislike_to_like(self):
        """Test switching from dislike to like"""
        print("\n=== Testing Switch Dislike to Like ===")
        
        if not self.test_post_id or len(self.tokens) < 5:
            self.log_result("Switch Dislike to Like", False, "Prerequisites not met")
            return
            
        # Use fifth user to first dislike, then like
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[4]}"
        }
        
        # First dislike the post
        vote_data = {"vote_type": "dislike"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code != 200:
                self.log_result("Switch Dislike to Like", False, 
                              f"Failed to dislike post first: {response.text}")
                return
            
            # Now like the post
            vote_data = {"vote_type": "like"}
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                user_in_likes = self.users[4]["id"] in data.get("likes", [])
                user_not_in_dislikes = self.users[4]["id"] not in data.get("dislikes", [])
                
                if user_in_likes and user_not_in_dislikes:
                    self.log_result("Switch Dislike to Like", True, 
                                  f"Successfully switched from dislike to like")
                else:
                    self.log_result("Switch Dislike to Like", False, 
                                  "User not properly moved from dislikes to likes", data)
            else:
                self.log_result("Switch Dislike to Like", False, 
                              f"Failed to like post: {response.text}")
                
        except Exception as e:
            self.log_result("Switch Dislike to Like", False, 
                          f"Exception switching vote: {str(e)}")
    
    def test_self_voting_prevention(self):
        """Test that users cannot vote on their own posts"""
        print("\n=== Testing Self-Voting Prevention ===")
        
        if not self.test_post_id or not self.tokens:
            self.log_result("Self-Voting Prevention", False, "Prerequisites not met")
            return
            
        # Use first user (post creator) to try voting on their own post
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[0]}"
        }
        
        vote_data = {"vote_type": "like"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 400:
                self.log_result("Self-Voting Prevention", True, 
                              "Correctly prevented self-voting with 400 error")
            else:
                self.log_result("Self-Voting Prevention", False, 
                              f"Expected 400 error, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Self-Voting Prevention", False, 
                          f"Exception testing self-voting: {str(e)}")
    
    def test_auto_delete_logic(self):
        """Test auto-delete when 10+ votes AND 50%+ dislikes"""
        print("\n=== Testing Auto-Delete Logic ===")
        
        if not self.test_post_id or len(self.tokens) < 12:
            self.log_result("Auto-Delete Logic", False, "Not enough users for auto-delete test")
            return
            
        # Add 11 dislikes (users 5-15) to trigger auto-delete
        dislike_count = 0
        for i in range(5, 15):  # Users 5-14 (10 users)
            auth_headers = {
                **HEADERS,
                "Authorization": f"Bearer {self.tokens[i]}"
            }
            
            vote_data = {"vote_type": "dislike"}
            
            try:
                response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                       json=vote_data, headers=auth_headers)
                
                if response.status_code == 200:
                    dislike_count += 1
                elif response.status_code == 404 and "removed due to community feedback" in response.text:
                    self.log_result("Auto-Delete Logic", True, 
                                  f"Post auto-deleted after {dislike_count} dislikes")
                    return
                    
            except Exception as e:
                self.log_result("Auto-Delete Logic", False, 
                              f"Exception during auto-delete test: {str(e)}")
                return
        
        # If we get here, check if post still exists
        try:
            auth_headers = {
                **HEADERS,
                "Authorization": f"Bearer {self.tokens[1]}"
            }
            
            vote_data = {"vote_type": "like"}
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 404:
                self.log_result("Auto-Delete Logic", True, 
                              f"Post correctly auto-deleted after {dislike_count} dislikes")
            else:
                self.log_result("Auto-Delete Logic", False, 
                              f"Post not deleted despite {dislike_count} dislikes")
                
        except Exception as e:
            self.log_result("Auto-Delete Logic", False, 
                          f"Exception checking post deletion: {str(e)}")
    
    def test_get_posts_with_votes(self):
        """Test that GET endpoints return posts with likes and dislikes arrays"""
        print("\n=== Testing Get Posts with Vote Arrays ===")
        
        if not self.tokens:
            self.log_result("Get Posts with Votes", False, "No users available")
            return
            
        # Create a new post for this test
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[0]}"
        }
        
        post_data = {
            "content": "Test post for checking vote arrays in GET responses",
            "privacy": {
                "level": "public",
                "specific_user_ids": []
            }
        }
        
        try:
            # Create post
            response = requests.post(f"{BASE_URL}/posts/enhanced", 
                                   json=post_data, headers=auth_headers)
            
            if response.status_code != 200:
                self.log_result("Get Posts with Votes", False, 
                              f"Failed to create test post: {response.text}")
                return
                
            new_post_id = response.json()["id"]
            
            # Add some votes
            if len(self.tokens) >= 3:
                # User 1 likes
                vote_data = {"vote_type": "like"}
                requests.post(f"{BASE_URL}/posts/{new_post_id}/vote", 
                            json=vote_data, 
                            headers={"Authorization": f"Bearer {self.tokens[1]}", **HEADERS})
                
                # User 2 dislikes
                vote_data = {"vote_type": "dislike"}
                requests.post(f"{BASE_URL}/posts/{new_post_id}/vote", 
                            json=vote_data, 
                            headers={"Authorization": f"Bearer {self.tokens[2]}", **HEADERS})
            
            # Test GET /api/posts/enhanced
            response = requests.get(f"{BASE_URL}/posts/enhanced", headers=auth_headers)
            
            if response.status_code == 200:
                posts = response.json()
                found_post = None
                for post in posts:
                    if post["id"] == new_post_id:
                        found_post = post
                        break
                
                if found_post:
                    has_likes = "likes" in found_post and isinstance(found_post["likes"], list)
                    has_dislikes = "dislikes" in found_post and isinstance(found_post["dislikes"], list)
                    
                    if has_likes and has_dislikes:
                        self.log_result("Get Posts with Votes", True, 
                                      f"GET /posts/enhanced returns likes and dislikes arrays")
                    else:
                        self.log_result("Get Posts with Votes", False, 
                                      f"Missing vote arrays in response", found_post)
                else:
                    self.log_result("Get Posts with Votes", False, 
                                  "Test post not found in GET response")
            else:
                self.log_result("Get Posts with Votes", False, 
                              f"Failed to get posts: {response.text}")
                
        except Exception as e:
            self.log_result("Get Posts with Votes", False, 
                          f"Exception testing GET posts: {str(e)}")
    
    def test_vote_on_deleted_post(self):
        """Test voting on a deleted post returns 404"""
        print("\n=== Testing Vote on Deleted Post ===")
        
        if not self.tokens:
            self.log_result("Vote on Deleted Post", False, "No users available")
            return
            
        # Try to vote on the auto-deleted post
        auth_headers = {
            **HEADERS,
            "Authorization": f"Bearer {self.tokens[1]}"
        }
        
        vote_data = {"vote_type": "like"}
        
        try:
            response = requests.post(f"{BASE_URL}/posts/{self.test_post_id}/vote", 
                                   json=vote_data, headers=auth_headers)
            
            if response.status_code == 404:
                self.log_result("Vote on Deleted Post", True, 
                              "Correctly returns 404 when voting on deleted post")
            else:
                self.log_result("Vote on Deleted Post", False, 
                              f"Expected 404, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Vote on Deleted Post", False, 
                          f"Exception voting on deleted post: {str(e)}")
    
    def run_all_tests(self):
        """Run all voting functionality tests"""
        print("🚀 Starting Post Voting Functionality Tests")
        print(f"Backend URL: {BASE_URL}")
        
        # Setup
        self.create_test_users()
        self.create_test_post()
        
        # Basic voting tests
        self.test_like_post()
        self.test_dislike_post()
        self.test_toggle_like()
        self.test_toggle_dislike()
        
        # Advanced voting tests
        self.test_switch_like_to_dislike()
        self.test_switch_dislike_to_like()
        
        # Security and validation tests
        self.test_self_voting_prevention()
        
        # Auto-delete functionality
        self.test_auto_delete_logic()
        self.test_vote_on_deleted_post()
        
        # API response format tests
        self.test_get_posts_with_votes()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("📊 POST VOTING FUNCTIONALITY TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in self.results if "✅ PASS" in r["status"])
        failed = sum(1 for r in self.results if "❌ FAIL" in r["status"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if "❌ FAIL" in result["status"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.results:
            if "✅ PASS" in result["status"]:
                print(f"  • {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = PostVotingTester()
    tester.run_all_tests()