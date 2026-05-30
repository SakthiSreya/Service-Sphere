import React from 'react';
import { useTheme } from './ThemeContext';

const LogoIcon = ({ size = 36, id = "logo" }) => {
    const { theme } = useTheme();
    const edgeOpacity = theme === 'dark' ? 0.6 : 0.7;
    const spokeOpacity = theme === 'dark' ? 0.9 : 0.7;
    const centerFill = theme === 'dark' ? '#1a1b2e' : '#f0f4ff';
    const gradId = `grad-${id}`;

    return (
        <svg width={size} height={size} viewBox="53 43 134 140" fill="none">
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f9cf9" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
            <line x1="120" y1="60" x2="170" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="120" y1="60" x2="170" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="120" y1="60" x2="120" y2="176" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="120" y1="60" x2="70" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="120" y1="60" x2="70" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="170" y1="89" x2="170" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="170" y1="89" x2="120" y2="176" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="170" y1="89" x2="70" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="170" y1="89" x2="70" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="170" y1="147" x2="120" y2="176" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="170" y1="147" x2="70" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="170" y1="147" x2="70" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="120" y1="176" x2="70" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="120" y1="176" x2="70" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="70" y1="147" x2="70" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.2" opacity={edgeOpacity} />
            <line x1="120" y1="118" x2="120" y2="60" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" opacity={spokeOpacity} />
            <line x1="120" y1="118" x2="170" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" opacity={spokeOpacity} />
            <line x1="120" y1="118" x2="170" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" opacity={spokeOpacity} />
            <line x1="120" y1="118" x2="120" y2="176" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" opacity={spokeOpacity} />
            <line x1="120" y1="118" x2="70" y2="147" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" opacity={spokeOpacity} />
            <line x1="120" y1="118" x2="70" y2="89" stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round" opacity={spokeOpacity} />
            <circle cx="120" cy="60" r="7" fill={`url(#${gradId})`} />
            <circle cx="170" cy="89" r="7" fill={`url(#${gradId})`} />
            <circle cx="170" cy="147" r="7" fill={`url(#${gradId})`} />
            <circle cx="120" cy="176" r="7" fill={`url(#${gradId})`} />
            <circle cx="70" cy="147" r="7" fill={`url(#${gradId})`} />
            <circle cx="70" cy="89" r="7" fill={`url(#${gradId})`} />
            <circle cx="120" cy="118" r="20" fill={`url(#${gradId})`} />
            <circle cx="120" cy="118" r="10" fill={centerFill} />
        </svg>
    );
};

export default LogoIcon;