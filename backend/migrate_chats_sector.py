#!/usr/bin/env python3
"""
Migration script to add 'sector' field to existing chats
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_chats():
    # Get MongoDB connection string from environment
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ MONGO_URL not found in environment")
        return
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db = client.drivers_chat
    
    print("🔍 Checking chats collection...")
    
    # Count total chats
    total_chats = await db.chats.count_documents({})
    print(f"📊 Total chats in database: {total_chats}")
    
    # Count chats without sector field
    chats_without_sector = await db.chats.count_documents({"sector": {"$exists": False}})
    print(f"🔍 Chats without sector field: {chats_without_sector}")
    
    if chats_without_sector == 0:
        print("✅ All chats already have sector field!")
        return
    
    # Update all chats without sector field
    print(f"\n🔧 Adding 'sector: drivers' to {chats_without_sector} chats...")
    
    result = await db.chats.update_many(
        {"sector": {"$exists": False}},
        {"$set": {"sector": "drivers"}}
    )
    
    print(f"✅ Migration completed!")
    print(f"   - Modified documents: {result.modified_count}")
    print(f"   - Matched documents: {result.matched_count}")
    
    # Verify the migration
    remaining = await db.chats.count_documents({"sector": {"$exists": False}})
    print(f"\n🎉 Verification: {remaining} chats remaining without sector field")
    
    # Show sample of migrated chats
    sample_chats = await db.chats.find({"sector": "drivers"}).limit(3).to_list(3)
    print(f"\n📝 Sample of migrated chats:")
    for chat in sample_chats:
        print(f"   - Chat ID: {chat.get('id', 'N/A')}, Name: {chat.get('name', 'N/A')}, Sector: {chat.get('sector', 'N/A')}")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 CHAT SECTOR MIGRATION SCRIPT")
    print("=" * 60)
    asyncio.run(migrate_chats())
    print("=" * 60)
