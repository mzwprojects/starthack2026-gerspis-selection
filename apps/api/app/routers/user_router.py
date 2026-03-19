from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.auth import get_current_user
from app.database import get_session
from app.models import User

router = APIRouter(prefix="/api", tags=["user"])


@router.get("/user/{email}")
def get_user(
    email: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return {"error": "User not found"}
    return {
        "id": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "coins": user.coins,
        "gamesPlayed": user.games_played,
        "quizStreak": user.quiz_streak,
        "avatar": user.avatar,
        "ownedAvatars": user.owned_avatars,
    }

class AvatarUpdate(BaseModel):
    avatar: str
    cost: int = 0

@router.post("/user/{email}/avatar")
def update_avatar(
    email: str,
    data: AvatarUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.email != email:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if data.cost > 0:
        if user.coins < data.cost:
            raise HTTPException(status_code=400, detail="Not enough coins")
        user.coins -= data.cost
        
        owned = list(user.owned_avatars) if user.owned_avatars else []
        if data.avatar not in owned:
            owned.append(data.avatar)
            user.owned_avatars = owned

    user.avatar = data.avatar
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {
        "success": True, 
        "coins": user.coins, 
        "avatar": user.avatar, 
        "ownedAvatars": user.owned_avatars
    }
