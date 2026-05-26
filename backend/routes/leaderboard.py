from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Attempt

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/")
def get_leaderboard(category: str, db: Session = Depends(get_db)):
    # Get all attempts for this category
    attempts = db.query(Attempt).filter(
        Attempt.category == category
    ).all()

    # Get best attempt per player
    player_best = {}
    for attempt in attempts:
        name = attempt.player_name
        if name not in player_best:
            player_best[name] = attempt
        else:
            # Keep highest score, then fastest time
            current = player_best[name]
            if attempt.score > current.score:
                player_best[name] = attempt
            elif attempt.score == current.score:
                if attempt.avg_time < current.avg_time:
                    player_best[name] = attempt

    # Sort by score then avg time
    sorted_players = sorted(
        player_best.values(),
        key=lambda a: (-a.score, a.avg_time)
    )

    leaderboard = []
    for i, attempt in enumerate(sorted_players[:10]):
        leaderboard.append({
            "rank": i + 1,
            "name": attempt.player_name,
            "best_score": attempt.score,
            "avg_time": round(attempt.avg_time, 2),
            "best_streak": attempt.best_streak,
            "category": attempt.category
        })

    return leaderboard