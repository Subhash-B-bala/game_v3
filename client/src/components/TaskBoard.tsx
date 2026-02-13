"use client";

import { useGameStore, SCENE_FLOW } from "@/store/gameStore";
import { submitAction } from "@/lib/api";
import { SCENE_ACTIONS } from "@/constants/actions";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./TaskBoard.module.css";

export default function TaskBoard() {
    const { sessionId, sceneIndex, advanceToNextScene } = useGameStore();
    const currentScene = SCENE_FLOW[sceneIndex];
    const actions = SCENE_ACTIONS[currentScene.scenarioId] || [];

    const handleAction = async (actionId: string) => {
        if (!sessionId) return;
        try {
            await submitAction(sessionId, currentScene.scenarioId, actionId);
            advanceToNextScene();
        } catch (error) {
            console.error("TaskBoard error:", error);
        }
    };

    return (
        <div className={styles.boardContainer}>
            {/* Header HUD */}
            <header className={styles.boardHeader}>
                <div className={styles.titleArea}>
                    <div className={styles.statusInfo}>
                        <div className={styles.dot} />
                        <span className={styles.statusLabel}>Sprint Active // Cycle 04</span>
                    </div>
                    <h2 className={styles.mainTitle}>AGILE MATRIX</h2>
                </div>
            </header>

            {/* Kanban Stage */}
            <div className={styles.kanbanGrid}>
                {/* Column: To Do */}
                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <div className={styles.colIndicator} />
                        <span className={styles.colLabel}>Planned</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={styles.card}
                    >
                        <span className={styles.cardTitle}>Future Milestone</span>
                        <p className={styles.cardDesc}>Technical debt mitigation and infrastructure scaling roadmap.</p>
                    </motion.div>
                </div>

                {/* Column: In Progress (Active Task) */}
                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <div className={styles.colIndicator} style={{ backgroundColor: '#a855f7' }} />
                        <span className={styles.colLabel} style={{ color: '#a855f7' }}>In Progress</span>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {actions.map((opt: any, idx: number) => (
                            <motion.button
                                key={opt.id || idx}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`${styles.card} ${styles.cardActive}`}
                                onClick={() => handleAction(opt.id)}
                            >
                                <div className={styles.cardGlow} />
                                <span className={styles.cardTitle}>{opt.label || "Core Task"}</span>
                                <p className={styles.cardDesc}>{opt.desc || "Synthesizing project requirements for immediate deployment."}</p>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
