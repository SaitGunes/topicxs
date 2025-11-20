import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    # MongoDB bağlantısı
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME", "topicx")
    
    print(f"Connecting to database: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Eski kullanıcıları kontrol et
    existing_users = await db.users.count_documents({})
    print(f"Mevcut kullanıcı sayısı: {existing_users}")
    
    if existing_users > 0:
        print("Tüm kullanıcılar siliniyor...")
        result = await db.users.delete_many({})
        print(f"{result.deleted_count} kullanıcı silindi")
    
    # Admin kullanıcı bilgileri
    admin_data = {
        "id": "admin_001",
        "username": "Sait",
        "email": "saitgunes@hotmail.com",
        "password": pwd_context.hash("admin123"),
        "full_name": "Sait Güneş",
        "is_admin": True,
        "email_verified": True,
        "profile_picture": None,
        "phone_number": None,
        "created_at": datetime.utcnow(),
        "last_seen": datetime.utcnow(),
        "is_banned": False,
        "sector_info": None,
        "star_level": {
            "stars": 5,
            "level_name": "Legend",
            "total_referrals": 0,
            "next_star_at": None,
            "remaining_referrals": 0
        }
    }
    
    # Admin kullanıcıyı oluştur
    await db.users.insert_one(admin_data)
    print(f"\n✅ Admin kullanıcı oluşturuldu!")
    print(f"Username: {admin_data['username']}")
    print(f"Email: {admin_data['email']}")
    print(f"Password: admin123")
    print(f"Admin: {admin_data['is_admin']}")
    
    # Diğer koleksiyonları temizle
    collections_to_clear = [
        "posts", "comments", "chats", "chat_messages", 
        "groups", "group_messages", "chatroom_messages",
        "friend_requests", "reports", "notifications"
    ]
    
    print("\nDiğer koleksiyonlar temizleniyor...")
    for collection_name in collections_to_clear:
        result = await db[collection_name].delete_many({})
        print(f"  {collection_name}: {result.deleted_count} kayıt silindi")
    
    print("\n🎉 Veritabanı sıfırlama tamamlandı!")
    print(f"Veritabanı: {db_name}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
