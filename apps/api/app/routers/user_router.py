from fastapi import APIRouter, Depends
from sqlmodel import Session, select

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
    }
