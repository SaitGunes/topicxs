import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client.social_app

# Turkish driver-themed content
FIRST_NAMES = ["Ahmet", "Mehmet", "Ali", "Mustafa", "Hasan", "Hüseyin", "İbrahim", "Fatma", "Ayşe", "Zeynep", 
               "Emine", "Hatice", "Can", "Cem", "Deniz", "Efe", "Burak", "Emre", "Kerem", "Murat"]
LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
              "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek"]

POST_CONTENTS = [
    "Bugün çok yoğun bir gün geçirdim, 15 saat yoldaydım 🚗",
    "Trafik berbattı bugün, saatlerce bekledim 😤",
    "Yeni araç aldım, çok mutluyum! 🎉",
    "İstanbul trafiğinde hayatta kalmak sanat 😅",
    "Bugün çok güzel bir müşteri ile karşılaştım, gününü güzelleştirdi ❤️",
    "Yakıt fiyatları çok arttı, ne yapacağız? 💸",
    "Akşam trafiği yine aynı, eve geç gidiyorum 😔",
    "Araç bakımı yaptırdım, motorun sesi şimdi çok güzel 🔧",
    "Yağmurda sürüş yaparken çok dikkatli olun arkadaşlar ☔",
    "Park yeri bulmak neden bu kadar zor? 🤔",
    "Bugün 500 km yol yaptım, yoruldum ama mutluyum 😊",
    "Yeni navigasyon aldım, artık kaybolmuyorum 📍",
    "Araç temizliği yaptırdım, tertemiz oldu ✨",
    "Lastik değişimi zamanı geldi, önerisi olan var mı? 🚙",
    "Köprü geçiş ücretleri çok pahalı 💰",
    "Bugün ilk kez otoyolda gittim, çok heyecanlıydı 🛣️",
    "Araç sigortası yenileme zamanı, hangisi daha iyi? 📋",
    "Motor yağı değişimi için önerileriniz neler? 🛢️",
    "Trafik cezası yedim, haksız yere 😡",
    "Yeni sürücülere önerim: Sabırlı olun ve kurallara uyun 🎓",
    "GPS'im bozuldu, kağıt harita kullanmak zorunda kaldım 🗺️",
    "Araç kiralama işine başladım, tavsiye veren var mı? 🚕",
    "Bugün çok güzel bir manzara gördüm, paylaşmak istedim 🌄",
    "Kış lastiği takmayı unutmayın arkadaşlar ❄️",
    "Araç alarmı sürekli çalıyor, nasıl çözebilirim? 🔊",
    "Yeni sürücü belgesi aldım, heyecanlıyım! 🪪",
    "Otoparkta bir araba çarptı ve kaçtı 😠",
    "Araç klİması bozuldu, tamir masrafı çok yüksek 🥵",
    "Uzun yolda dinlenmek çok önemli, uyuklamayın 😴",
    "Araç far ayarı yaptırdım, gece sürüşü daha rahat 💡",
]

COMMENTS = [
    "Çok haklısın!",
    "Benim de başıma geldi",
    "Teşekkürler tavsiye için",
    "Geçmiş olsun",
    "Harika paylaşım",
    "Bende öyle düşünüyorum",
    "Aynen öyle",
    "Çok yararlı bilgi",
    "Tebrikler!",
    "Dikkatli ol",
    "İyi yolculuklar",
    "Güzel paylaşım",
    "Çok doğru söyledin",
    "Bana da lazımdı bu bilgi",
    "Süper!",
]

GROUP_NAMES = [
    "İstanbul Sürücüleri",
    "Ankara Trafik Topluluğu",
    "İzmir Yol Arkadaşları",
    "Profesyonel Sürücüler",
    "Otomobil Tutkunları",
    "Yeni Sürücüler Grubu",
    "Uzun Yol Şoförleri",
    "Araç Bakım ve Tamir",
]

GROUP_DESCRIPTIONS = [
    "İstanbul'da sürücülerin bilgi paylaştığı grup",
    "Ankara trafiği hakkında her şey",
    "İzmir yollarında yol arkadaşlığı",
    "Profesyonel sürücülerin buluşma noktası",
    "Otomobil sevenlerin topluluğu",
    "Yeni ehliyet alanlar için yardımlaşma",
    "Uzun yolculuklar için ipuçları",
    "Araç bakımı ve onarımı hakkında bilgi paylaşımı",
]

MESSAGES = [
    "Merhaba, nasılsın?",
    "Bugün müsait misin?",
    "Yardımına ihtiyacım var",
    "Teşekkürler çok yardımcı oldun",
    "Görüşmek üzere",
    "İyi akşamlar",
    "Trafikte misin?",
    "Eve ne zaman geleceksin?",
    "Toplantı saat kaçta?",
    "Tamam, anladım",
]

EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "😡", "🔥", "✨"]

