"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./InterviewDuel.module.css";
import { useGameStore } from "@/store/gameStore";

interface InterviewDuelProps {
    scenarioTitle: string;
    actions: Array<{ id: string; label: string; desc: string }>;
    onAction: (actionId: string) => void;
    isTransitioning: boolean;
}

export default function InterviewDuel({ scenarioTitle, actions, onAction, isTransitioning }: InterviewDuelProps) {
    const store = useGameStore();
    const [nerve, setNerve] = useState(80);
    const [skepticism, setSkepticism] = useState(60);

    // Effect: Tactical proof influence (simplified)
    useEffect(() => {
        if (store.resumeAllocation) {
            const { technical, soft_skills } = store.resumeAllocation;
            if (technical > 3) setSkepticism(s => Math.max(0, s - 10)); // Head start if technical is high
            if (soft_skills > 3) setNerve(n => Math.min(100, n + 10)); // More nerve if soft skills are high
        }
    }, [store.resumeAllocation]);

    return (
        <div className={styles.stage}>
            {/* Background/Environment */}
            <div className={styles.environment}>
                <div className={styles.interviewerSilhouette} />
            </div>

            {/* Duel Meters */}
            <div className={styles.meters}>
                <div className={styles.meterGroup}>
                    <div className={styles.meterHeader}>
                        <span className={styles.meterLabel}>YOUR NERVE</span>
                        <span className={styles.meterValue}>{nerve}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <motion.div
                            className={styles.nerveFill}
                            animate={{ width: `${nerve}%` }}
                            style={{ background: nerve < 30 ? "var(--accent-danger)" : "var(--primary-blue)" }}
                        />
                    </div>
                </div>

                <div className={styles.meterGroup}>
                    <div className={styles.meterHeader}>
                        <span className={styles.meterLabel}>THEIR SKEPTICISM</span>
                        <span className={styles.meterValue}>{skepticism}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <motion.div
                            className={styles.skepticismFill}
                            animate={{ width: `${skepticism}%` }}
                            style={{ background: skepticism > 70 ? "var(--accent-danger)" : "var(--primary-purple)" }}
                        />
                    </div>
                </div>
            </div>

            {/* Dialogue Area */}
            <div className={styles.dialogueArea}>
                <motion.div
                    className={styles.questionBox}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <span className={styles.speakerTag}>INTERVIEWER</span>
                    <p className={styles.questionText}>{scenarioTitle}</p>
                </motion.div>

                <div className={styles.actionGrid}>
                    {actions.map((action, idx) => (
                        <motion.button
                            key={action.id}
                            className={styles.actionCard}
                            whileHover={{ scale: 1.02, backgroundColor: "var(--bg-surface-hover)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                // Tactical feedback
                                if (action.id.includes("technical")) setSkepticism(s => Math.max(0, s - 15));
                                else if (action.id.includes("honest")) setSkepticism(s => Math.max(0, s - 5));
                                else if (action.id.includes("pad")) setSkepticism(s => Math.min(100, s + 10));

                                setNerve(n => Math.max(0, n - 10));
                                onAction(action.id);
                            }}
                            disabled={isTransitioning}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className={styles.actionHeader}>
                                <span className={styles.actionNum}>0{idx + 1}</span>
                                <h3>{action.label}</h3>
                            </div>
                            <p>{action.desc}</p>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
