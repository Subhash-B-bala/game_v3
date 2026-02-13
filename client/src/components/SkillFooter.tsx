"use client";

import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import styles from './SkillFooter.module.css';

const StatBar = ({ label, value, colorClass = 'purple' }: { label: string; value: number; colorClass?: string }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className={styles.barItem}
    >
        <div className={styles.barMeta}>
            <span className={styles.barLabel}>{label}</span>
            <span className={styles.barValue}>{Math.round(value * 100)}</span>
        </div>
        <div className={styles.barTrack}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`${styles.barFill} ${styles[colorClass]}`}
            />
        </div>
    </motion.div>
);

const SkillFooter = ({ isSidebar = false }: { isSidebar?: boolean }) => {
    const { stats } = useGameStore();

    const content = (
        <div className={isSidebar ? styles.sidebarSkills : styles.gridSystem}>
            {/* Technical Domain */}
            <div className={styles.domainSection}>
                {!isSidebar && (
                    <div className={styles.domainHeader}>
                        <div className={`${styles.domainLine} ${styles.domainLineLeft}`} />
                        <span className={styles.domainLabel}>Technical Arsenal</span>
                        <div className={styles.domainLine} />
                    </div>
                )}
                <div className={`${styles.skillGrid} ${isSidebar ? styles.vGrid : styles.skillGridTechnical}`}>
                    <StatBar label="SQL" value={stats.sql} colorClass="blue" />
                    <StatBar label="Python" value={stats.python} colorClass="green" />
                    <StatBar label="Excel" value={stats.excel} colorClass="green" />
                    <StatBar label="Power BI" value={stats.powerbi} colorClass="yellow" />
                    <StatBar label="Cloud" value={stats.cloud} colorClass="blue" />
                    <StatBar label="ML" value={stats.ml} colorClass="purple" />
                </div>
            </div>

            {/* Professional Domain */}
            <div className={styles.domainSection}>
                {!isSidebar && (
                    <div className={styles.domainHeader}>
                        <div className={`${styles.domainLine} ${styles.domainLineLeft}`} />
                        <span className={styles.domainLabel}>Professional Core</span>
                        <div className={styles.domainLine} />
                    </div>
                )}
                <div className={`${styles.skillGrid} ${isSidebar ? styles.vGrid : styles.skillGridProfessional}`}>
                    <StatBar label="Comms" value={stats.communication} colorClass="purple" />
                    <StatBar label="Stakeholder" value={stats.stakeholder_mgmt} colorClass="yellow" />
                    <StatBar label="Problem Solving" value={stats.problem_solving} colorClass="red" />
                    <StatBar label="Leadership" value={stats.leadership} colorClass="purple" />
                </div>
            </div>
        </div>
    );

    if (isSidebar) return content;

    return (
        <div className={styles.footerWrapper}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.footerInner}
            >
                {content}
            </motion.div>
        </div>
    );
};

export default SkillFooter;
