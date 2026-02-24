"use client";

import React from 'react';

export type AvatarMood = 'happy' | 'sad' | 'worried' | 'neutral';
export type AvatarType =
    | 'fresher' | 'analyst' | 'engineer' | 'manager' | 'mentor'
    | 'scammer' | 'stressed' | 'success' | 'recruiter'
    | 'family' | 'intl' | 'founder' | 'peer' | 'codebasics' | 'system';

interface AvatarProps {
    type: AvatarType;
    size?: number;
    mood?: AvatarMood;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ type, size = 64, mood = 'neutral', className }) => {
    if (type === 'codebasics') {
        return (
            <div
                className={className}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #2563eb',
                    boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)'
                }}
            >
                <img
                    src="/codebasics.png"
                    alt="Codebasics"
                    style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                />
            </div>
        );
    }

    const expressions = {
        happy: { eyeY: 42, mouth: 'M35 62Q50 75 65 62' },
        sad: { eyeY: 46, mouth: 'M35 68Q50 60 65 68' },
        worried: { eyeY: 44, mouth: 'M38 66Q50 63 62 66' },
        neutral: { eyeY: 44, mouth: 'M38 64Q50 68 62 64' },
    };
    const e = expressions[mood] || expressions.neutral;

    const configs = {
        fresher: { skin: '#FFE0BD', hair: '#4A3728', acc: 'cap' },
        analyst: { skin: '#FFCD94', hair: '#333', acc: 'glasses' },
        engineer: { skin: '#FFE0BD', hair: '#1a1a1a', acc: 'headphones' },
        manager: { skin: '#FFCD94', hair: '#333', acc: 'tie' },
        mentor: { skin: '#FFCD94', hair: '#9CA3AF', acc: 'beard' },
        scammer: { skin: '#FFCD94', hair: '#1a1a1a', acc: 'shades' },
        stressed: { skin: '#FFE0BD', hair: '#4A3728', acc: 'sweat' },
        success: { skin: '#FFE0BD', hair: '#333', acc: 'crown' },
        recruiter: { skin: '#FFE0BD', hair: '#F59E0B', acc: 'headset' },
        family: { skin: '#FFE0BD', hair: '#4A3728', acc: 'heart' },
        intl: { skin: '#FFCD94', hair: '#333', acc: 'globe' },
        founder: { skin: '#FFE0BD', hair: '#333', acc: 'bulb' },
        peer: { skin: '#FFCD94', hair: '#5D4037', acc: 'glasses' },
        system: { skin: '#B0BEC5', hair: '#37474F', acc: 'none' }, // Robot/system avatar
    };
    const c = configs[type] || configs.analyst;

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="38" fill={c.skin} stroke="#E8B88A" strokeWidth="2" />
            <path d="M18 38Q50 8 82 38L78 48Q50 22 22 48Z" fill={c.hair} />
            <ellipse cx="35" cy={e.eyeY} rx="6" ry="7" fill="white" />
            <ellipse cx="65" cy={e.eyeY} rx="6" ry="7" fill="white" />
            <circle cx="35" cy={e.eyeY + 1} r="3.5" fill="#333" />
            <circle cx="65" cy={e.eyeY + 1} r="3.5" fill="#333" />
            <circle cx="36" cy={e.eyeY} r="1.5" fill="white" />
            <circle cx="66" cy={e.eyeY} r="1.5" fill="white" />
            <path d={e.mouth} stroke="#E85A5A" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="25" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.5" />
            <ellipse cx="75" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.5" />
            {c.acc === 'cap' && <><ellipse cx="50" cy="18" rx="35" ry="10" fill="#4169E1" /><rect x="15" y="15" width="70" height="12" fill="#4169E1" /><text x="50" y="24" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">NEW</text></>}
            {c.acc === 'glasses' && <><rect x="25" y="38" width="18" height="13" rx="3" fill="none" stroke="#333" strokeWidth="2" /><rect x="57" y="38" width="18" height="13" rx="3" fill="none" stroke="#333" strokeWidth="2" /><line x1="43" y1="44" x2="57" y2="44" stroke="#333" strokeWidth="2" /></>}
            {c.acc === 'shades' && <><rect x="23" y="38" width="22" height="13" rx="3" fill="#111" /><rect x="55" y="38" width="22" height="13" rx="3" fill="#111" /></>}
            {c.acc === 'headphones' && <><path d="M15 50Q10 30 25 20" stroke="#333" strokeWidth="4" fill="none" /><path d="M85 50Q90 30 75 20" stroke="#333" strokeWidth="4" fill="none" /><ellipse cx="14" cy="52" rx="6" ry="8" fill="#333" /><ellipse cx="86" cy="52" rx="6" ry="8" fill="#333" /></>}
            {c.acc === 'beard' && <ellipse cx="50" cy="72" rx="22" ry="18" fill={c.hair} opacity="0.7" />}
            {c.acc === 'crown' && <path d="M25 22L30 10L40 17L50 4L60 17L70 10L75 22Z" fill="#FFD700" stroke="#FFA500" strokeWidth="2" />}
            {c.acc === 'sweat' && <ellipse cx="78" cy="35" rx="4" ry="6" fill="#87CEEB" />}
            {c.acc === 'tie' && <><path d="M30 85Q50 78 70 85L75 100L25 100Z" fill="#2C3E50" /><path d="M50 80L46 95L50 100L54 95Z" fill="#DC2626" /></>}
            {c.acc === 'bulb' && <ellipse cx="78" cy="18" rx="10" ry="12" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="2" />}
            {c.acc === 'globe' && <circle cx="78" cy="20" r="12" fill="#3498DB" stroke="#2980B9" strokeWidth="2" />}
        </svg>
    );
};

export default Avatar;
