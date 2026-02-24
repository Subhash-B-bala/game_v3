'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { EnemyInstance } from './EnemySystem';
import scamQuestionsData from '@/engine/chapter3_job_hunt/scam_questions.json';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface ScamQuestion {
    id: string;
    question: string;
    choices: string[];
    correct: number;
    difficulty: number;
    explanation: string;
}

interface CombatOverlayProps {
    enemy: EnemyInstance;
    playerHp: number;
    playerMaxHp: number;
    onVictory: (enemyId: string, coinsEarned: number, xpEarned: number) => void;
    onDefeat: (damageTaken: number) => void;
    onClose: () => void;
}

const QUESTIONS: ScamQuestion[] = scamQuestionsData as ScamQuestion[];
const TIMER_DURATION = 12; // seconds per question
const ROUNDS_TO_WIN = 3;

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function CombatOverlay({
    enemy,
    playerHp,
    playerMaxHp,
    onVictory,
    onDefeat,
    onClose,
}: CombatOverlayProps) {
    const [round, setRound] = useState(0);
    const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
    const [currentQuestion, setCurrentQuestion] = useState<ScamQuestion | null>(null);
    const [timer, setTimer] = useState(TIMER_DURATION);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [playerDamageTaken, setPlayerDamageTaken] = useState(0);
    const [shake, setShake] = useState(false);
    const [playerFlash, setPlayerFlash] = useState(false);
    const [combatResult, setCombatResult] = useState<'fighting' | 'victory' | 'defeat'>('fighting');
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [xpEarned, setXpEarned] = useState(0);

    const usedQuestionIds = useRef<Set<string>>(new Set());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Pick a question based on difficulty
    const pickQuestion = useCallback((): ScamQuestion => {
        const available = QUESTIONS.filter(
            q => !usedQuestionIds.current.has(q.id) && q.difficulty <= enemy.difficulty + 1
        );
        const pool = available.length > 0 ? available : QUESTIONS.filter(q => !usedQuestionIds.current.has(q.id));
        const finalPool = pool.length > 0 ? pool : QUESTIONS;
        const q = finalPool[Math.floor(Math.random() * finalPool.length)];
        usedQuestionIds.current.add(q.id);
        return q;
    }, [enemy.difficulty]);

    // Start first question
    useEffect(() => {
        const q = pickQuestion();
        setCurrentQuestion(q);
        setTimer(TIMER_DURATION);
    }, [pickQuestion]);

    // Timer countdown
    useEffect(() => {
        if (combatResult !== 'fighting' || showResult || !currentQuestion) return;

        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    // Time's up — wrong answer
                    handleAnswer(-1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentQuestion, showResult, combatResult]);

    const handleAnswer = useCallback((answerIdx: number) => {
        if (showResult || !currentQuestion || combatResult !== 'fighting') return;
        if (timerRef.current) clearInterval(timerRef.current);

        setSelectedAnswer(answerIdx);
        const correct = answerIdx === currentQuestion.correct;
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            // Damage enemy
            const newEnemyHp = enemyHp - 1;
            setEnemyHp(newEnemyHp);
            setShake(true);
            setTimeout(() => setShake(false), 400);

            const roundCoins = 50 + enemy.difficulty * 30;
            const roundXp = 20 + enemy.difficulty * 10;
            setCoinsEarned(prev => prev + roundCoins);
            setXpEarned(prev => prev + roundXp);

            if (newEnemyHp <= 0) {
                // Victory!
                setTimeout(() => {
                    setCombatResult('victory');
                }, 1200);
                return;
            }
        } else {
            // Player takes damage
            const dmg = 10 + enemy.difficulty * 5;
            setPlayerDamageTaken(prev => prev + dmg);
            setPlayerFlash(true);
            setTimeout(() => setPlayerFlash(false), 400);

            if (playerHp - playerDamageTaken - dmg <= 0) {
                setTimeout(() => {
                    setCombatResult('defeat');
                }, 1200);
                return;
            }
        }

        // Next round after delay
        setTimeout(() => {
            setShowResult(false);
            setSelectedAnswer(null);
            setRound(prev => prev + 1);
            const q = pickQuestion();
            setCurrentQuestion(q);
            setTimer(TIMER_DURATION);
        }, 2000);
    }, [showResult, currentQuestion, combatResult, enemyHp, enemy.difficulty, playerHp, playerDamageTaken, pickQuestion]);

    // Close handlers
    const handleVictoryClose = useCallback(() => {
        onVictory(enemy.id, coinsEarned, xpEarned);
        onClose();
    }, [enemy.id, coinsEarned, xpEarned, onVictory, onClose]);

    const handleDefeatClose = useCallback(() => {
        onDefeat(playerDamageTaken);
        onClose();
    }, [playerDamageTaken, onDefeat, onClose]);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    const enemyHpPercent = (enemyHp / enemy.maxHp) * 100;
    const effectivePlayerHp = Math.max(0, playerHp - playerDamageTaken);
    const playerHpPercent = (effectivePlayerHp / playerMaxHp) * 100;
    const timerPercent = (timer / TIMER_DURATION) * 100;

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            background: 'rgba(10, 5, 15, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInOverlay 0.3s ease',
            backdropFilter: 'blur(6px)',
        }}>
            {/* ── Victory Screen ── */}
            {combatResult === 'victory' && (
                <div style={{ textAlign: 'center', animation: 'fadeInOverlay 0.5s ease' }}>
                    <div style={{
                        fontSize: 48,
                        fontWeight: 900,
                        color: '#20C997',
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: 4,
                        textShadow: '0 0 30px rgba(32, 201, 151, 0.5)',
                        marginBottom: 8,
                    }}>
                        SCAM DEFEATED!
                    </div>
                    <div style={{
                        fontSize: 16,
                        color: '#aaa',
                        fontFamily: '"Kanit", sans-serif',
                        marginBottom: 24,
                    }}>
                        You exposed {enemy.name}!
                    </div>
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 32 }}>
                        <RewardBadge label="Coins" value={`+₹${coinsEarned}`} color="#FFD600" />
                        <RewardBadge label="XP" value={`+${xpEarned}`} color="#3B82F6" />
                        <RewardBadge label="Scams" value="+1" color="#20C997" />
                    </div>
                    {currentQuestion && (
                        <div style={{
                            background: 'rgba(32, 201, 151, 0.08)',
                            border: '1px solid rgba(32, 201, 151, 0.3)',
                            borderRadius: 12,
                            padding: '12px 20px',
                            maxWidth: 500,
                            margin: '0 auto 24px',
                            textAlign: 'left',
                        }}>
                            <div style={{ fontSize: 11, color: '#20C997', fontWeight: 700, marginBottom: 4, fontFamily: '"Saira Condensed", sans-serif', letterSpacing: 1 }}>REMEMBER</div>
                            <div style={{ fontSize: 13, color: '#ccc', fontFamily: '"Kanit", sans-serif', lineHeight: 1.6 }}>
                                {currentQuestion.explanation}
                            </div>
                        </div>
                    )}
                    <button onClick={handleVictoryClose} style={btnStyle('#20C997')}>
                        Collect Rewards →
                    </button>
                </div>
            )}

            {/* ── Defeat Screen ── */}
            {combatResult === 'defeat' && (
                <div style={{ textAlign: 'center', animation: 'fadeInOverlay 0.5s ease' }}>
                    <div style={{
                        fontSize: 48,
                        fontWeight: 900,
                        color: '#EF4444',
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: 4,
                        textShadow: '0 0 30px rgba(239, 68, 68, 0.5)',
                        marginBottom: 8,
                    }}>
                        SCAMMED!
                    </div>
                    <div style={{
                        fontSize: 16,
                        color: '#aaa',
                        fontFamily: '"Kanit", sans-serif',
                        marginBottom: 24,
                    }}>
                        {enemy.name} got the better of you this time.
                    </div>
                    <div style={{
                        fontSize: 14,
                        color: '#EF4444',
                        fontFamily: '"Kanit", sans-serif',
                        marginBottom: 32,
                    }}>
                        -{playerDamageTaken} HP
                    </div>
                    <button onClick={handleDefeatClose} style={btnStyle('#EF4444')}>
                        Retreat →
                    </button>
                </div>
            )}

            {/* ── Combat Screen ── */}
            {combatResult === 'fighting' && currentQuestion && (
                <div style={{ maxWidth: 650, width: '100%', padding: '0 20px' }}>
                    {/* Health bars */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 20 }}>
                        {/* Player HP */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#3B82F6', fontFamily: '"Saira Condensed", sans-serif', fontWeight: 700 }}>YOU</span>
                                <span style={{ fontSize: 11, color: '#888', fontFamily: '"Kanit", sans-serif' }}>{effectivePlayerHp}/{playerMaxHp}</span>
                            </div>
                            <div style={{
                                height: 10, borderRadius: 5,
                                background: 'rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                border: playerFlash ? '1px solid #EF4444' : '1px solid transparent',
                                transition: 'border 0.2s',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${playerHpPercent}%`,
                                    background: playerHpPercent > 50 ? '#20C997' : playerHpPercent > 25 ? '#FD7E14' : '#EF4444',
                                    borderRadius: 5,
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>

                        <div style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: '#666',
                            fontFamily: '"Saira Condensed", sans-serif',
                            alignSelf: 'center',
                        }}>VS</div>

                        {/* Enemy HP */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#EF4444', fontFamily: '"Saira Condensed", sans-serif', fontWeight: 700 }}>{enemy.name}</span>
                                <span style={{ fontSize: 11, color: '#888', fontFamily: '"Kanit", sans-serif' }}>{enemyHp}/{enemy.maxHp}</span>
                            </div>
                            <div style={{
                                height: 10, borderRadius: 5,
                                background: 'rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                transform: shake ? 'translateX(5px)' : 'none',
                                transition: 'transform 0.1s',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${enemyHpPercent}%`,
                                    background: '#EF4444',
                                    borderRadius: 5,
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Timer bar */}
                    <div style={{
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.1)',
                        marginBottom: 20,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${timerPercent}%`,
                            background: timer > 6 ? '#3B82F6' : timer > 3 ? '#FD7E14' : '#EF4444',
                            borderRadius: 2,
                            transition: 'width 1s linear, background 0.3s',
                        }} />
                    </div>

                    {/* Round indicator */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: 12,
                    }}>
                        <span style={{
                            fontSize: 11,
                            color: '#888',
                            fontFamily: '"Saira Condensed", sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                        }}>
                            Round {round + 1} • {timer}s
                        </span>
                    </div>

                    {/* Question */}
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.06)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: 14,
                        padding: '16px 20px',
                        marginBottom: 16,
                    }}>
                        <div style={{
                            fontSize: 11,
                            color: '#EF4444',
                            fontFamily: '"Saira Condensed", sans-serif',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            marginBottom: 8,
                        }}>
                            SCAM ALERT
                        </div>
                        <div style={{
                            fontSize: 15,
                            color: '#E1E3FA',
                            fontFamily: '"Kanit", sans-serif',
                            lineHeight: 1.7,
                        }}>
                            {currentQuestion.question}
                        </div>
                    </div>

                    {/* Answer choices */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {currentQuestion.choices.map((choice, idx) => {
                            let bg = 'rgba(59, 130, 246, 0.08)';
                            let border = 'rgba(59, 130, 246, 0.25)';
                            let color = '#E1E3FA';

                            if (showResult) {
                                if (idx === currentQuestion.correct) {
                                    bg = 'rgba(32, 201, 151, 0.15)';
                                    border = '#20C997';
                                    color = '#20C997';
                                } else if (idx === selectedAnswer && !isCorrect) {
                                    bg = 'rgba(239, 68, 68, 0.15)';
                                    border = '#EF4444';
                                    color = '#EF4444';
                                } else {
                                    bg = 'rgba(255,255,255,0.03)';
                                    border = 'rgba(255,255,255,0.1)';
                                    color = '#555';
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !showResult && handleAnswer(idx)}
                                    disabled={showResult}
                                    style={{
                                        background: bg,
                                        border: `1px solid ${border}`,
                                        color,
                                        padding: '11px 16px',
                                        borderRadius: 10,
                                        cursor: showResult ? 'default' : 'pointer',
                                        fontSize: 13,
                                        fontFamily: '"Kanit", sans-serif',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        opacity: showResult && idx !== currentQuestion.correct && idx !== selectedAnswer ? 0.4 : 1,
                                    }}
                                >
                                    <span style={{ color: '#666', marginRight: 8, fontWeight: 700 }}>
                                        {String.fromCharCode(65 + idx)}.
                                    </span>
                                    {choice}
                                </button>
                            );
                        })}
                    </div>

                    {/* Result feedback */}
                    {showResult && (
                        <div style={{
                            marginTop: 12,
                            padding: '10px 16px',
                            borderRadius: 10,
                            background: isCorrect ? 'rgba(32, 201, 151, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${isCorrect ? 'rgba(32, 201, 151, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            textAlign: 'center',
                        }}>
                            <div style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: isCorrect ? '#20C997' : '#EF4444',
                                fontFamily: '"Saira Condensed", sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                            }}>
                                {isCorrect ? 'CORRECT! Scam Exposed!' : 'WRONG! You fell for it!'}
                            </div>
                            <div style={{
                                fontSize: 12,
                                color: '#999',
                                fontFamily: '"Kanit", sans-serif',
                                marginTop: 4,
                            }}>
                                {currentQuestion.explanation}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes fadeInOverlay {
                    0% { opacity: 0; transform: scale(0.97); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

function RewardBadge({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{
            background: `${color}15`,
            border: `1px solid ${color}40`,
            borderRadius: 12,
            padding: '12px 20px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: '"Saira Condensed", sans-serif' }}>
                {value}
            </div>
            <div style={{ fontSize: 10, color: '#888', fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
                {label}
            </div>
        </div>
    );
}

function btnStyle(color: string): React.CSSProperties {
    return {
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        border: 'none',
        color: '#fff',
        padding: '14px 40px',
        borderRadius: 12,
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: '"Saira Condensed", sans-serif',
        textTransform: 'uppercase',
        letterSpacing: 2,
        boxShadow: `0 4px 20px ${color}44`,
    };
}
