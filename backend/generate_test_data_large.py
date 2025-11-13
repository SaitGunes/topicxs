import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timedelta
import random
import string

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Sample data
ENGLISH_NAMES = [
    "John Smith", "Emma Johnson", "Michael Brown", "Sarah Davis", "James Wilson",
    "Lisa Anderson", "David Taylor", "Maria Garcia", "Robert Martinez", "Jennifer Rodriguez",
    "William Lee", "Patricia Walker", "Richard Hall", "Linda Allen", "Joseph Young",
    "Barbara King", "Thomas Wright", "Elizabeth Lopez", "Christopher Hill", "Nancy Scott"
]

TURKISH_NAMES = [
    "Ahmet Yılmaz", "Ayşe Demir", "Mehmet Çelik", "Fatma Kaya", "Ali Şahin",
    "Zeynep Yıldız", "Mustafa Özdemir", "Elif Aydın", "Hasan Öztürk", "Merve Arslan",
    "Hüseyin Doğan", "Selin Kılıç", "İbrahim Aslan", "Esra Çetin", "Osman Polat",
    "Büşra Erdoğan", "Murat Güneş", "Gizem Şimşek", "Emre Yücel", "Deniz Kurt"
]

SPANISH_NAMES = [
    "Juan García", "María López", "José Martínez", "Ana González", "Carlos Rodríguez",
    "Carmen Fernández", "Miguel Pérez", "Laura Sánchez", "Francisco Ramírez", "Isabel Torres"
]

POST_TEXTS = [
    "Just finished a long haul delivery. Road conditions were great today! 🚛",
    "Beautiful sunrise on the highway this morning ☀️",
    "Tips for new drivers: Always check your mirrors and stay alert!",
    "Rest area coffee hits different after 8 hours of driving ☕",
    "Traffic jam for 2 hours... patience is key in this job 😅",
    "Made it to the destination 30 minutes early! Best feeling ever 🎉",
    "Sharing some photos from my route today. Stunning views! 📸",
    "Question: What's your favorite truck stop?",
    "Winter driving tips: Slow down and increase following distance ❄️",
    "First week as a professional driver. Loving it so far! 💪",
    "Maintenance day. Taking care of the truck that takes care of me 🔧",
    "Night shift driving has its own vibe 🌙",
    "Met some great fellow drivers at the truck stop today 👋",
    "Road safety reminder: No phone while driving! 📵",
    "Celebrating 5 years as a professional driver today! 🎂",
    "Anyone else love listening to podcasts while driving? 🎧",
    "Sunset over the mountains. This is why I love this job 🌄",
    "Delivered 500 loads this year! Personal record 📦",
    "Rain or shine, the deliveries must go on ☔",
    "Taking a well-deserved break. How's everyone doing? 😊"
]

GROUP_NAMES = [
    ("Long Haul Drivers", "For drivers doing interstate and long distance routes"),
    ("Truck Maintenance Tips", "Share and learn about truck maintenance"),
    ("European Drivers", "For drivers operating in Europe"),
    ("Night Shift Crew", "For those who drive through the night"),
    ("Safety First", "Discussing safety practices and regulations"),
    ("Local Delivery Pros", "For local and city delivery drivers"),
    ("Fuel Efficiency Tips", "Save money with better fuel efficiency"),
    ("Trucking Stories", "Share your interesting road stories"),
    ("New Driver Support", "Help and advice for new drivers"),
    ("Veteran Drivers", "Experienced drivers only - 5+ years")
]

