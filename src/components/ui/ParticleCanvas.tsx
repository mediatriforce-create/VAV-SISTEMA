'use client'

import { useEffect, useRef } from 'react'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    opacity: number
    color: string
}

export default function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: -999, y: -999 })
    const particlesRef = useRef<Particle[]>([])
    const animationRef = useRef<number>(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // Paleta de cores premium
        const colors = [
            'rgba(59, 130, 246,',   // blue-500
            'rgba(99, 102, 241,',   // indigo-500
            'rgba(139, 92, 246,',   // violet-500
            'rgba(37, 99, 235,',    // blue-600
            'rgba(79, 70, 229,',    // indigo-600
        ]

        // Criar partículas
        const count = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 15000))
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.1,
            color: colors[Math.floor(Math.random() * colors.length)],
        }))

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }
        const handleMouseLeave = () => {
            mouseRef.current = { x: -999, y: -999 }
        }
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const particles = particlesRef.current
            const mouse = mouseRef.current

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]

                // Movimento
                p.x += p.vx
                p.y += p.vy

                // Bounce nas bordas
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1

                // Interação com mouse — repulsão suave
                const dx = p.x - mouse.x
                const dy = p.y - mouse.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 150) {
                    const force = (150 - dist) / 150
                    p.vx += (dx / dist) * force * 0.15
                    p.vy += (dy / dist) * force * 0.15
                }

                // Damping para não acelerar infinitamente
                p.vx *= 0.99
                p.vy *= 0.99

                // Desenha partícula
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
                ctx.fillStyle = `${p.color} ${p.opacity})`
                ctx.fill()

                // Conexões entre partículas próximas
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j]
                    const connDx = p.x - p2.x
                    const connDy = p.y - p2.y
                    const connDist = Math.sqrt(connDx * connDx + connDy * connDy)

                    if (connDist < 120) {
                        const alpha = (1 - connDist / 120) * 0.15
                        ctx.beginPath()
                        ctx.moveTo(p.x, p.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }

            animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            cancelAnimationFrame(animationRef.current)
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    )
}
