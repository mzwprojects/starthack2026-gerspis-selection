import random
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import User, Question
from app.schemas import QuizAnswerRequest

router = APIRouter(prefix="/api", tags=["quiz"])


@router.get("/quiz")
def get_quiz(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    questions = session.exec(select(Question)).all()
    shuffled = list(questions)
    random.shuffle(shuffled)
    selected = shuffled[:4]
    return {
        "questions": [
            {"id": q.id, "question": q.question, "options": q.options}
            for q in selected
        ]
    }


@router.post("/quiz/answer")
def submit_answer(
    req: QuizAnswerRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    question = session.get(Question, req.questionId)
    if not question:
        return {"error": "Question not found"}

    correct = question.correct == req.answerIndex
    coins_earned = 10 if correct else 0

    current_user.coins += coins_earned
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {
        "correct": correct,
        "correctAnswer": question.correct,
        "explanation": question.explanation,
        "coinsEarned": coins_earned,
        "totalCoins": current_user.coins,
    }


@router.post("/quiz/streak")
def update_streak(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Increment quiz streak - only once per day.
    - Same day: no change
    - Consecutive day: streak + 1
    - Gap > 1 day: streak resets to 1
    """
    today = date.today().isoformat()  # "YYYY-MM-DD"

    if current_user.last_quiz_date == today:
        # Already counted today
        return {
            "streak": current_user.quiz_streak,
            "alreadyCounted": True,
        }

    yesterday = (date.today() - timedelta(days=1)).isoformat()

    if current_user.last_quiz_date == yesterday:
        # Consecutive day: increment
        current_user.quiz_streak += 1
    else:
        # First time or gap > 1 day: reset to 1
        current_user.quiz_streak = 1

    current_user.last_quiz_date = today
    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {
        "streak": current_user.quiz_streak,
        "alreadyCounted": False,
    }
