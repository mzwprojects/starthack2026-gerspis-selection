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

    # ── Streak tracking ──
    today = date.today().isoformat()  # "YYYY-MM-DD"
    last_date = current_user.last_quiz_date

    if last_date != today:
        # First quiz of the day
        if last_date:
            yesterday = (date.today() - timedelta(days=1)).isoformat()
            if last_date == yesterday:
                current_user.quiz_streak += 1  # Consecutive day
            else:
                current_user.quiz_streak = 1   # Streak broken, reset
        else:
            current_user.quiz_streak = 1       # First ever quiz
        current_user.last_quiz_date = today

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return {
        "correct": correct,
        "correctAnswer": question.correct,
        "explanation": question.explanation,
        "coinsEarned": coins_earned,
        "totalCoins": current_user.coins,
        "quizStreak": current_user.quiz_streak,
    }

