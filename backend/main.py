from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import questions, players, leaderboard

app = FastAPI(title="IPL Quiz App")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://frontend1-production-254d.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(questions.router)
app.include_router(players.router)
app.include_router(leaderboard.router)

@app.get("/")
def home():
    return {"message": "IPL Quiz API is running!"}