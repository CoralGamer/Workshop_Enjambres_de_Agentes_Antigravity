# Workshop de Google Antigravity 2.0 — GDG Bogotá

Repositorio autocontenido para practicar hooks de ciclo de vida en Python,
enjambres multi-agente, compactación selectiva de contexto y auditoría visual.
TaskPulse usa Node.js nativo y Python estándar; no requiere paquetes externos.

## Inicio rápido

Requisitos: Node.js moderno y Python 3.

```sh
npm start
npm test
npm run test:hooks
```

Abre <http://localhost:3000>. El valor de autenticación local predeterminado es
`workshop-token`; la interfaz de ejemplo está configurada para ese valor. No se
carga `.env.example` automáticamente y no debes guardar credenciales reales.
El servidor escucha solo en `127.0.0.1`; no es una configuración de producción.

## Contenido

- `.antigravity/hooks/`: guard de `PreToolUse` y auditor de `PostToolUse`.
- `.antigravity/agents/`: perfiles de arquitecto, desarrollador y QA para `/swarm`.
- `app/`: API de tareas y dashboard local.
- `tests/`: pruebas iniciales intencionalmente incompletas para ampliar en el
  ejercicio de enjambres.
- `docs/GUIA_ASISTENTE.md`: agenda y pasos de los ejercicios.
- `docs/ARCHITECTURE_LEGACY.md`: material de práctica para compactar contexto.

La API contiene un defecto intencional en el filtrado por estado; la validación
de tokens vencidos ya está protegida y debe conservarse al ampliar pruebas.
Sigue los pasos de la [guía del
asistente](docs/GUIA_ASISTENTE.md), que también explica el contrato de eventos
JSON utilizado por los hooks y las limitaciones de las demos cloud.
