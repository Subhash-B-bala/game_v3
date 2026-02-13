"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ApplicationBlitz.module.css";

interface JobPost {
    id: string;
    company: string;
    role: string;
    fit: number; // 0-100
    energyCost: number;
}

interface ApplicationBlitzProps {
    onComplete: (appliedCount: number, strategy: string) => void;
}

const SAMPLE_JOBS: JobPost[] = [
    { id: "1", company: "TechNova", role: "Junior Data Analyst", fit: 85, energyCost: 10 },
    { id: "2", company: "DataFlow", role: "BI Intern", fit: 92, energyCost: 15 },
    { id: "3", company: "GlobalSystems", role: "Junior SQL Dev", fit: 60, energyCost: 5 },
    { id: "4", company: "InnoSoft", role: "Data Engineer I", fit: 75, energyCost: 12 },
    { id: "5", company: "SmallBiz", role: "Lead Everything", fit: 40, energyCost: 20 },
    { id: "6", company: "BigBank", role: "Data Scrubber", fit: 80, energyCost: 8 },
    { id: "7", company: "CloudPipes", role: "Pipeline Specialist", fit: 70, energyCost: 10 },
    { id: "8", company: "InsightCo", role: "Visualization Expert", fit: 95, energyCost: 18 },
];

export default function ApplicationBlitz({ onComplete }: ApplicationBlitzProps) {
    const [energy, setEnergy] = useState(100);
    const [appliedCount, setAppliedCount] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [isGameOver, setIsGameOver] = useState(false);

    useEffect(() => {
        if (timeLeft > 0 && !isGameOver) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isGameOver) {
            handleGameOver();
        }
    }, [timeLeft, isGameOver]);

    const handleApply = (fit: number, cost: number) => {
        if (energy >= cost) {
            setEnergy(prev => prev - cost);
            setAppliedCount(prev => prev + 1);
            nextJob();
        }
    };

    const nextJob = () => {
        if (currentIndex < SAMPLE_JOBS.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleGameOver();
        }
    };

    const handleGameOver = () => {
        setIsGameOver(true);
        // Determine strategy based on appliedCount
        let strategy = "apply_targeted";
        if (appliedCount > 5) strategy = "apply_mass";
        else if (appliedCount < 3) strategy = "apply_referral"; // Low application count implies "quality/referral" focus

        setTimeout(() => onComplete(appliedCount, strategy), 1500);
    };

    const currentJob = SAMPLE_JOBS[currentIndex];

    return (
        <div className={styles.stage}>
            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>ENERGY</span>
                    <div className={styles.energyBar}>
                        <motion.div
                            className={styles.energyFill}
                            animate={{ width: `${energy}%` }}
                            style={{ background: energy < 30 ? "var(--accent-danger)" : "var(--secondary-teal)" }}
                        />
                    </div>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>TIME</span>
                    <span className={styles.timer}>{timeLeft}s</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>APPLIED</span>
                    <span className={styles.counter}>{appliedCount}</span>
                </div>
            </div>

            <div className={styles.jobArea}>
                <AnimatePresence mode="wait">
                    {!isGameOver ? (
                        <motion.div
                            key={currentJob.id}
                            className={styles.jobCard}
                            initial={{ x: 200, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -200, opacity: 0 }}
                        >
                            <h3 className={styles.role}>{currentJob.role}</h3>
                            <p className={styles.company}>{currentJob.company}</p>

                            <div className={styles.fitIndicator}>
                                <span>MATCH SCORE</span>
                                <div className={styles.fitValue} style={{ color: currentJob.fit > 80 ? "var(--secondary-lime)" : "var(--primary-white)" }}>
                                    {currentJob.fit}%
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button className={styles.skipBtn} onClick={nextJob}>SKIP</button>
                                <button
                                    className={styles.applyBtn}
                                    onClick={() => handleApply(currentJob.fit, currentJob.energyCost)}
                                    disabled={energy < currentJob.energyCost}
                                >
                                    APPLY (-{currentJob.energyCost} Energy)
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            className={styles.gameOver}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <h2>BLITZ COMPLETE</h2>
                            <p>You submitted {appliedCount} applications.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
