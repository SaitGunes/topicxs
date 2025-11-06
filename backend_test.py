#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Chat/Messaging System
Testing all chat and messaging endpoints as requested by user
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://driverschat-i18n.preview.emergentagent.com/api"

class ChatMessagingTester:
    def __init__(self):
        self.session = requests.Session()
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.chat_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        
    def create_test_users(self):
        """Create two test users for messaging"""
        print("\n=== Creating Test Users ===")
        
        # Create User 1
        user1_data = {
            "username": f"chatuser1_{int(time.time())}",
            "email": f"chatuser1_{int(time.time())}@test.com",
            "password": "testpass123",
            "full_name": "Chat User One",
            "bio": "Test user for messaging system"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user1_data)
            if response.status_code == 200:
                data = response.json()
                self.user1_token = data["access_token"]
                self.user1_id = data["user"]["id"]
                self.log_result("Create User 1", True, f"User created with ID: {self.user1_id}")
            else:
                self.log_result("Create User 1", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Create User 1", False, f"Exception: {str(e)}")
            return False
            
        # Create User 2
        user2_data = {
            "username": f"chatuser2_{int(time.time())}",
            "email": f"chatuser2_{int(time.time())}@test.com", 
            "password": "testpass123",
            "full_name": "Chat User Two",
            "bio": "Second test user for messaging system"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user2_data)
            if response.status_code == 200:
                data = response.json()
                self.user2_token = data["access_token"]
                self.user2_id = data["user"]["id"]
                self.log_result("Create User 2", True, f"User created with ID: {self.user2_id}")
                return True
            else:
                self.log_result("Create User 2", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Create User 2", False, f"Exception: {str(e)}")
            return False
    
    def test_create_chat(self):
        """Test POST /api/chats - Create new chat"""
        print("\n=== Testing Chat Creation ===")
        
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        chat_data = {
            "name": "Test Chat Between Users",
            "is_group": False,
            "members": [self.user2_id]
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/chats", json=chat_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.chat_id = data["id"]
                
                # Verify chat structure
                required_fields = ["id", "name", "is_group", "members", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Create Chat", False, f"Missing fields: {missing_fields}")
                    return False
                
                # Verify members include both users
                if self.user1_id not in data["members"] or self.user2_id not in data["members"]:
                    self.log_result("Create Chat", False, "Both users not in members list")
                    return False
                    
                self.log_result("Create Chat", True, f"Chat created successfully with ID: {self.chat_id}", data)
                return True
            else:
                self.log_result("Create Chat", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Chat", False, f"Exception: {str(e)}")
            return False
    
    def test_get_user_chats(self):
        """Test GET /api/chats - Get user's chat list"""
        print("\n=== Testing Get User Chats ===")
        
        # Test for User 1
        headers1 = {"Authorization": f"Bearer {self.user1_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/chats", headers=headers1)
            if response.status_code == 200:
                data = response.json()
                
                # Verify it's a list
                if not isinstance(data, list):
                    self.log_result("Get User 1 Chats", False, "Response is not a list")
                    return False
                
                # Find our test chat
                test_chat = None
                for chat in data:
                    if chat["id"] == self.chat_id:
                        test_chat = chat
                        break
                
                if not test_chat:
                    self.log_result("Get User 1 Chats", False, "Test chat not found in user's chat list")
                    return False
                    
                self.log_result("Get User 1 Chats", True, f"Found {len(data)} chats including test chat")
            else:
                self.log_result("Get User 1 Chats", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Get User 1 Chats", False, f"Exception: {str(e)}")
            return False
        
        # Test for User 2
        headers2 = {"Authorization": f"Bearer {self.user2_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/chats", headers=headers2)
            if response.status_code == 200:
                data = response.json()
                
                # Find our test chat
                test_chat = None
                for chat in data:
                    if chat["id"] == self.chat_id:
                        test_chat = chat
                        break
                
                if not test_chat:
                    self.log_result("Get User 2 Chats", False, "Test chat not found in user 2's chat list")
                    return False
                    
                self.log_result("Get User 2 Chats", True, f"Found {len(data)} chats including test chat")
                return True
            else:
                self.log_result("Get User 2 Chats", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Get User 2 Chats", False, f"Exception: {str(e)}")
            return False
    
    def test_send_messages(self):
        """Test POST /api/chats/{chat_id}/messages - Send messages"""
        print("\n=== Testing Send Messages ===")
        
        messages_sent = []
        
        # User 1 sends first message
        headers1 = {"Authorization": f"Bearer {self.user1_token}"}
        message1_data = {
            "chat_id": self.chat_id,
            "content": "Merhaba! Bu test mesajlaşma sisteminin ilk mesajı."
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/chats/{self.chat_id}/messages", 
                                       json=message1_data, headers=headers1)
            if response.status_code == 200:
                data = response.json()
                
                # Verify message structure
                required_fields = ["id", "chat_id", "user_id", "username", "content", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result("Send Message 1", False, f"Missing fields: {missing_fields}")
                    return False
                
                # Verify content and user
                if data["content"] != message1_data["content"]:
                    self.log_result("Send Message 1", False, "Message content mismatch")
                    return False
                    
                if data["user_id"] != self.user1_id:
                    self.log_result("Send Message 1", False, "Message user_id mismatch")
                    return False
                
                messages_sent.append(data)
                self.log_result("Send Message 1", True, f"Message sent by User 1: {data['id']}")
            else:
                self.log_result("Send Message 1", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Send Message 1", False, f"Exception: {str(e)}")
            return False
        
        # User 2 sends reply
        headers2 = {"Authorization": f"Bearer {self.user2_token}"}
        message2_data = {
            "chat_id": self.chat_id,
            "content": "Merhaba! Bu da ikinci kullanıcıdan gelen cevap mesajı."
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/chats/{self.chat_id}/messages", 
                                       json=message2_data, headers=headers2)
            if response.status_code == 200:
                data = response.json()
                
                if data["user_id"] != self.user2_id:
                    self.log_result("Send Message 2", False, "Message user_id mismatch")
                    return False
                
                messages_sent.append(data)
                self.log_result("Send Message 2", True, f"Reply sent by User 2: {data['id']}")
            else:
                self.log_result("Send Message 2", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Send Message 2", False, f"Exception: {str(e)}")
            return False
        
        # User 1 sends another message
        message3_data = {
            "chat_id": self.chat_id,
            "content": "Harika! Mesajlaşma sistemi çalışıyor. Bu üçüncü test mesajı."
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/chats/{self.chat_id}/messages", 
                                       json=message3_data, headers=headers1)
            if response.status_code == 200:
                data = response.json()
                messages_sent.append(data)
                self.log_result("Send Message 3", True, f"Third message sent by User 1: {data['id']}")
                return True
            else:
                self.log_result("Send Message 3", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Send Message 3", False, f"Exception: {str(e)}")
            return False
    
    def test_get_messages(self):
        """Test GET /api/chats/{chat_id}/messages - Get messages"""
        print("\n=== Testing Get Messages ===")
        
        # User 1 gets messages
        headers1 = {"Authorization": f"Bearer {self.user1_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/chats/{self.chat_id}/messages", headers=headers1)
            if response.status_code == 200:
                data = response.json()
                
                # Verify it's a list
                if not isinstance(data, list):
                    self.log_result("Get Messages User 1", False, "Response is not a list")
                    return False
                
                # Should have at least 3 messages
                if len(data) < 3:
                    self.log_result("Get Messages User 1", False, f"Expected at least 3 messages, got {len(data)}")
                    return False
                
                # Verify messages are sorted by creation time (oldest first)
                for i in range(1, len(data)):
                    if data[i]["created_at"] < data[i-1]["created_at"]:
                        self.log_result("Get Messages User 1", False, "Messages not sorted by creation time")
                        return False
                
                # Verify message structure
                for msg in data:
                    required_fields = ["id", "chat_id", "user_id", "username", "content", "created_at"]
                    missing_fields = [field for field in required_fields if field not in msg]
                    if missing_fields:
                        self.log_result("Get Messages User 1", False, f"Message missing fields: {missing_fields}")
                        return False
                
                self.log_result("Get Messages User 1", True, f"Retrieved {len(data)} messages correctly")
            else:
                self.log_result("Get Messages User 1", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Messages User 1", False, f"Exception: {str(e)}")
            return False
        
        # User 2 gets messages
        headers2 = {"Authorization": f"Bearer {self.user2_token}"}
        try:
            response = self.session.get(f"{BACKEND_URL}/chats/{self.chat_id}/messages", headers=headers2)
            if response.status_code == 200:
                data = response.json()
                
                if len(data) < 3:
                    self.log_result("Get Messages User 2", False, f"Expected at least 3 messages, got {len(data)}")
                    return False
                
                self.log_result("Get Messages User 2", True, f"Retrieved {len(data)} messages correctly")
                return True
            else:
                self.log_result("Get Messages User 2", False, f"Failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Messages User 2", False, f"Exception: {str(e)}")
            return False
    
    def test_error_scenarios(self):
        """Test error handling scenarios"""
        print("\n=== Testing Error Scenarios ===")
        
        # Test unauthorized access (no token)
        try:
            response = self.session.get(f"{BACKEND_URL}/chats")
            if response.status_code in [401, 403]:
                self.log_result("Unauthorized Access", True, f"Correctly blocked unauthorized access: {response.status_code}")
            else:
                self.log_result("Unauthorized Access", False, f"Should block unauthorized access, got: {response.status_code}")
        except Exception as e:
            self.log_result("Unauthorized Access", False, f"Exception: {str(e)}")
        
        # Test sending message to non-existent chat
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        fake_chat_id = "nonexistent_chat_id"
        message_data = {
            "chat_id": fake_chat_id,
            "content": "This should fail"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/chats/{fake_chat_id}/messages", 
                                       json=message_data, headers=headers)
            if response.status_code in [403, 404]:
                self.log_result("Send to Non-existent Chat", True, f"Correctly blocked message to non-existent chat: {response.status_code}")
            else:
                self.log_result("Send to Non-existent Chat", False, f"Should block message to non-existent chat, got: {response.status_code}")
        except Exception as e:
            self.log_result("Send to Non-existent Chat", False, f"Exception: {str(e)}")
        
        # Test getting messages from non-existent chat
        try:
            response = self.session.get(f"{BACKEND_URL}/chats/{fake_chat_id}/messages", headers=headers)
            if response.status_code in [403, 404]:
                self.log_result("Get Messages Non-existent Chat", True, f"Correctly blocked access to non-existent chat: {response.status_code}")
            else:
                self.log_result("Get Messages Non-existent Chat", False, f"Should block access to non-existent chat, got: {response.status_code}")
        except Exception as e:
            self.log_result("Get Messages Non-existent Chat", False, f"Exception: {str(e)}")
    
    def test_chat_updates(self):
        """Test that chat list updates with last message"""
        print("\n=== Testing Chat Updates ===")
        
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        # Get current chat list
        try:
            response = self.session.get(f"{BACKEND_URL}/chats", headers=headers)
            if response.status_code == 200:
                chats = response.json()
                
                # Find our test chat
                test_chat = None
                for chat in chats:
                    if chat["id"] == self.chat_id:
                        test_chat = chat
                        break
                
                if not test_chat:
                    self.log_result("Chat Updates", False, "Test chat not found")
                    return False
                
                # Check if last_message is updated
                if test_chat.get("last_message"):
                    self.log_result("Chat Updates", True, f"Chat has last_message: {test_chat['last_message']}")
                else:
                    self.log_result("Chat Updates", False, "Chat last_message not updated")
                    return False
                
                # Check if last_message_time exists
                if test_chat.get("last_message_time"):
                    self.log_result("Chat Last Message Time", True, f"Chat has last_message_time: {test_chat['last_message_time']}")
                    return True
                else:
                    self.log_result("Chat Last Message Time", False, "Chat last_message_time not updated")
                    return False
            else:
                self.log_result("Chat Updates", False, f"Failed to get chats: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Chat Updates", False, f"Exception: {str(e)}")
            return False
    
    def test_message_ordering(self):
        """Test that messages are properly ordered"""
        print("\n=== Testing Message Ordering ===")
        
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/chats/{self.chat_id}/messages", headers=headers)
            if response.status_code == 200:
                messages = response.json()
                
                if len(messages) < 2:
                    self.log_result("Message Ordering", False, "Need at least 2 messages to test ordering")
                    return False
                
                # Check if messages are ordered by created_at (oldest first)
                is_ordered = True
                for i in range(1, len(messages)):
                    if messages[i]["created_at"] < messages[i-1]["created_at"]:
                        is_ordered = False
                        break
                
                if is_ordered:
                    self.log_result("Message Ordering", True, f"Messages properly ordered by creation time ({len(messages)} messages)")
                    return True
                else:
                    self.log_result("Message Ordering", False, "Messages not properly ordered by creation time")
                    return False
            else:
                self.log_result("Message Ordering", False, f"Failed to get messages: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Message Ordering", False, f"Exception: {str(e)}")
            return False
    
    def test_unread_message_count(self):
        """Test unread message functionality (if implemented)"""
        print("\n=== Testing Unread Message Count ===")
        
        # This is a placeholder test since unread count might not be implemented
        # We'll just verify the chat structure includes necessary fields
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/chats", headers=headers)
            if response.status_code == 200:
                chats = response.json()
                
                # Find our test chat
                test_chat = None
                for chat in chats:
                    if chat["id"] == self.chat_id:
                        test_chat = chat
                        break
                
                if test_chat:
                    # Check if chat has the basic structure for potential unread count
                    has_last_message = "last_message" in test_chat
                    has_last_message_time = "last_message_time" in test_chat
                    
                    if has_last_message and has_last_message_time:
                        self.log_result("Unread Message Structure", True, "Chat has structure for unread message tracking")
                        return True
                    else:
                        self.log_result("Unread Message Structure", False, "Chat missing fields for unread message tracking")
                        return False
                else:
                    self.log_result("Unread Message Structure", False, "Test chat not found")
                    return False
            else:
                self.log_result("Unread Message Structure", False, f"Failed to get chats: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Unread Message Structure", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all messaging system tests"""
        print("🚀 Starting Comprehensive Chat/Messaging System Tests")
        print("=" * 60)
        
        # Create test users
        if not self.create_test_users():
            print("❌ Failed to create test users. Stopping tests.")
            return False
        
        # Test chat creation
        if not self.test_create_chat():
            print("❌ Failed to create chat. Stopping tests.")
            return False
        
        # Test getting user chats
        if not self.test_get_user_chats():
            print("❌ Failed to get user chats. Continuing with other tests.")
        
        # Test sending messages
        if not self.test_send_messages():
            print("❌ Failed to send messages. Continuing with other tests.")
        
        # Test getting messages
        if not self.test_get_messages():
            print("❌ Failed to get messages. Continuing with other tests.")
        
        # Test message ordering
        if not self.test_message_ordering():
            print("❌ Failed message ordering test. Continuing with other tests.")
        
        # Test chat updates
        if not self.test_chat_updates():
            print("❌ Failed chat updates test. Continuing with other tests.")
        
        # Test unread message count structure
        if not self.test_unread_message_count():
            print("❌ Failed unread message count test. Continuing with other tests.")
        
        # Test error scenarios
        self.test_error_scenarios()
        
        # Print summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 MESAJLAŞMA SİSTEMİ TEST SONUÇLARI")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        total = len(self.test_results)
        
        print(f"Toplam Test: {total}")
        print(f"Başarılı: {passed} ✅")
        print(f"Başarısız: {failed} ❌")
        print(f"Başarı Oranı: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n❌ BAŞARISIZ TESTLER:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ BAŞARILI TESTLER:")
        for result in self.test_results:
            if "✅ PASS" in result["status"]:
                print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        
        # Test edilen endpoint'ler
        print("\n📋 TEST EDİLEN ENDPOINT'LER:")
        print("✅ POST /api/chats - Yeni sohbet oluşturma")
        print("✅ GET /api/chats - Kullanıcının sohbet listesi")
        print("✅ POST /api/chats/{chat_id}/messages - Mesaj gönderme")
        print("✅ GET /api/chats/{chat_id}/messages - Mesajları alma")
        print("\n📋 TEST EDİLEN ÖZELLİKLER:")
        print("✅ İki kullanıcı arası sohbet başlatma")
        print("✅ Mesaj gönderme ve alma")
        print("✅ Mesaj sıralaması (eskiden yeniye)")
        print("✅ Sohbet listesi güncelleme")
        print("✅ Yetkilendirme kontrolü")
        print("✅ Hata senaryoları")
        
        if passed == total:
            print("\n🎉 TÜM TESTLER BAŞARILI! Mesajlaşma sistemi tam olarak çalışıyor.")
        else:
            print(f"\n⚠️ {failed} test başarısız oldu. Detaylar yukarıda listelenmiştir.")

if __name__ == "__main__":
    tester = ChatMessagingTester()
    tester.run_all_tests()