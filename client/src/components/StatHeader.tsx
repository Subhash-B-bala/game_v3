"use client";

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import styles from './StatHeader.module.css';

const StatItem = ({ emoji, label, value, themeClass, prefix = '', suffix = '' }: any) => (
    <motion.div
        whileHover={{ scale: 1.05, translateY: -2 }}
        className={styles.statItem}
    >
        <div className={styles.statGlow} />
        <div className={styles.statInner}>
            <div className={`${styles.accentBar} ${styles[themeClass]}`} />

            <div className={styles.iconBox}>
                {emoji}
            </div>

            <div className={styles.infoBox}>
                <span className={styles.label}>{label}</span>
                <div className={styles.valueContainer}>
                    <span className={styles.value}>
                        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                    </span>
                </div>
            </div>

            <div className={styles.decorativeIcon}>
                {emoji}
            </div>
        </div>
    </motion.div>
);

const StatHeader = ({ isSidebar = false }: { isSidebar?: boolean }) => {
    const { stats, months } = useGameStore();
    const hasJob = stats.salary > 0;

    const yearsExp = (months / 12).toFixed(1);
    const salaryLakhs = (stats.salary / 100000).toFixed(1);
    const savingsLakhs = (stats.savings / 100000).toFixed(1);

    const containerStyle = isSidebar ? styles.sidebarStats : styles.headerContainer;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={containerStyle}
        >
            <div className={isSidebar ? styles.sidebarGroup : "flex gap-4"}>
                <StatItem emoji="⚡" label="Energy" value={Math.round(stats.energy * 100)} suffix="%" themeClass="conf" />
                <StatItem emoji="🤯" label="Stress" value={Math.round(stats.stress * 100)} suffix="%" themeClass="health" />
            </div>

            {!isSidebar && <div className={styles.divider} />}

            <div className={isSidebar ? styles.sidebarGroup : "flex gap-4"}>
                <StatItem emoji="🏢" label="Years Exp" value={yearsExp} suffix="y" themeClass="exp" />
                <StatItem emoji="🤝" label="Reputation" value={Math.round(stats.reputation * 100)} themeClass="rep" />
            </div>

            {!isSidebar && <div className={styles.divider} />}

            <div className={isSidebar ? styles.sidebarGroup : "flex gap-4"}>
                <StatItem emoji="💰" label="Savings" value={savingsLakhs} prefix="₹" suffix="L" themeClass="savings" />
                {hasJob && (
                    <StatItem emoji="💼" label="Salary" value={salaryLakhs} prefix="₹" suffix="L" themeClass="salary" />
                )}
            </div>
        </motion.div>
    );
};

export default StatHeader;
