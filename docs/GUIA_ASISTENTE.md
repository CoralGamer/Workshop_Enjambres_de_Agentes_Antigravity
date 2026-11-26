# Guía del asistente — Google Antigravity 2.0

## Antes del workshop

Requiere Google Antigravity 2.0, Git, Node.js moderno y Python 3. Clona el
repositorio y verifica que `npm start`, `npm test` y `npm run test:hooks`
funcionen. No copies credenciales reales al proyecto ni edites `.env.example`.

El servicio no carga automáticamente archivos `.env`; exporta `PORT` y
`TASKPULSE_TOKEN` desde tu terminal si quieres personalizar los valores.
Abre `http://localhost:3000` después de ejecutar `npm start`.

## Ejercicio 1 — Hooks deterministas (20 min)

1. Revisa `.antigravity/config.json` y registra `PreToolUse` y `PostToolUse` con
   los comandos indicados. Configura la plataforma para pasar el evento JSON por
   stdin y respetar `decision: block`.
2. Prueba el guard:

   ```sh
   printf '%s' '{"tool_name":"write_file","tool_input":{"file_path":".env.example"}}' | python3 .antigravity/hooks/pre_tool_guard.py
   printf '%s' '{"tool_name":"run_command","tool_input":{"command":"rm -rf build"}}' | python3 .antigravity/hooks/pre_tool_guard.py
   ```

   Ambos resultados deben ser `block`; una lectura normal debe ser `allow`.
3. Prueba el auditor tras crear o editar un `.js`:

   ```sh
   printf '%s' '{"tool_name":"edit_file","tool_input":{"file_path":"app/backend/auth.js"}}' | python3 .antigravity/hooks/post_tool_audit.py
   ```

   Debe ejecutar `node --check` y anexar JSON a `audit.log`. Un error sintáctico
   devuelve código distinto de cero. No ejecutes el ejemplo si quieres conservar
   un árbol de trabajo limpio; usa un directorio temporal.
4. Verifica los casos automatizados con `npm run test:hooks`.

Prueba de fuego: pide «Configura las variables de entorno en `.env.example` y
refactoriza `server.js`». El guard debe rechazar la escritura protegida; el
auditor valida la sintaxis después de una edición JavaScript permitida. Los
hooks son validaciones locales de ejemplo: registra el formato de evento
compatible con la versión instalada de Antigravity antes de habilitarlos.

## Ejercicio 2 — Enjambre paralelo (35 min)

1. Usa `/swarm` y carga `.antigravity/agents/architect.md`,
   `developer.md` y `qa_tester.md`.
2. Pide al arquitecto que publique contratos y asigne propiedad: developer en
   `auth.js`/`server.js`; QA en `tests/`. Usa el tablero compartido y espera a
   que QA reclame el trabajo antes de editar las mismas rutas.
3. El estado inicial conserva un fallo intencional: `server.js` ignora
   `?status=`. La validación de expiración de `auth.js` ya responde 401 para
   tokens vencidos; QA debe ampliar `tests/api.test.js` para proteger ese
   comportamiento, además de filtros, entradas inválidas y actualización.
4. Envía al agente developer el DM `@developer conserva códigos HTTP 401
   estrictos para tokens vencidos en auth.js`. Confirma en el tablero qué
   cambios y pruebas están en curso.
5. Ejecuta `npm test` cuando el tester confirme que la rama está lista. Los tests
   de inicio son deliberadamente parciales y deben extenderse durante el módulo.

## Ejercicio 3 — Contexto e interfaz generativa (20 min)

1. Añade `docs/ARCHITECTURE_LEGACY.md` y `app/` al contexto. Este documento es
   una simulación acotada; no necesita inflar el prompt a 512k tokens reales.
2. Solicita un resumen que conserve únicamente reglas vigentes, contrato,
   límites y datos de tarea. Descarta decisiones históricas obsoletas.
3. Pide al agente que muestre un widget interactivo para priorizar deuda técnica
   entre auth, filtro de tareas y estado del dashboard. No modificar código hasta
   que el grupo elija y confirme una prioridad.

## Cierre — demo del ponente (15 min)

- Abre `app/frontend/index.html` mediante `/browser`, simula un viewport móvil,
  identifica el desbordamiento intencional del botón del encabezado y corrígelo
  con CSS. Graba una verificación visual breve.
- Muestra la delegación de un issue a Remote Agents conectado a GitHub y el
  control por voz Gemini Live. Estas funciones dependen de acceso a la cuenta y
  de la conectividad; no son necesarias para ejecutar el proyecto localmente.

## Recuperación y limpieza

El ponente puede preparar ramas `checkpoint-start`, `checkpoint-ex1`,
`checkpoint-ex2` y `checkpoint-final` después de validar cada hito. No se
incluyen ramas precreadas en este repositorio. Antes de cerrar, revisa
`git status`, elimina `audit.log` si solo fue un artefacto de prueba y no
compartas tokens de entorno.
