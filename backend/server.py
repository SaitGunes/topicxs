from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
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
import httpx
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import bleach
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ["SECRET_KEY"]  # Must be set in .env file
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

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== INPUT VALIDATION & SECURITY ====================

def sanitize_text(text: str, max_length: int = 5000) -> str:
    """
    Sanitize user input to prevent XSS attacks
    - Remove HTML tags
    - Limit length
    - Strip dangerous characters
    """
    if not text:
        return ""
    
    # Remove HTML tags using bleach
    clean_text = bleach.clean(text, tags=[], strip=True)
    
    # Limit length
    if len(clean_text) > max_length:
        clean_text = clean_text[:max_length]
    
    return clean_text.strip()

def validate_image_data(image_data: str) -> bool:
    """
    Validate image data format
    - Must be base64 data URI
    - Must be image type (jpeg, png, gif, webp)
    - Size limit check (10MB)
    """
    if not image_data:
        return True
    
    # Check if it's a data URI
    if not image_data.startswith('data:image/'):
        return False
    
    # Check allowed formats
    allowed_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
    format_match = re.match(r'data:image/(\w+);base64,', image_data)
    if not format_match or format_match.group(1).lower() not in allowed_formats:
        return False
    
    # Check size (approximate - base64 is ~1.37x larger than binary)
    # 10MB binary = ~13.7MB base64
    if len(image_data) > 14 * 1024 * 1024:  # ~14MB base64 limit
        return False
    
    return True

def validate_audio_data(audio_data: str) -> bool:
    """
    Validate audio data format for voice messages
    - Must be base64 data URI
    - Must be audio type (m4a, mp3, wav, ogg)
    - Size limit check (5MB for 1 minute audio)
    """
    if not audio_data:
        return True
    
    # Check if it's a data URI
    if not audio_data.startswith('data:audio/'):
        return False
    
    # Check allowed formats
    allowed_formats = ['m4a', 'mp3', 'wav', 'ogg', 'webm']
    format_match = re.match(r'data:audio/(\w+);base64,', audio_data)
    if not format_match or format_match.group(1).lower() not in allowed_formats:
        return False
    
    # Check size (~5MB for 1 minute voice message)
    # 5MB binary = ~6.85MB base64
    if len(audio_data) > 7 * 1024 * 1024:  # ~7MB base64 limit
        return False
    
    return True

# ==================== MODELS ====================

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    bio: Optional[str] = ""
    profile_picture: Optional[str] = None
    referral_code: Optional[str] = None
    user_type: str = "driver"  # "professional_driver", "driver", "non_driver"
    phone_number: Optional[str] = None
    current_sector: str = "drivers"  # Which sector they're registering from

class UserLogin(BaseModel):
    username: str
    password: str
    current_sector: str = "drivers"  # Which sector they're logging in from

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
    sectors: List[str] = ["drivers"]  # New: which sectors user has joined
    following_ids: List[str] = []  # Users this user follows
    followers_ids: List[str] = []  # Users following this user
    blocked_user_ids: List[str] = []
    is_admin: bool = False
    push_token: Optional[str] = None
    notification_preferences: dict = {
        "friend_requests": True,
        "messages": True,
        "likes": True,
        "comments": True
    }
    user_type: str = "driver"  # "professional_driver", "driver", "non_driver"
    email_verified: bool = False
    email_verification_code: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class LocationInfo(BaseModel):
    latitude: float
    longitude: float
    location_type: str  # traffic, roadwork, accident, closed, police
    description: Optional[str] = None

class PostCreate(BaseModel):
    content: str
    image: Optional[str] = None
    location: Optional[LocationInfo] = None

class Post(BaseModel):
    id: str
    user_id: str
    username: str
    user_profile_picture: Optional[str] = None
    content: str
    image: Optional[str] = None
    location: Optional[LocationInfo] = None
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
    full_name: Optional[str] = None
    user_profile_picture: Optional[str] = None
    content: Optional[str] = None
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
    location: Optional[LocationInfo] = None
    privacy: PostPrivacy = PostPrivacy(level="friends", specific_user_ids=[])
    group_id: Optional[str] = None  # If post is shared to a group
    sector: str = "drivers"  # Which sector this post belongs to

class PostEnhanced(BaseModel):
    id: str
    user_id: str
    username: str
    full_name: Optional[str] = None
    user_profile_picture: Optional[str] = None
    content: str
    image: Optional[str] = None
    location: Optional[LocationInfo] = None
    likes: List[str] = []
    dislikes: List[str] = []
    reactions: dict = {}  # {"😀": ["user1", "user2"], "❤️": ["user3"]}
    comments_count: int = 0
    privacy: PostPrivacy
    group_id: Optional[str] = None  # If post is shared to a group
    shared_from_id: Optional[str] = None  # ID of original post if this is a share
    share_count: int = 0  # How many times this post has been shared
    content_hash: Optional[str] = None  # Hash for duplicate detection
    sector: str = "drivers"  # Which sector this post belongs to
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoteAction(BaseModel):
    vote_type: str  # like or dislike

class ReactionAction(BaseModel):
    emoji: str  # Any emoji like 😀, ❤️, 😂, 😮, 😢, 😡

class SharePost(BaseModel):
    comment: Optional[str] = None  # Optional comment when sharing

class GroupMessageCreate(BaseModel):
    content: Optional[str] = None
    audio: Optional[str] = None  # base64 encoded audio
    duration: Optional[int] = None  # in seconds
    message_type: str = "text"  # "text" or "audio"

class UpdateCredentialsRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None

class Report(BaseModel):
    id: str
    reporter_user_id: str
    reporter_username: str
    reported_content_type: str  # post, comment, user
    reported_content_id: str
    reported_user_id: str
    reported_username: str
    reason: str  # spam, harassment, inappropriate, hate_speech, violence, other
    description: Optional[str] = None
    status: str = "pending"  # pending, reviewed, resolved, dismissed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReportCreate(BaseModel):
    reported_content_type: str
    reported_content_id: str
    reported_user_id: str
    reason: str
    description: Optional[str] = None

