'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface MagicButtonProps extends HTMLMotionProps<"button"> {
    children: ReactNode;
    icon?: ReactNode;
    glowColor?: string;
}

export function MagicButton({
    children,
    icon,
    glowColor = 'rgba(59, 130, 246, 0.8)', // Default bg-blue-500 glow
    className = '',
    ...props
}: MagicButtonProps) {
    return (
        <motion.button
            whileHover="hover"
            whileTap="tap"
            variants={{
                hover: { scale: 1.03, y: -2 },
                tap: { scale: 0.97, y: 0 }
            }}
            className={`
                relative group overflow-hidden rounded-xl 
                bg-white/10 dark:bg-black/40 backdrop-blur-md 
                border border-white/20 dark:border-white/10
                px-6 py-3 font-semibold text-zinc-800 dark:text-white
                shadow-sm transition-colors
                flex items-center justify-center gap-2 will-change-transform
                ${className}
            `}
            style={{ willChange: "transform" }}
            {...props}
        >
            {/* Top Border Glow Particle */}
            <motion.div
                className="absolute top-0 left-0 h-[2px] w-full origin-left"
                style={{
                    background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`
                }}
                variants={{
                    hover: { x: ['-100%', '100%'] },
                }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear"
                }}
            />

            {/* Internal ambient glow */}
            <motion.div
                className="absolute inset-0 z-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`
                }}
            />

            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
                {icon && (
                    <motion.span
                        variants={{
                            hover: { x: 4 }
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center"
                    >
                        {icon}
                    </motion.span>
                )}
            </span>
        </motion.button>
    );
}
