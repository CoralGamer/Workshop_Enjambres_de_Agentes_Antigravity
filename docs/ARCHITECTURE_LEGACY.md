# TaskPulse — notas de arquitectura heredada

Este documento representa documentación heredada extensa para practicar lectura,
extracción de reglas vigentes y compactación selectiva de contexto. No todas las
notas son requisitos actuales. Si una regla contradice al contrato del API en
`GUIA_ASISTENTE.md`, prevalece el contrato vigente de esa guía.

## Contexto del sistema

TaskPulse es una aplicación local de gestión de tareas para una demostración
educativa. El backend usa exclusivamente módulos nativos de Node.js y persiste
los registros en `app/backend/db.json`. El navegador consume una API HTTP local.
No se requiere base de datos, compilación ni paquetes externos.

## Reglas vigentes

- Los estados permitidos de una tarea son `pending` y `completed`.
- Cada tarea tiene `id`, `title`, `status` y `createdAt`.
- Una tarea nueva se crea con estado `pending`.
- La ruta `/api/health` responde sin credenciales.
- Las rutas de tareas requieren un token en la cabecera de autorización.
- Los errores HTTP se devuelven como JSON con una propiedad `error`.
- No se deben guardar credenciales reales en el repositorio ni editar `.env*`.
- El servicio debe seguir iniciando con `npm start` y probarse con `npm test`.
- Mantén la compatibilidad con Node.js moderno y APIs nativas.

## Componentes y límites

`server.js` es responsable del enrutamiento HTTP, validación de entradas y
serialización JSON. `auth.js` valida el formato del token y su vencimiento.
`db.json` es almacenamiento de demostración, no una base transaccional. `app.js`
es la única capa del navegador que llama a la API; el HTML mantiene una
estructura semántica y accesible.

El API debe responder con 201 al crear tareas, 200 al leer o actualizar, 400
ante datos inválidos, 401 ante credenciales incorrectas o vencidas y 404 para
rutas o tareas inexistentes. El filtro `GET /api/tasks?status=pending` debe
devolver solamente tareas que coincidan con el estado solicitado.

## Decisiones históricas (pueden estar obsoletas)

- Una primera versión ignoraba el parámetro `status` en la lista de tareas.
- El primer dashboard usaba una sola lista global y no distinguía el estado de
  carga de errores. Mejorar el manejo del estado sin añadir frameworks.
- Se discutió usar SQLite y un framework web, pero se descartó para que el
  repositorio se ejecute sin instalación de dependencias.
- Un borrador usaba `DELETE /api/tasks/:id`; no se implementó en el contrato
  actual. No añadirlo durante el ejercicio salvo que se acuerde en el tablero.
- La idea de sincronización remota quedó fuera de alcance. El ejercicio de
  Remote Agents es una demostración del ponente, no una dependencia del proyecto.

## Ejercicio de compactación

Al resumir estas notas, conserva las reglas vigentes, rutas, campos y límites
del sistema. Descarta las decisiones históricas ya marcadas como obsoletas y
las alternativas que explícitamente quedaron fuera de alcance. Antes de editar,
presenta el resumen y solicita una priorización; este archivo no requiere
512 000 tokens reales para practicar el flujo.