class Group(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    creator_id: Optional[str] = None  # Optional for legacy groups
    admin_ids: List[str] = []
    moderator_ids: List[str] = []
    member_ids: List[str] = []
    requires_approval: bool = True
    sector: str = "drivers"  # Which sector this group belongs to
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    requires_approval: bool = True
    sector: str = "drivers"  # Which sector this group belongs to

class GroupJoinRequest(BaseModel):
    id: str
    group_id: str
    user_id: str
    username: str
    request_status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupInvite(BaseModel):
    user_ids: List[str]

class PushTokenRegister(BaseModel):
    token: str

class NotificationPreferences(BaseModel):
    friend_requests: bool = True
    messages: bool = True
    likes: bool = True
    comments: bool = True

# ==================== EMAIL VERIFICATION ====================

def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join(random.choices('0123456789', k=6))

async def send_verification_email(email: str, code: str, username: str):
    """Send verification email (mock for now - you can integrate real email service)"""
    # TODO: Integrate with real email service (SendGrid, AWS SES, etc.)
    logging.info(f"📧 Verification email sent to {email}")
    logging.info(f"   Username: {username}")
    logging.info(f"   Code: {code}")
    # For now, just log it. In production, send actual email.
    return True

# ==================== STAR RATING SYSTEM ====================

def calculate_star_level(referral_count: int) -> dict:
    """Calculate star level based on referral count"""
    stars = min(referral_count // 5, 5)  # Max 5 stars
    
    # Define levels
    level_names = {
        0: "Newbie Driver",
        1: "Active Driver",
        2: "Community Driver",
        3: "Elite Driver",
        4: "Master Driver",
        5: "Legend Driver"
    }
    
    # Calculate progress to next star
    next_star_at = (stars + 1) * 5 if stars < 5 else 25
    remaining = next_star_at - referral_count if stars < 5 else 0
    
    return {
        "stars": stars,
        "level_name": level_names.get(stars, "Newbie Driver"),
        "total_referrals": referral_count,
        "next_star_at": next_star_at if stars < 5 else None,
        "remaining_referrals": remaining if stars < 5 else 0
    }

# ==================== PUSH NOTIFICATIONS ====================

async def send_push_notification(push_token: str, title: str, body: str, data: dict = None):
    """Send push notification using Expo Push Notification API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://exp.host/--/api/v2/push/send',
                json={
                    'to': push_token,
                    'title': title,
                    'body': body,
                    'data': data or {},
                    'sound': 'default',
                    'priority': 'high',
                },
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            )
            return response.json()
    except Exception as e:
        logging.error(f"Push notification error: {e}")
        return None

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

@api_router.post("/auth/verify-email")
async def verify_email(code: str, current_user: User = Depends(get_current_user)):
    """Verify email with the provided code"""
    user = await db.users.find_one({"id": current_user.id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified"):
        return {"message": "Email already verified", "verified": True}
    
    if user.get("email_verification_code") != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark email as verified
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$set": {"email_verified": True},
            "$unset": {"email_verification_code": ""}
        }
    )
    
    return {"message": "Email verified successfully", "verified": True}

@api_router.post("/auth/resend-verification")
async def resend_verification(current_user: User = Depends(get_current_user)):
    """Resend verification email"""
    user = await db.users.find_one({"id": current_user.id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    
    # Generate new code
    verification_code = generate_verification_code()
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"email_verification_code": verification_code}}
    )
    
    # Send email
    await send_verification_email(user["email"], verification_code, user["username"])
    
    return {"message": "Verification code sent"}

@api_router.post("/auth/register", response_model=Token)
@limiter.limit("5/minute")  # Max 5 registrations per minute per IP
async def register(request: Request, user_data: UserRegister):
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
    
    # Generate email verification code
    verification_code = generate_verification_code()
    
    # Sanitize text inputs
    full_name = sanitize_text(user_data.full_name, max_length=100)
    bio = sanitize_text(user_data.bio if user_data.bio else "", max_length=500)
    
    # Validate profile picture if provided
    if user_data.profile_picture and not validate_image_data(user_data.profile_picture):
        raise HTTPException(status_code=400, detail="Invalid profile picture format or size")
    
    user_dict = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "full_name": full_name,
        "bio": bio,
        "profile_picture": user_data.profile_picture,
        "referral_code": referral_code,
        "invited_by": referrer_id,
        "referral_count": 0,
        "friend_ids": [],
        "following_ids": [],
        "followers_ids": [],
        "is_admin": False,
        "user_type": user_data.user_type,
        "phone_number": user_data.phone_number,
        "email_verified": False,
        "email_verification_code": verification_code,
        "sectors": [user_data.current_sector],  # Initialize with current sector
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Send verification email
    await send_verification_email(user_data.email, verification_code, user_data.username)
    
    # Update referrer's count if there was a valid referral
    if referrer_id:
        await db.users.update_one(
            {"id": referrer_id},
            {"$inc": {"referral_count": 1}}
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    # Calculate star level for response
    star_info = calculate_star_level(0)  # New user has 0 referrals
    
    # Add star info to user response
    user_data = {k: v for k, v in user_dict.items() if k != 'password'}
    user_data['star_level'] = star_info
    
    user_response = User(**user_data)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
@limiter.limit("10/minute")  # Max 10 login attempts per minute per IP (brute force protection)
async def login(request: Request, user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Add current sector to user's sectors array if not already present
    user_sectors = user.get("sectors", [])
    if user_data.current_sector not in user_sectors:
        await db.users.update_one(
            {"id": user["id"]},
            {"$addToSet": {"sectors": user_data.current_sector}}
        )
        user_sectors.append(user_data.current_sector)
        user["sectors"] = user_sectors
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = User(**{k: v for k, v in user.items() if k != 'password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    # Get fresh user data from DB to include star info
    user = await db.users.find_one({"id": current_user.id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate star level
    referral_count = user.get("referral_count", 0)
    star_info = calculate_star_level(referral_count)
    
    # Add star info to user response
    user_data = {k: v for k, v in user.items() if k not in ['password', '_id']}
    user_data['star_level'] = star_info
    
    return user_data

@api_router.put("/auth/me", response_model=User)
async def update_profile(user_update: UserUpdate, current_user: User = Depends(get_current_user)):
    update_data = {}
    
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    
    if user_update.bio is not None:
        update_data["bio"] = user_update.bio
    
    if user_update.profile_picture is not None:
        update_data["profile_picture"] = user_update.profile_picture
    
    if user_update.phone_number is not None:
        update_data["phone_number"] = user_update.phone_number if user_update.phone_number.strip() else None
    
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

# ==================== PUSH NOTIFICATIONS ROUTES ====================

@api_router.post("/notifications/register-token")
async def register_push_token(
    token_data: PushTokenRegister,
    current_user: User = Depends(get_current_user)
):
    """Register or update user's push notification token"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"push_token": token_data.token}}
    )
    return {"message": "Push token registered successfully"}

@api_router.delete("/notifications/unregister-token")
async def unregister_push_token(current_user: User = Depends(get_current_user)):
    """Remove user's push notification token"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$unset": {"push_token": ""}}
    )
    return {"message": "Push token unregistered successfully"}

# ==================== USER ROUTES ====================

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate star level
    referral_count = user.get("referral_count", 0)
    star_info = calculate_star_level(referral_count)
    
    # Add star info to user response
    user_data = {k: v for k, v in user.items() if k not in ['password', '_id']}
    user_data['star_level'] = star_info
    
    return user_data

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

@api_router.post("/users/{user_id}/block")
async def block_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Block a user"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    # Add to blocked list
    await db.users.update_one(
        {"id": current_user.id},
        {"$addToSet": {"blocked_user_ids": user_id}}
    )
    
    return {"message": "User blocked successfully"}

@api_router.delete("/users/{user_id}/unblock")
async def unblock_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Unblock a user"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$pull": {"blocked_user_ids": user_id}}
    )
    
    return {"message": "User unblocked successfully"}

@api_router.get("/users/blocked", response_model=List[User])
async def get_blocked_users(current_user: User = Depends(get_current_user)):
    """Get list of blocked users"""
    user = await db.users.find_one({"id": current_user.id})
    blocked_ids = user.get("blocked_user_ids", [])
    
    if not blocked_ids:
        return []
    
    blocked_users = await db.users.find({"id": {"$in": blocked_ids}}).to_list(100)
    return [User(**{k: v for k, v in user.items() if k != 'password'}) for user in blocked_users]

# ==================== FOLLOW ROUTES ====================

@api_router.post("/users/{user_id}/follow")
@limiter.limit("100/minute")  # Max 100 follow/unfollow per minute
async def follow_user(request: Request, user_id: str, current_user: User = Depends(get_current_user)):
    """Follow a user"""
    # Can't follow yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if user exists
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    current_user_data = await db.users.find_one({"id": current_user.id})
    following_ids = current_user_data.get("following_ids", [])
    
    if user_id in following_ids:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Add to following list
    await db.users.update_one(
        {"id": current_user.id},
        {"$push": {"following_ids": user_id}}
    )
    
    # Add to followers list
    await db.users.update_one(
        {"id": user_id},
        {"$push": {"followers_ids": current_user.id}}
    )
    
    return {
        "message": "Successfully followed user",
        "user_id": user_id,
        "following": True
    }

@api_router.delete("/users/{user_id}/follow")
@limiter.limit("100/minute")
async def unfollow_user(request: Request, user_id: str, current_user: User = Depends(get_current_user)):
    """Unfollow a user"""
    # Can't unfollow yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot unfollow yourself")
    
    # Remove from following list
    await db.users.update_one(
        {"id": current_user.id},
        {"$pull": {"following_ids": user_id}}
    )
    
    # Remove from followers list
    await db.users.update_one(
        {"id": user_id},
        {"$pull": {"followers_ids": current_user.id}}
    )
    
    return {
        "message": "Successfully unfollowed user",
        "user_id": user_id,
        "following": False
    }

@api_router.get("/users/{user_id}/followers", response_model=List[User])
async def get_followers(user_id: str, current_user: User = Depends(get_current_user)):
    """Get list of users following this user"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    followers_ids = user.get("followers_ids", [])
    
    if not followers_ids:
        return []
    
    followers = await db.users.find({"id": {"$in": followers_ids}}).to_list(200)
    return [User(**{k: v for k, v in user.items() if k != 'password'}) for user in followers]

@api_router.get("/users/{user_id}/following", response_model=List[User])
async def get_following(user_id: str, current_user: User = Depends(get_current_user)):
    """Get list of users this user is following"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    following_ids = user.get("following_ids", [])
    
    if not following_ids:
        return []
    
    following = await db.users.find({"id": {"$in": following_ids}}).to_list(200)
    return [User(**{k: v for k, v in user.items() if k != 'password'}) for user in following]

# ==================== REPORT ROUTES ====================

@api_router.post("/reports", response_model=Report)
async def create_report(report_data: ReportCreate, current_user: User = Depends(get_current_user)):
    """Create a new report"""
    # Get reported username
    reported_user = await db.users.find_one({"id": report_data.reported_user_id})
    if not reported_user:
        raise HTTPException(status_code=404, detail="Reported user not found")
    
    report_dict = {
        "id": str(int(datetime.utcnow().timestamp() * 1000000)),
        "reporter_user_id": current_user.id,
        "reporter_username": current_user.username,
        "reported_content_type": report_data.reported_content_type,
        "reported_content_id": report_data.reported_content_id,
        "reported_user_id": report_data.reported_user_id,
        "reported_username": reported_user["username"],
        "reason": report_data.reason,
        "description": report_data.description,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.reports.insert_one(report_dict)
    return Report(**report_dict)

@api_router.get("/reports", response_model=List[Report])
async def get_reports(status: str = "pending", current_user: User = Depends(get_current_user)):
    """Get all reports (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {"status": status} if status != "all" else {}
    reports = await db.reports.find(query).sort("created_at", -1).limit(100).to_list(100)
    return [Report(**report) for report in reports]

@api_router.put("/reports/{report_id}/status")
async def update_report_status(report_id: str, status: str, current_user: User = Depends(get_current_user)):
    """Update report status (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if status not in ["reviewed", "resolved", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.reports.update_one(
        {"id": report_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": "Report status updated"}

# ==================== POST ROUTES ====================

@api_router.post("/posts", response_model=Post)
@limiter.limit("20/minute")  # Max 20 posts per minute (spam protection)
async def create_post(request: Request, post_data: PostCreate, current_user: User = Depends(get_current_user)):
    # Sanitize content
    content = sanitize_text(post_data.content, max_length=2000)
    
    if not content.strip():
        raise HTTPException(status_code=400, detail="Post content cannot be empty")
    
    # Validate image if provided
    if post_data.image and not validate_image_data(post_data.image):
        raise HTTPException(status_code=400, detail="Invalid image format or size (max 10MB)")
    
    post_id = str(datetime.utcnow().timestamp()).replace(".", "")
    
    # Convert location to dict if provided
    location_dict = None
    if post_data.location:
        location_dict = {
            "latitude": post_data.location.latitude,
            "longitude": post_data.location.longitude,
            "location_type": post_data.location.location_type,
            "description": post_data.location.description
        }
    
    post_dict = {
        "id": post_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_profile_picture": current_user.profile_picture,
        "content": content,
        "image": post_data.image,
        "location": location_dict,
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
@limiter.limit("30/minute")  # Max 30 comments per minute (spam protection)
async def create_comment(request: Request, post_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    # Sanitize comment content
    content = sanitize_text(comment_data.content, max_length=500)
    
    if not content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    
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
        "full_name": current_user.full_name,
        "user_profile_picture": current_user.profile_picture,
        "content": content,
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
    
    # Send push notification to post owner
    try:
        if post["user_id"] != current_user.id:  # Don't notify if commenting on own post
            post_owner = await db.users.find_one({"id": post["user_id"]})
            if post_owner and post_owner.get("push_token"):
                prefs = post_owner.get("notification_preferences", {})
                if prefs.get("comments", True):
                    await send_push_notification(
                        post_owner["push_token"],
                        "New Comment",
                        f"{current_user.username} commented on your post!",
                        {
                            "type": "comment",
                            "post_id": post_id,
                            "comment_id": comment_id,
                            "user_id": current_user.id,
                            "username": current_user.username
                        }
                    )
    except Exception as e:
        logging.error(f"Error sending comment notification: {e}")
    
    return Comment(**comment_dict)

@api_router.get("/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_id: str, current_user: User = Depends(get_current_user)):
    comments = await db.comments.find({"post_id": post_id}).sort("created_at", 1).to_list(1000)
    return [Comment(**comment) for comment in comments]

# ==================== CHAT ROUTES ====================

from typing import Optional
from pydantic import BaseModel

class ChatCreateSimple(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    is_group: bool = False
    members: List[str] = []

@api_router.post("/chats", response_model=Chat)
async def create_chat(
    chat_request: ChatCreateSimple,
    current_user: User = Depends(get_current_user)
):
    user_id = chat_request.user_id
    name = chat_request.name
    is_group = chat_request.is_group
    members = chat_request.members
    # Support both simple user_id (for 1-1 chat) and full ChatCreate (for groups)
    if user_id:
        # Simple 1-1 chat
        # Check if chat already exists
        existing_chat = await db.chats.find_one({
            "is_group": False,
            "members": {"$all": [current_user.id, user_id]}
        })
        
        if existing_chat:
            return Chat(**existing_chat)
        
        # Create new 1-1 chat
        other_user = await db.users.find_one({"id": user_id})
        if not other_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        chat_id = str(datetime.utcnow().timestamp()).replace(".", "")
        chat_dict = {
            "id": chat_id,
            "name": other_user["full_name"],
            "is_group": False,
            "members": [current_user.id, user_id],
            "created_at": datetime.utcnow(),
            "last_message": None,
            "last_message_time": None
        }
    else:
        # Group chat
        chat_id = str(datetime.utcnow().timestamp()).replace(".", "")
        all_members = list(set([current_user.id] + members))
        
        chat_dict = {
            "id": chat_id,
            "name": name or "Group Chat",
            "is_group": is_group,
            "members": all_members,
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
    
    # Send push notification
    try:
        if target_user.get("push_token"):
            prefs = target_user.get("notification_preferences", {})
            if prefs.get("friend_requests", True):
                await send_push_notification(
                    target_user["push_token"],
                    "New Friend Request",
                    f"{current_user.username} sent you a friend request",
                    {
                        "type": "friend_request", 
                        "from_user_id": current_user.id,
                        "username": current_user.username
                    }
                )
    except Exception as e:
        logging.error(f"Error sending friend request notification: {e}")
    
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
        
        # Send push notification to requester
        try:
            requester = await db.users.find_one({"id": friend_request["from_user_id"]})
            if requester and requester.get("push_token"):
                prefs = requester.get("notification_preferences", {})
                if prefs.get("friend_requests", True):
                    await send_push_notification(
                        requester["push_token"],
                        "Friend Request Accepted",
                        f"{current_user.username} accepted your friend request!",
                        {
                            "type": "friend_request",
                            "user_id": current_user.id,
                            "username": current_user.username
                        }
                    )
        except Exception as e:
            logging.error(f"Error sending friend request notification: {e}")
        
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
    
    # Generate content hash for duplicate detection
    import hashlib
    content_for_hash = f"{post_data.content}{post_data.image or ''}"
    content_hash = hashlib.md5(content_for_hash.encode()).hexdigest()
    
    # Check for duplicate posts in last 24 hours
    duplicate_check_time = datetime.utcnow() - timedelta(hours=24)
    duplicate_post = await db.posts_enhanced.find_one({
        "user_id": current_user.id,
        "content_hash": content_hash,
        "created_at": {"$gte": duplicate_check_time}
    })
    
    if duplicate_post:
        raise HTTPException(
            status_code=400, 
            detail="You have already posted this content in the last 24 hours"
        )
    
    # If posting to a group, verify membership
    if post_data.group_id:
        group = await db.groups.find_one({"id": post_data.group_id})
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if current_user.id not in group["member_ids"]:
            raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Convert location to dict if provided
    location_dict = None
    if post_data.location:
        location_dict = {
            "latitude": post_data.location.latitude,
            "longitude": post_data.location.longitude,
            "location_type": post_data.location.location_type,
            "description": post_data.location.description
        }
    
    post_dict = {
        "id": post_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "user_profile_picture": current_user.profile_picture,
        "content": post_data.content,
        "image": post_data.image,
        "location": location_dict,
        "likes": [],
        "dislikes": [],
        "reactions": {},
        "comments_count": 0,
        "privacy": post_data.privacy.dict(),
        "group_id": post_data.group_id,
        "content_hash": content_hash,
        "share_count": 0,
        "shared_from_id": None,
        "sector": post_data.sector,
        "created_at": datetime.utcnow()
    }
    
    await db.posts_enhanced.insert_one(post_dict)
    return PostEnhanced(**post_dict)

@api_router.get("/posts/enhanced", response_model=List[PostEnhanced])
async def get_enhanced_posts(skip: int = 0, limit: int = 20, sector: str = "drivers", current_user: User = Depends(get_current_user)):
    # Get user's friend list
    user_data = await db.users.find_one({"id": current_user.id})
    friend_ids = user_data.get("friend_ids", [])
    
    # Build query based on privacy settings - EXCLUDE group posts AND filter by sector
    query = {
        "$and": [
            {"sector": sector},  # Filter by sector
            {
                "$or": [
                    {"privacy.level": "public"},
                    {"user_id": current_user.id},
                    {"privacy.level": "friends", "user_id": {"$in": friend_ids}},
                    {"privacy.level": "specific", "privacy.specific_user_ids": current_user.id}
                ]
            },
            {
                "$or": [
                    {"group_id": {"$exists": False}},
                    {"group_id": None}
                ]
            }
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
            
            # Send push notification to post owner
            try:
                post_owner = await db.users.find_one({"id": post["user_id"]})
                if post_owner and post_owner.get("push_token"):
                    prefs = post_owner.get("notification_preferences", {})
                    if prefs.get("likes", True):
                        await send_push_notification(
                            post_owner["push_token"],
                            "New Like",
                            f"{current_user.username} liked your post!",
                            {
                                "type": "like",
                                "post_id": post_id,
                                "user_id": current_user.id,
                                "username": current_user.username
                            }
                        )
            except Exception as e:
                logging.error(f"Error sending like notification: {e}")
    
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

@api_router.post("/posts/{post_id}/react")
async def react_to_post(post_id: str, reaction_data: ReactionAction, current_user: User = Depends(get_current_user)):
    """Add emoji reaction to post"""
    post = await db.posts_enhanced.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Cannot react to own post
    if post["user_id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot react to your own post")
    
    emoji = reaction_data.emoji
    reactions = post.get("reactions", {})
    
    # Remove user from all other reactions first
    for existing_emoji in reactions:
        if current_user.id in reactions[existing_emoji]:
            reactions[existing_emoji] = [uid for uid in reactions[existing_emoji] if uid != current_user.id]
    
    # Toggle: if same emoji, remove it; otherwise add it
    if emoji in reactions and current_user.id in reactions[emoji]:
        # Remove reaction
        reactions[emoji] = [uid for uid in reactions[emoji] if uid != current_user.id]
        if not reactions[emoji]:  # Remove emoji key if empty
            del reactions[emoji]
    else:
        # Add reaction
        if emoji not in reactions:
            reactions[emoji] = []
        reactions[emoji].append(current_user.id)
    
    # Update post
    await db.posts_enhanced.update_one(
        {"id": post_id},
        {"$set": {"reactions": reactions}}
    )
    
    # Return updated post
    updated_post = await db.posts_enhanced.find_one({"id": post_id})
    return PostEnhanced(**updated_post)

@api_router.post("/posts/{post_id}/share", response_model=PostEnhanced)
async def share_post(post_id: str, current_user: User = Depends(get_current_user)):
    """Share a post to your timeline"""
    # Find original post
    original_post = await db.posts_enhanced.find_one({"id": post_id})
    if not original_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Cannot share your own post
    if original_post["user_id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share your own post")
    
    # Create new post as a share
    new_post_id = str(int(datetime.utcnow().timestamp() * 1000))
    shared_post = {
        "id": new_post_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_profile_picture": current_user.profile_picture,
        "content": "",  # Shared posts don't have content, just reference
        "image": None,  # Shared posts don't have their own image
        "likes": [],
        "dislikes": [],
        "reactions": {},
        "comments_count": 0,
        "privacy": {"level": "public", "specific_user_ids": []},  # Shares are always public
        "group_id": None,
        "shared_from_id": post_id,  # Link to original post
        "share_count": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.posts_enhanced.insert_one(shared_post)
    
    # Increment share count on original post
    await db.posts_enhanced.update_one(
        {"id": post_id},
        {"$inc": {"share_count": 1}}
    )
    
    # Send notification to original post owner
    try:
        if original_post["user_id"] != current_user.id:
            post_owner = await db.users.find_one({"id": original_post["user_id"]})
            if post_owner and post_owner.get("push_token"):
                prefs = post_owner.get("notification_preferences", {})
                if prefs.get("comments", True):  # Using comments pref for shares
                    await send_push_notification(
                        post_owner["push_token"],
                        "Post Shared",
                        f"{current_user.username} shared your post!",
                        {
                            "type": "share",
                            "post_id": post_id,
                            "share_id": new_post_id,
                            "user_id": current_user.id,
                            "username": current_user.username
                        }
                    )
    except Exception as e:
        logging.error(f"Error sending share notification: {e}")
    
    return PostEnhanced(**shared_post)

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    post = await db.posts_enhanced.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user is admin or post owner
    if not current_user.is_admin and post["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # Delete post from both collections
    await db.posts.delete_one({"id": post_id})
    await db.posts_enhanced.delete_one({"id": post_id})
    
    # Delete all comments on this post
    await db.comments.delete_many({"post_id": post_id})
    
    return {"message": "Post deleted successfully"}

@api_router.put("/posts/{post_id}")
async def update_post(post_id: str, content: str, current_user: User = Depends(get_current_user)):
    post = await db.posts_enhanced.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Only post owner can edit
    if post["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    # Update post in both collections
    await db.posts.update_one({"id": post_id}, {"$set": {"content": content}})
    await db.posts_enhanced.update_one({"id": post_id}, {"$set": {"content": content}})
    
    # Return updated post
    updated_post = await db.posts_enhanced.find_one({"id": post_id})
    return PostEnhanced(**updated_post)

@api_router.get("/posts/enhanced/user/{user_id}", response_model=List[PostEnhanced])
async def get_user_enhanced_posts(user_id: str, skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    posts = await db.posts_enhanced.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [PostEnhanced(**post) for post in posts]

@api_router.get("/posts/search", response_model=List[PostEnhanced])
async def search_posts(q: str, skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    """Search posts by content or username"""
    if not q or len(q) < 2:
        return []
    
    # Search in post content or username
    search_filter = {
        "$or": [
            {"content": {"$regex": q, "$options": "i"}},
            {"username": {"$regex": q, "$options": "i"}}
        ]
    }
    
    posts = await db.posts_enhanced.find(search_filter).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [PostEnhanced(**post) for post in posts]

@api_router.get("/posts/following", response_model=List[PostEnhanced])
async def get_following_posts(skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    """Get posts only from users you follow"""
    # Get current user's following list
    user = await db.users.find_one({"id": current_user.id})
    following_ids = user.get("following_ids", [])
    
    # If not following anyone, return empty list
    if not following_ids:
        return []
    
    # Get posts from followed users only
    posts = await db.posts_enhanced.find(
        {"user_id": {"$in": following_ids}}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
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
        "sector": group_data.sector,
        "created_at": datetime.utcnow()
    }
    
    await db.groups.insert_one(group_dict)
    return Group(**group_dict)

@api_router.get("/groups", response_model=List[Group])
async def get_groups(sector: str = "drivers", current_user: User = Depends(get_current_user)):
    groups = await db.groups.find({"member_ids": current_user.id, "sector": sector}).sort("created_at", -1).to_list(100)
    return [Group(**group) for group in groups]

@api_router.get("/groups/discover", response_model=List[Group])
async def discover_groups(sector: str = "drivers", current_user: User = Depends(get_current_user)):
    # Get all groups where user is not a member - filtered by sector
    groups = await db.groups.find({"member_ids": {"$ne": current_user.id}, "sector": sector}).sort("created_at", -1).to_list(100)
    return [Group(**group) for group in groups]

@api_router.get("/groups/{group_id}")
async def get_group_detail(group_id: str, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Fetch member details
    member_ids = group.get("member_ids", [])
    members = []
    if member_ids:
        members_data = await db.users.find(
            {"id": {"$in": member_ids}},
            {"_id": 0, "id": 1, "username": 1, "full_name": 1, "profile_picture": 1}
        ).to_list(None)
        members = members_data
    
    # Add members detail to response
    group_response = Group(**group).dict()
    group_response["members"] = members
    
    return group_response

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

@api_router.put("/groups/{group_id}/join-requests/{request_id}")
async def handle_join_request(
    group_id: str,
    request_id: str,
    action: str,  # approve or reject
    current_user: User = Depends(get_current_user)
):
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group["admin_ids"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    request = await db.group_join_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if action == "approve":
        # Add user to group
        await db.groups.update_one(
            {"id": group_id},
            {"$push": {"member_ids": request["user_id"]}}
        )
        await db.group_join_requests.update_one(
            {"id": request_id},
            {"$set": {"request_status": "approved"}}
        )
        return {"message": "Request approved"}
    else:
        await db.group_join_requests.update_one(
            {"id": request_id},
            {"$set": {"request_status": "rejected"}}
        )
        return {"message": "Request rejected"}

@api_router.delete("/groups/{group_id}/leave")
async def leave_group(group_id: str, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id == group["creator_id"]:
        raise HTTPException(status_code=400, detail="Creator cannot leave group. Delete the group instead.")
    
    if current_user.id not in group["member_ids"]:
        raise HTTPException(status_code=400, detail="Not a member")
    
    await db.groups.update_one(
        {"id": group_id},
        {"$pull": {"member_ids": current_user.id, "admin_ids": current_user.id, "moderator_ids": current_user.id}}
    )
    return {"message": "Left group successfully"}

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id != group["creator_id"]:
        raise HTTPException(status_code=403, detail="Only creator can delete group")
    
    # Delete group and all related data
    await db.groups.delete_one({"id": group_id})
    await db.group_join_requests.delete_many({"group_id": group_id})
    # Note: We could also delete group posts here if needed
    
    return {"message": "Group deleted successfully"}

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

@api_router.get("/groups/{group_id}/posts", response_model=List[PostEnhanced])
async def get_group_posts(group_id: str, skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is a member
    if current_user.id not in group["member_ids"]:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get posts for this group
    posts = await db.posts_enhanced.find({"group_id": group_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [PostEnhanced(**post) for post in posts]

# ==================== ADMIN ENDPOINTS ====================

# Admin middleware to check if user is admin
async def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Get all reports (admin only)
@api_router.get("/admin/reports", response_model=List[Report])
async def get_all_reports_admin(
    status: Optional[str] = None,
    admin: User = Depends(require_admin)
):
    query = {}
    if status:
        query["status"] = status
    
    reports = await db.reports.find(query).sort("created_at", -1).to_list(length=1000)
    return reports

# Resolve or update report status (admin only)
@api_router.put("/admin/reports/{report_id}/resolve")
async def resolve_report_admin(
    report_id: str,
    status: str,  # reviewed, resolved, dismissed
    admin: User = Depends(require_admin)
):
    if status not in ["reviewed", "resolved", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.reports.update_one(
        {"id": report_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": f"Report status updated to {status}"}

# Get all users (admin only)
@api_router.get("/admin/users")
async def get_all_users_admin(
    skip: int = 0,
    limit: int = 5000,
    admin: User = Depends(require_admin)
):
    users = await db.users.find().skip(skip).limit(limit).to_list(length=limit)
    
    # Add statistics for each user
    users_with_stats = []
    for user in users:
        # Count posts
        posts_count = await db.posts_enhanced.count_documents({"user_id": user["id"]})
        
        # Count friends, followers, referrals
        friends_count = len(user.get("friend_ids", []))
        followers_count = len(user.get("followers_ids", []))
        referrals_count = await db.users.count_documents({"referred_by": user["id"]})
        
        users_with_stats.append({
            "id": user["id"],
            "username": user["username"],
            "full_name": user.get("full_name", ""),
            "email": user["email"],
            "is_admin": user.get("is_admin", False),
            "is_banned": user.get("is_banned", False),
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at"),
            "profile_picture": user.get("profile_picture"),
            "stats": {
                "posts_count": posts_count,
                "friends_count": friends_count,
                "followers_count": followers_count,
                "referrals_count": referrals_count,
            }
        })
    
    return users_with_stats

# Toggle user admin status (admin only)
@api_router.put("/admin/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: str,
    admin: User = Depends(require_admin)
):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_admin_status = not user.get("is_admin", False)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_admin": new_admin_status}}
    )
    
    return {"message": f"User admin status set to {new_admin_status}", "is_admin": new_admin_status}

# Ban/Unban user (admin only)
@api_router.put("/admin/users/{user_id}/ban")
async def ban_user_admin(
    user_id: str,
    ban: bool,  # true to ban, false to unban
    admin: User = Depends(require_admin)
):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent banning yourself
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_banned": ban}}
    )
    
    return {"message": f"User {'banned' if ban else 'unbanned'} successfully", "is_banned": ban}

# Get all posts (admin only)
@api_router.get("/admin/posts")
async def get_all_posts_admin(
    skip: int = 0,
    limit: int = 5000,
    admin: User = Depends(require_admin)
):
    # Use posts_enhanced collection
    posts = await db.posts_enhanced.find({}, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(length=limit)
    
    # Convert datetime to ISO string
    for post in posts:
        if isinstance(post.get("created_at"), datetime):
            post["created_at"] = post["created_at"].isoformat()
    
    return posts

# Delete any post (admin only)
@api_router.delete("/admin/posts/{post_id}")
async def delete_post_admin(
    post_id: str,
    admin: User = Depends(require_admin)
):
    # Delete from posts_enhanced collection
    result = await db.posts_enhanced.delete_one({"id": post_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Also delete all comments on this post
    await db.comments.delete_many({"post_id": post_id})
    
    return {"message": "Post deleted successfully"}

# Get admin statistics (admin only)
@api_router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_posts = await db.posts_enhanced.count_documents({})  # Use posts_enhanced
    total_comments = await db.comments.count_documents({})
    total_reports = await db.reports.count_documents({})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    
    # Get recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_users = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    recent_posts = await db.posts_enhanced.count_documents({"created_at": {"$gte": seven_days_ago}})  # Use posts_enhanced
    
    return {
        "total_users": total_users,
        "total_posts": total_posts,
        "total_comments": total_comments,
        "total_reports": total_reports,
        "pending_reports": pending_reports,
        "recent_users_7d": recent_users,
        "recent_posts_7d": recent_posts
    }

@api_router.get("/admin/users/{user_id}/details")
async def get_user_details(user_id: str, admin: User = Depends(require_admin)):
    """Get detailed user statistics for admin panel"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Count posts
    posts_count = await db.posts_enhanced.count_documents({"user_id": user_id})
    
    # Count comments
    comments_count = await db.comments.count_documents({"user_id": user_id})
    
    # Count friends
    friends_count = len(user.get("friend_ids", []))
    
    # Count groups created by user
    groups_count = await db.groups.count_documents({"creator_id": user_id})
    
    # Count referrals (users who have this user as referrer)
    referrals_count = await db.users.count_documents({"referred_by": user_id})
    
    # Get follower/following counts
    followers_count = len(user.get("followers_ids", []))
    following_count = len(user.get("following_ids", []))
    
    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user.get("full_name", ""),
            "email": user["email"],
            "is_admin": user.get("is_admin", False),
            "is_banned": user.get("is_banned", False),
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else user.get("created_at"),
            "profile_picture": user.get("profile_picture"),
        },
        "statistics": {
            "posts_count": posts_count,
            "comments_count": comments_count,
            "friends_count": friends_count,
            "groups_created": groups_count,
            "referrals_count": referrals_count,
            "followers_count": followers_count,
            "following_count": following_count,
        }
    }

