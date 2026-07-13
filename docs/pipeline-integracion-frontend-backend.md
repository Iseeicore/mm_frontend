# Pipeline de integración frontend-backend (bases-front ↔ bases-api)

Estado del trabajo de integrar en `bases-front` los recursos que `bases-api` ya expone. Se actualiza cada vez que se cierra un recurso o se toma una decisión de alcance. Última actualización: 2026-07-13.

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
| 5 | `ventas` | ⏳ Siguiente | — | Alta+lectura, maestro-detalle (cabecera + líneas). Mismo patrón sin CRUD completo que `movimientos`. Verificar contrato con `bases-api/postman/movimientos-ventas.postman_collection.json` antes de asumir nada |

## Trabajo intermedio (no era parte del pipeline original, surgió en el camino)

| Ítem | Estado | Commit | Notas |
|---|---|---|---|
| Skill `estilo-neomorfico` | Creada, no aplicada todavía | — (`.claude/` está gitignored, no se commitea) | Define el mecanismo de sombra dual + color semántico para Tailwind v4. Deliberadamente no aplicada a ningún recurso todavía para no romper consistencia visual con el resto del dashboard (que sigue con estilo plano) |
| Consulta de stock por producto | ✅ Cerrado | `9ad119b` | Pantalla de solo lectura (`GET /productos/:id/stock`) en `/productos/:id/stock`, accedida con un botón "Ver stock" nuevo en la lista de productos. Requirió extender `<app-tabla>` (componente compartido) con un tercer slot genérico de acción (`puedeVerDetalle`/`etiquetaVerDetalle`/`verDetalle`), verificado retrocompatible con las otras 8 vistas que ya lo usan |

## Pendientes explícitos (fuera de alcance por ahora, con motivo)

- **`GET /almacenes/:id/productos` y `GET /tiendas/:id/productos`** — el usuario pidió poder ver, desde la vista de un almacén/tienda, qué productos tiene registrados. Se verificó que `bases-api` NO tiene ese endpoint (solo existe la dirección inversa, producto→ubicaciones). Armarlo solo del frontend sería un N+1 no escalable (paginar todos los productos + pedir stock de cada uno + filtrar client-side). **Requiere crear el endpoint en `bases-api` primero** (cruzar de repo, orquestar su propio `AGENTS.md`: `sql-schema-gate` + `api-conventions` + `data-normalization`). El usuario decidió explícitamente dejarlo pendiente.
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

## Próximo paso

Retomar con **recurso #5: `ventas`** siguiendo el procedimiento fijo de arriba, empezando por el gate de `sql-schema-gate` (preguntar qué cambió en la BD) y `observador-backend` (confirmar contrato real, usando `bases-api/postman/movimientos-ventas.postman_collection.json` como referencia).
