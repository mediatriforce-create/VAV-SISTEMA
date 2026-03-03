'use client';

import { motion } from 'framer-motion';

interface BorealSkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

export function BorealSkeleton({ className = '', style }: BorealSkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden bg-zinc-200/50 dark:bg-white/5 rounded-2xl ${className}`}
            style={style}
        >
            <motion.div
                className="absolute inset-0 z-10"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1), transparent)',
                }}
                animate={{
                    x: ['-100%', '200%'],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                }}
            />
            {/* Opcional: Efeito Boreal Secundário */}
            <motion.div
                className="absolute inset-0 z-0 opacity-50 blur-xl"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.2), transparent 60%)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
}
