#!/usr/bin/env python3
"""
Migration script to add 'sector' field to existing chatroom messages
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_chatroom_messages():
    # Get MongoDB connection string from environment
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ MONGO_URL not found in environment")
        return
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db = client.drivers_chat
    
    print("🔍 Checking chatroom_messages collection...")
    
    # Count total messages
    total_messages = await db.chatroom_messages.count_documents({})
    print(f"📊 Total chatroom messages in database: {total_messages}")
    
    # Count messages without sector field
    messages_without_sector = await db.chatroom_messages.count_documents({"sector": {"$exists": False}})
    print(f"🔍 Messages without sector field: {messages_without_sector}")
    
    if messages_without_sector == 0:
        print("✅ All chatroom messages already have sector field!")
        return
    
    # Update all messages without sector field
    print(f"\n🔧 Adding 'sector: drivers' to {messages_without_sector} messages...")
    
    result = await db.chatroom_messages.update_many(
        {"sector": {"$exists": False}},
        {"$set": {"sector": "drivers"}}
    )
    
    print(f"✅ Migration completed!")
    print(f"   - Modified documents: {result.modified_count}")
    print(f"   - Matched documents: {result.matched_count}")
    
    # Verify the migration
    remaining = await db.chatroom_messages.count_documents({"sector": {"$exists": False}})
    print(f"\n🎉 Verification: {remaining} messages remaining without sector field")
    
    # Show sample of migrated messages
    sample_messages = await db.chatroom_messages.find({"sector": "drivers"}).limit(3).to_list(3)
    print(f"\n📝 Sample of migrated messages:")
    for msg in sample_messages:
        print(f"   - Message ID: {msg.get('id', 'N/A')}, User: {msg.get('username', 'N/A')}, Sector: {msg.get('sector', 'N/A')}")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 CHATROOM MESSAGES SECTOR MIGRATION SCRIPT")
    print("=" * 60)
    asyncio.run(migrate_chatroom_messages())
    print("=" * 60)
