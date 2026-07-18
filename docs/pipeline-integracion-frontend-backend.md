# Pipeline de integración frontend-backend (bases-front ↔ bases-api)

Estado del trabajo de integrar en `bases-front` los recursos que `bases-api` ya expone. Se actualiza cada vez que se cierra un recurso o se toma una decisión de alcance. Última actualización: 2026-07-16.

## Procedimiento fijo por recurso

1. `sql-schema-gate` (bd/) — preguntar siempre qué cambió en la base de datos antes de asumir el esquema, releer `bd/schema/tables.sql` + `functions/` + `triggers/` real.
2. `observador-backend` — confirmar el contrato real del endpoint con evidencia archivo:línea (controller + ruta reales en `bases-api`, y los Postman de `bases-api/postman/` cuando hace falta un ejemplo real).
3. Delegar la implementación (service + vista, siguiendo `reglas-reuso-angular` + `convenciones-vistas`).
4. Revisión de código en contexto fresco — obligatoria, sin excepción.
5. **Probar en el navegador antes de comitear** — se sumó a partir de `movimientos`, después de que 2 bugs reales (label mal puesto, select sin filtrar por stock) solo aparecieron al usar la app, no en la revisión de código.
6. `commit-summary` — preguntar si funciona, armar el mensaje, commit por recurso (no un commit gigante al final).

## Recursos del pipeline principal

| # | Recurso | Estado | Commit | Notas |
|---|---|---|---|---|
| 1 | `tiendas` | ✅ Cerrado | `ace60ec` | CRUD completo, extiende `CrudService`/`CrudListBase` |
| 2 | `almacenes` | ✅ Cerrado | `d4f80e7` | Réplica 1:1 de tiendas (backend idéntico salvo nombres/prefijos) |
| 3 | `productos` | ✅ Cerrado (solo CRUD base) | `c42389b` | Sin stock/precio/historial en esta iteración. Bug real corregido antes del commit: `codigo_barras`/`descripcion` vacíos se mandaban como `''` en vez de `null` (chocaba contra el índice único parcial del backend) |
| 4 | `movimientos` | ✅ Cerrado | `36563ac` | NO extiende `CrudService`/`CrudListBase` (backend solo GET/POST). 4 rondas de fixes reales: reset de ubicación stale al cambiar tipo, tests de `crear()` faltantes, label "origen" mal puesto en `entrada`, select de origen sin filtrar por stock real |
| 5 | `ventas` | ✅ Cerrado | `523ab46` | Alta+lectura, maestro-detalle (cabecera + N líneas dinámicas). Mismo patrón sin CRUD completo que `movimientos`. Revisión en contexto fresco encontró y corrigió: paginación ya era la 4ta copia manual (se generalizó a `shared/paginacion/listado-paginado.ts`, migrando también `movimientos.ts` y `productos-ubicacion.ts`) y una race condition real de índice en el stock por línea (resuelta con `WeakMap` keyeado por el `FormGroup` de cada línea) |

**Pipeline principal cerrado** (2026-07-16): los 5 recursos previstos (`tiendas`, `almacenes`, `productos`, `movimientos`, `ventas`) están integrados. Lo que sigue son los pendientes explícitos de abajo y trabajo intermedio nuevo que vaya surgiendo.

## Trabajo intermedio (no era parte del pipeline original, surgió en el camino)

| Ítem | Estado | Commit | Notas |
|---|---|---|---|
| Validación reactiva de stock por línea en `ventas` | ✅ Cerrado | `2a9d3a3` | El usuario pidió aviso en vivo al tipear la cantidad, no solo al fallar el POST. `mensajeStock()` compara contra el `stock_actual` real del origen elegido (mismo `stockPorLinea` ya cargado, sin requests nuevos), mensaje no bloqueante bajo el campo — mismo patrón que `mensajeRuc` en `registro.ts` (único precedente de "mensaje en vivo" del proyecto, se siguió esa convención en vez de inventar una nueva). Después, a pedido explícito del usuario, se sumó `hayErroresStock()` para bloquear el botón Guardar (y `crear()` como segunda barrera) mientras haya una línea que supere el stock — el backend sigue siendo la autoridad final (`23514` → 400) por si el stock cambia entre que se lee y se confirma la venta |
| Skill `estilo-neomorfico` | Creada, no aplicada todavía | — (`.claude/` está gitignored, no se commitea) | Define el mecanismo de sombra dual + color semántico para Tailwind v4. Deliberadamente no aplicada a ningún recurso todavía para no romper consistencia visual con el resto del dashboard (que sigue con estilo plano) |
| Consulta de stock por producto | ✅ Cerrado | `9ad119b` | Pantalla de solo lectura (`GET /productos/:id/stock`) en `/productos/:id/stock`, accedida con un botón "Ver stock" nuevo en la lista de productos. Requirió extender `<app-tabla>` (componente compartido) con un tercer slot genérico de acción (`puedeVerDetalle`/`etiquetaVerDetalle`/`verDetalle`), verificado retrocompatible con las otras 8 vistas que ya lo usan |
| Listado de productos por almacén/tienda | ✅ Cerrado | `f0d2ffe` | Gap de Fase 1 (ver "Pendientes" más abajo) que `bases-api` destrabó en su commit `6f07f78`. Un solo componente `ProductosUbicacion` parametrizado por route `data.tipo` en vez de dos casi idénticos, reusa el tercer slot de `<app-tabla>` ("Ver productos") en almacenes/tiendas. Revisión en contexto fresco encontró y corrigió: guard de página fuera de rango faltante, URL de sub-recurso hardcodeada en vez de `this.recurso`, tipo duplicado (`TipoUbicacion` ya existía en `movimiento.service.ts`) |
| Paginación compartida para listados no-CRUD | ✅ Cerrado | `523ab46` | `shared/paginacion/listado-paginado.ts` (`crearListadoPaginado<T>`, composición por función, sin herencia). Se venía marcando desde `productos-ubicacion.ts` como deuda a resolver "si aparece una 4ta copia" — apareció con `ventas`, se generalizó de una vez en `movimientos.ts`, `productos-ubicacion.ts` y `ventas.ts`. `CrudListBase` no se tocó, sigue siendo la base correcta para recursos con CRUD completo |

