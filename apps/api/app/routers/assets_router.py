from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import User, Asset

router = APIRouter(prefix="/api", tags=["assets"])


@router.get("/assets")
def get_assets(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    assets = session.exec(select(Asset)).all()
    result = []
    for a in assets:
        if a.volatility > 0.5:
            risk = "Very High"
        elif a.volatility > 0.2:
            risk = "High"
        elif a.volatility > 0.1:
            risk = "Medium"
        else:
            risk = "Low"
        result.append({
            "id": a.id,
            "name": a.name,
            "fullName": a.full_name,
            "category": a.category,
            "icon": a.icon,
            "description": a.description,
            "infoText": a.info_text or a.description,
            "riskLevel": risk,
        })
    return {"assets": result}
