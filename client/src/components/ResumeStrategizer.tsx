"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ResumeStrategizer.module.css";
import { useGameStore } from "@/store/gameStore";

interface EffortAllocation {
    id: string;
    label: string;
    points: number;
}

interface ResumeStrategizerProps {
    onComplete: (allocation: Record<string, number>) => void;
}

export default function ResumeStrategizer({ onComplete }: ResumeStrategizerProps) {
    const [points, setPoints] = useState(10);
    const [efforts, setEfforts] = useState<EffortAllocation[]>([
        { id: "technical", label: "Technical Depth", points: 0 },
        { id: "projects", label: "Projects & Impact", points: 0 },
        { id: "soft_skills", label: "Communication/Soft Skills", points: 0 },
        { id: "visuals", label: "Formatting & Design", points: 0 },
    ]);

    const handleAdjust = (id: string, delta: number) => {
        if (delta > 0 && points <= 0) return;

        setEfforts(prev => prev.map(e => {
            if (e.id === id) {
                const newVal = Math.max(0, e.points + delta);
                // Only allow increase if we have points, and decrease if points > 0
                if (delta > 0 && points > 0) {
                    setPoints(p => p - 1);
                    return { ...e, points: e.points + 1 };
                } else if (delta < 0 && e.points > 0) {
                    setPoints(p => p + 1);
                    return { ...e, points: e.points - 1 };
                }
            }
            return e;
        }));
    };

    const isReady = points === 0;

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            <div className={styles.header}>
                <span className={styles.badge}>CHAPTER 2: TACTICAL PHASE</span>
                <h2>RESUME <span className="text-accent">STRATEGIZER</span></h2>
                <p className={styles.instruction}>
                    Allocate your limited <strong>Effort Points</strong> to build your profile.
                    Your choices will unlock specific advantages in the interview.
                </p>
            </div>

            <div className={styles.pointPool}>
                <div className={styles.poolLabel}>EFFORT POINTS REMAINING</div>
                <motion.div
                    className={styles.poolValue}
                    key={points}
                    initial={{ scale: 1.2, color: "var(--secondary-lime)" }}
                    animate={{ scale: 1, color: "var(--primary-white)" }}
                >
                    {points}
                </motion.div>
            </div>

            <div className={styles.grid}>
                {efforts.map((eff) => (
                    <div key={eff.id} className={styles.row}>
                        <div className={styles.labelSection}>
                            <span className={styles.rowLabel}>{eff.label}</span>
                            <div className={styles.barContainer}>
                                <motion.div
                                    className={styles.barFill}
                                    animate={{ width: `${(eff.points / 5) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className={styles.controls}>
                            <button
                                className={styles.adjustBtn}
                                onClick={() => handleAdjust(eff.id, -1)}
                                disabled={eff.points === 0}
                            >
                                -
                            </button>
                            <span className={styles.pointValue}>{eff.points}</span>
                            <button
                                className={styles.adjustBtn}
                                onClick={() => handleAdjust(eff.id, 1)}
                                disabled={points === 0 || eff.points >= 5}
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <button
                    className="btn-primary"
                    disabled={!isReady}
                    onClick={() => {
                        const result = efforts.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.points }), {});
                        onComplete(result);
                    }}
                >
                    GENERATE RESUME
                </button>
                {!isReady && <p className={styles.footerHint}>Allocate all points to proceed</p>}
            </div>
        </motion.div>
    );
}
