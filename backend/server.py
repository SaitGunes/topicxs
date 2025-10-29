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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

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
    status: str = "pending"  # pending, accepted, rejected
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
    status: str = "pending"  # pending, approved, rejected
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
    
    # Create user
    user_id = str(datetime.utcnow().timestamp()).replace(".", "")
    hashed_password = get_password_hash(user_data.password)
    
    user_dict = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "full_name": user_data.full_name,
        "bio": user_data.bio,
        "profile_picture": user_data.profile_picture,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
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
    
    # Update comments count
    await db.posts.update_one(
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
