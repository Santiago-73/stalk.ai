# Stalkai — CLAUDE.md

## Qué es este proyecto
Stalkai (stalk-ai.com) es una herramienta SaaS para creadores de 
contenido que detecta tendencias en su nicho antes que nadie. 
No es un RSS reader ni un agregador genérico. Es un analista de 
tendencias automático powered by Gemini 2.5.

El usuario añade "Subjects" (ej: "Minecraft en español", "Gaming 
de terror"). Dentro de cada Subject añade fuentes: canales de 
YouTube, subreddits, canales de Twitch. Stalkai analiza todas las 
fuentes juntas y detecta patrones y tendencias emergentes.

## Usuario objetivo
Creadores de contenido de YouTube, Twitch y Reddit que quieren 
saber qué está funcionando en su nicho esta semana sin pasarse 
horas revisando canales manualmente.

## Stack técnico
- Frontend: Next.js + Tailwind CSS
- Base de datos: Supabase
- Deploy: Vercel
- IA: Gemini 2.5 (Google AI API)
- Pagos: Stripe
- Auth: Supabase Auth

## Plataformas soportadas
- YouTube ✅ (core del producto, API de Google)
- Reddit ✅ (en desarrollo)
- Twitch ✅
- RSS / Blogs ✅
- Hacker News ✅
- Bluesky ✅
- Substack ✅
- Twitter/X ❌ (sin API, no implementar)
- Instagram ❌ (sin API, no implementar)
- TikTok ❌ (integración inestable, no implementar)

## Planes y límites
- Free: 3 subjects, 3 sources por subject, YouTube + RSS + HN + 
  Bluesky, digest manual una vez al día
- Pro ($9/mes): 50 subjects, 15 sources por subject, todas las 
  plataformas, digest automático diario por email, generaciones 
  ilimitadas
- Ultra ($19/mes): subjects ilimitados, sources ilimitadas, todas 
  las plataformas, Deep Video Analysis con Gemini 2.5, 
  priority support

## Cómo funciona el digest
Gemini recibe los títulos y descripciones de las últimas 
publicaciones de todas las fuentes del subject y devuelve 
un Trend Analysis con este formato:

1. Tendencia principal de la semana
2. Lo que los creadores deben saber
3. Insight accionable

El digest NO lista publicaciones una por una. Cruza todas las 
fuentes y detecta patrones.

## Prompt de Gemini (Trend Analysis)
"You are a trend analyst for content creators.
Below are the most recent posts/videos from multiple sources 
about [TOPIC]. Analyze them together and provide:

1. Main trend this week (1-2 sentences): What topic or format 
is gaining traction across these sources right now?

2. What creators should know (1-2 sentences): What is the 
audience engaging with? What angle is working?

3. Actionable insight (1 sentence): One specific thing a creator 
in this niche could do with this information.

Write in the same language as the content. Be specific, not 
generic. If there is not enough data, say so honestly."

## Decisiones importantes ya tomadas
- No añadir Twitter/Instagram hasta que haya API viable y gratuita
- No añadir features sin feedback de usuarios reales primero
- El Deep Video Analysis de Ultra usa la URL de YouTube directamente 
  con Gemini 2.5, que puede procesar vídeo completo
- El email diario se manda por las mañanas con el digest de cada 
  subject activo del usuario

## Copy clave
- Hero: "Stalk your niche. Own the trend."
- Subheadline: "Stalkai analyzes YouTube, Twitch and Reddit to 
  detect what's trending in your niche. One digest every morning. 
  Always one step ahead."
- Badge: "AI TREND ANALYSIS FOR CREATORS"

## Estado actual
- Producto lanzado y funcionando
- ~8 usuarios registrados
- Launch en Product Hunt programado
- Buscando primeros creadores para feedback