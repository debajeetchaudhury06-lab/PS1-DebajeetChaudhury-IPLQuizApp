from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Player, Attempt
import bcrypt

router = APIRouter(prefix="/players", tags=["Players"])


# ─── helpers ────────────────────────────────────────────────────────────────

def hash_passkey(passkey: str) -> str:
    return bcrypt.hashpw(passkey.encode(), bcrypt.gensalt()).decode()

def verify_passkey(passkey: str, hashed: str) -> bool:
    return bcrypt.checkpw(passkey.encode(), hashed.encode())


# ─── AUTH ENDPOINTS ──────────────────────────────────────────────────────────

@router.post("/register")
def register_player(name: str, passkey: str, db: Session = Depends(get_db)):
    """
    Register a brand-new player with a chosen passkey.
    Returns 400 if the name is already taken.
    """
    name = name.strip()
    if not name or not passkey:
        raise HTTPException(status_code=400, detail="Name and passkey are required.")

    existing = db.query(Player).filter(Player.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Name already taken. Please login or choose a different name.")

    player = Player(
        name=name,
        passkey_hash=hash_passkey(passkey),
        total_quizzes=0,
        best_score=0,
        total_correct=0,
        total_questions=0,
        avg_time=0.0,
        best_streak=0
    )
    db.add(player)
    db.commit()
    db.refresh(player)

    return {
        "message": "Registered successfully!",
        "player": {
            "name": player.name,
            "best_score": player.best_score,
            "total_quizzes": player.total_quizzes,
            "avg_time": player.avg_time,
            "best_streak": player.best_streak,
            "accuracy": 0.0
        }
    }


@router.post("/login")
def login_player(name: str, passkey: str, db: Session = Depends(get_db)):
    """
    Login an existing player.
    Returns 404 if player not found, 401 if passkey is wrong.
    """
    name = name.strip()
    player = db.query(Player).filter(Player.name == name).first()

    if not player:
        raise HTTPException(status_code=404, detail="Player not found. Please register first.")

    # Support legacy players who have no passkey set yet
    if player.passkey_hash is None:
        player.passkey_hash = hash_passkey(passkey)
        db.commit()
    elif not verify_passkey(passkey, player.passkey_hash):
        raise HTTPException(status_code=401, detail="Wrong passkey. Try again.")

    if player.total_questions > 0:
        accuracy = round((player.total_correct / player.total_questions) * 100, 1)
    else:
        accuracy = 0.0

    return {
        "message": "Login successful!",
        "player": {
            "name": player.name,
            "best_score": player.best_score,
            "total_quizzes": player.total_quizzes,
            "avg_time": round(float(player.avg_time), 2),
            "best_streak": player.best_streak,
            "accuracy": accuracy
        }
    }


# ─── EXISTING ENDPOINTS (unchanged) ─────────────────────────────────────────

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
        player = db.query(Player).filter(Player.name == name.strip()).first()

        if not player:
            player = Player(
                name=name.strip(),
                total_quizzes=0,
                best_score=0,
                total_correct=0,
                total_questions=0,
                avg_time=0.0,
                best_streak=0
            )
            db.add(player)
            db.flush()

        player.total_quizzes += 1
        player.total_correct += score
        player.total_questions += total_questions

        if score > player.best_score:
            player.best_score = score
        if best_streak > player.best_streak:
            player.best_streak = best_streak

        if player.total_quizzes <= 1:
            player.avg_time = float(avg_time)
        else:
            player.avg_time = float(
                (player.avg_time * (player.total_quizzes - 1) + avg_time)
                / player.total_quizzes
            )

        attempt = Attempt(
            player_name=name.strip(),
            score=score,
            total_questions=total_questions,
            avg_time=avg_time,
            best_streak=best_streak,
            category=category
        )
        db.add(attempt)
        db.commit()
        db.refresh(player)

        accuracy = round((player.total_correct / player.total_questions) * 100, 1) \
                   if player.total_questions > 0 else 0.0

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
        player = db.query(Player).filter(Player.name == name.strip()).first()
        if not player:
            return {"error": "Player not found"}

        accuracy = round((player.total_correct / player.total_questions) * 100, 1) \
                   if player.total_questions > 0 else 0.0

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