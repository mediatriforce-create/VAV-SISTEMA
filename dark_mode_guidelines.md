# VAV Central - UI & Dark Mode Guidelines (Detailed Master Document)

## Objetivo Principal
Este documento é o guia definitivo para a refatoração do Modo Escuro (Dark Mode) da plataforma VAV Central. 
Atualmente, a interface possui inconsistências nas paletas de cores entre os componentes no modo escuro, causando falta de legibilidade e estética incoerente.

Seu trabalho como Engenheiro Frontend (Gemini CLI) é analisar os arquivos fonte especificados e aplicar as classes corretas do TailwindCSS, seguindo rigidamente a "Regra de Ouro" das cores de botões e painéis, garantindo acessibilidade, contraste e um design premium "glassmorphism" no modo escuro.

---

### 🔴 Regra de Ouro (Ação e Contraste)
Todo o sistema deve obedecer ao seguinte padrão cromático:

#### Tela de Fundo (Backgrounds)
- **Modo Claro:** Fila, painéis e páginas usam fundos super claros (ex: `bg-zinc-50`, `bg-white`).
- **Modo Escuro:** Fundos devem ser abismos escuros (ex: `dark:bg-black`, `dark:bg-zinc-950`). Painéis elevados/modais devem usar translucidez para o efeito glass (ex: `dark:bg-white/5`, `dark:border-white/10`).
- **Nunca use:** `dark:bg-gray-800` ou cinzas lavados. Mantenha o contraste de "preto profundo" com "bordas brancas quase transparentes".

#### Botões de Ação Primária (Salvar, Criar, Enviar, Publicar, Confirmar)
- **Modo Claro:** O Acionamento principal é **AZUL / ÍNDIGO**.
  - Exemplo: `bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30`
- **Modo Escuro:** O Acionamento principal DEVE SER **AMARELO / ÂMBAR**.
  - Exemplo: `dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-900 dark:shadow-amber-500/20`. O texto tem que ficar super escuro para dar contraste no amarelo brilhante.
- **Botões Dinâmicos (Sair/Excluir/Zonas de Perigo):** Esses são exceções e podem/devem usar vermelho no claro e no escuro.

---

## Mapeamento Detalhado e Fluxo do Sistema

Abaixo listamos os módulos da plataforma, os arquivos mais relevantes e as interações exatas onde botões ou fundos quebram as regras e precisam de refatoração pelo Gemini CLI.

### 1. Painel de Controle (Dashboard Master)
**Aquivo Base:** `src/app/dashboard/layout.tsx` e `src/app/dashboard/page.tsx`
- **Navegação (Sidebar):** O menu fica na lateral esquerda. Quando no modo escuro, deve ter o fundo preto com borda `border-white/10`. Menus ativos recebem destaque (hoje azul/índigo, podem ganhar um acento âmbar sutil no dark).
- **Mural Inicial:** Contém avisos e a foto da instituição. O botão para os atalhos ou painéis deve seguir a Regra de Ouro.

### 2. Calendário Global (`src/app/dashboard/calendario/page.tsx` e `GlobalCalendar.tsx`)
- **Visualização Geral:** Mostra uma grade CSS com os dias do mês. O fundo da grade no modo escuro não deve ficar cinza opaco.
- **Interação "Criar Postagem/Evento":** 
  - Ocorre ao Clicar em um dia da grade.
  - Abre um Modal central (overlay backdrop forte: `bg-black/60`).
  - **Formulário do Modal:** Contém campos "Título", "Descrição" e um input de arquivo (`<input type="file">`).
  - **Botão Principal:** O botão **"Publicar no Mural"**. Este botão é crítico e deve ser `bg-indigo-600` no claro e `dark:bg-amber-500` no escuro.
- **Interação "Ver Detalhes da Postagem":**
  - Ocorre ao clicar na pílula do evento no calendário.
  - Exibe os dados. Pode haver um botão "Excluir Evento" (vermelho).
  - Eventos Roxos (Reuniões) têm um botão "Ir para Reuniões". Esse também requer atenção visual para não se perder no escuro.

### 3. Reuniões Virtuais (`src/actions/meetings.ts`, páginas em `dashboard/reunioes`)
- **Tela Inicial:** Listagem inteligente de agendamentos.
- **Interação "Agendar Reunião Virtural":**
  - Abre um form (pode ser uma página em anexo ou modal).
  - Pede data, título, observações, etc.
  - **Botão Principal:** Form submit de **"Salvar Agendamento"**. Ajuste o Dark Mode dele para o Âmbar.
- **Interação "Acessar Reunião":** 
  - Cada card tem um botão "Entrar na Sala" (seja Google Meet ou link próprio). Precisa das cores da Regra de Ouro.

### 4. Módulo de Coordenação de Projetos (`src/app/coord` e subpastas)
**Aqui fica o core financeiro/pedagógico da ONG.**
- **Visão Geral:** Tabela ou cards mostrando "Demandas" com colunas de status (Pendente, Aprovado, Concluído). O fundo da tela deve estar "pure dark" ou "glass", não em branco no Dark mode.
- **Nova Demanda (`CreateDemandForm.tsx`):**
  - Tela rica com vários inputs.
  - **Botões da tela:** No final, há **"Criar Demanda" / "Salvar"**. Ele deve explodir a regra de ouro: claro = Índigo, escuro = Âmbar brilhante.
