import Link from 'next/link'

export default function Home() {
  return (
    <div className="font-display bg-background-base text-foreground h-screen w-screen relative flex flex-col overflow-hidden selection:bg-primary/30">
      {/* Premium Dark Mode Fixed Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full px-6 py-3 flex justify-between items-center bg-white/60 dark:bg-white/5 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-extrabold text-lg shadow-md">
            C
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">Central Viva a Vida</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <Link href="#" className="hover:text-primary transition-colors">Sobre Nós</Link>
          <Link href="#" className="hover:text-primary transition-colors">Estrutura</Link>
          <Link href="#" className="hover:text-primary transition-colors">Ajuda</Link>
        </div>
      </nav>

      {/* Main Content — preenche todo o espaço restante */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center px-6 sm:px-8 lg:px-12">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">

          {/* Left Column: Text & CTA */}
          <div className="text-center lg:text-left order-2 lg:order-1 flex flex-col justify-center">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-secondary/10 border border-blue-200 dark:border-secondary/20 text-secondary text-xs font-semibold mb-4 self-center lg:self-start">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></span>
              Portal Institucional Premium
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3 leading-[1.1]">
              Organização que <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-secondary-dark inline-block">
                Transforma Vidas
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed max-w-md mx-auto lg:mx-0">
              Bem-vindo ao sistema de gestão <strong className="text-zinc-900 dark:text-zinc-200">Central Viva a Vida</strong>. Conectando propósitos e simplificando processos para um impacto social exponencial.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/signup" className="btn-primary group">
                Criar Conta
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>

              <Link href="/login" className="btn-glass">
                Acessar Plataforma
              </Link>
            </div>

          </div>

          {/* Right Column: Visual — altura limitada ao espaço disponível */}
          <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm lg:max-w-md h-[280px] sm:h-[320px] lg:h-[380px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-200 dark:border-zinc-800/80 group">

              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuC_rNCq8xD_qaMjIgNZyn230YoEhPaLpos3skji9Ty0YA643nGWwIB3MBgQC8_hCPUen5fuUEwDUY1iK4UUtP-8zk4CSe3gIlfSrraUJ48WlIK_8eesqNXDmA1kxGIhH1sbY6vHJf2earugR5ZYgu0jPCb5m-o7a9E7spbMUKCkoZomUgSoawxYCOq2fn7HKiy7Yfexz1j5y0_LpLngzWriLIswizmoAyDayWxtV3l8V9Zx8mTUCafkMTNkFsafXHPugB8n1jyjgY"
                alt="Impacto Social"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-background-base via-background-base/40 to-transparent"></div>

              {/* Floating Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/85 dark:bg-white/10 backdrop-blur-xl p-4 rounded-xl shadow-lg border border-white/40 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30 shadow-md shadow-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-primary-dark dark:text-primary text-lg">volunteer_activism</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Impacto Social</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">Gerencie recursos e voluntários com eficiência na plataforma integrada.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient Glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none"></div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-3 text-center border-t border-zinc-200 dark:border-white/5 shrink-0">
        <p className="text-xs text-zinc-400">© 2024 Central Viva a Vida. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
