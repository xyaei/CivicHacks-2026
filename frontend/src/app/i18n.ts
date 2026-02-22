export type Language = "en" | "es" | "pt" | "zh";

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "zh", label: "中文" },
];

const messages = {
  nav_publicDashboard: { en: "Public Dashboard", es: "Panel público", pt: "Painel público", zh: "公开仪表板" },
  nav_aiAssistant: { en: "AI Assistant", es: "Asistente IA", pt: "Assistente IA", zh: "AI 助手" },
  nav_judgeLogin: { en: "Judge Login", es: "Inicio sesión juez", pt: "Login do juiz", zh: "法官登录" },
  app_title: { en: "Public Bail Data Dashboard", es: "Panel de datos de fianza", pt: "Painel de dados de fiança", zh: "保释数据公开仪表板" },
  app_subtitle: { en: "Promoting fairness and transparency through open access to judicial data", es: "Promoviendo equidad y transparencia mediante el acceso abierto a datos judiciales", pt: "Promovendo justiça e transparência através do acesso aberto a dados judiciais", zh: "通过司法数据开放促进公平与透明" },
  app_massachusetts: { en: "Massachusetts", es: "Massachusetts", pt: "Massachusetts", zh: "马萨诸塞州" },
  app_boston: { en: "Boston", es: "Boston", pt: "Boston", zh: "波士顿" },
  judgeLogin_title: { en: "BailLens Judge Portal", es: "Portal de jueces BailLens", pt: "Portal do juiz BailLens", zh: "BailLens 法官门户" },
  judgeLogin_who: { en: "Who are you? Select your name or enter it below.", es: "¿Quién eres? Selecciona tu nombre o escríbelo abajo.", pt: "Quem é você? Selecione seu nome ou digite abaixo.", zh: "您是谁？选择或输入您的姓名。" },
  judgeLogin_loading: { en: "Loading judges…", es: "Cargando jueces…", pt: "Carregando juízes…", zh: "加载法官…" },
  judgeLogin_noJudges: { en: "No judge data available. Enter your name below.", es: "No hay datos de jueces. Introduce tu nombre abajo.", pt: "Nenhum dado de juiz. Digite seu nome abaixo.", zh: "暂无法官数据。请在下方输入您的姓名。" },
  judgeLogin_judgesCount: { en: "judge", es: "juez", pt: "juiz", zh: "法官" },
  judgeLogin_judgesCountPlural: { en: "judges", es: "jueces", pt: "juízes", zh: "法官" },
  judgeLogin_kevinFirst: { en: "Kevin first", es: "Kevin primero", pt: "Kevin primeiro", zh: "Kevin 优先" },
  judgeLogin_notInList: { en: "Not in the list?", es: "¿No estás en la lista?", pt: "Não está na lista?", zh: "不在列表中？" },
  judgeLogin_placeholder: { en: "Enter your full name", es: "Introduce tu nombre completo", pt: "Digite seu nome completo", zh: "输入您的全名" },
  judgeLogin_go: { en: "Go", es: "Entrar", pt: "Entrar", zh: "进入" },
  judgeLogin_confidential: { en: "Confidential professional development. Data is anonymized.", es: "Desarrollo profesional confidencial. Los datos están anonimizados.", pt: "Desenvolvimento profissional confidencial. Dados anonimizados.", zh: "保密专业发展。数据已匿名化。" },
  judgeLogin_back: { en: "Back to Public Dashboard", es: "Volver al panel público", pt: "Voltar ao painel público", zh: "返回公开仪表板" },
  chat_title: { en: "AI Assistant", es: "Asistente IA", pt: "Assistente IA", zh: "AI 助手" },
  chat_subtitle: { en: "Ask about bail data or judicial trends. Answers use judge data only.", es: "Pregunta sobre datos de fianza o tendencias judiciales. Solo se usan datos de jueces.", pt: "Pergunte sobre dados de fiança ou tendências judiciais. Respostas usam apenas dados de juízes.", zh: "询问保释数据或司法趋势。回答仅基于法官数据。" },
  chat_placeholder: { en: "Ask a question…", es: "Haz una pregunta…", pt: "Faça uma pergunta…", zh: "提问…" },
  chat_send: { en: "Send", es: "Enviar", pt: "Enviar", zh: "发送" },
  chat_listening: { en: "Listening… speak now, then pause.", es: "Escuchando… habla y luego pausa.", pt: "Ouvindo… fale e pause.", zh: "正在听…请说话后暂停。" },
  chat_sorryFailed: { en: "Sorry, the request failed.", es: "Lo sentimos, la solicitud falló.", pt: "Desculpe, a solicitação falhou.", zh: "抱歉，请求失败。" },
  chat_readAloud: { en: "Read aloud", es: "Leer en voz alta", pt: "Ler em voz alta", zh: "朗读" },
  chat_stopListening: { en: "Stop listening", es: "Dejar de escuchar", pt: "Parar de ouvir", zh: "停止听" },
  chat_talkToAI: { en: "Talk to AI (response will be read aloud)", es: "Hablar con IA (la respuesta se leerá en voz alta)", pt: "Falar com IA (resposta será lida em voz alta)", zh: "与 AI 对话（将朗读回复）" },
  judges_title: { en: "Judges", es: "Jueces", pt: "Juízes", zh: "法官" },
  judges_subtitle: { en: "Select a judge to view bail comparison and AI brief", es: "Selecciona un juez para ver comparación de fianza y resumen IA", pt: "Selecione um juiz para ver comparação de fiança e resumo IA", zh: "选择法官查看保释对比与 AI 摘要" },
  judges_loading: { en: "Loading…", es: "Cargando…", pt: "Carregando…", zh: "加载…" },
  judges_judgeLabel: { en: "Judge", es: "Juez", pt: "Juiz", zh: "法官" },
  judges_select: { en: "— Select —", es: "— Seleccionar —", pt: "— Selecionar —", zh: "— 选择 —" },
  judges_charge: { en: "Charge", es: "Cargo", pt: "Acusação", zh: "指控" },
  judges_bailByCharge: { en: "Bail by charge (median)", es: "Fianza por cargo (mediana)", pt: "Fiança por acusação (mediana)", zh: "按指控的保释金（中位数）" },
  judges_judgeCol: { en: "Judge", es: "Juez", pt: "Juiz", zh: "法官" },
  judges_courtAvg: { en: "Court avg", es: "Prom. tribunal", pt: "Média tribunal", zh: "法院平均" },
  judges_aiBrief: { en: "AI brief", es: "Resumen IA", pt: "Resumo IA", zh: "AI 摘要" },
  judges_couldNotLoad: { en: "Could not load brief.", es: "No se pudo cargar el resumen.", pt: "Não foi possível carregar o resumo.", zh: "无法加载摘要。" },
  dashboard_whyMatters: { en: "Why this matters", es: "Por qué importa", pt: "Por que importa", zh: "为何重要" },
  dashboard_myDashboard: { en: "My Dashboard", es: "Mi panel", pt: "Meu painel", zh: "我的仪表板" },
  dashboard_logout: { en: "Log out", es: "Cerrar sesión", pt: "Sair", zh: "退出" },
  dashboard_downloadReport: { en: "Download report", es: "Descargar informe", pt: "Baixar relatório", zh: "下载报告" },
  dashboard_generating: { en: "Generating…", es: "Generando…", pt: "Gerando…", zh: "生成中…" },
  dashboard_downloadPdf: { en: "Download PDF Report", es: "Descargar informe PDF", pt: "Baixar relatório PDF", zh: "下载 PDF 报告" },
  solana_auditFeed: { en: "Audit feed", es: "Registro de auditoría", pt: "Feed de auditoria", zh: "审计动态" },
  solana_verify: { en: "Verify", es: "Verificar", pt: "Verificar", zh: "验证" },
  filterBar_dateRange: { en: "Date range", es: "Rango de fechas", pt: "Período", zh: "日期范围" },
  last30d: { en: "Last 30 Days", es: "Últimos 30 días", pt: "Últimos 30 dias", zh: "最近30天" },
  last90d: { en: "Last 90 Days", es: "Últimos 90 días", pt: "Últimos 90 dias", zh: "最近90天" },
  last6m: { en: "Last 6 Months", es: "Últimos 6 meses", pt: "Últimos 6 meses", zh: "最近6个月" },
  last1y: { en: "Last Year", es: "Último año", pt: "Último ano", zh: "去年" },
  last2y: { en: "Last 2 Years", es: "Últimos 2 años", pt: "Últimos 2 anos", zh: "最近2年" },
  all: { en: "All", es: "Todo", pt: "Tudo", zh: "全部" },
} as const satisfies Record<string, { en: string; es: string; pt: string; zh: string }>;

export type MessageKey = keyof typeof messages;

export function t(lang: Language, key: MessageKey): string {
  const m = messages[key];
  if (!m) return String(key);
  return m[lang] ?? m.en ?? String(key);
}