- **Painel de Detalhe da Demanda (`DemandDetailsModal.tsx`):**
  - **Layout:** Um off-canvas gigante de direita para a esquerda ou Modal tela-cheia onde toda a operação acontece. O fundo do offcanvas `dark:bg-zinc-900 border-l border-white/10`.
  - **Colunas/Seções:** Esquerda = dados da demanda; Direita = Abas de Comentários e Histórico (Logs).
  - **Interação de Status (Coordenação Executiva):** Coordenadores veem botões de mudança de estágio: **"Aprovar"**, **"Concluir"**, **"Reprovar"**. Os botões positivos devem seguir a Regra de Ouro (Azul/Amarelo). Os negativos podem ser Red/Rose.
  - **Criar Comentário/Anotação:** Aba lateral com um textarea. Botão de **"Enviar Comentário"** deve ficar amarelo quando em Dark mode. O background da lista de comentários precisa separar as bolhas (estilo WhatsApp) e ser perfeitamente legível (fundo do card `dark:bg-white/5`).

### 5. Comunicação Total (`src/app/comunicacao` e componentes Modais)
**O centro de mídia da instituição.**
- **Gestão Kanban (`KanbanBoard.tsx`):**
  - Semelhante ao Trello. O background da área de arrastar-e-soltar das colunas (Fila, Produção, etc) no Escuro tem que ser muito suave e usar `dark:bg-white/5` enquanto o fundo global é `dark:bg-black`.
  - Botões para **"Criar Novo Card"** em cada coluna (`+`).
- **Formulário Kanban (`shared/components/ApprovalSubmissionModal.tsx` ou afins):**
  - Salvar um novo Card de rede social.
  - Botão principal **"Inserir Fila/Salvar Card"** precisa do tratamento Âmbar.
- **Drive / Acervo de Mídias (`DriveUploadModal.tsx`, `AssetUploadModal.tsx`, `FileUploadModal.tsx`, `FolderModal.tsx`, `SmartUploadModal.tsx`):**
  - Vários modais minúsculos de ações vitais.
  - "Criar Nova Pasta": Contém um input com o nome da pasta. Botão **"Salvar/Criar"** é a chave.
  - "Fazer Upload de Mídia": Input type file dropzone. O botão gigante de submissão do upload (ex: **"Subir Arquivos"**, **"Analisar Conteúdo"**) precisa brilhar na Regra de Ouro. O texto do botão no dark precisa ser dark (`dark:text-zinc-900`) e a animação de hover (`ambient shadow` e `hover:-translate-y-1`) deve ser mantida ou aplicada para o toque premium.

### 6. Área de Administração Financeira (`src/app/dashboard/admin` e `NewEntryModal.tsx`, `ImportModal.tsx`)
- **Interface da Tabela Financeira:** 
  - Fundo da tabela de lançamentos com headers cinza clara e escura correspondentes (`dark:bg-zinc-900`, headers `dark:bg-white/5`).
  - **Botões de Ação Global:**
    1. **"Novo Lançamento / Adicionar Conta"** -> Abre `NewEntryModal` -> Pede Valor, Tipo (Entrada/Saída), Descrição -> Botão Final **"Registrar Movimentação"** ou "Salvar".
    2. **"Importar Planilha/Extrato"** -> Abre `ImportModal` -> Botão de ação (File dropzone) e "Processar Dados".
    Ambos os botões principais dependem da paleta primária.

### 7. Configurações Exclusivas (`UserPreferences.tsx` e `SettingsClient.tsx`)
- **Preferências Pessoais:**
  - Aba de Identidade: Input nome. Botão de Ação: **"Salvar Alteração"**. Já foi implementado, e o Gemini CLI deve assegurar que botões secundários fiquem discretos enquanto este principal brilha Azul/Amarelo.
  - Opções de Temas (Claro, Escuro e Sync de OS) em grids dinâmicas.
- **Zona de Perigo (Sair da Conta - Logout):** Este DEVE ser vermelho brilhante vivo (`bg-red-500` tanto light quanto dark, para quebrar a regra conscientemente).
- **Gestão De Equipes (Admin Area):** 
  - Tabela com listagem da equipe, nomes, cargos (Select/Dropdown). O select e as setinhas (`<select>`, `<option>`) devem ser completamente estilizados no modo escuro para não ter "fundo branco default de HTML". Dica: `dark:bg-zinc-900 dark:border-white/20`.

## Instruções Finais para o Gemini CLI
Você tem autonomia total para aplicar globalmente regex, `sed`, ou editar os arquivos diretamente.
Foque pesadamente na Busca por expressões clássicas de botão primário (`bg-indigo`, `bg-blue`, `text-white`) e infunda as diretrizes do **Amber (Amarelo)** no `dark:`. 

Revise backgrounds (`bg-white` que esqueceram de receber um correspondente `dark:bg-zinc-900/black`) e proteja os textos para garantir que Botão Amarelo no Escuro tenha texto interno Escuro (`dark:text-zinc-900`) para a melhor legibilidade possível. Nunca entregue botões ilegíveis.
