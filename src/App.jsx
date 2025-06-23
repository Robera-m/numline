import { useState, useEffect } from 'react';
import './App.css';

const CHARACTERS = [
  { emoji: '🐰', label: 'Bunny' },
  { emoji: '🐱', label: 'Cat' },
  { emoji: '🐶', label: 'Dog' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐻', label: 'Bear' },
];

function App() {
  const [showMenu, setShowMenu] = useState(true);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showTimerSelect, setShowTimerSelect] = useState(false);
  const [mode, setMode] = useState('normal'); // 'normal' or 'game'
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentTimerDuration, setCurrentTimerDuration] = useState(0);
  const [personalBest, setPersonalBest] = useState(() => {
    const saved = localStorage.getItem('numlinePersonalBest');
    return saved ? JSON.parse(saved) : { '15': 0, '30': 0 };
  });
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0].emoji);
  const [position, setPosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState(() => {
    const start = Math.floor(Math.random() * 11) - 5;
    const steps = Math.floor(Math.random() * 7) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';
    return { start, steps, operation };
  });

  // Only whole number values
  const wholeValues = Array.from({ length: 21 }, (_, i) => i - 10);
  const range = wholeValues;

  // Problem generator (whole numbers only)
  const generateNewProblem = () => {
    const start = Math.floor(Math.random() * 11) - 5;
    const steps = Math.floor(Math.random() * 7) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';
    setProblem({ start, steps, operation });
    setPosition(start);
    setCurrentStep(0);
    setUserAnswer('');
    setFeedback(null);
    setShowExplanation(false);
    // Auto-focus the input after a short delay
    setTimeout(() => {
      const input = document.querySelector('input[type="number"]');
      if (input) input.focus();
    }, 100);
  };

  const checkAnswer = () => {
    let correctAnswer;
    correctAnswer = problem.operation === '+' 
      ? problem.start + problem.steps 
      : problem.start - problem.steps;
    const userNum = parseInt(userAnswer);
    if (userNum === correctAnswer) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      animateCorrectPath();
    } else {
      setFeedback('incorrect');
      setShowExplanation(true);
      animateCorrectPath();
    }
  };

  // Movement (whole numbers only)
  const moveMarker = (steps) => {
    if (isAnimating) return;
    const newPosition = position + steps;
    if (wholeValues.includes(newPosition)) {
      setPosition(newPosition);
    }
  };

  // Animation (whole numbers only)
  useEffect(() => {
    if (isAnimating && currentStep < problem.steps) {
      const timer = setTimeout(() => {
        setPosition(p => p + (problem.operation === '+' ? 1 : -1));
        setCurrentStep(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    } else if (isAnimating && currentStep === problem.steps) {
      setIsAnimating(false);
    }
  }, [isAnimating, currentStep, problem.steps, problem.operation]);

  const animateCorrectPath = () => {
    setIsAnimating(true);
    setCurrentStep(0);
    setPosition(problem.start);
  };

  const resetGame = () => {
    setShowMenu(true);
    setPosition(0);
    setIsAnimating(false);
    setCurrentStep(0);
    setUserAnswer('');
    setFeedback(null);
    setShowExplanation(false);
    setScore(0);
    setProblem(() => {
      const start = Math.floor(Math.random() * 11) - 5;
      const steps = Math.floor(Math.random() * 7) + 1;
      const operation = Math.random() > 0.5 ? '+' : '-';
      return { start, steps, operation };
    });
  };

  // Timer effect for game mode
  useEffect(() => {
    if (mode === 'game' && timer === 0 && !gameOver) {
      if (!isAnimating) {
        setGameOver(true);
      }
      // else: wait for animation to finish
    } else if (mode === 'game' && timer > 0 && !gameOver) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [mode, timer, gameOver, isAnimating]);

  // Patch Next Question button and Enter key to allow skipping animation
  const handleNextQuestion = () => {
    if (isAnimating) setIsAnimating(false);
    generateNewProblem();
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          if (!isAnimating) moveMarker(-1);
          break;
        case 'arrowright':
        case 'd':
          if (!isAnimating) moveMarker(1);
          break;
        case 'enter':
          if (feedback) {
            handleNextQuestion();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnimating, position, feedback]);

  const getFeedbackMessage = () => {
    if (feedback === 'correct') {
      return "Great job! You solved it correctly! 🎉";
    } else if (feedback === 'incorrect') {
      return `Not quite. Let's see how to solve ${problem.start} ${problem.operation} ${problem.steps}`;
    }
    return null;
  };

  // Update personal best when game ends
  useEffect(() => {
    if (gameOver && mode === 'game' && currentTimerDuration > 0) {
      const timerKey = currentTimerDuration.toString();
      if (score > personalBest[timerKey]) {
        const newBest = { ...personalBest, [timerKey]: score };
        setPersonalBest(newBest);
        localStorage.setItem('numlinePersonalBest', JSON.stringify(newBest));
      }
    }
  }, [gameOver, mode, score, currentTimerDuration, personalBest]);

  if (showModeSelect) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 40, borderRadius: 20, boxShadow: '0 8px 32px rgba(31,38,135,0.15)', textAlign: 'center' }}>
          <h2 style={{ color: '#2196f3', fontSize: '2.5em', marginBottom: 30 }}>Choose Mode</h2>
          <button onClick={() => { setMode('normal'); setShowModeSelect(false); setShowMenu(false); generateNewProblem(); }} style={{ fontSize: '1.5em', padding: '20px 40px', margin: '0 20px', borderRadius: 15, border: '2px solid #2196f3', background: 'white', color: '#2196f3', fontWeight: 'bold', cursor: 'pointer' }}>Normal (Practice)</button>
          <button onClick={() => { setShowModeSelect(false); setShowTimerSelect(true); }} style={{ fontSize: '1.5em', padding: '20px 40px', margin: '0 20px', borderRadius: 15, border: '2px solid #f44336', background: 'white', color: '#f44336', fontWeight: 'bold', cursor: 'pointer' }}>Game (Timed)</button>
        </div>
      </div>
    );
  }

  if (showTimerSelect) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 40, borderRadius: 20, boxShadow: '0 8px 32px rgba(31,38,135,0.15)', textAlign: 'center' }}>
          <h2 style={{ color: '#2196f3', fontSize: '2.5em', marginBottom: 30 }}>Choose Timer</h2>
          <div style={{ display: 'flex', gap: 40, marginBottom: 30, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2em', color: '#666', marginBottom: 10 }}>15 Seconds</div>
              <div style={{ fontSize: '1em', color: '#4caf50' }}>Best: {personalBest['15']} ⭐</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2em', color: '#666', marginBottom: 10 }}>30 Seconds</div>
              <div style={{ fontSize: '1em', color: '#4caf50' }}>Best: {personalBest['30']} ⭐</div>
            </div>
          </div>
          <button onClick={() => { 
            setMode('game'); 
            setTimer(15); 
            setCurrentTimerDuration(15);
            setShowTimerSelect(false); 
            setShowMenu(false); 
            setGameOver(false); 
            generateNewProblem(); 
          }} style={{ fontSize: '1.5em', padding: '20px 40px', margin: '0 20px', borderRadius: 15, border: '2px solid #2196f3', background: 'white', color: '#2196f3', fontWeight: 'bold', cursor: 'pointer' }}>15 Seconds</button>
          <button onClick={() => { 
            setMode('game'); 
            setTimer(30); 
            setCurrentTimerDuration(30);
            setShowTimerSelect(false); 
            setShowMenu(false); 
            setGameOver(false); 
            generateNewProblem(); 
          }} style={{ fontSize: '1.5em', padding: '20px 40px', margin: '0 20px', borderRadius: 15, border: '2px solid #f44336', background: 'white', color: '#f44336', fontWeight: 'bold', cursor: 'pointer' }}>30 Seconds</button>
        </div>
      </div>
    );
  }

  if (showCharacterSelect) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
        background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
        color: '#2c3e50',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.10)',
          textAlign: 'center',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => {
              setShowCharacterSelect(false);
              setShowMenu(true);
            }}
            style={{
              position: 'absolute',
              top: 30,
              left: 30,
              padding: '10px 20px',
              fontSize: '18px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 2
            }}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: '2.5em', color: '#2196f3', marginBottom: '30px' }}>Pick Your Character</h2>
          <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {CHARACTERS.map(char => (
              <button
                key={char.emoji}
                onClick={() => {
                  setSelectedCharacter(char.emoji);
                  setShowCharacterSelect(false);
                  setShowModeSelect(true);
                }}
                style={{
                  fontSize: '3em',
                  padding: '20px',
                  borderRadius: '50%',
                  border: selectedCharacter === char.emoji ? '4px solid #2196f3' : '2px solid #bbb',
                  background: 'white',
                  cursor: 'pointer',
                  boxShadow: selectedCharacter === char.emoji ? '0 0 16px #2196f3' : '0 2px 8px #bbb',
                  transition: 'all 0.2s',
                  outline: 'none',
                  margin: '0 10px'
                }}
                aria-label={char.label}
              >
                {char.emoji}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '1.2em', color: '#666' }}>You can change your character next time you play!</div>
        </div>
      </div>
    );
  }

  if (showMenu) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
        background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
        color: '#2c3e50',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.10)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ 
            color: '#2196f3',
            fontSize: '3em',
            marginBottom: '40px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            Number Line Math Adventure
          </h1>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => setShowCharacterSelect(true)}
              style={{
                padding: '20px 40px',
                fontSize: '24px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                width: '200px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              Play Game
            </button>

            <button 
              style={{
                padding: '20px 40px',
                fontSize: '24px',
                backgroundColor: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'not-allowed',
                width: '200px',
                opacity: 0.7,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              Lessons 📚
              <div style={{
                fontSize: '14px',
                marginTop: '5px',
                color: '#666'
              }}>
                Coming Soon!
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver && mode === 'game') {
    const timerKey = currentTimerDuration.toString();
    const isNewRecord = score > personalBest[timerKey];
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 40, borderRadius: 20, boxShadow: '0 8px 32px rgba(31,38,135,0.15)', textAlign: 'center' }}>
          <h2 style={{ color: '#2196f3', fontSize: '2.5em', marginBottom: 30 }}>Time's Up!</h2>
          {isNewRecord && (
            <div style={{ fontSize: '1.5em', color: '#ff9800', fontWeight: 'bold', marginBottom: 15 }}>🏆 NEW RECORD! 🏆</div>
          )}
          <div style={{ fontSize: '2em', marginBottom: 20, color: '#4caf50', fontWeight: 'bold' }}>Final Score: {score} ⭐</div>
          <div style={{ fontSize: '1.2em', color: '#666', marginBottom: 30 }}>
            Personal Best: {personalBest[timerKey]} ⭐
          </div>
          <button onClick={() => { setGameOver(false); setScore(0); setTimer(0); setShowMenu(true); }} style={{ fontSize: '1.2em', padding: '12px 32px', borderRadius: 10, border: '2px solid #2196f3', background: 'white', color: '#2196f3', fontWeight: 'bold', cursor: 'pointer', marginRight: 20 }}>Menu</button>
          <button onClick={() => { setGameOver(false); setScore(0); setTimer(mode === 'game' ? timer : 0); setShowTimerSelect(true); }} style={{ fontSize: '1.2em', padding: '12px 32px', borderRadius: 10, border: '2px solid #4caf50', background: 'white', color: '#4caf50', fontWeight: 'bold', cursor: 'pointer' }}>Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: '"Comic Sans MS", cursive, sans-serif',
      background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
      color: '#2c3e50',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '18px',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.10)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={resetGame}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              ← Menu
            </button>
            <h1 style={{ 
              color: '#2196f3',
              fontSize: '2.5em',
              margin: 0,
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              Number Line Math Adventure
            </h1>
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2196f3',
            background: 'rgba(33, 150, 243, 0.1)',
            padding: '10px 20px',
            borderRadius: '15px',
            border: '2px solid #2196f3',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            Score: {score} ⭐
            {mode === 'game' && !gameOver && (
              <span style={{ marginLeft: 20, color: '#f44336', fontWeight: 'bold', fontSize: '1.1em' }}>⏰ {timer}s</span>
            )}
          </div>
        </div>

        <div style={{ 
          fontSize: '28px', 
          marginBottom: '20px',
          minHeight: '40px',
          textAlign: 'center',
          fontWeight: 'bold',
          color: '#1565c0'
        }}>
          What is {problem.start} {problem.operation} {problem.steps}?
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            style={{
              fontSize: '20px',
              padding: '10px',
              width: '100px',
              textAlign: 'center',
              borderRadius: '10px',
              border: '2px solid #2196f3',
              outline: 'none'
            }}
            placeholder="?"
            disabled={isAnimating}
            step="1"
            onKeyDown={e => {
              if (e.key === 'Enter' && !isAnimating && userAnswer) checkAnswer();
            }}
          />
          <button 
            onClick={checkAnswer}
            disabled={!userAnswer || isAnimating}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Check Answer
          </button>
          {feedback && <span style={{ 
            fontSize: '28px',
            marginLeft: '10px'
          }}>{feedback === 'correct' ? '✅' : '❌'}</span>}
        </div>

        {!isAnimating && !feedback && (
          <>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '20px',
              fontSize: '16px',
              color: '#666'
            }}>
              Use A/D or ←/→ keys to move the {CHARACTERS.find(c => c.emoji === selectedCharacter)?.label?.toLowerCase() || 'character'}
            </div>
          </>
        )}

        {feedback && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            color: feedback === 'correct' ? '#4caf50' : '#f44336',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {getFeedbackMessage()}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '20px',
          borderRadius: '15px',
          marginTop: '60px'
        }}>
          {range.map((num) => (
            <div key={num} style={{
              width: '40px',
              textAlign: 'center',
              borderLeft: '1px solid #2196f3',
              height: '60px',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '65px', 
                width: '100%',
                color: '#1565c0',
                fontWeight: 'bold'
              }}>{num}</div>
              {num === position && (
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '28px',
                  animation: isAnimating ? 'hop 0.6s ease-in-out' : 'bounce 0.5s infinite alternate'
                }}>
                  {selectedCharacter}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px',
          marginTop: '30px'
        }}>
          <button 
            onClick={handleNextQuestion}
            style={{
              padding: '12px 24px',
              fontSize: '18px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
