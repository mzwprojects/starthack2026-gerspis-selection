from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.models import User
from app.schemas import SimulationRequest
from app.simulation import run_simulation

router = APIRouter(prefix="/api", tags=["simulation"])


@router.post("/simulate")
def simulate(
    req: SimulationRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not req.years or not req.totalBudget or not req.allocation:
        return {"error": "years, totalBudget, and allocation required"}

    result = run_simulation(session, req.years, req.totalBudget, req.allocation)
    if "error" in result:
        return {"error": result["error"]}

    current_user.games_played += 1
    session.add(current_user)
    session.commit()

    return result
