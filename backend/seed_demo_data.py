import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from faker import Faker
import random
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from passlib.context import CryptContext

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Faker instances for different languages
fake_en = Faker('en_US')
fake_tr = Faker('tr_TR')
fake_es = Faker('es_ES')

# MongoDB connection
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client.drivers_chat

async def check_data():
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'social_app')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

# Current topics and trends (June 2025)
TOPICS_EN = [
    "Just tested the new Tesla Model Y with full self-driving - incredible experience!",
    "Road trip tips for summer 2025: What's your favorite scenic route?",
    "Electric vehicles are getting more affordable. Anyone else considering the switch?",
    "Traffic in LA is worse than ever. We need better public transit!",
    "Best dash cam for 2025? Looking for recommendations",
    "Winter tires: When do you switch? Share your experience",
    "Gas prices are crazy high again. Time for that EV?",
    "Just passed my driving test! Any tips for new drivers?",
    "Autonomous trucks on highways - what do professional drivers think?",
    "Best car insurance deals in 2025? Help me save some money!",
    "Long distance driving fatigue - how do you deal with it?",
    "Classic cars vs modern tech - which do you prefer?",
    "Motorcycle season is here! Who's ready to ride?",
    "Urban cycling infrastructure is improving. Finally!",
    "Carpooling apps - which one do you use?",
    "EV charging stations need to be more widespread",
    "Semi-truck drivers: What's the biggest challenge you face?",
    "Road rage incidents are increasing. Stay safe out there!",
    "Best podcasts for long drives? Drop your recommendations",
    "Fuel efficiency hacks that actually work",
]

TOPICS_TR = [
    "İstanbul trafiği için en iyi saatler hangisi? Tecrübelerinizi paylaşın",
    "Yeni aldığım elektrikli araç hakkında sorularınız var mı?",
    "Uzun yol sürüşleri için en iyi dinlenme tesisleri",
    "Otoban hız limitleri tartışması - sizce yeterli mi?",
    "Ankara-İzmir yolu yenilendi, harika bir deneyim!",
    "Kışlık lastik önerileri 2025 - hangisi daha iyi?",
    "Ehliyet sınavı ipuçları - yeni sürücüler için",
    "Yakıt fiyatları çok yüksek, hibrit araba düşünüyorum",
    "En ekonomik araba modelleri hangileri?",
    "Trafik cezaları hakkında bilgi paylaşımı",
    "Araç bakımı için en uygun servisler İstanbul'da",
    "Otomobil alırken nelere dikkat etmeliyiz?",
    "Sürüş güvenliği için en önemli kurallar",
    "Motorsiklet sezonu açıldı, kimler hazır?",
    "Şehir içi park yerleri sorunu nasıl çözülür?",
    "Araç kiralama deneyimleriniz nasıl?",
    "En iyi navigasyon uygulaması hangisi?",
    "Yol yardım sigortası gerekli mi?",
    "Araç temizliği için önerileriniz neler?",
    "Trafik kazalarından korunma yöntemleri",
]

TOPICS_ES = [
    "¿Cuál es la mejor ruta para viajar por España en verano?",
    "Los coches eléctricos son el futuro - ¿quién está de acuerdo?",
    "Consejos para conducir en las ciudades grandes",
    "¿Qué tan seguro es el transporte público en tu ciudad?",
    "Acabé de comprar un coche nuevo - ¡estoy emocionado!",
    "Los precios de la gasolina están por las nubes",
    "¿Alguien más usa aplicaciones de carpooling?",
    "La mejor época para hacer un road trip",
    "Problemas con el tráfico en Madrid - ¿soluciones?",
    "¿Qué seguro de auto recomiendan?",
    "Consejos para nuevos conductores en 2025",
    "Los camiones autónomos cambiarán todo",
    "¿Cuál es tu coche de ensueño?",
    "Infraestructura para vehículos eléctricos en España",
    "Las motos son más eficientes en la ciudad",
    "¿Cómo lidiar con el estrés al conducir?",
    "Los mejores podcasts para viajes largos",
    "Técnicas de conducción defensiva",
    "¿Vale la pena comprar un coche híbrido?",
    "Estaciones de carga para EVs - ¿dónde faltan más?",
]

# Comment templates
COMMENTS_EN = [
    "Great point!", "I totally agree!", "Thanks for sharing!", "Interesting perspective",
    "This is so true", "I had the same experience", "Couldn't agree more", "Well said!",
    "This is helpful", "Good to know", "Same here!", "Exactly what I was thinking",
]

