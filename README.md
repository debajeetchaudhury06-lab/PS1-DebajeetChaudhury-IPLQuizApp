# 🏏 IPL Quiz App

A full stack IPL Cricket Quiz application built with FastAPI and React.

## 🌐 Live URL
Coming soon after deployment!

## 🛠️ Tech Stack
- **Frontend:** React.js
- **Backend:** FastAPI (Python)
- **Database:** SQLite (local) / PostgreSQL (production)
- **Deployment:** Railway

## ✨ Features
- 🏆 Two quiz categories — IPL History and Player Records
- ⏱️ 30 second timer per question
- 🔥 Streak system
- 💡 Fun facts after each answer
- 📊 Auto difficulty tagging (Easy/Medium/Hard)
- 🏅 Live leaderboard with tiebreaker
- 📈 Question analytics with charts
- 👤 Personal player stats

## 🚀 How to Run Locally

### Backend
```bash
cd backend
pip install fastapi uvicorn sqlalchemy python-dotenv
python seed.py
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 📚 What I Learned
- Building REST APIs with FastAPI
- React frontend development
- Connecting frontend to backend
- Database design with SQLAlchemy
- Cloud deployment with Railway
