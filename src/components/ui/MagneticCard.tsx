'use client';

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";

interface MagneticCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    active?: boolean;
}

export function MagneticCard({ children, className = '', onClick, active = true }: MagneticCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);
    const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current || !active) return;
        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const glowBackground = useMotionTemplate`radial-gradient(circle 120px at ${glowX} ${glowY}, rgba(59, 130, 246, 0.15), transparent 80%)`;

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => active && setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{
                rotateX: active ? rotateX : 0,
                rotateY: active ? rotateY : 0,
                transformStyle: "preserve-3d",
                willChange: active ? "transform" : "auto"
            }}
            whileHover={active ? { scale: 1.02 } : {}}
            whileTap={active ? { scale: 0.98 } : {}}
            className={`relative overflow-hidden will-change-transform ${className}`}
        >
            {/* Dynamic Ambient Glow overlay */}
            {active && isHovered && (
                <motion.div
                    className="pointer-events-none absolute inset-0 z-0 opacity-50 transition-opacity duration-300"
                    style={{ background: glowBackground }}
                />
            )}

            {/* Content container (lifted up in 3d space for parallax) */}
            <div
                className="relative z-10 w-full h-full flex flex-col items-center justify-center transform-gpu"
                style={{ transform: active && isHovered ? "translateZ(20px)" : "translateZ(0px)", transition: "transform 0.2s ease-out" }}
            >
                {children}
            </div>
        </motion.div>
    );
}