COMMENTS_TR = [
    "Haklısınız!", "Kesinlikle katılıyorum!", "Paylaşım için teşekkürler!", "İlginç bakış açısı",
    "Çok doğru", "Benim de aynı deneyimim oldu", "Tam olarak katılıyorum", "Güzel söylemişsiniz!",
    "Faydalı bilgi", "Bilmek güzel", "Aynen öyle!", "Tam da düşündüğüm gibi",
]

COMMENTS_ES = [
    "¡Gran punto!", "¡Totalmente de acuerdo!", "¡Gracias por compartir!", "Perspectiva interesante",
    "Esto es muy cierto", "Tuve la misma experiencia", "No podría estar más de acuerdo", "¡Bien dicho!",
    "Esto es útil", "Bueno saber", "¡Lo mismo aquí!", "Exactamente lo que pensaba",
]

CHAT_MESSAGES_EN = [
    "Hey everyone! 👋", "How's the traffic today?", "Anyone driving through downtown?",
    "Best route to avoid highway traffic?", "Stay safe out there!", "Good morning drivers!",
    "Traffic is crazy today", "Anyone need a ride share?", "Weather looks good for a drive",
]

CHAT_MESSAGES_TR = [
    "Herkese merhaba! 👋", "Bugün trafik nasıl?", "Şehir merkezinden geçen var mı?",
    "Otobandan kaçınmak için en iyi rota?", "Güvenli sürüşler!", "Günaydın sürücüler!",
    "Bugün trafik çok yoğun", "Araç paylaşımı isteyen var mı?", "Hava sürüş için ideal",
]

CHAT_MESSAGES_ES = [
    "¡Hola a todos! 👋", "¿Cómo está el tráfico hoy?", "¿Alguien conduciendo por el centro?",
    "¿Mejor ruta para evitar autopista?", "¡Manéjense con cuidado!", "¡Buenos días conductores!",
    "El tráfico está loco hoy", "¿Alguien necesita compartir viaje?", "El clima está bien para conducir",
]

GROUP_NAMES = [
    "Tesla Owners Club", "Classic Car Enthusiasts", "Truck Drivers United",
    "Motorcycle Riders", "EV Discussion Group", "Road Trip Planners",
    "City Commuters", "Long Distance Drivers", "Car Maintenance Tips",
    "Traffic Updates Live", "Carpooling Community", "Vintage Cars Lovers",
    "Professional Drivers", "Sunday Cruisers", "Auto Racing Fans",
]

async def clear_database_keep_admin():
    """Clear all collections except admin user"""
    print(f"🗑️  Clearing database: {db.name} (keeping admin)...")
    
    # Get admin user
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        print("⚠️  No admin user found. Creating one...")
        admin_id = str(int(datetime.utcnow().timestamp() * 1000))
        admin = {
            "id": admin_id,
            "username": "admin",
            "email": "admin@drivers.com",
            "password": pwd_context.hash("admin123"),
            "full_name": "Admin User",
            "bio": "Platform Administrator",
            "profile_picture": None,
            "user_type": "admin",
            "age": 30,
            "phone_number": None,
            "email_verified": True,
            "stars": 5,
            "invited_by": None,
            "referral_count": 0,
            "friend_ids": [],
            "following_ids": [],
            "followers_ids": [],
            "blocked_user_ids": [],
            "is_admin": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin)
    
    # Clear all collections
    await db.users.delete_many({"username": {"$ne": "admin"}})
    await db.posts.delete_many({})
    await db.posts_enhanced.delete_many({})
    await db.comments.delete_many({})
    await db.groups.delete_many({})
    await db.group_messages.delete_many({})
    await db.chatroom_messages.delete_many({})
    await db.friend_requests.delete_many({})
    await db.chats.delete_many({})
    await db.chat_messages.delete_many({})
    
    print("✅ Database cleared (admin preserved)")
    return admin

