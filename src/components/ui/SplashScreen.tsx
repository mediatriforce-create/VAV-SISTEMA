'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Evita problemas de hidratação (só renderiza o DOM do splash após montar no client)
    setMounted(true);

    // Trava o scroll do body durante o splash e seta a cor de fundo preta pra evitar flash branco
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#0a0a0c';

    // Gatilho Temporal: 2.5 segundos (2500ms) de exposição da marca
    const timer1 = setTimeout(() => {
      const splashNode = document.getElementById('splash-root');
      const appNode = document.getElementById('app-core');

      // Fase 1: Aplica fade out (Transição de Opacidade via GPU)
      if (splashNode) splashNode.style.opacity = '0';

      // Fase 2: Ocultação estrutural e liberação da interface do usuário
      setTimeout(() => {
        if (splashNode) splashNode.style.display = 'none'; // Remove da árvore de renderização
        document.body.style.overflow = 'auto'; // Restaura o scroll natural
        document.body.style.backgroundColor = '';

        if (appNode) {
          appNode.style.display = 'block'; // Monta a aplicação principal

          // Toca uma mini animação de entrada no App Core
          try {
            appNode.animate([
              { opacity: 0, transform: 'scale(0.98)' },
              { opacity: 1, transform: 'scale(1)' }
            ], {
              duration: 400,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            });
          } catch (e) {
            // Resiliente caso animate API não esteja disponível em certos browsers
          }
        }
      }, 400); // 400ms = Sincronizado com o CSS: transition: opacity 0.4s

    }, 2500);

    return () => {
      clearTimeout(timer1);
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        /* 1. Reset Base & Camada do Sistema */
        #splash-root * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* Ocultação Nativa do Sistema sem conflito de Hidratação React */
        #app-core { display: none; }

        /* 2. Arquitetura da Splash Screen */
        #splash-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: #0a0a0c; /* Fundo escuro de alto contraste */
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.4s ease-out; /* Curva de saída otimizada */
        }

        /* 3. Camada de Glow (Efeito Atmosférico) */
        #splash-root .glow-layer {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 35% 50%, rgba(0, 163, 255, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 65% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 45%);
          opacity: 0;
          animation: fadeInGlow 2s ease-out forwards;
        }

        /* 4. Container de Alinhamento Matemático */
        #splash-root .brand-cluster {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          z-index: 2;
        }

        /* 5. Vetor SVG (O Ícone) */
        #splash-root .icon-vector {
          width: 110px;
          height: auto;
          transform: scale(0);
          transform-origin: bottom center; /* Ponto de ancoragem para o crescimento */
          /* Curva cubic-bezier para o efeito de "desabrochar" elástico */
          animation: bloomVector 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
        }

        /* 6. Estruturação Tipográfica */
        #splash-root .text-stack {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        #splash-root .text-line {
          color: #ffffff;
          opacity: 0;
          transform: translateX(30px);
          will-change: transform, opacity; /* Aviso de processamento prévio para a GPU */
        }

        #splash-root .text-small {
          font-size: 1.1rem;
          font-weight: 400;
          letter-spacing: 2px;
          color: #94a3b8;
          text-transform: uppercase;
          animation: slideInText 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }

        #splash-root .text-large {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          /* Gradiente sutil no texto principal para sofisticação */
          background: linear-gradient(90deg, #ffffff, #fde047);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: slideInText 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
        }

        /* 7. Motores de Animação (Keyframes) */
        @keyframes bloomVector {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes slideInText {
          0% { transform: translateX(30px); opacity: 0; filter: blur(4px); }
          100% { transform: translateX(0); opacity: 1; filter: blur(0); }
        }

        @keyframes fadeInGlow {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}} />

      <div id="splash-root">
        <div className="glow-layer"></div>

        <div className="brand-cluster">
          <svg className="icon-vector" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.4))' }}>
            <path d="M 50 95 Q 65 70 85 42 L 78 37 Q 68 44 63 46 L 68 54 Q 58 75 51 90 Z" fill="#4B6914" />
            <path d="M 50 95 Q 35 70 15 42 L 22 37 Q 32 44 37 46 L 32 54 Q 42 75 49 90 Z" fill="#A4C61A" />
            <circle cx="50" cy="24" r="13" fill="#FFEA00" />
          </svg>

          <div className="text-stack">
            <span className="text-line text-small">Associação</span>
            <span className="text-line text-large">Viva a Vida</span>
          </div>
        </div>
      </div>
    </>
  );
}
