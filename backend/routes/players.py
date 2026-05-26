from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Player, Attempt

router = APIRouter(prefix="/players", tags=["Players"])

@router.post("/submit")
def submit_quiz(
    name: str,
    score: int,
    total_questions: int,
    avg_time: float,
    best_streak: int,
    category: str,
    db: Session = Depends(get_db)
):
    try:
        # Get or create player
        player = db.query(Player).filter(
            Player.name == name
        ).first()

        if not player:
            player = Player(
                name=name,
                total_quizzes=0,
                best_score=0,
                total_correct=0,
                total_questions=0,
                avg_time=0.0,
                best_streak=0
            )
            db.add(player)
            db.flush()

        # Update stats
        player.total_quizzes += 1
        player.total_correct += score
        player.total_questions += total_questions

        if score > player.best_score:
            player.best_score = score

        if best_streak > player.best_streak:
            player.best_streak = best_streak

        # Safe avg time calculation
        if player.total_quizzes <= 1:
            player.avg_time = float(avg_time)
        else:
            player.avg_time = float(
                (player.avg_time * (player.total_quizzes - 1) + avg_time)
                / player.total_quizzes
            )

        # Save attempt
        attempt = Attempt(
            player_name=name,
            score=score,
            total_questions=total_questions,
            avg_time=avg_time,
            best_streak=best_streak,
            category=category
        )
        db.add(attempt)
        db.commit()
        db.refresh(player)

        # Safe accuracy calculation
        if player.total_questions > 0:
            accuracy = round(
                (player.total_correct / player.total_questions) * 100, 1
            )
        else:
            accuracy = 0.0

        return {
            "message": "Quiz submitted!",
            "player": {
                "name": player.name,
                "best_score": player.best_score,
                "total_quizzes": player.total_quizzes,
                "avg_time": round(float(player.avg_time), 2),
                "best_streak": player.best_streak,
                "accuracy": accuracy
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}")
def get_player(name: str, db: Session = Depends(get_db)):
    try:
        player = db.query(Player).filter(
            Player.name == name
        ).first()

        if not player:
            return {"error": "Player not found"}

        if player.total_questions > 0:
            accuracy = round(
                (player.total_correct / player.total_questions) * 100, 1
            )
        else:
            accuracy = 0.0

        return {
            "name": player.name,
            "best_score": player.best_score,
            "total_quizzes": player.total_quizzes,
            "avg_time": round(float(player.avg_time), 2),
            "best_streak": player.best_streak,
            "accuracy": accuracy
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))