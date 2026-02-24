'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import bossData from '@/engine/chapter3_job_hunt/boss_questions.json';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface BossQuestion {
    q: string;
    choices: string[];
    correct: number;
    tip: string;
}

interface BossConfig {
    district: number;
    name: string;
    title: string;
    rounds: number;
    hp: number;
    reward: { coins: number; xp: number };
    questions: BossQuestion[];
}

interface BossInterviewProps {
    district: number;
    playerHp: number;
    playerMaxHp: number;
    playerLevel: number;
    onVictory: (district: number, coins: number, xp: number) => void;
    onDefeat: (damageTaken: number) => void;
    onClose: () => void;
}

const BOSSES: BossConfig[] = bossData.bosses as BossConfig[];
const TIMER_PER_ROUND = 20; // seconds per question

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function BossInterview({
    district,
    playerHp,
    playerMaxHp,
    playerLevel,
    onVictory,
    onDefeat,
    onClose,
}: BossInterviewProps) {
    const boss = BOSSES.find(b => b.district === district) || BOSSES[0];

    const [phase, setPhase] = useState<'intro' | 'fighting' | 'victory' | 'defeat'>('intro');
    const [round, setRound] = useState(0);
    const [bossHp, setBossHp] = useState(boss.hp);
    const [playerDmg, setPlayerDmg] = useState(0);
    const [timer, setTimer] = useState(TIMER_PER_ROUND);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [shake, setShake] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<BossQuestion>(boss.questions[0]);

    const usedQuestions = useRef<Set<number>>(new Set());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const pickQuestion = useCallback(() => {
        const available = boss.questions.filter((_, i) => !usedQuestions.current.has(i));
        const pool = available.length > 0 ? available : boss.questions;
        const idx = Math.floor(Math.random() * pool.length);
        const qIdx = boss.questions.indexOf(pool[idx]);
        usedQuestions.current.add(qIdx);
        return pool[idx];
    }, [boss]);

    // Start combat
    const startFight = useCallback(() => {
        setPhase('fighting');
        setCurrentQuestion(pickQuestion());
        setTimer(TIMER_PER_ROUND);
    }, [pickQuestion]);

    // Timer
    useEffect(() => {
        if (phase !== 'fighting' || showResult) return;

        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    handleAnswer(-1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, showResult, round]);

    const handleAnswer = useCallback((idx: number) => {
        if (showResult || phase !== 'fighting') return;
        if (timerRef.current) clearInterval(timerRef.current);

        setSelectedAnswer(idx);
        const correct = idx === currentQuestion.correct;
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            const newBossHp = bossHp - 1;
            setBossHp(newBossHp);
            setShake(true);
            setTimeout(() => setShake(false), 500);

            if (newBossHp <= 0) {
                setTimeout(() => setPhase('victory'), 1500);
                return;
            }
        } else {
            const dmg = 15 + district * 5;
            setPlayerDmg(prev => prev + dmg);

            if (playerHp - playerDmg - dmg <= 0) {
                setTimeout(() => setPhase('defeat'), 1500);
                return;
            }
        }

        // Next round
        setTimeout(() => {
            setShowResult(false);
            setSelectedAnswer(null);
            setRound(prev => prev + 1);
            setCurrentQuestion(pickQuestion());
            setTimer(TIMER_PER_ROUND);
        }, 2500);
    }, [showResult, phase, currentQuestion, bossHp, district, playerHp, playerDmg, pickQuestion]);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════

    const effectiveHp = Math.max(0, playerHp - playerDmg);
    const bossHpPercent = (bossHp / boss.hp) * 100;
    const playerHpPercent = (effectiveHp / playerMaxHp) * 100;
    const timerPercent = (timer / TIMER_PER_ROUND) * 100;

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 65,
            background: 'rgba(5, 5, 15, 0.96)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInOverlay 0.4s ease',
            backdropFilter: 'blur(8px)',
        }}>
            {/* ── INTRO ── */}
            {phase === 'intro' && (
                <div style={{ textAlign: 'center', maxWidth: 500 }}>
                    <div style={{
                        fontSize: 11,
                        color: '#EF4444',
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: 4,
                        marginBottom: 8,
                    }}>
                        BOSS INTERVIEW
                    </div>
                    <div style={{
                        fontSize: 42,
                        fontWeight: 900,
                        color: '#E1E3FA',
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: 3,
                        marginBottom: 4,
                        textShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                    }}>
                        {boss.name}
                    </div>
                    <div style={{
                        fontSize: 14,
                        color: '#9CA3AF',
                        fontFamily: '"Kanit", sans-serif',
                        marginBottom: 24,
                    }}>
                        {boss.title}
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 16,
                        justifyContent: 'center',
                        marginBottom: 32,
                    }}>
                        <StatBadge label="Rounds" value={`${boss.rounds}+`} color="#EF4444" />
                        <StatBadge label="Reward" value={`₹${boss.reward.coins}`} color="#FFD600" />
                        <StatBadge label="XP" value={`${boss.reward.xp}`} color="#3B82F6" />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button onClick={startFight} style={{
                            background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
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
                            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                        }}>
                            Begin Interview
                        </button>
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#888',
                            padding: '14px 30px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontFamily: '"Kanit", sans-serif',
                        }}>
                            Not Ready
                        </button>
                    </div>
                </div>
            )}

            {/* ── FIGHTING ── */}
            {phase === 'fighting' && (
                <div style={{ maxWidth: 650, width: '100%', padding: '0 20px' }}>
                    {/* Boss & Player HP */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 20 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#3B82F6', fontFamily: '"Saira Condensed", sans-serif', fontWeight: 700 }}>YOU (LVL {playerLevel})</span>
                                <span style={{ fontSize: 11, color: '#888' }}>{effectiveHp}/{playerMaxHp}</span>
                            </div>
                            <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${playerHpPercent}%`,
                                    background: playerHpPercent > 50 ? '#20C997' : playerHpPercent > 25 ? '#FD7E14' : '#EF4444',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>

                        <div style={{ fontSize: 18, fontWeight: 900, color: '#555', alignSelf: 'center', fontFamily: '"Saira Condensed", sans-serif' }}>VS</div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: '#EF4444', fontFamily: '"Saira Condensed", sans-serif', fontWeight: 700 }}>{boss.name}</span>
                                <span style={{ fontSize: 11, color: '#888' }}>{bossHp}/{boss.hp}</span>
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
                                    width: `${bossHpPercent}%`,
                                    background: 'linear-gradient(90deg, #EF4444, #B91C1C)',
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 16, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${timerPercent}%`,
                            background: timer > 10 ? '#3B82F6' : timer > 5 ? '#FD7E14' : '#EF4444',
                            transition: 'width 1s linear',
                        }} />
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: '#888', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 2 }}>
                            Round {round + 1} • {timer}s
                        </span>
                    </div>

                    {/* Question */}
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 14,
                        padding: '16px 20px',
                        marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 11, color: '#EF4444', fontFamily: '"Saira Condensed", sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                            {boss.title}
                        </div>
                        <div style={{ fontSize: 16, color: '#E1E3FA', fontFamily: '"Kanit", sans-serif', lineHeight: 1.7 }}>
                            "{currentQuestion.q}"
                        </div>
                    </div>

                    {/* Choices */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {currentQuestion.choices.map((choice, idx) => {
                            let bg = 'rgba(239, 68, 68, 0.06)';
                            let border = 'rgba(239, 68, 68, 0.2)';
                            let color = '#E1E3FA';

                            if (showResult) {
                                if (idx === currentQuestion.correct) {
                                    bg = 'rgba(32, 201, 151, 0.15)'; border = '#20C997'; color = '#20C997';
                                } else if (idx === selectedAnswer && !isCorrect) {
                                    bg = 'rgba(239, 68, 68, 0.15)'; border = '#EF4444'; color = '#EF4444';
                                } else {
                                    bg = 'rgba(255,255,255,0.02)'; color = '#444';
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
                                        padding: '10px 16px',
                                        borderRadius: 10,
                                        cursor: showResult ? 'default' : 'pointer',
                                        fontSize: 13,
                                        fontFamily: '"Kanit", sans-serif',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        opacity: showResult && idx !== currentQuestion.correct && idx !== selectedAnswer ? 0.35 : 1,
                                    }}
                                >
                                    <span style={{ color: '#666', marginRight: 8, fontWeight: 700 }}>{String.fromCharCode(65 + idx)}.</span>
                                    {choice}
                                </button>
                            );
                        })}
                    </div>

                    {/* Result + Tip */}
                    {showResult && (
                        <div style={{
                            marginTop: 12,
                            padding: '10px 16px',
                            borderRadius: 10,
                            background: isCorrect ? 'rgba(32, 201, 151, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            border: `1px solid ${isCorrect ? 'rgba(32, 201, 151, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isCorrect ? '#20C997' : '#EF4444', fontFamily: '"Saira Condensed", sans-serif', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                                {isCorrect ? 'GREAT ANSWER!' : 'WEAK RESPONSE!'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: '"Kanit", sans-serif', lineHeight: 1.5 }}>
                                {currentQuestion.tip}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── VICTORY ── */}
            {phase === 'victory' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: '#20C997',
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: 4,
                        textShadow: '0 0 40px rgba(32, 201, 151, 0.5)',
                        marginBottom: 8,
                    }}>
                        HIRED!
                    </div>
                    <div style={{ fontSize: 16, color: '#aaa', fontFamily: '"Kanit", sans-serif', marginBottom: 6 }}>
                        You impressed {boss.title}!
                    </div>
                    <div style={{ fontSize: 14, color: '#D7EF3F', fontFamily: '"Kanit", sans-serif', marginBottom: 24 }}>
                        District {district + 1} Unlocked!
                    </div>
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 32 }}>
                        <StatBadge label="Coins" value={`+₹${boss.reward.coins}`} color="#FFD600" />
                        <StatBadge label="XP" value={`+${boss.reward.xp}`} color="#3B82F6" />
                    </div>
                    <button onClick={() => onVictory(district, boss.reward.coins, boss.reward.xp)} style={{
                        background: 'linear-gradient(135deg, #20C997, #059669)',
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
                        boxShadow: '0 4px 20px rgba(32, 201, 151, 0.3)',
                    }}>
                        Collect Rewards →
                    </button>
                </div>
            )}

            {/* ── DEFEAT ── */}
            {phase === 'defeat' && (
                <div style={{ textAlign: 'center' }}>
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
                        REJECTED
                    </div>
                    <div style={{ fontSize: 16, color: '#aaa', fontFamily: '"Kanit", sans-serif', marginBottom: 8 }}>
                        {boss.name} wasn't convinced. Keep practicing!
                    </div>
                    <div style={{ fontSize: 14, color: '#EF4444', fontFamily: '"Kanit", sans-serif', marginBottom: 32 }}>
                        -{playerDmg} HP
                    </div>
                    <button onClick={() => onDefeat(playerDmg)} style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#EF4444',
                        padding: '14px 40px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 'bold',
                        fontFamily: '"Saira Condensed", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                    }}>
                        Try Again Later →
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fadeInOverlay { 0% { opacity: 0; } 100% { opacity: 1; } }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{
            background: `${color}12`,
            border: `1px solid ${color}35`,
            borderRadius: 10,
            padding: '10px 18px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: '"Saira Condensed", sans-serif' }}>
                {value}
            </div>
            <div style={{ fontSize: 9, color: '#888', fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
                {label}
            </div>
        </div>
    );
}
