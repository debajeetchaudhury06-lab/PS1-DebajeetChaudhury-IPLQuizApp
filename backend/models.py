from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    question = Column(String)
    option_a = Column(String)
    option_b = Column(String)
    option_c = Column(String)
    option_d = Column(String)
    correct_answer = Column(String)
    fun_fact = Column(String)
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    difficulty = Column(String, default="medium")

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    passkey_hash = Column(String, nullable=True)   # ← NEW
    total_quizzes = Column(Integer, default=0)
    best_score = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    avg_time = Column(Float, default=0.0)
    best_streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String)
    score = Column(Integer)
    total_questions = Column(Integer)
    avg_time = Column(Float)
    best_streak = Column(Integer)
    category = Column(String)
    created_at = Column(DateTime, default=func.now())