@api_router.put("/admin/users/{user_id}/update-credentials")
async def update_user_credentials(
    user_id: str,
    request: UpdateCredentialsRequest,
    admin: User = Depends(require_admin)
):
    """Admin can update user email and password"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    
    if request.email:
        # Check if email is already taken by another user
        existing_user = await db.users.find_one({"email": request.email, "id": {"$ne": user_id}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")
        update_data["email"] = request.email
    
    if request.password:
        # Hash the new password
        update_data["password"] = pwd_context.hash(request.password)
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"message": "User credentials updated successfully"}

# ==================== PUBLIC CHAT ROOM ====================

@api_router.get("/chatroom/messages")
async def get_chatroom_messages(
    current_user: User = Depends(get_current_user)
):
    """Get latest public chat messages - max 200 OR last 24 hours"""
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    # Get messages from last 24 hours OR max 200 messages
    messages = await db.chatroom_messages.find(
        {"created_at": {"$gte": twenty_four_hours_ago}},
        {"_id": 0}
    ).sort("created_at", -1).limit(200).to_list(200)
    
    messages.reverse()  # Oldest first
    
    # Convert datetime to ISO string
    for msg in messages:
        if isinstance(msg.get("created_at"), datetime):
            msg["created_at"] = msg["created_at"].isoformat()
    
    return messages

@api_router.get("/chatroom/status")
async def get_chatroom_status(current_user: User = Depends(get_current_user)):
    """Check if chatroom is enabled or disabled"""
    status = await db.chatroom_status.find_one({"id": "chatroom"})
    if not status:
        # Create default status
        await db.chatroom_status.insert_one({"id": "chatroom", "enabled": True})
        return {"enabled": True}
    return {"enabled": status.get("enabled", True)}

class ChatMessageCreate(BaseModel):
    content: Optional[str] = None
    audio: Optional[str] = None  # base64 encoded audio
    duration: Optional[int] = None  # in seconds
    message_type: str = "text"  # "text" or "audio"

@api_router.post("/chatroom/messages")
@limiter.limit("60/minute")  # Max 60 chat messages per minute (1 per second average)
async def send_chatroom_message(
    request: Request,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a message (text or audio) to public chat room"""
    # Check if chat is enabled
    status = await db.chatroom_status.find_one({"id": "chatroom"})
    if status and not status.get("enabled", True):
        raise HTTPException(status_code=403, detail="Chat is currently disabled by admin")
    
    # Sanitize and validate based on message type
    content = None
    audio = None
    
    if message_data.message_type == "text":
        if not message_data.content:
            raise HTTPException(status_code=400, detail="Text message requires content")
        content = sanitize_text(message_data.content, max_length=1000)
        if not content.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
    elif message_data.message_type == "audio":
        if not message_data.audio:
            raise HTTPException(status_code=400, detail="Audio message requires audio data")
        if not validate_audio_data(message_data.audio):
            raise HTTPException(status_code=400, detail="Invalid audio format or size (max 5MB)")
        audio = message_data.audio
    else:
        raise HTTPException(status_code=400, detail="Invalid message type")
    
    message_id = str(int(datetime.utcnow().timestamp() * 1000))
    now = datetime.utcnow()
    
    message_db = {
        "id": message_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "user_profile_picture": current_user.profile_picture,
        "content": content,
        "audio": audio,
        "duration": message_data.duration,
        "message_type": message_data.message_type,
        "created_at": now
    }
    
    await db.chatroom_messages.insert_one(message_db)
    
    # Prepare message for Socket.IO (with ISO string datetime)
    message_emit = {
        "id": message_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "user_profile_picture": current_user.profile_picture,
        "content": message_data.content,
        "audio": message_data.audio,
        "duration": message_data.duration,
        "message_type": message_data.message_type,
        "created_at": now.isoformat()
    }
    
    # Emit to all connected clients via Socket.IO
    await sio.emit('new_chatroom_message', message_emit, room='chatroom')
    
    return message_emit

