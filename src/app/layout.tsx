import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import SplashScreen from '@/components/ui/SplashScreen';

export const metadata: Metadata = {
  title: "Central Viva a Vida",
  description: "Sistema de Gestão - ONG Viva a Vida",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <SplashScreen />
        <main id="app-core">
          {children}
        </main>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            className: 'bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 text-zinc-800 dark:text-white rounded-2xl shadow-xl shadow-secondary/5 dark:shadow-[var(--shadow-neon)] font-medium px-4 py-3',
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
              style: {
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: 'currentColor',
                backdropFilter: 'blur(16px)'
              },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: {
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'currentColor',
                backdropFilter: 'blur(16px)'
              },
            },
          }}
        />
      </body>
    </html>
  );
}
