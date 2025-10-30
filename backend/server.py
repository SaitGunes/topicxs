from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import socketio
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    bio: Optional[str] = ""
    profile_picture: Optional[str] = None
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    bio: Optional[str] = ""
    profile_picture: Optional[str] = None
    referral_code: Optional[str] = None
    invited_by: Optional[str] = None
    referral_count: int = 0
    friend_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class PostCreate(BaseModel):
    content: str
    image: Optional[str] = None

class Post(BaseModel):
    id: str
    user_id: str
    username: str
    user_profile_picture: Optional[str] = None
    content: str
    image: Optional[str] = None
    likes: List[str] = []
    comments_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommentCreate(BaseModel):
    content: str

class Comment(BaseModel):
    id: str
    post_id: str
    user_id: str
    username: str
    user_profile_picture: Optional[str] = None
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatCreate(BaseModel):
    name: str
    is_group: bool = False
    members: List[str] = []

class Chat(BaseModel):
    id: str
    name: str
    is_group: bool
    members: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None

class MessageCreate(BaseModel):
    chat_id: str
    content: str

class Message(BaseModel):
    id: str
    chat_id: str
    user_id: str
    username: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== NEW MODELS FOR PHASE 1-4 ====================

class FriendRequest(BaseModel):
    id: str
    from_user_id: str
    from_username: str
    from_user_picture: Optional[str] = None
    to_user_id: str
    message: Optional[str] = None
    request_status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FriendRequestCreate(BaseModel):
    to_user_id: str
    message: Optional[str] = None

class FriendRequestAction(BaseModel):
    action: str  # accept or reject

class PostPrivacy(BaseModel):
    level: str  # public, friends, specific
    specific_user_ids: Optional[List[str]] = []

class PostCreateEnhanced(BaseModel):
    content: str
    image: Optional[str] = None
    privacy: PostPrivacy = PostPrivacy(level="friends", specific_user_ids=[])

class PostEnhanced(BaseModel):
    id: str
    user_id: str
    username: str
    user_profile_picture: Optional[str] = None
    content: str
    image: Optional[str] = None
    likes: List[str] = []
    dislikes: List[str] = []
    comments_count: int = 0
    privacy: PostPrivacy
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoteAction(BaseModel):
    vote_type: str  # like or dislike