async def create_users(en_count=500, tr_count=300, es_count=200):
    """Create demo users in different languages"""
    print(f"👥 Creating {en_count + tr_count + es_count} users...")
    
    users = []
    
    # English users
    for i in range(en_count):
        user_id = str(int(datetime.utcnow().timestamp() * 1000) + i)
        user = {
            "id": user_id,
            "username": fake_en.user_name() + str(i),
            "email": fake_en.email(),
            "password": pwd_context.hash("password123"),
            "full_name": fake_en.name(),
            "bio": fake_en.sentence(),
            "profile_picture": None,
            "user_type": random.choice(["driver", "passenger", "both"]),
            "age": random.randint(18, 65),
            "phone_number": None,
            "email_verified": True,
            "stars": random.randint(1, 5),
            "invited_by": None,
            "referral_count": 0,
            "friend_ids": [],
            "following_ids": [],
            "followers_ids": [],
            "blocked_user_ids": [],
            "is_admin": False,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90))
        }
        users.append(user)
    
    # Turkish users
    for i in range(tr_count):
        user_id = str(int(datetime.utcnow().timestamp() * 1000) + en_count + i)
        user = {
            "id": user_id,
            "username": fake_tr.user_name() + str(i),
            "email": fake_tr.email(),
            "password": pwd_context.hash("password123"),
            "full_name": fake_tr.name(),
            "bio": fake_tr.sentence(),
            "profile_picture": None,
            "user_type": random.choice(["driver", "passenger", "both"]),
            "age": random.randint(18, 65),
            "phone_number": None,
            "email_verified": True,
            "stars": random.randint(1, 5),
            "invited_by": None,
            "referral_count": 0,
            "friend_ids": [],
            "following_ids": [],
            "followers_ids": [],
            "blocked_user_ids": [],
            "is_admin": False,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90))
        }
        users.append(user)
    
    # Spanish users
    for i in range(es_count):
        user_id = str(int(datetime.utcnow().timestamp() * 1000) + en_count + tr_count + i)
        user = {
            "id": user_id,
            "username": fake_es.user_name() + str(i),
            "email": fake_es.email(),
            "password": pwd_context.hash("password123"),
            "full_name": fake_es.name(),
            "bio": fake_es.sentence(),
            "profile_picture": None,
            "user_type": random.choice(["driver", "passenger", "both"]),
            "age": random.randint(18, 65),
            "phone_number": None,
            "email_verified": True,
            "stars": random.randint(1, 5),
            "invited_by": None,
            "referral_count": 0,
            "friend_ids": [],
            "following_ids": [],
            "followers_ids": [],
            "blocked_user_ids": [],
            "is_admin": False,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90))
        }
        users.append(user)
    
    await db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")
    return users

async def create_posts(users, count=300):
    """Create demo posts with current topics"""
    print(f"📝 Creating {count} posts...")
    
    posts = []
    for i in range(count):
        user = random.choice(users)
        
        # Determine language based on user
        user_index = users.index(user)
        if user_index < 500:
            content = random.choice(TOPICS_EN)
        elif user_index < 800:
            content = random.choice(TOPICS_TR)
        else:
            content = random.choice(TOPICS_ES)
        
        post_id = str(int(datetime.utcnow().timestamp() * 1000) + i)
        created_at = datetime.utcnow() - timedelta(hours=random.randint(1, 720))
        
        post = {
            "id": post_id,
            "user_id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "user_profile_picture": user.get("profile_picture"),
            "content": content,
            "image": None,
            "likes": [],
            "dislikes": [],
            "reactions": {},
            "comments_count": 0,
            "created_at": created_at,
            "privacy": "public"
        }
        posts.append(post)
    
    await db.posts_enhanced.insert_many(posts)
    print(f"✅ Created {len(posts)} posts")
    return posts

async def create_friendships_and_follows(users):
    """Create random friendships and follow relationships"""
    print("🤝 Creating friendships and follows...")
    
    friend_count = 0
    follow_count = 0
    
    for user in users:
        # Random number of friends (0-20)
        num_friends = random.randint(0, min(20, len(users) - 1))
        friends = random.sample([u for u in users if u["id"] != user["id"]], num_friends)
        
        friend_ids = [f["id"] for f in friends]
        
        # Random number of follows (0-50)
        num_follows = random.randint(0, min(50, len(users) - 1))
        follows = random.sample([u for u in users if u["id"] != user["id"]], num_follows)
        
        following_ids = [f["id"] for f in follows]
        
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "friend_ids": friend_ids,
                    "following_ids": following_ids
                }
            }
        )
        
        # Update followers for followed users
        for followed_user in follows:
            await db.users.update_one(
                {"id": followed_user["id"]},
                {"$addToSet": {"followers_ids": user["id"]}}
            )
            follow_count += 1
        
        friend_count += len(friend_ids)
    
    print(f"✅ Created {friend_count} friendships and {follow_count} follows")

