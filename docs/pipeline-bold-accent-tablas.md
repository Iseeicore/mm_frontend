# Pipeline: rollout de Bold Accent (`variante="elevado"`) a todas las tablas

Estado del rollout de `<app-tabla variante="elevado">` (piloteado en `ventas.ts`, confirmado el 18/07/2026 como "solo Ventas, piloto") al resto de vistas que usan el componente compartido `<app-tabla>`. El usuario confirmó extender el rollout a todas las vistas EXCEPTO `features/reportes` (que no usa `<app-tabla>`, usa su propio listado "notebook sheet" — se deja igual a propósito). Última actualización: 2026-07-22.

## Procedimiento fijo por ítem

1. Confirmar que la vista usa `<app-tabla>` (grep, no asumir) y que hoy no tiene ya `variante="elevado"`.
2. Agregar `variante="elevado"` al tag — cero cambios de lógica, es un input opt-in que ya vive en el componente compartido (`tabla.ts`), no se toca nada más.
3. Build + suite de tests completa.
4. Verificar visualmente en navegador antes de comitear (mismo criterio del resto del proyecto).
5. `commit-summary` — un solo commit para todo el rollout (cambio mecánico, mismo patrón repetido) o por vista, según decida el usuario al cerrar.

## Vistas

| # | Vista | Estado | Commit | Notas |
|---|---|---|---|---|
| 1 | `ventas.ts` | ✅ Ya estaba (piloto) | `d804db6` | Piloto original, sin cambios en este pipeline |
| 2 | `configuraciones.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 3 | `almacenes.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 4 | `movimientos.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 5 | `roles.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 6 | `producto-stock.ts` | ✅ Cerrado | _(pendiente de commit)_ | 2 tablas en esta vista (almacenes y tiendas), ambas actualizadas |
| 7 | `permisos.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 8 | `usuarios.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 9 | `sistemas.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 10 | `tiendas.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 11 | `productos.ts` | ✅ Cerrado | _(pendiente de commit)_ | |
| 12 | `productos-ubicacion.ts` | ✅ Cerrado | _(pendiente de commit)_ | |

## Explícitamente fuera de alcance

- **`features/reportes/reportes-trazabilidad.ts`** — no usa `<app-tabla>` (usa el listado "notebook sheet" propio, ver `docs/pipeline-responsive-mobile.md`). El usuario pidió expresamente dejarlo igual.
- **`features/ventas/venta-detalle.ts`** — tampoco usa `<app-tabla>` (tabla nativa propia, con scroll y buscador que el componente compartido no ofrece). Ya está en Bold Accent desde el rediseño de Ventas, sin cambios acá.

## Aprendizajes clave

- El rollout fue puramente mecánico: agregar `variante="elevado"` no requirió tocar ninguna otra clase o lógica en las 11 vistas, porque todo el estilo (colores, sombra, radius, chips) vive adentro de `tabla.ts` detrás de ese único input — confirma que el componente compartido estaba bien diseñado para este momento desde el piloto.
- Se prefirió setear `variante="elevado"` explícito en cada vista en vez de cambiar el DEFAULT del input en `tabla.ts`, para mantener consistencia con cómo se hizo el resto del rollout de Bold Accent en el proyecto (siempre opt-in explícito por vista, nunca un default silencioso) — así una vista nueva que no lo declare no hereda el look sin que quede explícito en su propio template.

## Próximo paso

Falta el commit (decisión del usuario sobre si es uno solo para las 11 vistas o varios) y la verificación visual manual en navegador, como pide el paso 4 del procedimiento fijo.
