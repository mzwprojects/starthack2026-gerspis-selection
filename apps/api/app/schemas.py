from pydantic import BaseModel
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    displayName: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    success: bool = True
    token: str
    user: dict


# ── Quiz ──────────────────────────────────────────────────────────────

class QuizAnswerRequest(BaseModel):
    questionId: int
    answerIndex: int


# ── Simulation ────────────────────────────────────────────────────────

class SimulationRequest(BaseModel):
    years: int
    totalBudget: float
    allocation: dict  # { assetId: percentage }
