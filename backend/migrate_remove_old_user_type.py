#!/usr/bin/env python3
"""
Migration script to remove old user_type and phone_number fields from users
These are now deprecated and replaced with sector_info
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def migrate_users():
    # Get MongoDB connection string from environment
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("❌ MONGO_URL not found in environment")
        return
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db = client.drivers_chat
    
    print("🔍 Checking users collection...")
    
    # Count total users
    total_users = await db.users.count_documents({})
    print(f"📊 Total users in database: {total_users}")
    
    # Count users with old user_type field
    users_with_old_type = await db.users.count_documents({"user_type": {"$exists": True}})
    print(f"🔍 Users with old user_type field: {users_with_old_type}")
    
    # Count users with old phone_number field at root level
    users_with_old_phone = await db.users.count_documents({"phone_number": {"$exists": True}})
    print(f"🔍 Users with old phone_number field: {users_with_old_phone}")
    
    if users_with_old_type == 0 and users_with_old_phone == 0:
        print("✅ No users with old fields!")
        return
    
    # Remove old fields
    print(f"\n🔧 Removing old user_type and phone_number fields...")
    
    result = await db.users.update_many(
        {},
        {"$unset": {"user_type": "", "phone_number": ""}}
    )
    
    print(f"✅ Migration completed!")
    print(f"   - Modified documents: {result.modified_count}")
    print(f"   - Matched documents: {result.matched_count}")
    
    # Verify the migration
    remaining_type = await db.users.count_documents({"user_type": {"$exists": True}})
    remaining_phone = await db.users.count_documents({"phone_number": {"$exists": True}})
    print(f"\n🎉 Verification:")
    print(f"   - Users with user_type remaining: {remaining_type}")
    print(f"   - Users with phone_number remaining: {remaining_phone}")
    
    # Show sample of users
    sample_users = await db.users.find({}).limit(3).to_list(3)
    print(f"\n📝 Sample of users:")
    for user in sample_users:
        has_sector_info = "sector_info" in user
        print(f"   - User: {user.get('username', 'N/A')}, Has sector_info: {has_sector_info}")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 REMOVE OLD USER FIELDS MIGRATION SCRIPT")
    print("=" * 60)
    asyncio.run(migrate_users())
    print("=" * 60)