class Group(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    creator_id: str
    admin_ids: List[str] = []
    moderator_ids: List[str] = []
    member_ids: List[str] = []
    requires_approval: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    requires_approval: bool = True

class GroupJoinRequest(BaseModel):
    id: str
    group_id: str
    user_id: str
    username: str
    request_status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupInvite(BaseModel):
    user_ids: List[str]

# ==================== AUTH HELPERS ====================

def generate_referral_code():
    """Generate unique 8-character referral code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Check referral code if provided
    referrer_id = None
    if user_data.referral_code:
        referrer = await db.users.find_one({"referral_code": user_data.referral_code.upper()})
        if referrer:
            referrer_id = referrer["id"]
        # If invalid code, just ignore it (don't fail registration)
    
    # Create user
    user_id = str(datetime.utcnow().timestamp()).replace(".", "")
    hashed_password = get_password_hash(user_data.password)
    
    # Generate unique referral code
    referral_code = generate_referral_code()
    while await db.users.find_one({"referral_code": referral_code}):
        referral_code = generate_referral_code()
    
    user_dict = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "full_name": user_data.full_name,
        "bio": user_data.bio,
        "profile_picture": user_data.profile_picture,
        "referral_code": referral_code,
        "invited_by": referrer_id,
        "referral_count": 0,
        "friend_ids": [],
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Update referrer's count if there was a valid referral
    if referrer_id:
        await db.users.update_one(
            {"id": referrer_id},
            {"$inc": {"referral_count": 1}}
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = User(**{k: v for k, v in user_dict.items() if k != 'password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)
    
    user_response = User(**{k: v for k, v in user_dict.items() if k != 'password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = User(**{k: v for k, v in user.items() if k != 'password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/me", response_model=User)
async def update_profile(user_update: UserUpdate, current_user: User = Depends(get_current_user)):
    update_data = {}
    
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    
    if user_update.bio is not None:
        update_data["bio"] = user_update.bio
    
    if user_update.profile_picture is not None:
        update_data["profile_picture"] = user_update.profile_picture
    
    if update_data:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return User(**{k: v for k, v in updated_user.items() if k != 'password'})

@api_router.post("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: User = Depends(get_current_user)):
    # Get user with password
    user = await db.users.find_one({"id": current_user.id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not pwd_context.verify(password_data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    hashed_password = pwd_context.hash(password_data.new_password)
    
    # Update password
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password": hashed_password}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.delete("/auth/me")
async def delete_account(current_user: User = Depends(get_current_user)):
    # Delete user's posts
    await db.posts.delete_many({"user_id": current_user.id})
    await db.posts_enhanced.delete_many({"user_id": current_user.id})
    
    # Delete user's comments
    await db.comments.delete_many({"user_id": current_user.id})
    
    # Delete user's messages
    await db.messages.delete_many({"user_id": current_user.id})
    
    # Remove user from chats
    await db.chats.update_many(
        {"members": current_user.id},
        {"$pull": {"members": current_user.id}}
    )
    
    # Delete chats with no members
    await db.chats.delete_many({"members": {"$size": 0}})
    
    # Delete friend requests
    await db.friend_requests.delete_many({
        "$or": [
            {"from_user_id": current_user.id},
            {"to_user_id": current_user.id}
        ]
    })
    
    # Remove from friends lists
    await db.users.update_many(
        {"friend_ids": current_user.id},
        {"$pull": {"friend_ids": current_user.id}}
    )
    
    # Finally delete user
    await db.users.delete_one({"id": current_user.id})
    
    return {"message": "Account deleted successfully"}

@api_router.post("/auth/forgot-password")
async def forgot_password(email: str, username: str):
    user = await db.users.find_one({"email": email, "username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found with provided email and username")
    
    # Generate 6-character reset code
    reset_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Store reset code in user document
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"reset_code": reset_code, "reset_code_expiry": datetime.utcnow() + timedelta(hours=1)}}
    )
    
    return {"reset_code": reset_code}

@api_router.post("/auth/reset-password")
async def reset_password(email: str, reset_code: str, new_password: str):
    user = await db.users.find_one({"email": email, "reset_code": reset_code.upper()})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check if code expired
    if user.get("reset_code_expiry") and user["reset_code_expiry"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    # Update password
    hashed_password = get_password_hash(new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"reset_code": "", "reset_code_expiry": ""}
        }
    )
    
    return {"message": "Password reset successful"}

# ==================== USER ROUTES ====================

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**{k: v for k, v in user.items() if k != 'password'})

@api_router.get("/users", response_model=List[User])
async def search_users(q: str = "", current_user: User = Depends(get_current_user)):
    if q:
        users = await db.users.find({
            "$or": [
                {"username": {"$regex": q, "$options": "i"}},
                {"full_name": {"$regex": q, "$options": "i"}}
            ]
        }).to_list(50)
    else:
        users = await db.users.find().limit(50).to_list(50)
    
    return [User(**{k: v for k, v in user.items() if k != 'password'}) for user in users]

# ==================== POST ROUTES ====================

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    post_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    post_dict = {
        "id": post_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_profile_picture": current_user.profile_picture,
        "content": post_data.content,
        "image": post_data.image,
        "likes": [],
        "comments_count": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.posts.insert_one(post_dict)
    return Post(**post_dict)

@api_router.get("/posts", response_model=List[Post])
async def get_posts(skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    posts = await db.posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Post(**post) for post in posts]

@api_router.get("/posts/user/{user_id}", response_model=List[Post])
async def get_user_posts(user_id: str, skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    posts = await db.posts.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Post(**post) for post in posts]

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    likes = post.get("likes", [])
    if current_user.id in likes:
        # Unlike
        await db.posts.update_one(
            {"id": post_id},
            {"$pull": {"likes": current_user.id}}
        )
        return {"liked": False, "likes_count": len(likes) - 1}
    else:
        # Like
        await db.posts.update_one(
            {"id": post_id},
            {"$push": {"likes": current_user.id}}
        )
        return {"liked": True, "likes_count": len(likes) + 1}

# ==================== COMMENT ROUTES ====================

@api_router.post("/posts/{post_id}/comments", response_model=Comment)
async def create_comment(post_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    # Check in both collections
    post = await db.posts_enhanced.find_one({"id": post_id})
    if not post:
        post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    comment_dict = {
        "id": comment_id,
        "post_id": post_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_profile_picture": current_user.profile_picture,
        "content": comment_data.content,
        "created_at": datetime.utcnow()
    }
    
    await db.comments.insert_one(comment_dict)
    
    # Update comments count in both collections
    await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    await db.posts_enhanced.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    return Comment(**comment_dict)

@api_router.get("/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_id: str, current_user: User = Depends(get_current_user)):
    comments = await db.comments.find({"post_id": post_id}).sort("created_at", 1).to_list(1000)
    return [Comment(**comment) for comment in comments]

# ==================== CHAT ROUTES ====================

@api_router.post("/chats", response_model=Chat)
async def create_chat(chat_data: ChatCreate, current_user: User = Depends(get_current_user)):
    chat_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    # Add current user to members if not already
    members = list(set([current_user.id] + chat_data.members))
    
    chat_dict = {
        "id": chat_id,
        "name": chat_data.name,
        "is_group": chat_data.is_group,
        "members": members,
        "created_at": datetime.utcnow(),
        "last_message": None,
        "last_message_time": None
    }
    
    await db.chats.insert_one(chat_dict)
    return Chat(**chat_dict)

@api_router.get("/chats", response_model=List[Chat])
async def get_chats(current_user: User = Depends(get_current_user)):
    chats = await db.chats.find({"members": current_user.id}).sort("last_message_time", -1).to_list(100)
    return [Chat(**chat) for chat in chats]

@api_router.get("/chats/{chat_id}/messages", response_model=List[Message])
async def get_messages(chat_id: str, current_user: User = Depends(get_current_user)):
    # Check if user is member
    chat = await db.chats.find_one({"id": chat_id})
    if not chat or current_user.id not in chat["members"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.messages.find({"chat_id": chat_id}).sort("created_at", 1).to_list(1000)
    return [Message(**message) for message in messages]

@api_router.post("/chats/{chat_id}/messages", response_model=Message)
async def send_message(chat_id: str, message_data: MessageCreate, current_user: User = Depends(get_current_user)):
    # Check if user is member
    chat = await db.chats.find_one({"id": chat_id})
    if not chat or current_user.id not in chat["members"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    message_dict = {
        "id": message_id,
        "chat_id": chat_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "content": message_data.content,
        "created_at": datetime.utcnow()
    }
    
    await db.messages.insert_one(message_dict)
    
    # Update chat's last message
    await db.chats.update_one(
        {"id": chat_id},
        {"$set": {"last_message": message_data.content, "last_message_time": datetime.utcnow()}}
    )
    
    # Emit to socket.io
    await sio.emit('new_message', message_dict, room=chat_id)
    
    return Message(**message_dict)

# ==================== FRIEND ROUTES ====================

@api_router.post("/friends/request", response_model=FriendRequest)
async def send_friend_request(request_data: FriendRequestCreate, current_user: User = Depends(get_current_user)):
    # Check if user exists
    target_user = await db.users.find_one({"id": request_data.to_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already friends
    user_data = await db.users.find_one({"id": current_user.id})
    if request_data.to_user_id in user_data.get("friend_ids", []):
        raise HTTPException(status_code=400, detail="Already friends")
    
    # Check if request already exists
    existing_request = await db.friend_requests.find_one({
        "from_user_id": current_user.id,
        "to_user_id": request_data.to_user_id,
        "request_status": "pending"
    })
    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already sent")
    
    request_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    friend_request_dict = {
        "id": request_id,
        "from_user_id": current_user.id,
        "from_username": current_user.username,
        "from_user_picture": current_user.profile_picture,
        "to_user_id": request_data.to_user_id,
        "message": request_data.message,
        "request_status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.friend_requests.insert_one(friend_request_dict)
    return FriendRequest(**friend_request_dict)

@api_router.get("/friends/requests", response_model=List[FriendRequest])
async def get_friend_requests(current_user: User = Depends(get_current_user)):
    requests = await db.friend_requests.find({
        "to_user_id": current_user.id,
        "request_status": "pending"
    }).sort("created_at", -1).to_list(100)
    return [FriendRequest(**req) for req in requests]

@api_router.post("/friends/requests/{request_id}/action")
async def handle_friend_request(request_id: str, action_data: FriendRequestAction, current_user: User = Depends(get_current_user)):
    friend_request = await db.friend_requests.find_one({"id": request_id})
    if not friend_request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if friend_request["to_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if action_data.action == "accept":
        # Add to friends list
        await db.users.update_one(
            {"id": current_user.id},
            {"$push": {"friend_ids": friend_request["from_user_id"]}}
        )
        await db.users.update_one(
            {"id": friend_request["from_user_id"]},
            {"$push": {"friend_ids": current_user.id}}
        )
        
        # Update request status
        await db.friend_requests.update_one(
            {"id": request_id},
            {"$set": {"request_status": "accepted"}}
        )
        return {"message": "Friend request accepted"}
    
    elif action_data.action == "reject":
        await db.friend_requests.update_one(
            {"id": request_id},
            {"$set": {"request_status": "rejected"}}
        )
        return {"message": "Friend request rejected"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@api_router.get("/friends", response_model=List[User])
async def get_friends(current_user: User = Depends(get_current_user)):
    user_data = await db.users.find_one({"id": current_user.id})
    friend_ids = user_data.get("friend_ids", [])
    
    friends = await db.users.find({"id": {"$in": friend_ids}}).to_list(1000)
    return [User(**{k: v for k, v in friend.items() if k != 'password'}) for friend in friends]

# ==================== ENHANCED POST ROUTES ====================

@api_router.post("/posts/enhanced", response_model=PostEnhanced)
async def create_enhanced_post(post_data: PostCreateEnhanced, current_user: User = Depends(get_current_user)):
    post_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    post_dict = {
        "id": post_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_profile_picture": current_user.profile_picture,
        "content": post_data.content,
        "image": post_data.image,
        "likes": [],
        "dislikes": [],
        "comments_count": 0,
        "privacy": post_data.privacy.dict(),
        "created_at": datetime.utcnow()
    }
    
    await db.posts_enhanced.insert_one(post_dict)
    return PostEnhanced(**post_dict)

@api_router.get("/posts/enhanced", response_model=List[PostEnhanced])
async def get_enhanced_posts(skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    # Get user's friend list
    user_data = await db.users.find_one({"id": current_user.id})
    friend_ids = user_data.get("friend_ids", [])
    
    # Build query based on privacy settings
    query = {
        "$or": [
            {"privacy.level": "public"},
            {"user_id": current_user.id},
            {"privacy.level": "friends", "user_id": {"$in": friend_ids}},
            {"privacy.level": "specific", "privacy.specific_user_ids": current_user.id}
        ]
    }
    
    posts = await db.posts_enhanced.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [PostEnhanced(**post) for post in posts]

@api_router.post("/posts/{post_id}/vote")
async def vote_post(post_id: str, vote_data: VoteAction, current_user: User = Depends(get_current_user)):
    post = await db.posts_enhanced.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Cannot vote on own post
    if post["user_id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vote on your own post")
    
    likes = post.get("likes", [])
    dislikes = post.get("dislikes", [])
    
    if vote_data.vote_type == "like":
        if current_user.id in likes:
            # Remove like
            await db.posts_enhanced.update_one(
                {"id": post_id},
                {"$pull": {"likes": current_user.id}}
            )
            likes = [l for l in likes if l != current_user.id]
        else:
            # Add like, remove dislike if exists
            if current_user.id in dislikes:
                dislikes = [d for d in dislikes if d != current_user.id]
            likes.append(current_user.id)
            await db.posts_enhanced.update_one(
                {"id": post_id},
                {
                    "$push": {"likes": current_user.id},
                    "$pull": {"dislikes": current_user.id}
                }
            )
    
    elif vote_data.vote_type == "dislike":
        if current_user.id in dislikes:
            # Remove dislike
            await db.posts_enhanced.update_one(
                {"id": post_id},
                {"$pull": {"dislikes": current_user.id}}
            )
            dislikes = [d for d in dislikes if d != current_user.id]
        else:
            # Add dislike, remove like if exists
            if current_user.id in likes:
                likes = [l for l in likes if l != current_user.id]
            dislikes.append(current_user.id)
            await db.posts_enhanced.update_one(
                {"id": post_id},
                {
                    "$push": {"dislikes": current_user.id},
                    "$pull": {"likes": current_user.id}
                }
            )
    else:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    # Check auto-delete rule: dislike > 10 AND like < dislike
    dislike_count = len(dislikes)
    like_count = len(likes)
    
    if dislike_count > 10 and like_count < dislike_count:
        # Delete the post
        await db.posts_enhanced.delete_one({"id": post_id})
        raise HTTPException(status_code=404, detail="Post removed due to community feedback")
    
    # Return updated post
    updated_post = await db.posts_enhanced.find_one({"id": post_id})
    return PostEnhanced(**updated_post)

@api_router.get("/posts/enhanced/user/{user_id}", response_model=List[PostEnhanced])
async def get_user_enhanced_posts(user_id: str, skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    posts = await db.posts_enhanced.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [PostEnhanced(**post) for post in posts]

# ==================== GROUP ROUTES ====================

@api_router.post("/groups", response_model=Group)
async def create_group(group_data: GroupCreate, current_user: User = Depends(get_current_user)):
    group_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    group_dict = {
        "id": group_id,
        "name": group_data.name,
        "description": group_data.description,
        "creator_id": current_user.id,
        "admin_ids": [current_user.id],
        "moderator_ids": [],
        "member_ids": [current_user.id],
        "requires_approval": group_data.requires_approval,
        "created_at": datetime.utcnow()
    }
    
    await db.groups.insert_one(group_dict)
    return Group(**group_dict)

@api_router.get("/groups", response_model=List[Group])
async def get_groups(current_user: User = Depends(get_current_user)):
    groups = await db.groups.find({"member_ids": current_user.id}).sort("created_at", -1).to_list(100)
    return [Group(**group) for group in groups]

@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id in group["member_ids"]:
        raise HTTPException(status_code=400, detail="Already a member")
    
    if group["requires_approval"]:
        # Create join request
        request_id = str(datetime.utcnow().timestamp()).replace(".", "")
        join_request_dict = {
            "id": request_id,
            "group_id": group_id,
            "user_id": current_user.id,
            "username": current_user.username,
            "request_status": "pending",
            "created_at": datetime.utcnow()
        }
        await db.group_join_requests.insert_one(join_request_dict)
        return {"message": "Join request sent"}
    else:
        # Join directly
        await db.groups.update_one(
            {"id": group_id},
            {"$push": {"member_ids": current_user.id}}
        )
        return {"message": "Joined group successfully"}

@api_router.get("/groups/{group_id}/join-requests", response_model=List[GroupJoinRequest])
async def get_group_join_requests(group_id: str, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group["admin_ids"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    requests = await db.group_join_requests.find({
        "group_id": group_id,
        "request_status": "pending"
    }).sort("created_at", -1).to_list(100)
    return [GroupJoinRequest(**req) for req in requests]

@api_router.post("/groups/{group_id}/invite")
async def invite_to_group(group_id: str, invite_data: GroupInvite, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group["admin_ids"] and current_user.id not in group["moderator_ids"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Add users directly to group
    await db.groups.update_one(
        {"id": group_id},
        {"$addToSet": {"member_ids": {"$each": invite_data.user_ids}}}
    )
    
    return {"message": f"Invited {len(invite_data.user_ids)} users to group"}

# ==================== SOCKET.IO ====================

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_chat(sid, data):
    chat_id = data.get('chat_id')
    if chat_id:
        sio.enter_room(sid, chat_id)
        print(f"Client {sid} joined chat {chat_id}")

@sio.event
async def leave_chat(sid, data):
    chat_id = data.get('chat_id')
    if chat_id:
        sio.leave_room(sid, chat_id)
        print(f"Client {sid} left chat {chat_id}")

# Include the router in the main app
app.include_router(api_router)

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