# ==================== GROUP CHAT ====================

@api_router.get("/groups/{group_id}/messages")
async def get_group_messages(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get group chat messages - only for group members"""
    # Verify user is a member
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group["member_ids"]:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get last 200 messages
    messages = await db.group_messages.find(
        {"group_id": group_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(200).to_list(200)
    
    messages.reverse()  # Oldest first
    
    # Convert datetime to ISO string
    for msg in messages:
        if isinstance(msg.get("created_at"), datetime):
            msg["created_at"] = msg["created_at"].isoformat()
    
    return messages

@api_router.post("/groups/{group_id}/messages")
@limiter.limit("60/minute")  # Max 60 group messages per minute
async def send_group_message(
    request: Request,
    group_id: str,
    message: GroupMessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a message (text or audio) to group chat"""
    # Verify user is a member
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group["member_ids"]:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Sanitize and validate based on message type
    content = None
    audio = None
    
    if message.message_type == "text":
        if not message.content:
            raise HTTPException(status_code=400, detail="Text message requires content")
        content = sanitize_text(message.content, max_length=1000)
        if not content.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
    elif message.message_type == "audio":
        if not message.audio:
            raise HTTPException(status_code=400, detail="Audio message requires audio data")
        if not validate_audio_data(message.audio):
            raise HTTPException(status_code=400, detail="Invalid audio format or size (max 5MB)")
        audio = message.audio
    else:
        raise HTTPException(status_code=400, detail="Invalid message type")
    
    message_id = str(int(datetime.utcnow().timestamp() * 1000))
    now = datetime.utcnow()
    
    message_db = {
        "id": message_id,
        "group_id": group_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "user_profile_picture": current_user.profile_picture,
        "content": content,
        "audio": audio,
        "duration": message.duration,
        "message_type": message.message_type,
        "created_at": now
    }
    
    await db.group_messages.insert_one(message_db)
    
    # Prepare message for Socket.IO (with ISO string datetime)
    message_emit = {
        "id": message_id,
        "group_id": group_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "user_profile_picture": current_user.profile_picture,
        "content": message.content,
        "audio": message.audio,
        "duration": message.duration,
        "message_type": message.message_type,
        "created_at": now.isoformat()
    }
    
    # Emit to group room via Socket.IO
    await sio.emit('new_group_message', message_emit, room=f'group_{group_id}')
    
    return message_emit

@api_router.delete("/groups/{group_id}/messages/{message_id}")
async def delete_group_message(
    group_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete own message from group chat"""
    message = await db.group_messages.find_one({"id": message_id, "group_id": group_id})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only owner or admin can delete
    if message["user_id"] != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.group_messages.delete_one({"id": message_id})
    
    # Notify via Socket.IO
    await sio.emit('delete_group_message', {"message_id": message_id}, room=f'group_{group_id}')
    
    return {"message": "Message deleted"}

@api_router.post("/admin/reset-database")
@limiter.limit("5/hour")  # Max 5 resets per hour
async def reset_database(request: Request, admin: User = Depends(require_admin)):
    """DANGER: Reset entire database except admin users"""
    try:
        # Delete all non-admin users
        result = await db.users.delete_many({"is_admin": {"$ne": True}})
        users_deleted = result.deleted_count
        
        # Clear all collections
        await db.posts.delete_many({})
        await db.posts_enhanced.delete_many({})
        await db.comments.delete_many({})
        await db.groups.delete_many({})
        await db.group_messages.delete_many({})
        await db.chatroom_messages.delete_many({})
        await db.friend_requests.delete_many({})
        await db.chats.delete_many({})
        await db.chat_messages.delete_many({})
        await db.reports.delete_many({})
        
        # Count remaining users (admins only)
        remaining_users = await db.users.count_documents({})
        
        return {
            "success": True,
            "message": "Database reset successfully",
            "details": {
                "users_deleted": users_deleted,
                "remaining_users": remaining_users,
                "admin_preserved": True
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

# ==================== CHATROOM ====================

@api_router.delete("/chatroom/messages/{message_id}")
async def delete_chatroom_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete own message from chatroom"""
    message = await db.chatroom_messages.find_one({"id": message_id})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only owner or admin can delete
    if message["user_id"] != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
    
    await db.chatroom_messages.delete_one({"id": message_id})
    
    # Notify all clients
    await sio.emit('chatroom_message_deleted', {"message_id": message_id}, room='chatroom')
    
    return {"message": "Message deleted"}

@api_router.delete("/admin/chatroom/clear")
async def clear_chatroom(admin: User = Depends(require_admin)):
    """Clear all chatroom messages (admin only)"""
    result = await db.chatroom_messages.delete_many({})
    
    # Notify all clients
    await sio.emit('chatroom_cleared', {}, room='chatroom')
    
    return {"message": f"Cleared {result.deleted_count} messages"}

@api_router.post("/admin/chatroom/toggle")
async def toggle_chatroom(
    enabled: bool,
    admin: User = Depends(require_admin)
):
    """Enable or disable chatroom (admin only)"""
    await db.chatroom_status.update_one(
        {"id": "chatroom"},
        {"$set": {"enabled": enabled}},
        upsert=True
    )
    
    # Notify all clients
    await sio.emit('chatroom_status_changed', {"enabled": enabled}, room='chatroom')
    
    return {"message": f"Chatroom {'enabled' if enabled else 'disabled'}", "enabled": enabled}

# ==================== PUSH NOTIFICATIONS ENDPOINTS ====================

@api_router.post("/notifications/register")
async def register_push_token(
    token_data: PushTokenRegister,
    current_user: User = Depends(get_current_user)
):
    """Register or update user's push notification token"""
    try:
        result = await db.users.update_one(
            {"_id": current_user.id},
            {"$set": {"push_token": token_data.token}}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return {"message": "Push token registered successfully", "token": token_data.token}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logging.error(f"Error registering push token: {e}")
        raise HTTPException(status_code=500, detail="Failed to register push token")

@api_router.delete("/notifications/unregister")
async def unregister_push_token(
    current_user: User = Depends(get_current_user)
):
    """Remove user's push notification token (logout)"""
    try:
        result = await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"push_token": None}}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return {"message": "Push token removed successfully"}
        else:
            # User might not have a token, that's OK
            return {"message": "No push token to remove"}
    except Exception as e:
        logging.error(f"Error removing push token: {e}")
        # Don't fail logout for this
        return {"message": "Push token removal skipped"}

@api_router.put("/notifications/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: User = Depends(get_current_user)
):
    """Update user's notification preferences"""
    try:
        prefs_dict = {
            "friend_requests": preferences.friend_requests,
            "messages": preferences.messages,
            "likes": preferences.likes,
            "comments": preferences.comments
        }
        
        result = await db.users.update_one(
            {"_id": current_user.id},
            {"$set": {"notification_preferences": prefs_dict}}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return prefs_dict
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logging.error(f"Error updating notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

@api_router.get("/notifications/preferences")
async def get_notification_preferences(
    current_user: User = Depends(get_current_user)
):
    """Get user's notification preferences"""
    try:
        user = await db.users.find_one({"_id": current_user.id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return preferences or defaults
        prefs = user.get("notification_preferences", {
            "friend_requests": True,
            "messages": True,
            "likes": True,
            "comments": True
        })
        
        return prefs
    except Exception as e:
        logging.error(f"Error getting notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get preferences")

# ==================== SOCKET.IO ====================

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_chatroom(sid, data):
    """Join the public chat room"""
    sio.enter_room(sid, 'chatroom')
    user_id = data.get('user_id')
    username = data.get('username')
    print(f"User {username} ({sid}) joined chatroom")
    
    # Notify others
    await sio.emit('user_joined', {'username': username, 'user_id': user_id}, room='chatroom', skip_sid=sid)

@sio.event
async def leave_chatroom(sid):
    """Leave the public chat room"""
    sio.leave_room(sid, 'chatroom')
    print(f"Client {sid} left chatroom")

@sio.event
async def join_group_chat(sid, data):
    """Join a group chat room"""
    group_id = data.get('group_id')
    user_id = data.get('user_id')
    username = data.get('username')
    
    room_name = f'group_{group_id}'
    sio.enter_room(sid, room_name)
    print(f"User {username} ({sid}) joined group chat {group_id}")
    
    # Notify others in the group
    await sio.emit('user_joined_group', {'username': username, 'user_id': user_id}, room=room_name, skip_sid=sid)

@sio.event
async def leave_group_chat(sid, data):
    """Leave a group chat room"""
    group_id = data.get('group_id')
    room_name = f'group_{group_id}'
    sio.leave_room(sid, room_name)
    print(f"Client {sid} left group chat {group_id}")

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