async def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_users(count=100):
    print(f"Creating {count} bot users...")
    users = []
    base_time = datetime.utcnow() - timedelta(days=30)
    
    for i in range(1, count + 1):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        username = f"bot{i}"
        email = f"bot{i}@driverchat.com"
        user_id = str(int((base_time + timedelta(hours=i)).timestamp() * 1000))
        
        user = {
            "id": user_id,
            "username": username,
            "email": email,
            "password": await hash_password("Bot123!"),
            "full_name": f"{first_name} {last_name}",
            "bio": f"Profesyonel sürücü, {random.randint(1, 15)} yıllık tecrübe",
            "profile_picture": None,
            "referral_code": f"REF{i:03d}",
            "invited_by": None,
            "referral_count": 0,
            "friend_ids": [],
            "is_admin": False,
            "is_professional_driver": True,
            "blocked_users": [],
            "created_at": base_time + timedelta(hours=i)
        }
        users.append(user)
    
    await db.users.insert_many(users)
    print(f"✅ Created {count} users")
    return users

async def create_friendships(users):
    print("Creating friendships...")
    friend_requests = []
    
    for i, user in enumerate(users):
        # Her kullanıcı 5-15 arkadaşlık kursun
        num_friends = random.randint(5, 15)
        potential_friends = [u for u in users if u["id"] != user["id"]]
        friends = random.sample(potential_friends, min(num_friends, len(potential_friends)))
        
        friend_ids = [f["id"] for f in friends]
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"friend_ids": friend_ids}}
        )
        
        # Bazı bekleyen arkadaşlık istekleri oluştur
        if random.random() > 0.7:  # %30 ihtimalle
            requester = random.choice([u for u in users if u["id"] != user["id"] and u["id"] not in friend_ids])
            request_id = str(int(datetime.utcnow().timestamp() * 1000)) + str(random.randint(1000, 9999))
            friend_requests.append({
                "id": request_id,
                "requester_id": requester["id"],
                "requester_username": requester["username"],
                "receiver_id": user["id"],
                "status": "pending",
                "created_at": datetime.utcnow()
            })
    
    if friend_requests:
        await db.friend_requests.insert_many(friend_requests)
    
    print(f"✅ Created friendships and {len(friend_requests)} pending requests")

async def create_groups(users):
    print("Creating groups...")
    groups = []
    base_time = datetime.utcnow() - timedelta(days=20)
    
    for i in range(len(GROUP_NAMES)):
        creator = random.choice(users)
        group_id = str(int((base_time + timedelta(days=i)).timestamp() * 1000))
        
        # 10-30 üye ekle
        num_members = random.randint(10, 30)
        members = random.sample(users, min(num_members, len(users)))
        member_ids = list(set([creator["id"]] + [m["id"] for m in members]))
        
        group = {
            "id": group_id,
            "name": GROUP_NAMES[i],
            "description": GROUP_DESCRIPTIONS[i],
            "creator_id": creator["id"],
            "admin_ids": [creator["id"]],
            "moderator_ids": [],
            "member_ids": member_ids,
            "requires_approval": random.choice([True, False]),
            "created_at": base_time + timedelta(days=i)
        }
        groups.append(group)
    
    await db.groups.insert_many(groups)
    print(f"✅ Created {len(groups)} groups")
    return groups

async def create_posts(users, groups):
    print("Creating 100 posts...")
    posts = []
    base_time = datetime.utcnow() - timedelta(days=15)
    
    for i in range(100):
        user = random.choice(users)
        post_id = str(int((base_time + timedelta(hours=i*2)).timestamp() * 1000))
        content = random.choice(POST_CONTENTS)
        
        # %20 ihtimalle bir gruba paylaş
        group_id = None
        if random.random() > 0.8 and groups:
            group = random.choice(groups)
            if user["id"] in group["member_ids"]:
                group_id = group["id"]
        
        # %30 ihtimalle resim ekle
        has_image = random.random() > 0.7
        
        post = {
            "id": post_id,
            "user_id": user["id"],
            "username": user["username"],
            "user_profile_picture": user.get("profile_picture"),
            "content": content,
            "image": f"data:image/jpeg;base64,/9j/test{i}" if has_image else None,
            "likes": [],
            "dislikes": [],
            "reactions": {},
            "comments_count": 0,
            "privacy": {"level": "public" if random.random() > 0.8 else "friends", "specific_user_ids": []},
            "group_id": group_id,
            "created_at": base_time + timedelta(hours=i*2)
        }
        posts.append(post)
    
    await db.posts_enhanced.insert_many(posts)
    print(f"✅ Created 100 posts")
    return posts

async def add_reactions_to_posts(users, posts):
    print("Adding likes, dislikes, and emoji reactions...")
    
    for post in posts:
        # Her posta 5-20 beğeni
        num_likes = random.randint(5, 20)
        likers = random.sample(users, min(num_likes, len(users)))
        like_ids = [u["id"] for u in likers if u["id"] != post["user_id"]]
        
        # Her posta 0-5 beğenmeme
        num_dislikes = random.randint(0, 5)
        dislikers = random.sample([u for u in users if u["id"] not in like_ids and u["id"] != post["user_id"]], 
                                   min(num_dislikes, len(users) - len(like_ids)))
        dislike_ids = [u["id"] for u in dislikers]
        
        # Emoji reaksiyonları
        reactions = {}
        num_emoji_reactors = random.randint(3, 10)
        reactors = random.sample([u for u in users if u["id"] != post["user_id"]], 
                                 min(num_emoji_reactors, len(users)))
        for reactor in reactors:
            emoji = random.choice(EMOJIS)
            if emoji not in reactions:
                reactions[emoji] = []
            reactions[emoji].append(reactor["id"])
        
        await db.posts_enhanced.update_one(
            {"id": post["id"]},
            {"$set": {
                "likes": like_ids,
                "dislikes": dislike_ids,
                "reactions": reactions
            }}
        )
    
    print("✅ Added reactions to posts")

