'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import miniGameData from '@/engine/chapter3_job_hunt/mini_game_content.json';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type MiniGameMode = 'typing' | 'spot_error' | 'quiz_rapid';

interface MiniGameOverlayProps {
    mode: MiniGameMode;
    difficulty: number;
    stationName: string;
    onComplete: (score: number, maxScore: number, coinsEarned: number, xpEarned: number) => void;
    onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function MiniGameOverlay({
    mode,
    difficulty,
    stationName,
    onComplete,
    onClose,
}: MiniGameOverlayProps) {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            background: 'rgba(10, 5, 20, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInOverlay 0.3s ease',
            backdropFilter: 'blur(6px)',
        }}>
            {mode === 'typing' && (
                <TypingChallenge difficulty={difficulty} stationName={stationName} onComplete={onComplete} onClose={onClose} />
            )}
            {mode === 'spot_error' && (
                <SpotTheError difficulty={difficulty} stationName={stationName} onComplete={onComplete} onClose={onClose} />
            )}
            {mode === 'quiz_rapid' && (
                <QuizRapidFire difficulty={difficulty} stationName={stationName} onComplete={onComplete} onClose={onClose} />
            )}

            <style>{`
                @keyframes fadeInOverlay { 0% { opacity: 0; } 100% { opacity: 1; } }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Typing Challenge
// ═══════════════════════════════════════════════════════════════

function TypingChallenge({ difficulty, stationName, onComplete, onClose }: Omit<MiniGameOverlayProps, 'mode'>) {
    const challenges = miniGameData.typing_challenges.filter(c => c.difficulty <= difficulty + 1);
    const [challenge] = useState(() => challenges[Math.floor(Math.random() * challenges.length)]);
    const [input, setInput] = useState('');
    const [timer, setTimer] = useState(challenge.timeLimit);
    const [done, setDone] = useState(false);
    const [score, setScore] = useState(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const finishGame = useCallback(() => {
        if (done) return;
        setDone(true);
        // Calculate accuracy
        const target = challenge.text;
        let correct = 0;
        for (let i = 0; i < Math.min(input.length, target.length); i++) {
            if (input[i] === target[i]) correct++;
        }
        const accuracy = target.length > 0 ? correct / target.length : 0;
        const completionRate = Math.min(1, input.length / target.length);
        const finalScore = Math.round(accuracy * completionRate * 100);
        setScore(finalScore);

        const stars = finalScore >= 90 ? 3 : finalScore >= 60 ? 2 : finalScore >= 30 ? 1 : 0;
        const coins = stars * 60 + difficulty * 20;
        const xp = stars * 25 + difficulty * 10;

        setTimeout(() => onComplete(finalScore, 100, coins, xp), 2000);
    }, [done, input, challenge.text, difficulty, onComplete]);

    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (done) return;
        setInput(e.target.value);
        if (e.target.value.length >= challenge.text.length) {
            finishGame();
        }
    }, [done, challenge.text.length, finishGame]);

    // Render typed characters with color coding
    const renderTarget = () => {
        return challenge.text.split('').map((char, i) => {
            let color = '#555'; // not typed yet
            if (i < input.length) {
                color = input[i] === char ? '#20C997' : '#EF4444';
            }
            return (
                <span key={i} style={{ color, fontFamily: '"Courier New", monospace' }}>
                    {char === ' ' ? '\u00A0' : char}
                </span>
            );
        });
    };

    return (
        <div style={{ maxWidth: 650, width: '100%', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#3B82F6', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 2 }}>
                    {stationName}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#E1E3FA', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 3 }}>
                    TYPING CHALLENGE
                </div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: '"Kanit", sans-serif' }}>
                    Type the code exactly as shown — {timer}s remaining
                </div>
            </div>

            {/* Timer bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 16, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${(timer / challenge.timeLimit) * 100}%`,
                    background: timer > challenge.timeLimit * 0.5 ? '#3B82F6' : timer > challenge.timeLimit * 0.25 ? '#FD7E14' : '#EF4444',
                    borderRadius: 2,
                    transition: 'width 1s linear',
                }} />
            </div>

            {/* Target text */}
            <div style={{
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 16,
                fontSize: 14,
                lineHeight: 2,
                wordBreak: 'break-all',
            }}>
                {renderTarget()}
            </div>

            {/* Input area */}
            <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                disabled={done}
                placeholder="Start typing..."
                style={{
                    width: '100%',
                    height: 80,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 10,
                    color: '#E1E3FA',
                    fontSize: 14,
                    fontFamily: '"Courier New", monospace',
                    padding: 12,
                    resize: 'none',
                    outline: 'none',
                }}
            />

            {done && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: score >= 60 ? '#20C997' : '#FD7E14', fontFamily: '"Saira Condensed", sans-serif' }}>
                        {score}% Accuracy
                    </div>
                    <div style={{ fontSize: 12, color: '#888', fontFamily: '"Kanit", sans-serif' }}>
                        {score >= 90 ? '★★★ Perfect!' : score >= 60 ? '★★ Good job!' : score >= 30 ? '★ Keep practicing!' : 'Try again next time'}
                    </div>
                </div>
            )}

            <button onClick={onClose} style={{
                marginTop: 16,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#888',
                padding: '8px 20px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: '"Kanit", sans-serif',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}>
                {done ? 'Close' : 'Skip'}
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Spot the Error
// ═══════════════════════════════════════════════════════════════

function SpotTheError({ difficulty, stationName, onComplete, onClose }: Omit<MiniGameOverlayProps, 'mode'>) {
    const challenges = miniGameData.spot_the_error.filter(c => c.difficulty <= difficulty + 1);
    const [challenge] = useState(() => challenges[Math.floor(Math.random() * challenges.length)]);
    const [timer, setTimer] = useState(challenge.timeLimit);
    const [foundErrors, setFoundErrors] = useState<Set<number>>(new Set());
    const [done, setDone] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const finishGame = useCallback(() => {
        if (done) return;
        setDone(true);
        setShowAnswers(true);
        const score = foundErrors.size;
        const maxScore = challenge.errorCount;
        const stars = score >= maxScore ? 3 : score >= maxScore * 0.6 ? 2 : score >= 1 ? 1 : 0;
        const coins = stars * 50 + difficulty * 25;
        const xp = stars * 20 + difficulty * 10;
        setTimeout(() => onComplete(score, maxScore, coins, xp), 2500);
    }, [done, foundErrors, challenge.errorCount, difficulty, onComplete]);

    const toggleError = (idx: number) => {
        if (done) return;
        setFoundErrors(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div style={{ maxWidth: 650, width: '100%', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#FD7E14', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 2 }}>
                    {stationName}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#E1E3FA', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 3 }}>
                    {challenge.title}
                </div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: '"Kanit", sans-serif' }}>
                    Find {challenge.errorCount} errors — {timer}s remaining
                </div>
            </div>

            {/* Timer */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 16, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${(timer / challenge.timeLimit) * 100}%`,
                    background: timer > challenge.timeLimit * 0.5 ? '#FD7E14' : '#EF4444',
                    transition: 'width 1s linear',
                }} />
            </div>

            {/* Content */}
            <div style={{
                background: 'rgba(253, 126, 20, 0.06)',
                border: '1px solid rgba(253, 126, 20, 0.2)',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 16,
                fontSize: 15,
                lineHeight: 1.8,
                color: '#E1E3FA',
                fontFamily: '"Kanit", sans-serif',
            }}>
                {challenge.content}
            </div>

            {/* Error buttons */}
            <div style={{ fontSize: 11, color: '#888', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Click to mark errors ({foundErrors.size}/{challenge.errorCount} found):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {challenge.errors.map((error, idx) => (
                    <button
                        key={idx}
                        onClick={() => toggleError(idx)}
                        style={{
                            background: foundErrors.has(idx)
                                ? 'rgba(32, 201, 151, 0.15)'
                                : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${foundErrors.has(idx) ? '#20C997' : 'rgba(255,255,255,0.15)'}`,
                            color: foundErrors.has(idx) ? '#20C997' : '#aaa',
                            padding: '8px 14px',
                            borderRadius: 8,
                            cursor: done ? 'default' : 'pointer',
                            fontSize: 12,
                            fontFamily: '"Kanit", sans-serif',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                        }}
                    >
                        {foundErrors.has(idx) ? '✓ ' : '○ '}
                        {error}
                    </button>
                ))}
            </div>

            {!done && (
                <button onClick={finishGame} style={{
                    marginTop: 16,
                    background: 'linear-gradient(135deg, #FD7E14, #D63384)',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 30px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 'bold',
                    fontFamily: '"Saira Condensed", sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}>
                    Submit ({foundErrors.size} errors found)
                </button>
            )}

            {done && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: foundErrors.size >= challenge.errorCount ? '#20C997' : '#FD7E14', fontFamily: '"Saira Condensed", sans-serif' }}>
                        {foundErrors.size}/{challenge.errorCount} Errors Found!
                    </div>
                    <button onClick={onClose} style={{
                        marginTop: 12,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#888',
                        padding: '8px 20px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                    }}>
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Quiz Rapid Fire
// ═══════════════════════════════════════════════════════════════

function QuizRapidFire({ difficulty, stationName, onComplete, onClose }: Omit<MiniGameOverlayProps, 'mode'>) {
    const quizSets = miniGameData.quiz_rapid_fire.filter(q => q.difficulty <= difficulty + 1);
    const [quizSet] = useState(() => quizSets[Math.floor(Math.random() * quizSets.length)]);
    const [currentQ, setCurrentQ] = useState(0);
    const [timer, setTimer] = useState(quizSet.timeLimit);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const finishGame = useCallback(() => {
        if (done) return;
        setDone(true);
        const maxScore = quizSet.questions.length;
        const stars = score >= maxScore ? 3 : score >= maxScore * 0.6 ? 2 : score >= 1 ? 1 : 0;
        const coins = stars * 70 + difficulty * 20;
        const xp = stars * 30 + difficulty * 15;
        setTimeout(() => onComplete(score, maxScore, coins, xp), 2000);
    }, [done, score, quizSet.questions.length, difficulty, onComplete]);

    const handleAnswer = useCallback((idx: number) => {
        if (showResult || done) return;
        setSelectedAnswer(idx);
        setShowResult(true);
        const q = quizSet.questions[currentQ];
        if (idx === q.correct) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentQ + 1 >= quizSet.questions.length) {
                finishGame();
            } else {
                setCurrentQ(prev => prev + 1);
                setSelectedAnswer(null);
                setShowResult(false);
            }
        }, 1200);
    }, [showResult, done, quizSet.questions, currentQ, finishGame]);

    const q = quizSet.questions[currentQ];

    return (
        <div style={{ maxWidth: 600, width: '100%', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#6F53C1', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 2 }}>
                    {stationName}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#E1E3FA', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 3 }}>
                    RAPID FIRE QUIZ
                </div>
                <div style={{ fontSize: 12, color: '#888', fontFamily: '"Kanit", sans-serif' }}>
                    {timer}s remaining • Question {currentQ + 1}/{quizSet.questions.length} • Score: {score}
                </div>
            </div>

            {/* Timer */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 20, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${(timer / quizSet.timeLimit) * 100}%`,
                    background: timer > quizSet.timeLimit * 0.5 ? '#6F53C1' : '#EF4444',
                    transition: 'width 1s linear',
                }} />
            </div>

            {!done && q && (
                <>
                    <div style={{
                        background: 'rgba(111, 83, 193, 0.08)',
                        border: '1px solid rgba(111, 83, 193, 0.25)',
                        borderRadius: 12,
                        padding: '16px 20px',
                        marginBottom: 16,
                        fontSize: 16,
                        color: '#E1E3FA',
                        fontFamily: '"Kanit", sans-serif',
                        lineHeight: 1.6,
                        textAlign: 'center',
                    }}>
                        {q.q}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.choices.map((choice, idx) => {
                            let bg = 'rgba(111, 83, 193, 0.08)';
                            let border = 'rgba(111, 83, 193, 0.25)';
                            let color = '#E1E3FA';

                            if (showResult) {
                                if (idx === q.correct) {
                                    bg = 'rgba(32, 201, 151, 0.15)';
                                    border = '#20C997';
                                    color = '#20C997';
                                } else if (idx === selectedAnswer) {
                                    bg = 'rgba(239, 68, 68, 0.15)';
                                    border = '#EF4444';
                                    color = '#EF4444';
                                } else {
                                    bg = 'rgba(255,255,255,0.02)';
                                    color = '#444';
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={showResult}
                                    style={{
                                        background: bg,
                                        border: `1px solid ${border}`,
                                        color,
                                        padding: '10px 16px',
                                        borderRadius: 10,
                                        cursor: showResult ? 'default' : 'pointer',
                                        fontSize: 13,
                                        fontFamily: '"Kanit", sans-serif',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {choice}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {done && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: score >= quizSet.questions.length * 0.6 ? '#20C997' : '#FD7E14', fontFamily: '"Saira Condensed", sans-serif' }}>
                        {score}/{quizSet.questions.length}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', fontFamily: '"Kanit", sans-serif', marginBottom: 16 }}>
                        {score >= quizSet.questions.length ? '★★★ Perfect!' : score >= quizSet.questions.length * 0.6 ? '★★ Great!' : '★ Keep learning!'}
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#888',
                        padding: '8px 20px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                    }}>
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