async def generate_large_test_data():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.social_app
    
    print("🚀 Starting large test data generation...")
    print("=" * 60)
    
    # Hash password once
    hashed_password = pwd_context.hash("uyeler123")
    
    # Generate users
    print("\n👥 Creating 1000 users...")
    users = []
    user_ids = []
    
    # English users (600)
    for i in range(600):
        name = random.choice(ENGLISH_NAMES)
        username = f"user_en_{i+1}"
        user_id = f"user_{username}_{random.randint(1000, 9999)}"
        
        # Random referral count
        referral_count = random.choice([0, 0, 0, 3, 3, 5, 5, 10])
        
        user = {
            "id": user_id,
            "username": username,
            "email": f"{username}@example.com",
            "password": hashed_password,
            "full_name": name,
            "bio": f"Professional driver from USA/UK",
            "profile_picture": None,
            "referral_code": f"REF{username.upper()}",
            "invited_by": None,
            "referral_count": referral_count,
            "friend_ids": [],
            "blocked_user_ids": [],
            "is_admin": False,
            "user_type": random.choice(["professional_driver", "driver", "non_driver"]),
            "email_verified": random.choice([True, False]),
            "email_verification_code": None,
            "phone_number": None,
            "notification_preferences": {
                "friend_requests": True,
                "messages": True,
                "likes": True,
                "comments": True
            },
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 365))
        }
        users.append(user)
        user_ids.append(user_id)
    
    # Turkish users (300)
    for i in range(300):
        name = random.choice(TURKISH_NAMES)
        username = f"user_tr_{i+1}"
        user_id = f"user_{username}_{random.randint(1000, 9999)}"
        
        referral_count = random.choice([0, 0, 0, 3, 3, 5, 5, 10])
        
        user = {
            "id": user_id,
            "username": username,
            "email": f"{username}@example.com",
            "password": hashed_password,
            "full_name": name,
            "bio": f"Türkiye'den profesyonel sürücü",
            "profile_picture": None,
            "referral_code": f"REF{username.upper()}",
            "invited_by": None,
            "referral_count": referral_count,
            "friend_ids": [],
            "blocked_user_ids": [],
            "is_admin": False,
            "user_type": random.choice(["professional_driver", "driver", "non_driver"]),
            "email_verified": random.choice([True, False]),
            "email_verification_code": None,
            "phone_number": None,
            "notification_preferences": {
                "friend_requests": True,
                "messages": True,
                "likes": True,
                "comments": True
            },
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 365))
        }
        users.append(user)
        user_ids.append(user_id)
    
    # Spanish users (100)
    for i in range(100):
        name = random.choice(SPANISH_NAMES)
        username = f"user_es_{i+1}"
        user_id = f"user_{username}_{random.randint(1000, 9999)}"
        
        referral_count = random.choice([0, 0, 0, 3, 3, 5, 5, 10])
        
        user = {
            "id": user_id,
            "username": username,
            "email": f"{username}@example.com",
            "password": hashed_password,
            "full_name": name,
            "bio": f"Conductor profesional de España/México",
            "profile_picture": None,
            "referral_code": f"REF{username.upper()}",
            "invited_by": None,
            "referral_count": referral_count,
            "friend_ids": [],
            "blocked_user_ids": [],
            "is_admin": False,
            "user_type": random.choice(["professional_driver", "driver", "non_driver"]),
            "email_verified": random.choice([True, False]),
            "email_verification_code": None,
            "phone_number": None,
            "notification_preferences": {
                "friend_requests": True,
                "messages": True,
                "likes": True,
                "comments": True
            },
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 365))
        }
        users.append(user)
        user_ids.append(user_id)
    
    await db.users.insert_many(users)
    print(f"   ✓ Created {len(users)} users")
    
    # Create friendships
    print("\n👥 Creating friendships...")
    for user in users[:500]:  # First 500 users get friends
        num_friends = random.randint(10, 30)
        potential_friends = [u for u in user_ids if u != user["id"]]
        friends = random.sample(potential_friends, min(num_friends, len(potential_friends)))
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"friend_ids": friends}}
        )
        
        # Update reverse friendships
        for friend_id in friends:
            await db.users.update_one(
                {"id": friend_id},
                {"$addToSet": {"friend_ids": user["id"]}}
            )
    
    print(f"   ✓ Created random friendships (10-30 friends each)")
    
    # Create groups
    print("\n🏢 Creating 10 groups...")
    group_ids = []
    for i, (name, description) in enumerate(GROUP_NAMES):
        group_id = f"group_{i+1}_{random.randint(1000, 9999)}"
        is_private = i < 5  # First 5 are private
        
        founder = random.choice(users)
        member_count = random.randint(50, 200)
        members = random.sample(user_ids, min(member_count, len(user_ids)))
        
        group = {
            "id": group_id,
            "name": name,
            "description": description,
            "founder_id": founder["id"],
            "founder_username": founder["username"],
            "is_private": is_private,
            "member_ids": members,
            "pending_request_ids": [],
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 180))
        }
        
        await db.groups.insert_one(group)
        group_ids.append(group_id)
    
    print(f"   ✓ Created 10 groups (5 private, 5 public)")
    
    # Create posts
    print("\n📝 Creating 50 posts...")
    post_ids = []
    for i in range(50):
        author = random.choice(users)
        post_id = f"post_{i+1}_{random.randint(1000, 9999)}"
        
        # Random group assignment (some posts without group)
        group_id = random.choice([None, None, None] + group_ids[:3])
        
        post = {
            "id": post_id,
            "user_id": author["id"],
            "username": author["username"],
            "full_name": author["full_name"],
            "profile_picture": author.get("profile_picture"),
            "text": random.choice(POST_TEXTS),
            "image": None,
            "visibility": random.choice(["public", "friends", "specific"]),
            "specific_user_ids": [],
            "group_id": group_id,
            "likes": random.sample(user_ids, random.randint(5, 50)),
            "dislikes": random.sample(user_ids, random.randint(0, 5)),
            "emoji_reactions": {},
            "comments_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90))
        }
        
        await db.posts_enhanced.insert_one(post)
        post_ids.append(post_id)
    
    print(f"   ✓ Created 50 posts")
    
    # Create comments
    print("\n💬 Creating comments...")
    comment_count = 0
    for post_id in post_ids:
        num_comments = random.randint(1, 10)
        for _ in range(num_comments):
            commenter = random.choice(users)
            comment_id = f"comment_{random.randint(10000, 99999)}"
            
            comment = {
                "id": comment_id,
                "post_id": post_id,
                "user_id": commenter["id"],
                "username": commenter["username"],
                "full_name": commenter["full_name"],
                "profile_picture": commenter.get("profile_picture"),
                "text": random.choice([
                    "Great post!", "Thanks for sharing!", "Very helpful!",
                    "I agree with this", "Interesting perspective",
                    "Stay safe out there!", "Good advice!", "👍"
                ]),
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 60))
            }
            
            await db.comments.insert_one(comment)
            comment_count += 1
        
        # Update comment count
        await db.posts_enhanced.update_one(
            {"id": post_id},
            {"$set": {"comments_count": num_comments}}
        )
    
    print(f"   ✓ Created {comment_count} comments")
    
    # Create pending friend requests
    print("\n✉️ Creating pending friend requests...")
    for _ in range(50):
        from_user = random.choice(users)
        to_user = random.choice(users)
        
        if from_user["id"] != to_user["id"]:
            request_id = f"freq_{random.randint(10000, 99999)}"
            
            friend_request = {
                "id": request_id,
                "from_user_id": from_user["id"],
                "from_username": from_user["username"],
                "to_user_id": to_user["id"],
                "request_status": "pending",
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30))
            }
            
            await db.friend_requests.insert_one(friend_request)
    
    print(f"   ✓ Created 50 pending friend requests")
    
    # Create chatroom messages
    print("\n💬 Creating chatroom messages...")
    for _ in range(100):
        user = random.choice(users)
        message_id = f"chatroom_msg_{random.randint(10000, 99999)}"
        
        message = {
            "id": message_id,
            "user_id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "text": random.choice([
                "Hello everyone!", "Good morning drivers!",
                "Anyone on the road today?", "Stay safe!",
                "Traffic is heavy today", "Great weather for driving!",
                "Coffee break time ☕", "Just finished my route"
            ]),
            "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 72))
        }
        
        await db.chatroom_messages.insert_one(message)
    
    print(f"   ✓ Created 100 chatroom messages")
    
    # Create some reports
    print("\n🚨 Creating sample reports...")
    for _ in range(10):
        reporter = random.choice(users)
        reported_user = random.choice(users)
        
        if reporter["id"] != reported_user["id"]:
            report_id = f"report_{random.randint(10000, 99999)}"
            
            report = {
                "id": report_id,
                "reporter_user_id": reporter["id"],
                "reporter_username": reporter["username"],
                "reported_user_id": reported_user["id"],
                "reported_username": reported_user["username"],
                "report_type": random.choice(["user", "post"]),
                "reason": random.choice(["spam", "harassment", "inappropriate"]),
                "description": "Test report",
                "status": "pending",
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30))
            }
            
            await db.reports.insert_one(report)
    
    print(f"   ✓ Created 10 reports")
    
    print("\n" + "=" * 60)
    print("✅ Test data generation complete!")
    print("\n📊 Summary:")
    print(f"   • 1000 users (600 EN, 300 TR, 100 ES)")
    print(f"   • Password: uyeler123")
    print(f"   • 10-30 friends per user (first 500 users)")
    print(f"   • 50 posts with likes/dislikes")
    print(f"   • {comment_count} comments")
    print(f"   • 10 groups (5 private, 5 public)")
    print(f"   • 50 pending friend requests")
    print(f"   • 100 chatroom messages")
    print(f"   • 10 reports")
    print("\n🎯 Ready for testing!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(generate_large_test_data())