async def create_groups(users):
    """Create demo groups"""
    print("👥 Creating groups...")
    
    groups = []
    for i, name in enumerate(GROUP_NAMES):
        creator = random.choice(users)
        group_id = str(int(datetime.utcnow().timestamp() * 1000) + i)
        
        # Random members (5-30 per group)
        num_members = random.randint(5, min(30, len(users)))
        members = random.sample(users, num_members)
        member_ids = [creator["id"]] + [m["id"] for m in members if m["id"] != creator["id"]]
        
        group = {
            "id": group_id,
            "name": name,
            "description": f"A community for {name.lower()}",
            "creator_id": creator["id"],
            "member_ids": member_ids,
            "pending_requests": [],
            "privacy": random.choice(["public", "private"]),
            "requires_approval": random.choice([True, False]),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 60))
        }
        groups.append(group)
    
    await db.groups.insert_many(groups)
    print(f"✅ Created {len(groups)} groups")
    return groups

async def create_comments(users, posts):
    """Create random comments on posts"""
    print("💬 Creating comments...")
    
    comments = []
    for post in posts:
        # Random number of comments (0-10 per post)
        num_comments = random.randint(0, 10)
        
        for i in range(num_comments):
            commenter = random.choice(users)
            
            # Determine language
            user_index = users.index(commenter)
            if user_index < 500:
                content = random.choice(COMMENTS_EN)
            elif user_index < 800:
                content = random.choice(COMMENTS_TR)
            else:
                content = random.choice(COMMENTS_ES)
            
            comment_id = str(int(datetime.utcnow().timestamp() * 1000) + len(comments))
            
            comment = {
                "id": comment_id,
                "post_id": post["id"],
                "user_id": commenter["id"],
                "username": commenter["username"],
                "full_name": commenter["full_name"],
                "user_profile_picture": commenter.get("profile_picture"),
                "content": content,
                "created_at": post["created_at"] + timedelta(minutes=random.randint(1, 1440))
            }
            comments.append(comment)
        
        # Update comment count
        await db.posts_enhanced.update_one(
            {"id": post["id"]},
            {"$set": {"comments_count": num_comments}}
        )
    
    if comments:
        await db.comments.insert_many(comments)
    print(f"✅ Created {len(comments)} comments")

async def create_chatroom_messages(users):
    """Create chatroom messages"""
    print("💬 Creating chatroom messages...")
    
    messages = []
    for i in range(100):  # 100 chatroom messages
        user = random.choice(users)
        
        # Determine language
        user_index = users.index(user)
        if user_index < 500:
            content = random.choice(CHAT_MESSAGES_EN)
        elif user_index < 800:
            content = random.choice(CHAT_MESSAGES_TR)
        else:
            content = random.choice(CHAT_MESSAGES_ES)
        
        message_id = str(int(datetime.utcnow().timestamp() * 1000) + i)
        
        message = {
            "id": message_id,
            "user_id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "user_profile_picture": user.get("profile_picture"),
            "content": content,
            "message_type": "text",
            "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 48))
        }
        messages.append(message)
    
    await db.chatroom_messages.insert_many(messages)
    print(f"✅ Created {len(messages)} chatroom messages")

async def add_likes_to_posts(users, posts):
    """Add random likes to posts"""
    print("❤️  Adding likes to posts...")
    
    for post in posts:
        # Random number of likes (0-50)
        num_likes = random.randint(0, min(50, len(users)))
        likers = random.sample(users, num_likes)
        like_ids = [u["id"] for u in likers]
        
        await db.posts_enhanced.update_one(
            {"id": post["id"]},
            {"$set": {"likes": like_ids}}
        )
    
    print(f"✅ Added likes to posts")

async def main():
    print("🚀 Starting demo data generation...")
    print("=" * 50)
    
    # Step 1: Clear database
    admin = await clear_database_keep_admin()
    
    # Step 2: Create users
    users = await create_users(en_count=500, tr_count=300, es_count=200)
    
    # Step 3: Create friendships and follows
    await create_friendships_and_follows(users)
    
    # Step 4: Create posts
    posts = await create_posts(users, count=300)
    
    # Step 5: Add likes
    await add_likes_to_posts(users, posts)
    
    # Step 6: Create groups
    groups = await create_groups(users)
    
    # Step 7: Create comments
    await create_comments(users, posts)
    
    # Step 8: Create chatroom messages
    await create_chatroom_messages(users)
    
    print("=" * 50)
    print("✅ Demo data generation completed!")
    print(f"📊 Summary:")
    print(f"   - Users: {len(users)} (+ 1 admin)")
    print(f"   - Posts: {len(posts)}")
    print(f"   - Groups: {len(groups)}")
    print(f"   - Friendships & Follows: ✅")
    print(f"   - Comments: ✅")
    print(f"   - Chatroom messages: ✅")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
