"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./OfferNegotiator.module.css";

interface OfferNegotiatorProps {
    onComplete: (actionId: string) => void;
    isTransitioning: boolean;
}

export default function OfferNegotiator({ onComplete, isTransitioning }: OfferNegotiatorProps) {
    const [leverage, setLeverage] = useState(50);
    const [risk, setRisk] = useState(20);
    const [message, setMessage] = useState("They're waiting for your response.");

    const handleNegotiate = () => {
        if (risk >= 100) {
            setMessage("You pushed too hard. The offer might be rescinded!");
            return;
        }
        setLeverage(prev => Math.min(100, prev + 15));
        setRisk(prev => prev + Math.floor(Math.random() * 30));
        setMessage("You've asked for more. The tension is rising...");
    };

    return (
        <div className={styles.stage}>
            <div className={styles.header}>
                <span className={styles.badge}>FINAL NEGOTIATION</span>
                <h2>THE <span className="text-accent">OFFER</span></h2>
            </div>

            <div className={styles.statusBars}>
                <div className={styles.barGroup}>
                    <div className={styles.barHeader}>
                        <span>PAY LEVERAGE</span>
                        <span>{leverage}%</span>
                    </div>
                    <div className={styles.barBg}>
                        <motion.div className={styles.leverageFill} animate={{ width: `${leverage}%` }} />
                    </div>
                </div>

                <div className={styles.barGroup}>
                    <div className={styles.barHeader}>
                        <span>RESCIND RISK</span>
                        <span>{risk}%</span>
                    </div>
                    <div className={styles.barBg}>
                        <motion.div
                            className={styles.riskFill}
                            animate={{ width: `${risk}%` }}
                            style={{ backgroundColor: risk > 60 ? "var(--accent-danger)" : "var(--accent-warning)" }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.centerStage}>
                <p className={styles.message}>{message}</p>
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.negotiateBtn}
                    onClick={handleNegotiate}
                    disabled={isTransitioning || risk >= 100}
                >
                    PUSH FOR MORE
                </button>
                <div className={styles.finalChoices}>
                    <button
                        className={styles.acceptBtn}
                        onClick={() => onComplete("offer_accept")}
                        disabled={isTransitioning}
                    >
                        ACCEPT OFFER
                    </button>
                    <button
                        className={styles.rejectBtn}
                        onClick={() => onComplete("offer_reject")}
                        disabled={isTransitioning}
                    >
                        REJECT & WALK AWAY
                    </button>
                </div>
            </div>
        </div>
    );
}
