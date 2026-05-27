# 🏏 IPL Quiz App

A full stack IPL Cricket Quiz application built with FastAPI and React, featuring a live leaderboard, dynamic difficulty tagging, and question analytics.

## 🌐 Live URL
Coming soon after deployment!

## 🛠️ Tech Stack
- **Frontend:** React.js
- **Backend:** FastAPI (Python)
- **Database:** SQLite (local) / PostgreSQL (production)
- **Deployment:** Railway
- **API Testing:** Postman

## ✨ Features
- 🏆 Two quiz categories — IPL History and Player Records
- ⏱️ 30 second countdown timer per question
- 🔥 Live streak system during quiz
- 💡 Fun facts after each answer
- 📊 Auto difficulty tagging (Easy/Medium/Hard) based on real user data
- 🏅 Separate live leaderboards per category
- 🥇 Tiebreaker by fastest average time
- 📈 Question analytics with pie and bar charts
- 👤 Personal player stats (accuracy, avg time, best streak)
- 🎨 Dynamic background themes per question
- ⚡ Loading and error states handled

## 🏗️ Architecture
Frontend (React) ←→ REST API ←→ Backend (FastAPI) ←→ Database (PostgreSQL)

Decoupled architecture — frontend and backend run as separate services connected via REST API.

## 🚀 How to Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload
```
Backend runs at: http://localhost:8000

API Docs at: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs at: http://localhost:3000

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /questions/ | Get 7 random questions by category |
| POST | /questions/answer | Submit an answer |
| GET | /questions/stats | Get question analytics |
| POST | /players/submit | Submit quiz results |
| GET | /players/{name} | Get player stats |
| GET | /leaderboard/ | Get leaderboard by category |

## 📁 Project Structure

```
ipl-quiz-app/
├── backend/
│   ├── main.py            → FastAPI app entry point
│   ├── database.py        → Database connection
│   ├── models.py          → Database tables
│   ├── seed.py            → Seed questions
│   └── routes/
│       ├── questions.py   → Questions API
│       ├── players.py     → Players API
│       └── leaderboard.py → Leaderboard API
├── frontend/
│   └── src/
│       ├── App.js         → Main React app
│       └── App.css        → Styling
└── README.md
```
## 📚 What I Learned
- Building REST APIs with FastAPI
- React frontend development
- Connecting frontend to backend with Axios
- Database design with SQLAlchemy
- Decoupled architecture (not monolithic!)
- Cloud deployment with Railway
- API testing with Postman
- Git version control

## 🔮 Future Improvements
- User authentication system
- Player profiles with passwords
- Daily challenge mode
- Share your score feature
- More quiz categories

## ⚠️ Known Limitations
- Players are identified by name only
- Authentication can be added in future versions