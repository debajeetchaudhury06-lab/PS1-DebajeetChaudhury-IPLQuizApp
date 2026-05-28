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

@router.post("/seed")
def seed_questions(db: Session = Depends(get_db)):
    # Check if already seeded
    existing = db.query(Question).first()
    if existing:
        return {"message": "Database already seeded!"}

    questions = [
        Question(category="IPL History", question="Which team won the very first IPL title in 2008?", option_a="Mumbai Indians", option_b="Chennai Super Kings", option_c="Rajasthan Royals", option_d="Kolkata Knight Riders", correct_answer="C", fun_fact="Rajasthan Royals were the least expensive team at auction yet won the whole thing — Shane Warne's leadership is widely credited as the reason!"),
        Question(category="IPL History", question="In which country was the 2009 IPL season held entirely outside India?", option_a="England", option_b="UAE", option_c="Sri Lanka", option_d="South Africa", correct_answer="D", fun_fact="The entire tournament was shifted to South Africa in just 3 weeks due to Indian general elections — one of the fastest logistical moves in cricket history."),
        Question(category="IPL History", question="Which two franchises were banned from IPL for two years following the spot-fixing scandal?", option_a="RCB and MI", option_b="CSK and RR", option_c="KKR and KXIP", option_d="SRH and DC", correct_answer="B", fun_fact="During CSK's ban, MS Dhoni was assigned to Rising Pune Supergiant and had a public fallout with coach Anil Kumble over captaincy."),
        Question(category="IPL History", question="Which team has won the most IPL titles overall?", option_a="Chennai Super Kings", option_b="Kolkata Knight Riders", option_c="Rajasthan Royals", option_d="Mumbai Indians", correct_answer="D", fun_fact="Mumbai Indians have won all 5 of their titles in odd years — 2013, 2015, 2017, 2019, and 2020 — leading fans to joke about the MI odd year curse."),
        Question(category="IPL History", question="What is the highest team total ever scored in an IPL match as of 2024?", option_a="263/5", option_b="277/3", option_c="287/3", option_d="269/8", correct_answer="C", fun_fact="SRH scored 287/3 against RCB in IPL 2024, and then incredibly conceded 262 in the same match — both teams combined for over 500 runs, an IPL first."),
        Question(category="IPL History", question="Which bowler took the first-ever hat-trick in IPL history?", option_a="Lasith Malinga", option_b="Amit Mishra", option_c="Andrew Flintoff", option_d="Lakshmipathy Balaji", correct_answer="D", fun_fact="Balaji's hat-trick came in the very first IPL season in 2008, dismissing three different types of batsmen — making it one of the cleanest hat-tricks in history."),
        Question(category="IPL History", question="In which IPL season was the Decision Review System used for the first time?", option_a="2016", option_b="2017", option_c="2018", option_d="2019", correct_answer="D", fun_fact="The BCCI was the last major cricket board to adopt DRS, and its introduction in IPL 2019 was a landmark moment for the tournament's credibility."),
        Question(category="Player Records", question="Who is the all-time leading run-scorer in IPL history?", option_a="Rohit Sharma", option_b="David Warner", option_c="Virat Kohli", option_d="Shikhar Dhawan", correct_answer="C", fun_fact="Virat Kohli scored 973 runs in IPL 2016 alone — the most by any player in a single season — including 4 centuries, a record that still stands."),
        Question(category="Player Records", question="Who holds the record for the most wickets in IPL history?", option_a="Lasith Malinga", option_b="Yuzvendra Chahal", option_c="Jasprit Bumrah", option_d="Dwayne Bravo", correct_answer="D", fun_fact="Bravo is the only player to win the Purple Cap three times and celebrated almost every wicket with a little dance — giving birth to the Champion celebration."),
        Question(category="Player Records", question="Which player has hit the most sixes in IPL history?", option_a="AB de Villiers", option_b="Chris Gayle", option_c="MS Dhoni", option_d="Rohit Sharma", correct_answer="B", fun_fact="Chris Gayle once hit 17 sixes in a single innings of 175* — more sixes in one match than most players hit in an entire season."),
        Question(category="Player Records", question="Who scored the first-ever century in IPL history?", option_a="Chris Gayle", option_b="Adam Gilchrist", option_c="Virender Sehwag", option_d="Brendon McCullum", correct_answer="D", fun_fact="McCullum's 158* came in the very first IPL match ever played, against RCB in Bangalore in 2008 — setting an absurd benchmark on day one."),
        Question(category="Player Records", question="Which bowler holds the record for the best bowling figures in a single IPL innings?", option_a="Sohail Tanvir (6/14)", option_b="Lasith Malinga (5/13)", option_c="Alzarri Joseph (6/12)", option_d="Anil Kumble (5/5)", correct_answer="C", fun_fact="Alzarri Joseph took 6/12 on his IPL debut for Mumbai Indians in 2019 — his very first game and he immediately broke a record that stood for over a decade."),
        Question(category="Player Records", question="Who has captained the most IPL matches in history?", option_a="Rohit Sharma", option_b="MS Dhoni", option_c="Virat Kohli", option_d="David Warner", correct_answer="B", fun_fact="Dhoni has captained CSK to more final appearances than any other captain — CSK have been to the final in more than half of all IPL seasons they have played."),
        Question(category="Player Records", question="Which player won the Orange Cap in the very first 2008 IPL season?", option_a="Matthew Hayden", option_b="Adam Gilchrist", option_c="Sachin Tendulkar", option_d="Shaun Marsh", correct_answer="D", fun_fact="Shaun Marsh was a relatively unknown 24-year-old at the time and his 616-run season catapulted him into international cricket — he made his Australia Test debut shortly after."),
        Question(category="Player Records", question="Chris Gayle's record IPL score of 175* came off how many balls?", option_a="64 balls", option_b="72 balls", option_c="58 balls", option_d="66 balls", correct_answer="D", fun_fact="Gayle reached his century off just 30 balls — the fastest century in IPL history — and was seen smiling and chatting with the wicketkeeper mid-innings."),
    ]

    db.add_all(questions)
    db.commit()
    return {"message": f"✅ {len(questions)} questions seeded successfully!"}