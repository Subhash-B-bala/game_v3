"use client";

import { useState } from "react";
import { useGameStore, SCENE_FLOW } from "@/store/gameStore";
import { submitAction } from "@/lib/api";
import { SCENE_ACTIONS } from "@/constants/actions";
import Avatar, { AvatarType } from "./Avatar";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./VideoMeeting.module.css";

export default function VideoMeeting() {
    const { sessionId, sceneIndex, narrative, setNarrative, advanceToNextScene, stats, currentScenario, loadDynamicScenario, phase } = useGameStore();
    const [joined, setJoined] = useState(false);

    const currentScene = SCENE_FLOW[sceneIndex] || SCENE_FLOW[0];
    const isDynamic = phase === "dynamic_loop";
    const activeScenario = isDynamic ? currentScenario : null;
    const actions = activeScenario?.actions || SCENE_ACTIONS[currentScene?.scenarioId] || [];

    const handleJoin = () => setJoined(true);

    const handleAction = async (actionId: string) => {
        if (!sessionId) return;
        try {
            const sid = (isDynamic ? activeScenario?.scenarioId : currentScene.scenarioId) || "";
            const result = await submitAction(sessionId, sid, actionId);

            if (isDynamic) {
                setNarrative({ text: result.narrative });
                await loadDynamicScenario();
            } else {
                advanceToNextScene();
                setNarrative({ text: result.narrative });
            }
        } catch (error) {
            console.error("Meeting error:", error);
        }
    };

    if (!joined) {
        return (
            <div className={styles.meetingContainer}>
                <div className={styles.joinScreen}>
                    <div className={styles.lobbyTitle}>Technical Interview</div>
                    <button className={styles.joinBtn} onClick={handleJoin}>
                        JOIN MEETING
                    </button>
                    <p style={{ opacity: 0.5 }}>Please check your microphone.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.meetingContainer}>
            {/* Header Area */}
            <header className={styles.meetingHeader}>
                <div className={styles.titleArea}>
                    <div className={styles.liveLabel}>
                        <div className={styles.dot} />
                        <span className={styles.labelText}>Live Boardroom Link</span>
                    </div>
                    <h2 className={styles.mainTitle}>VIRTUAL MEETING</h2>
                </div>
            </header>

            {/* Video Grid */}
            <div className={styles.meetingGrid}>
                {/* Interviewer Feed */}
                <motion.div
                    layout
                    className={styles.participantCard}
                >
                    <Avatar type={(activeScenario?.avatar as AvatarType) || "manager"} size={150} mood="neutral" />
                    <div className={styles.nameTag}>
                        <span className={styles.tagName}>{activeScenario?.title || "Department Lead"} (Interviewer)</span>
                    </div>
                </motion.div>

                {/* Player Feed */}
                <motion.div
                    layout
                    className={styles.participantCard}
                >
                    <Avatar type={(useGameStore.getState().roleChoice as AvatarType) || 'analyst'} size={150} mood="neutral" />
                    <div className={styles.nameTag}>
                        <span className={styles.tagName}>You (Neural Link)</span>
                    </div>
                </motion.div>
            </div>

            {/* Response Area */}
            <div className={styles.responseArea}>
                <div className={styles.responseGrid}>
                    {actions.map((action: any) => (
                        <motion.button
                            key={action.actionId || action.id}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className={styles.responseBtn}
                            onClick={() => handleAction(action.actionId || action.id)}
                        >
                            <span className={styles.btnTitle}>{action.label}</span>
                            <span className={styles.btnDesc}>{action.desc}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
