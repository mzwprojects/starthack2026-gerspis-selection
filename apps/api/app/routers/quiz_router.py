import random

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
