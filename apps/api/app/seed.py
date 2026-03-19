"""
Seed the database with initial data on first run.
Called from main.py after tables are created.
"""
from sqlmodel import Session, select
from app.database import engine
from app.models import Asset, Question, Tip, Event, Decision
from app.seed_data import ASSETS, EVENTS, DECISIONS
from app.seed_questions import QUESTIONS
from app.seed_tips import TIPS


def seed_database():
    """Populate tables if they are empty."""
    with Session(engine) as session:
        # Assets
        if not session.exec(select(Asset)).first():
            for a in ASSETS:
                session.add(Asset(**a))
            session.commit()
            print(f"✅ Seeded {len(ASSETS)} assets")

        # Questions
        if not session.exec(select(Question)).first():
            for q in QUESTIONS:
                session.add(Question(**q))
            session.commit()
            print(f"✅ Seeded {len(QUESTIONS)} questions")

        # Tips
        if not session.exec(select(Tip)).first():
            for t in TIPS:
                session.add(Tip(**t))
            session.commit()
            print(f"✅ Seeded {len(TIPS)} tips")

        # Events
        if not session.exec(select(Event)).first():
            for e in EVENTS:
                session.add(Event(**e))
            session.commit()
            print(f"✅ Seeded {len(EVENTS)} events")

        # Decisions
        if not session.exec(select(Decision)).first():
            for d in DECISIONS:
                session.add(Decision(**d))
            session.commit()
            print(f"✅ Seeded {len(DECISIONS)} decisions")
