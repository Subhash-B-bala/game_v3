"use client";

import { useGameStore } from "@/store/gameStore";
import styles from "./BackgroundStage.module.css";
import { useState } from "react";

interface BackgroundStageProps {
    imageUrl?: string;
}

/**
 * A simple 2D stage that displays high-quality static visuals
 * with subtle atmospheric animations to maintain realism.
 */
export default function BackgroundStage({ imageUrl = "/game/interview_bg.jpg" }: BackgroundStageProps) {
    const [error, setError] = useState(false);

    // Potential for future effects: zoom, shake, color correction
    return (
        <div className={styles.stageContainer}>
            <div className={styles.imageWrapper}>
                {!error ? (
                    <img
                        src={imageUrl}
                        alt="Scene Background"
                        className={styles.backgroundImage}
                        onError={() => setError(true)}
                    />
                ) : (
                    <div className={styles.fallbackStage}>
                        <div className={styles.officeSilhouette} />
                    </div>
                )}
                <div className={styles.overlay} />
            </div>

            {/* Subtle atmospheric particles or light shifts could go here */}
            <div className={styles.atmosphericLight} />
        </div>
    );
}