## Pendientes explícitos (fuera de alcance por ahora, con motivo)

- **`GET /almacenes/:id/productos/stock-bajo` y `GET /tiendas/:id/productos/stock-bajo`** — `bases-api` ya los expone (mismo commit `6f07f78` que destrabó el listado simple), pero el frontend solo consumió la variante simple en esta iteración (decisión explícita del usuario, YAGNI). Sin UI todavía.
- **`PATCH /productos/:id/precio`** — ajuste de precio, permiso propio `productos.adjust_price` (distinto de `productos.update`). Sin UI todavía.
- **`GET /productos/:id/historial-precios`** — solo lectura, poblado por trigger. Sin UI todavía.
- **`PUT /productos/:id/stock/almacenes|tiendas/:id`** — ajuste absoluto de stock (UPSERT), vía alternativa a crear un movimiento de `entrada`. Se decidió explícitamente que la pantalla de consulta de stock (`producto-stock.ts`) sea de solo lectura y no incluya esto. Sin UI todavía.

## Aprendizajes clave para las próximas iteraciones

- **Modelo de datos real de stock**: un producto NO tiene una ubicación única — puede tener stock en varios almacenes y varias tiendas simultáneamente (`s_producto_almacen`/`s_producto_tienda`, `UNIQUE(producto_id, ubicacion_id)` compuesto). El alta de un producto nunca especifica ubicación por diseño; el primer stock se crea recién con un movimiento `entrada` o el endpoint de ajuste absoluto.
- **Auth del backend**: cookie httpOnly `token` (JWT), nunca header `Authorization: Bearer`.
- **Errores del backend**: siempre `{ "error": "<mensaje>" }`, nunca `code`/`details`/array de validación.
- **Identificador**: `public_id` (UUID) salvo `configuracion` (id numérico) y `permiso` (string `clave`).
- **La revisión de código en contexto fresco no sustituye probar la app real** — confirmado en `movimientos`, donde 2 bugs reales solo aparecieron al usar el formulario en el navegador, no en 2 rondas previas de revisión de código.
- Antes de proponer una vista nueva que combine dos recursos (ej. "productos de este almacén"), verificar primero si el backend expone esa dirección de consulta — no asumir que porque existe A→B también existe B→A.
- **Umbral de "4ta copia" para generalizar**: cuando un comentario `ponytail:` marca una duplicación con una condición explícita para resolverla ("cuando aparezca una 4ta copia"), tratarla como una decisión ya tomada, no una sugerencia a re-evaluar — al cruzarse el umbral en `ventas`, se generalizó sin volver a preguntar si valía la pena.
- **`WeakMap` keyeado por `FormGroup`/`AbstractControl`** es más robusto que un array paralelo indexado por posición para asociar datos auxiliares no persistidos (ej. stock) a líneas dinámicas de un `FormArray` — sobrevive agregar/quitar/reordenar sin sincronización manual. Patrón a reusar si aparece otro formulario con líneas dinámicas.

## Próximo paso

Pipeline principal cerrado. Lo que sigue, en orden de mención por el usuario o de aparición:
1. Pendientes explícitos de arriba (stock-bajo por ubicación, ajuste de precio, historial de precios, ajuste absoluto de stock) — ninguno tiene fecha, retomar cuando el usuario los priorice.
2. Deuda técnica pendiente en `deuda-tecnica/agents.md` (ver ledger) — en particular el límite fijo `listar(1,100)` en `movimientos.ts`/`ventas.ts`, que no escala si esos catálogos crecen.
3. Sincronizar `Manual_Minimarket_v1.docx` (TEMA 10/11 + HOJA 2) reflejando el cierre de `ventas` y la extracción de `listado-paginado.ts`, siguiendo `docx-frontend-sync`.
