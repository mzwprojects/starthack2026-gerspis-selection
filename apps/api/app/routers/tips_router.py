import random

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import User, Tip

router = APIRouter(prefix="/api", tags=["tips"])


@router.get("/tips")
def get_tip(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    tips = session.exec(select(Tip)).all()
    if not tips:
        return {"tip": None}
    tip = random.choice(tips)
    return {"tip": {"id": tip.id, "icon": tip.icon, "title": tip.title, "text": tip.text}}
