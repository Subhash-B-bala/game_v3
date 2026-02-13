import { useGameStore } from "@/store/gameStore";
import { SCENARIO_POOL } from "@/engine/scenarios";
import StatHeader from "./StatHeader";
import SkillFooter from "./SkillFooter";
import MailClient from "./MailClient";
import VideoMeeting from "./VideoMeeting";
import TaskBoard from "./TaskBoard";
import Avatar, { AvatarType } from "./Avatar";
import NotificationSystem from "./NotificationSystem";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Workspace.module.css";
import dynamic from "next/dynamic";

const JobHuntChapter = dynamic(() => import("@/engine/chapter3_job_hunt/JobHuntChapter"), { ssr: false });

export default function Workspace() {
    const { currentScenarioId, role, characterName, characterAvatar, uiPhase } = useGameStore();

    // Derived state
    const currentScenario = SCENARIO_POOL.find(s => s.id === currentScenarioId);
    // Use SCENARIO_POOL (typo fix in next line if I made one, but I'll use the imported name)

    // Determine which "App" to show based on the scenario type
    const renderActiveComponent = () => {
        if (uiPhase === 'jobhunt') {
            return <JobHuntChapter />;
        }

        if (!currentScenario) return <MailClient />; // Default/Loading state

        const type = currentScenario.type || 'text';

        if (type === 'meeting') {
            return <VideoMeeting />;
        }

        if (type === 'taskboard') {
            return <TaskBoard />;
        }

        return <MailClient />;
    };

    return (
        <div className={styles.v4Container}>
            <NotificationSystem />
            {/* V4 Structural Sidebar */}
            <aside className={styles.v4Sidebar}>
                <div className={styles.sidebarBrand}>
                    <div className={styles.brandDot} />
                    <span>CAREER PORTAL</span>
                </div>

                <div className={styles.profileSection}>
                    <div className={styles.avatarBox}>
                        <Avatar type={characterAvatar} size={80} mood="happy" />
                    </div>
                    <div className={styles.profileMeta}>
                        <div className={styles.metaLabel}>PROFILE</div>
                        <div className={styles.userNameDisplay}>{characterName || "GUEST"}</div>
                    </div>
                </div>

                <nav className={styles.sidebarNav}>
                    <div className={styles.navGroup}>
                        <div className={styles.groupHeader}>STATS</div>
                        <StatHeader isSidebar />
                    </div>

                    <div className={styles.navGroup}>
                        <div className={styles.groupHeader}>SKILLS</div>
                        <SkillFooter isSidebar />
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.versionTag}>CAREER SIMULATOR v4.0</div>
                </div>
            </aside >

            {/* V4 Primary Stage */}
            < main className={styles.v4Main} >
                <header className={styles.panelHeader}>
                    <div className={styles.breadcrumbs}>
                        <span className={styles.crumbRoot}>CAREER PORTAL</span>
                        <span className={styles.crumbDivider}>/</span>
                        <span className={styles.crumbActive}>
                            {uiPhase === 'game' ? 'INBOX' : 'ONBOARDING'}
                        </span>
                    </div>
                    <div className={styles.systemTime}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                </header>

                <div className={styles.stageContent}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentScenarioId || 'loading'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className={styles.appContainer}
                        >
                            {renderActiveComponent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main >
        </div >
    );
}
