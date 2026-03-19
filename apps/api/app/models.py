from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON, Text


# ── User ──────────────────────────────────────────────────────────────

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    display_name: str = Field(max_length=100)
    coins: int = Field(default=0)
    games_played: int = Field(default=0)


# ── Question (Quiz) ──────────────────────────────────────────────────

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question: str = Field(sa_column=Column(Text))
    options: list = Field(sa_column=Column(JSON))
    correct: int = Field(default=0)
    explanation: str = Field(sa_column=Column(Text))


# ── Tip ──────────────────────────────────────────────────────────────

class Tip(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    icon: str = Field(max_length=10)
    title: str = Field(max_length=200)
    text: str = Field(sa_column=Column(Text))


# ── Asset ────────────────────────────────────────────────────────────

class Asset(SQLModel, table=True):
    id: str = Field(primary_key=True, max_length=50)
    name: str = Field(max_length=100)
    full_name: str = Field(max_length=200)
    category: str = Field(max_length=50)
    icon: str = Field(max_length=10)
    avg_return: float = Field(default=0.0)
    volatility: float = Field(default=0.0)
    description: str = Field(sa_column=Column(Text))
    info_text: str = Field(sa_column=Column(Text))


# ── Event (Market crisis) ────────────────────────────────────────────

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    year: int = Field(default=2000)
    title: str = Field(max_length=200)
    description: str = Field(sa_column=Column(Text))
    lesson: str = Field(sa_column=Column(Text))
    icon: str = Field(max_length=10)
    impacts: dict = Field(sa_column=Column(JSON))


# ── Decision (Crisis scenario) ───────────────────────────────────────

class Decision(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    icon: str = Field(max_length=10)
    description: str = Field(sa_column=Column(Text))
    options: list = Field(sa_column=Column(JSON))
    lesson: str = Field(sa_column=Column(Text))
