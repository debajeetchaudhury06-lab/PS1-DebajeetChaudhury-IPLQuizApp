from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Question
import random

router = APIRouter(prefix="/questions", tags=["Questions"])

@router.get("/")
def get_questions(category: str, db: Session = Depends(get_db)):
    questions = db.query(Question).filter(
        Question.category == category
    ).all()
    random.shuffle(questions)
    return questions[:7]

@router.post("/answer")
def submit_answer(
    question_id: int,
    answer: str,
    time_taken: float,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()
    
    is_correct = question.correct_answer == answer
    question.total_attempts += 1
    
    if is_correct:
        question.correct_attempts += 1
    
    # Auto update difficulty
    accuracy = question.correct_attempts / question.total_attempts
    if accuracy >= 0.8:
        question.difficulty = "easy"
    elif accuracy >= 0.4:
        question.difficulty = "medium"
    else:
        question.difficulty = "hard"
    
    db.commit()
    
    return {
        "correct": is_correct,
        "correct_answer": question.correct_answer,
        "fun_fact": question.fun_fact,
        "difficulty": question.difficulty
    }

@router.get("/stats")
def get_question_stats(category: str, db: Session = Depends(get_db)):
    questions = db.query(Question).filter(
        Question.category == category
    ).all()

    stats = []
    for q in questions:
        if q.total_attempts > 0:
            accuracy = round(
                (q.correct_attempts / q.total_attempts) * 100, 1
            )
        else:
            accuracy = 0.0

        stats.append({
            "id": q.id,
            "question": q.question,
            "total_attempts": q.total_attempts,
            "correct_attempts": q.correct_attempts,
            "accuracy": accuracy,
            "difficulty": q.difficulty
        })

    return stats