# 🏏 IPL Quiz App

A full stack IPL Cricket Quiz application built with FastAPI and React, featuring live leaderboards, dynamic difficulty tagging, question analytics, player authentication, and an admin panel.

## 🌐 Live URLs
- **Frontend:** https://frontend1-production-254d.up.railway.app
- **Backend API Docs:** https://backend12.up.railway.app/docs

## 🛠️ Tech Stack
- **Frontend:** React.js
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (production) / SQLite (local)
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
- 👤 Player authentication system
- 💡 Question suggestion system for players
- 👑 Admin panel with secret key
- ✅ Admin can approve, reject, edit and delete questions
- ⚡ Loading and error states handled
- 🎨 Dynamic background themes per question

## 🏗️ Architecture

Frontend (React) ←→ REST API ←→ Backend (FastAPI) ←→ PostgreSQL

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
| POST | /questions/seed | Seed database with questions |
| POST | /questions/suggest | Suggest a new question |
| GET | /questions/suggestions | Get all suggestions (admin) |
| POST | /players/register | Register a new player |
| POST | /players/login | Login a player |
| POST | /players/submit | Submit quiz results |
| GET | /players/{name} | Get player stats |
| GET | /leaderboard/ | Get leaderboard by category |
| POST | /admin/approve | Approve a suggestion |
| DELETE | /admin/delete | Delete a question |

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
- PostgreSQL in production
- Player authentication system
- Admin panel with role based access
- Decoupled architecture (not monolithic!)
- Cloud deployment with Railway
- API testing with Postman
- Git version control

## 🔮 Future Improvements
- Google OAuth login
- Daily challenge mode
- Share your score on social media
- More quiz categories
- Mobile app version

## ⚠️ Known Limitations
- Basic authentication (can be upgraded to JWT tokens)
- Admin key is currently hardcoded (can be moved to environment variables)