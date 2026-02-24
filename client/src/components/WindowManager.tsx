"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import styles from "./WindowManager.module.css";

import MailClient from "./MailClient";
import VideoMeeting from "./VideoMeeting";
import TaskBoard from "./TaskBoard";

const TerminalApp = () => (
    <div style={{ padding: 'var(--space-md)', background: '#000', height: '100%', color: '#27c93f', fontFamily: 'monospace', fontSize: '14px' }}>
        <p>Codebasics Terminal v1.0.4</p>
        <p>$ login --user analytics_lead</p>
        <p>Access granted. Welcome to the workspace.</p>
    </div>
);

const BrowserApp = () => (
    <div style={{ padding: 'var(--space-lg)', height: '100%', background: '#fff' }}>
        <div style={{ height: '32px', background: '#f1f3f4', borderRadius: '4px', marginBottom: '16px' }} />
        <p style={{ color: '#333' }}>Connecting to CareerBoard...</p>
    </div>
);

const APP_MAP: Record<string, { title: string; component: React.ComponentType }> = {
    mail: { title: "Outlook - Work", component: MailClient },
    meeting: { title: "Teams - Video Call", component: VideoMeeting },
    tasks: { title: "TaskBoard - Agile", component: TaskBoard },
    terminal: { title: "zsh -- /users/analytics", component: TerminalApp },
    browser: { title: "CareerBoard - Chrome", component: BrowserApp },
};

export default function WindowManager() {
    // TODO: openWindows, activeWindow, focusWindow, closeWindow don't exist in store
    const store = useGameStore();
    const openWindows: string[] = []; // Temporarily disabled
    const activeWindow = null;
    const focusWindow = (id: string) => console.log("Focus:", id);
    const closeWindow = (id: string) => console.log("Close:", id);

    return (
        <div className={styles.windowLayer}>
            <AnimatePresence>
                {openWindows.map((id) => {
                    const app = APP_MAP[id];
                    if (!app) return null;

                    return (
                        <motion.div
                            key={id}
                            className={`window-frame ${styles.window} ${activeWindow === id ? styles.active : ""}`}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onMouseDown={() => focusWindow(id)}
                            style={{ zIndex: activeWindow === id ? 100 : 10 }}
                        >
                            <div className="window-header">
                                <div className={styles.controls}>
                                    <div className="window-control control-close" onClick={(e) => { e.stopPropagation(); closeWindow(id); }} />
                                    <div className="window-control control-min" />
                                    <div className="window-control control-max" />
                                </div>
                                <span className={styles.windowTitle}>{app.title}</span>
                            </div>
                            <div className={styles.windowContent}>
                                <app.component />
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
