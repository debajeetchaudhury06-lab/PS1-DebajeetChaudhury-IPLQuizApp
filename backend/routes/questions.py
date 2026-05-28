from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models import Question
import random
import os

router = APIRouter(prefix="/questions", tags=["Questions"])

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "ipl-admin-secret-123")

def verify_admin(x_api_key: str = Header(...)):
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden - Invalid API Key")

@router.get("/")
def get_questions(category: str, db: Session = Depends(get_db)):
    questions = db.query(Question).filter(
        Question.category == category
    ).all()
    random.shuffle(questions)
    return questions[:7]

@router.get("/all")
def get_all_questions(db: Session = Depends(get_db)):
    return db.query(Question).all()

@router.get("/{question_id}")
def get_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

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
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = question.correct_answer == answer
    question.total_attempts += 1

    if is_correct:
        question.correct_attempts += 1

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

@router.put("/{question_id}")
@router.put("/{question_id}")
def update_question(
    question_id: int,
    question_text: str = None,
    option_a: str = None,
    option_b: str = None,
    option_c: str = None,
    option_d: str = None,
    correct_answer: str = None,
    fun_fact: str = None,
    db: Session = Depends(get_db),
    x_api_key: str = Header(...)
):
    verify_admin(x_api_key)
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question_text: question.question = question_text
    if option_a: question.option_a = option_a
    if option_b: question.option_b = option_b
    if option_c: question.option_c = option_c
    if option_d: question.option_d = option_d
    if correct_answer: question.correct_answer = correct_answer
    if fun_fact: question.fun_fact = fun_fact

    db.commit()
    db.refresh(question)
    return {"message": "Question updated!", "question": question}

@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    x_api_key: str = Header(...)
):
    verify_admin(x_api_key)
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()
    return {"message": f"Question {question_id} deleted successfully!"}

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