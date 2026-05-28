import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import './App.css';

const API = 'https://backend12.up.railway.app';

const questionThemes = [
  'theme-rr',
  'theme-mi',
  'theme-rcb',
  'theme-mi',
  'theme-srh',
  'theme-kkr',
  'theme-dhoni'
];

function App() {
  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [funFact, setFunFact] = useState('');
  const [timer, setTimer] = useState(30);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [times, setTimes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [leaderboardCategory, setLeaderboardCategory] = useState('IPL History');
  const [questionStats, setQuestionStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [waitingForApi, setWaitingForApi] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminTab, setAdminTab] = useState('questions');
  const [allQuestions, setAllQuestions] = useState([]);
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    question: '', option_a: '', option_b: '',
    option_c: '', option_d: '', correct_answer: '', category: 'IPL History'
  });
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [approveDialog, setApproveDialog] = useState(null);
  const [approveDifficulty, setApproveDifficulty] = useState('medium');

  const handleAnswer = useCallback(async (answer) => {
    if (selected !== null || waitingForApi) return;

    const timeTaken = 30 - timer;
    setTimes(prev => [...prev, timeTaken]);
    setSelected(answer);
    setWaitingForApi(true);
    setIsCorrect(null);

    try {
      const res = await axios.post(`${API}/questions/answer`, null, {
        params: {
          question_id: questions[currentQ].id,
          answer: answer,
          time_taken: timeTaken
        }
      });

      const correct = res.data.correct;
      setIsCorrect(correct);
      setWaitingForApi(false);

      if (correct) {
        setScore(prev => prev + 1);
        setStreak(prev => {
          const newStreak = prev + 1;
          setBestStreak(best => Math.max(best, newStreak));
          return newStreak;
        });
        document.body.className = questionThemes[currentQ] || 'theme-correct';
      } else {
        setStreak(0);
        document.body.className = 'theme-wrong';
      }

      setFunFact(res.data.fun_fact);
    } catch (err) {
      console.error(err);
      setWaitingForApi(false);
    }
  }, [selected, timer, questions, currentQ, waitingForApi]);

  useEffect(() => {
    if (screen !== 'quiz' || selected !== null) return;
    if (timer === 0) { handleAnswer('X'); return; }
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [screen, timer, selected, handleAnswer]);

  const startQuiz = async (cat) => {
    setCategory(cat);
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/questions/`, {
        params: { category: cat }
      });
      setQuestions(res.data);
      setScreen('quiz');
      setCurrentQ(0);
      setScore(0);
      setSelected(null);
      setIsCorrect(null);
      setFunFact('');
      setTimer(30);
      setStreak(0);
      setBestStreak(0);
      setTimes([]);
      setWaitingForApi(false);
      document.body.className = 'theme-neutral';
    } catch (err) {
      setError('Failed to load questions! Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setIsCorrect(null);
      setFunFact('');
      setTimer(30);
      setWaitingForApi(false);
      document.body.className = 'theme-neutral';
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const avgTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;

    try {
      const res = await axios.post(`${API}/players/submit`, null, {
        params: {
          name: playerName,
          score: score,
          total_questions: questions.length,
          avg_time: avgTime,
          best_streak: bestStreak,
          category: category
        }
      });
      setPlayerStats(res.data.player);
    } catch (err) {
      console.error(err);
    }

    try {
      const statsRes = await axios.get(`${API}/questions/stats`, {
        params: { category: category }
      });
      setQuestionStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }

    document.body.className = 'theme-results';
    setScreen('results');
  };

  const loadLeaderboard = async (cat = 'IPL History') => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/leaderboard/`, {
        params: { category: cat }
      });
      setLeaderboard(res.data);
      setLeaderboardCategory(cat);
    } catch (err) {
      setError('Failed to load leaderboard! Please try again.');
    } finally {
      setLoading(false);
    }
    document.body.className = 'theme-leaderboard';
    setScreen('leaderboard');
  };

  const loadAllQuestions = async () => {
    try {
      const res = await axios.get(`${API}/questions/all`);
      setAllQuestions(res.data);
      setPendingSuggestions(res.data.filter(q => q.difficulty === 'pending'));
    } catch (err) {
      console.error(err);
    }
    setAdminTab('questions');
    setScreen('admin');
  };

  const loadSuggestions = async () => {
    try {
      const res = await axios.get(`${API}/questions/all`);
      setPendingSuggestions(res.data.filter(q => q.difficulty === 'pending'));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteQuestion = async (id) => {
    if (!adminKey) {
      alert('Please enter admin API key first!');
      return;
    }
    try {
      await axios.delete(`${API}/questions/${id}`, {
        headers: { 'x-api-key': adminKey }
      });
      setAllQuestions(prev => prev.filter(q => q.id !== id));
      alert('Question deleted successfully!');
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Invalid API Key! Access denied.');
      } else {
        alert('Error deleting question!');
      }
    }
  };

  const updateQuestion = async (id) => {
    if (!adminKey) {
      alert('Please enter admin API key first!');
      return;
    }
    try {
      await axios.put(`${API}/questions/${id}`, null, {
        params: editForm,
        headers: { 'x-api-key': adminKey }
      });
      setAllQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, ...editForm } : q
      ));
      setEditingQuestion(null);
      setEditForm({});
      alert('Question updated successfully!');
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Invalid API Key! Access denied.');
      } else {
        alert('Error updating question!');
      }
    }
  };

  const approveSuggestion = async (id, difficulty) => {
    if (!adminKey) {
      alert('Please enter admin API key first!');
      return;
    }
    try {
      await axios.put(`${API}/questions/${id}`, null, {
        params: { difficulty: difficulty },
        headers: { 'x-api-key': adminKey }
      });
      setPendingSuggestions(prev => prev.filter(q => q.id !== id));
      setAllQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, difficulty: difficulty } : q
      ));
      setApproveDialog(null);
      alert(`Question approved as ${difficulty}! It is now live in the quiz.`);
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Invalid API Key! Access denied.');
      } else {
        alert('Error approving suggestion!');
      }
    }
  };

  const rejectSuggestion = async (id) => {
    if (!adminKey) {
      alert('Please enter admin API key first!');
      return;
    }
    if (!window.confirm('Permanently delete this suggestion?')) return;
    try {
      await axios.delete(`${API}/questions/${id}`, {
        headers: { 'x-api-key': adminKey }
      });
      setPendingSuggestions(prev => prev.filter(q => q.id !== id));
      setAllQuestions(prev => prev.filter(q => q.id !== id));
      alert('Suggestion rejected and deleted.');
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Invalid API Key! Access denied.');
      } else {
        alert('Error rejecting suggestion!');
      }
    }
  };

  const submitSuggestion = async () => {
    if (!suggestForm.question || !suggestForm.option_a ||
        !suggestForm.option_b || !suggestForm.option_c ||
        !suggestForm.option_d || !suggestForm.correct_answer) {
      alert('Please fill all fields!');
      return;
    }
    try {
      await axios.post(`${API}/questions/suggest`, null, {
        params: {
          ...suggestForm,
          suggested_by: playerName || 'Anonymous'
        }
      });
      setSuggestSuccess(true);
      setSuggestForm({
        question: '', option_a: '', option_b: '',
        option_c: '', option_d: '', correct_answer: '',
        category: 'IPL History'
      });
    } catch (err) {
      alert('Error submitting suggestion!');
    }
  };

  const getOptionClass = (opt) => {
    if (selected === null) return 'option-btn';
    if (isCorrect === null) return 'option-btn';
    const correct = questions[currentQ]?.correct_answer;
    if (opt === correct) return 'option-btn correct';
    if (opt === selected && opt !== correct) return 'option-btn wrong';
    return 'option-btn';
  };

  // LOADING SCREEN
  if (loading) return (
    <div className="app" style={{ textAlign: 'center', paddingTop: '200px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏏</div>
      <h2 style={{ color: '#f5a623', marginBottom: '10px' }}>Loading...</h2>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>Please wait a moment</p>
    </div>
  );

  // ERROR SCREEN
  if (error) return (
    <div className="app" style={{ textAlign: 'center', paddingTop: '200px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>❌</div>
      <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>Oops!</h2>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>{error}</p>
      <button className="btn btn-primary" onClick={() => { setError(null); setScreen('home'); }}>
        Go Back Home 🏠
      </button>
    </div>
  );

  // HOME SCREEN
  document.body.className = screen === 'home' ? 'theme-home' :
                             screen === 'analytics' ? 'theme-analytics' :
                             document.body.className;

  if (screen === 'home') return (
    <div className="app">
      <div className="header">
        <h1>🏏 IPL Quiz</h1>
        <p>Test your IPL knowledge and top the leaderboard!</p>
      </div>
      <div className="home-screen">
        <input
          className="name-input"
          placeholder="Enter your name to start..."
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
        />
        {playerName.trim() && (
          <>
            <h3 style={{ marginBottom: '15px' }}>Select a Category</h3>
            <div className="category-buttons">
              <button className="category-btn" onClick={() => startQuiz('IPL History')}>
                🏆 IPL History
              </button>
              <button className="category-btn" onClick={() => startQuiz('Player Records')}>
                🌟 Player Records
              </button>
            </div>
          </>
        )}
        <br />
        <button className="btn btn-secondary" onClick={() => loadLeaderboard('IPL History')}>
          🏆 View Leaderboard
        </button>
        <button className="btn btn-secondary" onClick={loadAllQuestions}>
          🔐 Admin Panel
        </button>
      </div>
    </div>
  );

  // QUIZ SCREEN
  if (screen === 'quiz') {
    const q = questions[currentQ];
    if (selected === null) document.body.className = 'theme-neutral';

    return (
      <div className="app">
        <div className="header">
          <h1>🏏 IPL Quiz</h1>
        </div>
        <div className="quiz-screen">
          <div className="quiz-header">
            <span className="progress">Q {currentQ + 1} of {questions.length}</span>
            <span className={`timer ${timer <= 10 ? 'warning' : ''}`}>⏱️ {timer}s</span>
            <span className="streak">
              {streak >= 3 ? `🔥 ${streak} Streak!` : `Streak: ${streak}`}
            </span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill"
              style={{ width: `${(currentQ / questions.length) * 100}%` }} />
          </div>

          <div className={`question-card ${
            selected === null ? 'new-question' :
            isCorrect === null ? '' :
            isCorrect ? 'answered-correct' : 'answered-wrong'
          }`}>
            <span className={`difficulty-badge ${q?.difficulty}`}>
              {q?.difficulty?.toUpperCase()}
            </span>
            <p className="question-text">{q?.question}</p>
            <div className="options">
              {['A', 'B', 'C', 'D'].map(opt => (
                <button
                  key={opt}
                  className={getOptionClass(opt)}
                  onClick={() => handleAnswer(opt)}
                  disabled={selected !== null}
                >
                  <strong>{opt})</strong>{' '}{q?.[`option_${opt.toLowerCase()}`]}
                </button>
              ))}
            </div>
          </div>

          {waitingForApi && (
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <p style={{ color: '#f5a623' }}>Checking answer...</p>
            </div>
          )}

          {selected && isCorrect !== null && (
            <div className={`result-banner ${isCorrect ? 'correct' : 'wrong'}`}>
              {isCorrect ? '🎉 Correct! Well done!'
                : `❌ Wrong! The answer was ${questions[currentQ]?.correct_answer}`}
            </div>
          )}

          {funFact && (
            <div className="fun-fact">
              <span>💡 Fun Fact: </span>{funFact}
            </div>
          )}

          {selected && isCorrect !== null && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={nextQuestion}>
                {currentQ + 1 < questions.length ? 'Next Question →' : 'See Results 🏆'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (screen === 'results') {
    const avgTime = times.length > 0
      ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)
      : 0;

    return (
      <div className="app">
        <div className="header">
          <h1>🏏 IPL Quiz</h1>
        </div>
        <div className="results-screen">
          <h2>Quiz Complete, {playerName}! 🎉</h2>
          <div className="score-circle">
            <h2>{score}/{questions.length}</h2>
            <p>Score</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>⏱️ {avgTime}s</h3>
              <p>Avg Time Per Question</p>
            </div>
            <div className="stat-card">
              <h3>🔥 {bestStreak}</h3>
              <p>Best Streak</p>
            </div>
            <div className="stat-card">
              <h3>🎯 {playerStats?.accuracy}%</h3>
              <p>Overall Accuracy</p>
            </div>
          </div>
          {playerStats && (
            <div className="question-card" style={{ textAlign: 'left' }}>
              <h3 style={{ color: '#f5a623', marginBottom: '15px' }}>📊 Your Stats</h3>
              <p>🏆 Best Score Ever: {playerStats.best_score}/{questions.length}</p>
              <p>🎮 Total Quizzes Played: {playerStats.total_quizzes}</p>
              <p>⚡ Best Streak Ever: {playerStats.best_streak}</p>
              <p>⏱️ Avg Time Per Question: {playerStats.avg_time}s</p>
            </div>
          )}
          <div>
            <button className="btn btn-primary" onClick={() => startQuiz(category)}>
              Play Again 🔄
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('home')}>
              Home 🏠
            </button>
            <button className="btn btn-secondary" onClick={() => loadLeaderboard('IPL History')}>
              Leaderboard 🏆
            </button>
            <button className="btn btn-secondary" onClick={() => setScreen('analytics')}>
              📊 View Analytics
            </button>
            <button className="btn btn-secondary"
              onClick={() => { setShowSuggest(true); setSuggestSuccess(false); }}>
              💡 Suggest a Question
            </button>
          </div>
        </div>

        {/* SUGGEST MODAL */}
        {showSuggest && (
          <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: '#16213e', borderRadius: '20px',
              padding: '30px', width: '90%', maxWidth: '500px',
              maxHeight: '80vh', overflowY: 'auto'
            }}>
              <h3 style={{ color: '#f5a623', marginBottom: '20px', textAlign: 'center' }}>
                💡 Suggest a Question
              </h3>

              {suggestSuccess ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>🎉</div>
                  <h3 style={{ color: '#2ecc71', margin: '15px 0' }}>
                    Suggestion Submitted!
                  </h3>
                  <p style={{ color: '#aaa', marginBottom: '20px' }}>
                    Admin will review your question. Thanks!
                  </p>
                  <button className="btn btn-primary" onClick={() => setShowSuggest(false)}>
                    Close
                  </button>
                </div>
              ) : (
                <div>
                  <select
                    value={suggestForm.category}
                    onChange={e => setSuggestForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px',
                      background: '#0f3460', color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      marginBottom: '10px', fontSize: '1rem'
                    }}>
                    <option value="IPL History">🏆 IPL History</option>
                    <option value="Player Records">🌟 Player Records</option>
                  </select>

                  <input className="name-input"
                    placeholder="Enter your question..."
                    value={suggestForm.question}
                    onChange={e => setSuggestForm(prev => ({ ...prev, question: e.target.value }))}
                    style={{ textAlign: 'left', width: '100%', marginBottom: '10px' }} />

                  {['a', 'b', 'c', 'd'].map(opt => (
                    <input key={opt} className="name-input"
                      placeholder={`Option ${opt.toUpperCase()}`}
                      value={suggestForm[`option_${opt}`]}
                      onChange={e => setSuggestForm(prev => ({
                        ...prev, [`option_${opt}`]: e.target.value
                      }))}
                      style={{ textAlign: 'left', width: '100%', marginBottom: '10px' }} />
                  ))}

                  <select
                    value={suggestForm.correct_answer}
                    onChange={e => setSuggestForm(prev => ({
                      ...prev, correct_answer: e.target.value
                    }))}
                    style={{
                      width: '100%', padding: '12px', borderRadius: '10px',
                      background: '#0f3460', color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      marginBottom: '20px', fontSize: '1rem'
                    }}>
                    <option value="">Select Correct Answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>

                  <div style={{ textAlign: 'center' }}>
                    <button className="btn btn-primary" onClick={submitSuggestion}>
                      Submit Suggestion ✅
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowSuggest(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ANALYTICS SCREEN
  if (screen === 'analytics') {
    document.body.className = 'theme-analytics';
    const pieData = [
      { name: 'Correct', value: questionStats.reduce((a, q) => a + q.correct_attempts, 0) },
      { name: 'Wrong', value: questionStats.reduce((a, q) => a + (q.total_attempts - q.correct_attempts), 0) }
    ];
    const COLORS = ['#2ecc71', '#e74c3c'];

    return (
      <div className="app">
        <div className="header">
          <h1>🏏 IPL Quiz</h1>
        </div>
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ textAlign: 'center', color: '#f5a623' }}>📊 Question Analytics</h2>
          <h4 style={{ textAlign: 'center', color: '#aaa', marginBottom: '30px' }}>{category}</h4>

          <div className="question-card" style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#f5a623', marginBottom: '20px', textAlign: 'center' }}>
              Overall Correct vs Wrong
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="question-card" style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#f5a623', marginBottom: '20px', textAlign: 'center' }}>
              Accuracy Per Question
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={questionStats.map((q, i) => ({
                  name: `Q${i + 1}`, accuracy: q.accuracy, difficulty: q.difficulty
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']}
                  contentStyle={{ background: '#16213e', border: 'none' }} />
                <Bar dataKey="accuracy" radius={[5, 5, 0, 0]}>
                  {questionStats.map((q, index) => (
                    <Cell key={index}
                      fill={q.difficulty === 'easy' ? '#2ecc71' :
                            q.difficulty === 'medium' ? '#f39c12' : '#e74c3c'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <span style={{ color: '#2ecc71', marginRight: '15px' }}>🟢 Easy</span>
              <span style={{ color: '#f39c12', marginRight: '15px' }}>🟡 Medium</span>
              <span style={{ color: '#e74c3c' }}>🔴 Hard</span>
            </div>
          </div>

          <div className="question-card">
            <h3 style={{ color: '#f5a623', marginBottom: '20px' }}>Question Breakdown</h3>
            {questionStats.map((q, i) => (
              <div key={q.id} style={{
                marginBottom: '15px', padding: '15px',
                background: '#0f3460', borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Q{i + 1}</span>
                  <span className={`difficulty-badge ${q.difficulty}`}>
                    {q.difficulty.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px' }}>
                  {q.question}
                </p>
                <div style={{ background: '#1a1a2e', borderRadius: '5px', overflow: 'hidden', height: '20px' }}>
                  <div style={{
                    width: `${q.accuracy}%`, height: '100%',
                    background: q.difficulty === 'easy' ? '#2ecc71' :
                                q.difficulty === 'medium' ? '#f39c12' : '#e74c3c',
                    transition: 'width 1s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.85rem', color: '#aaa' }}>
                  <span>✅ {q.correct_attempts} correct</span>
                  <span>{q.accuracy}% accuracy</span>
                  <span>👥 {q.total_attempts} attempts</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setScreen('results')}>
              ← Back to Results
            </button>
            <button className="btn btn-primary" onClick={() => setScreen('home')}>
              Home 🏠
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN SCREEN
  if (screen === 'admin') {
    document.body.className = 'theme-home';
    return (
      <div className="app">
        <div className="header">
          <h1>🏏 IPL Quiz</h1>
        </div>
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ textAlign: 'center', color: '#f5a623' }}>🔐 Admin Panel</h2>

          {/* API KEY INPUT */}
          <div className="question-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#f5a623', marginBottom: '15px' }}>
              Admin API Key (required for all actions)
            </h3>
            <input
              className="name-input"
              type="password"
              placeholder="Enter Admin API Key..."
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              style={{ textAlign: 'left', width: '100%' }}
            />
            {adminKey && (
              <p style={{ color: '#2ecc71', fontSize: '0.85rem', marginTop: '8px' }}>
                ✅ API key entered
              </p>
            )}
          </div>

          {/* TABS */}
          <div className="nav" style={{ marginBottom: '20px' }}>
            <button
              className={`nav-btn ${adminTab === 'questions' ? 'active' : ''}`}
              onClick={() => setAdminTab('questions')}>
              📋 All Questions ({allQuestions.filter(q => q.difficulty !== 'pending').length})
            </button>
            <button
              className={`nav-btn ${adminTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => { setAdminTab('suggestions'); loadSuggestions(); }}>
              💡 Suggestions
              {pendingSuggestions.length > 0 && (
                <span style={{
                  background: '#e74c3c', color: 'white',
                  borderRadius: '50%', fontSize: '0.75rem',
                  padding: '2px 7px', marginLeft: '8px'
                }}>
                  {pendingSuggestions.length}
                </span>
              )}
            </button>
          </div>

          {/* SUGGESTIONS TAB */}
          {adminTab === 'suggestions' && (
            <div className="question-card">
              <h3 style={{ color: '#f5a623', marginBottom: '5px' }}>
                💡 Pending Suggestions
              </h3>
              <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px' }}>
                Approve or reject user-submitted questions. API key required.
              </p>

              {pendingSuggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '3rem' }}>🎉</div>
                  <p style={{ color: '#aaa', marginTop: '10px' }}>No pending suggestions!</p>
                </div>
              ) : (
                pendingSuggestions.map((q) => (
                  <div key={q.id} style={{
                    marginBottom: '20px', padding: '15px',
                    background: '#1a0a00', borderRadius: '10px',
                    border: '1px solid #f39c12'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {q.category}
                      </span>
                      <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                        {q.fun_fact}
                      </span>
                    </div>

                    <p style={{ color: 'white', fontWeight: 'bold', marginBottom: '12px' }}>
                      {q.question}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <div key={opt} style={{
                          padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem',
                          background: q.correct_answer === opt.toUpperCase()
                            ? 'rgba(46,204,113,0.2)' : '#0f3460',
                          border: q.correct_answer === opt.toUpperCase()
                            ? '1px solid #2ecc71' : '1px solid transparent',
                          color: q.correct_answer === opt.toUpperCase() ? '#2ecc71' : '#ccc'
                        }}>
                          {opt.toUpperCase()}. {q[`option_${opt}`]}
                          {q.correct_answer === opt.toUpperCase() && ' ✅'}
                        </div>
                      ))}
                    </div>

                    {/* APPROVE DIALOG */}
                    {approveDialog === q.id ? (
                      <div style={{
                        background: '#0f3460', borderRadius: '10px',
                        padding: '15px', marginTop: '10px'
                      }}>
                        <p style={{ color: '#f5a623', marginBottom: '10px', fontWeight: 'bold' }}>
                          Set difficulty before approving:
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          {['easy', 'medium', 'hard'].map(d => (
                            <button key={d} onClick={() => setApproveDifficulty(d)}
                              style={{
                                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                border: approveDifficulty === d ? '2px solid #f5a623' : '1px solid #aaa',
                                background: approveDifficulty === d ? 'rgba(245,166,35,0.2)' : 'transparent',
                                color: approveDifficulty === d ? '#f5a623' : '#aaa',
                                fontWeight: approveDifficulty === d ? 'bold' : 'normal'
                              }}>
                              {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.charAt(0).toUpperCase() + d.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div>
                          <button className="btn btn-primary"
                            onClick={() => approveSuggestion(q.id, approveDifficulty)}>
                            ✅ Confirm Approve
                          </button>
                          <button className="btn btn-secondary"
                            onClick={() => setApproveDialog(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="btn btn-primary"
                          onClick={() => { setApproveDialog(q.id); setApproveDifficulty('medium'); }}>
                          ✅ Approve
                        </button>
                        <button className="btn"
                          style={{ background: '#e74c3c', color: 'white' }}
                          onClick={() => rejectSuggestion(q.id)}>
                          🗑️ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ALL QUESTIONS TAB */}
          {adminTab === 'questions' && (
            <div className="question-card">
              <h3 style={{ color: '#f5a623', marginBottom: '20px' }}>
                All Questions ({allQuestions.filter(q => q.difficulty !== 'pending').length})
              </h3>
              {allQuestions.filter(q => q.difficulty !== 'pending').map((q, i) => (
                <div key={q.id} style={{
                  marginBottom: '20px', padding: '15px',
                  background: '#0f3460', borderRadius: '10px'
                }}>
                  {editingQuestion === q.id ? (
                    <div>
                      <p style={{ color: '#f5a623', marginBottom: '10px' }}>Editing Q{i + 1}</p>
                      <input className="name-input" defaultValue={q.question}
                        placeholder="Question text"
                        onChange={e => setEditForm(prev => ({ ...prev, question_text: e.target.value }))}
                        style={{ textAlign: 'left', width: '100%', marginBottom: '8px' }} />
                      {['a', 'b', 'c', 'd'].map(opt => (
                        <input key={opt} className="name-input"
                          defaultValue={q[`option_${opt}`]}
                          placeholder={`Option ${opt.toUpperCase()}`}
                          onChange={e => setEditForm(prev => ({ ...prev, [`option_${opt}`]: e.target.value }))}
                          style={{ textAlign: 'left', width: '100%', marginBottom: '8px' }} />
                      ))}
                      <input className="name-input" defaultValue={q.correct_answer}
                        placeholder="Correct Answer (A/B/C/D)"
                        onChange={e => setEditForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                        style={{ textAlign: 'left', width: '100%', marginBottom: '8px' }} />
                      <input className="name-input" defaultValue={q.fun_fact}
                        placeholder="Fun fact"
                        onChange={e => setEditForm(prev => ({ ...prev, fun_fact: e.target.value }))}
                        style={{ textAlign: 'left', width: '100%', marginBottom: '8px' }} />
                      <div>
                        <button className="btn btn-primary" onClick={() => updateQuestion(q.id)}>
                          ✅ Save Changes
                        </button>
                        <button className="btn btn-secondary"
                          onClick={() => { setEditingQuestion(null); setEditForm({}); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#f5a623' }}>
                          Q{i + 1} — {q.category}
                        </span>
                        <span className={`difficulty-badge ${q.difficulty}`}>
                          {q.difficulty?.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ color: 'white', marginBottom: '10px' }}>{q.question}</p>
                      <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
                        ✅ Answer: {q.correct_answer} &nbsp;|&nbsp; 👥 {q.total_attempts} attempts
                      </p>
                      {q.fun_fact && (
                        <p style={{ color: '#f5a623', fontSize: '0.85rem', marginTop: '5px' }}>
                          💡 {q.fun_fact}
                        </p>
                      )}
                      <div style={{ marginTop: '10px' }}>
                        <button className="btn btn-secondary"
                          onClick={() => { setEditingQuestion(q.id); setEditForm({}); }}>
                          ✏️ Edit
                        </button>
                        <button className="btn"
                          style={{ background: '#e74c3c', color: 'white', margin: '8px' }}
                          onClick={() => {
                            if (window.confirm(`Delete "${q.question}"?`)) {
                              deleteQuestion(q.id);
                            }
                          }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => setScreen('home')}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LEADERBOARD SCREEN
  if (screen === 'leaderboard') return (
    <div className="app">
      <div className="header">
        <h1>🏏 IPL Quiz</h1>
      </div>
      <div className="leaderboard-screen">
        <h2 style={{ textAlign: 'center', color: '#f5a623' }}>🏆 Global Leaderboard</h2>
        <div className="nav" style={{ marginTop: '20px' }}>
          <button
            className={`nav-btn ${leaderboardCategory === 'IPL History' ? 'active' : ''}`}
            onClick={() => loadLeaderboard('IPL History')}>
            🏆 IPL History
          </button>
          <button
            className={`nav-btn ${leaderboardCategory === 'Player Records' ? 'active' : ''}`}
            onClick={() => loadLeaderboard('Player Records')}>
            🌟 Player Records
          </button>
        </div>

        <h3 style={{ textAlign: 'center', color: '#aaa', marginBottom: '15px', marginTop: '10px' }}>
          {leaderboardCategory}
        </h3>

        {leaderboard.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', marginTop: '30px' }}>
            No scores yet for this category — be the first! 🏏
          </p>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Best Score</th>
                <th>Avg Time</th>
                <th>Best Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player) => (
                <tr key={player.rank}>
                  <td className={`rank-${player.rank}`}>
                    {player.rank === 1 ? '🥇' :
                     player.rank === 2 ? '🥈' :
                     player.rank === 3 ? '🥉' : `#${player.rank}`}
                  </td>
                  <td>{player.name}</td>
                  <td>{player.best_score}/7</td>
                  <td>{player.avg_time}s</td>
                  <td>🔥 {player.best_streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={() => setScreen('results')}>
            ← Back to Results
          </button>
          <button className="btn btn-primary" onClick={() => setScreen('home')}>
            Play Quiz 🏏
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;