async def create_comments(users, posts):
    print("Creating comments...")
    comments = []
    base_time = datetime.utcnow() - timedelta(days=10)
    
    for i, post in enumerate(posts):
        # Her posta 2-8 yorum
        num_comments = random.randint(2, 8)
        commenters = random.sample(users, min(num_comments, len(users)))
        
        for j, commenter in enumerate(commenters):
            comment_id = str(int((base_time + timedelta(hours=i*2, minutes=j*10)).timestamp() * 1000))
            comment = {
                "id": comment_id,
                "post_id": post["id"],
                "user_id": commenter["id"],
                "username": commenter["username"],
                "user_profile_picture": commenter.get("profile_picture"),
                "content": random.choice(COMMENTS),
                "likes": random.randint(0, 10),
                "dislikes": random.randint(0, 3),
                "created_at": base_time + timedelta(hours=i*2, minutes=j*10)
            }
            comments.append(comment)
        
        # Yorum sayısını güncelle
        await db.posts_enhanced.update_one(
            {"id": post["id"]},
            {"$set": {"comments_count": num_comments}}
        )
    
    await db.comments.insert_many(comments)
    print(f"✅ Created {len(comments)} comments")

async def create_messages(users):
    print("Creating chats and messages...")
    chats = []
    messages = []
    base_time = datetime.utcnow() - timedelta(days=7)
    
    # 30 sohbet oluştur
    for i in range(30):
        user1, user2 = random.sample(users, 2)
        chat_id = str(int((base_time + timedelta(hours=i*3)).timestamp() * 1000))
        
        # 3-10 mesaj
        num_messages = random.randint(3, 10)
        chat_messages = []
        
        for j in range(num_messages):
            sender = random.choice([user1, user2])
            receiver = user2 if sender["id"] == user1["id"] else user1
            message_id = str(int((base_time + timedelta(hours=i*3, minutes=j*5)).timestamp() * 1000))
            
            message = {
                "id": message_id,
                "chat_id": chat_id,
                "sender_id": sender["id"],
                "receiver_id": receiver["id"],
                "content": random.choice(MESSAGES),
                "read": random.choice([True, False]),
                "created_at": base_time + timedelta(hours=i*3, minutes=j*5)
            }
            chat_messages.append(message)
            messages.append(message)
        
        # Son mesajı bul
        last_message = chat_messages[-1]
        
        chat = {
            "id": chat_id,
            "participants": [user1["id"], user2["id"]],
            "last_message": last_message["content"],
            "last_message_time": last_message["created_at"],
            "unread_count": {
                user1["id"]: sum(1 for m in chat_messages if m["receiver_id"] == user1["id"] and not m["read"]),
                user2["id"]: sum(1 for m in chat_messages if m["receiver_id"] == user2["id"] and not m["read"])
            },
            "created_at": base_time + timedelta(hours=i*3)
        }
        chats.append(chat)
    
    await db.chats.insert_many(chats)
    await db.messages.insert_many(messages)
    print(f"✅ Created {len(chats)} chats with {len(messages)} messages")

async def main():
    print("\n🚀 Starting test data population...\n")
    
    # Mevcut verileri temizle (Sait hariç)
    print("Cleaning existing data (keeping Sait)...")
    sait_id = "1761850983197165"
    await db.users.delete_many({"id": {"$ne": sait_id}})
    await db.posts_enhanced.delete_many({})
    await db.comments.delete_many({})
    await db.chats.delete_many({})
    await db.messages.delete_many({})
    await db.groups.delete_many({})
    await db.friend_requests.delete_many({})
    print("✅ Cleaned existing data\n")
    
    # Test verilerini oluştur
    users = await create_users(100)
    await create_friendships(users)
    groups = await create_groups(users)
    posts = await create_posts(users, groups)
    await add_reactions_to_posts(users, posts)
    await create_comments(users, posts)
    await create_messages(users)
    
    print("\n✅ Test data population completed!")
    print(f"\n📊 Summary:")
    print(f"   - Users: {await db.users.count_documents({})}")
    print(f"   - Posts: {await db.posts_enhanced.count_documents({})}")
    print(f"   - Comments: {await db.comments.count_documents({})}")
    print(f"   - Groups: {await db.groups.count_documents({})}")
    print(f"   - Chats: {await db.chats.count_documents({})}")
    print(f"   - Messages: {await db.messages.count_documents({})}")
    print(f"   - Friend Requests: {await db.friend_requests.count_documents({})}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
