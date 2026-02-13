"use client";

import { useGameStore } from "@/store/gameStore";
import { SCENARIO_POOL } from "@/engine/scenarios";
import { Choice } from "@/engine/types";
import Avatar from "./Avatar";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./MailClient.module.css";

export default function MailClient() {
    const { currentScenarioId, makeChoice, notifications } = useGameStore();

    // 1. Resolve Scenario Content
    // In a real app, this might come from the store (if loaded) or a hook
    const scenario = SCENARIO_POOL.find(s => s.id === currentScenarioId);

    if (!scenario) {
        return (
            <div className={styles.mailContainer}>
                <div className="p-8 text-center text-slate-500">
                    Thinking... (No scenario loaded)
                </div>
            </div>
        );
    }

    const { sender } = scenario;

    return (
        <div className={styles.mailContainer}>
            {/* Professional Header HUD */}
            <header className={styles.mailHeader}>
                <div className={styles.headerMain}>
                    <h2 className={styles.mainTitle}>CAREER INBOX</h2>
                </div>
                <div className={styles.authInfo}>
                    <div>SECURE CONNECTION ESTABLISHED</div>
                </div>
            </header>

            {/* Sender Info Card */}
            <div className={styles.profileHeader}>
                <Avatar type={sender.avatar} size={64} mood="neutral" />
                <div className={styles.senderMeta}>
                    <h3 className={styles.senderName}>{sender.name}</h3>
                    {sender.role && <div className={styles.senderRole}>{sender.role}</div>}
                </div>
                <div className={styles.urgentBar}>
                    <span className={styles.urgentTag}>Action Required</span>
                </div>
            </div>

            {/* Narrative Area */}
            <main className={styles.mailBody}>
                <div className={styles.transmitLabel}>INCOMING MESSAGE</div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={scenario.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={styles.messageContent}
                    >
                        <div className={styles.narrativeText}>
                            {scenario.text}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Strategy Selector Interface */}
            <footer className={styles.footerActions}>
                <div className={styles.actionHeader}>
                    <span className={styles.actionLabel}>Select Response</span>
                </div>
                <div className={styles.replyGrid}>
                    {scenario.choices.map((choice: Choice) => (
                        <motion.button
                            key={choice.id}
                            whileHover={{ scale: 1.01, x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            className={styles.replyBtn}
                            onClick={() => makeChoice(choice.id)}
                        >
                            <span className={styles.arrow}>→</span>
                            <span className={styles.btnTitle}>{choice.text}</span>
                            {choice.description && (
                                <span className={styles.btnDesc}>{choice.description}</span>
                            )}
                        </motion.button>
                    ))}
                </div>
            </footer>
        </div>
    );
}
