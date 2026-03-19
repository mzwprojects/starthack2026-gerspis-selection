from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import hash_password, verify_password, create_access_token
from app.database import get_session
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register")
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        display_name=req.displayName or req.email.split("@")[0],
        coins=0,
        games_played=0,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.email)
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "coins": user.coins,
            "quizStreak": user.quiz_streak,
        },
    }


@router.post("/login")
def login(req: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.email)
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "coins": user.coins,
            "quizStreak": user.quiz_streak,
        },
    }
