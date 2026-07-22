# Pipeline: CTA primario con menos radius + ícono `+` en todos los "Nuevo/Nueva X"

El usuario pidió bajar el radius del botón "Nueva venta" de `ventas.ts` (`rounded-full` se sentía "demasiado pill") para que quede igual que los demás botones elevado (secundario/peligro, ya `rounded-lg`), y extender el mismo patrón — ícono `+` inline antes del texto — a todos los botones de alta ("Nuevo X"/"Nueva X") del resto de vistas CRUD, que hoy eran texto plano sin `elevado` ni ícono. Última actualización: 2026-07-22.

## Procedimiento fijo por ítem

1. Confirmar el estado real del botón (grep, no asumir) antes de tocarlo.
2. Aplicar el cambio — cero lógica nueva, es CSS del componente compartido (`boton.ts`) + `[elevado]="true"` + el mismo SVG ya usado en `ventas.ts`.
3. Build + suite de tests completa.
4. Verificar visualmente en navegador antes de comitear.
5. `commit-summary`.

## Cambio de base: `src/app/shared/boton/boton.ts`

`CLASES_BASE_ELEVADA` pasa a incluir `rounded-lg` una sola vez (hoisted, ya que ahora las 3 variantes comparten el mismo radius), y se saca `rounded-full`/`rounded-lg` de cada variante individual (`primario`/`secundario`/`peligro`). Afecta a los 3 botones `[elevado]="true"` que ya existían en `ventas.ts` (Nueva venta, Agregar producto, Confirmar venta) sin que haga falta tocarlos — el cambio vive en el componente compartido.

## Vistas con botón "Nuevo/Nueva X" actualizado (ícono `+` + `[elevado]="true"`)

| # | Vista | Botón | Estado | Commit |
|---|---|---|---|---|
| 1 | `ventas.ts` | Nueva venta | ✅ Ya estaba elevado (piloto), solo bajó el radius vía `boton.ts` | _(pendiente)_ |
| 2 | `almacenes.ts` | Nuevo almacén | ✅ Cerrado | _(pendiente)_ |
| 3 | `usuarios.ts` | Nuevo usuario | ✅ Cerrado | _(pendiente)_ |
| 4 | `productos.ts` | Nuevo producto | ✅ Cerrado | _(pendiente)_ |
| 5 | `tiendas.ts` | Nueva tienda | ✅ Cerrado | _(pendiente)_ |
| 6 | `movimientos.ts` | Nuevo movimiento | ✅ Cerrado | _(pendiente)_ |
| 7 | `sistemas.ts` | Nuevo sistema | ✅ Cerrado | _(pendiente)_ |
| 8 | `roles.ts` | Nuevo rol | ✅ Cerrado | _(pendiente)_ |
| 9 | `configuraciones.ts` | Nueva configuración | ✅ Cerrado | _(pendiente)_ |

## Fuera de alcance

- `permisos.ts`, `productos-ubicacion.ts`, `producto-stock.ts` — catálogos de solo lectura, sin botón de alta, no aplica.
- `features/reportes/*` — no tiene botón de alta (es un reporte, no un CRUD).

## Aprendizajes clave

- El radius del CTA primario vivía repetido en 3 lugares (`boton.ts` variante primario/secundario/peligro); al pasar los 3 al mismo `rounded-lg`, se pudo hoistear a la clase base compartida en vez de repetirlo — la duplicación que quedaba (mismo valor en las 3 variantes) ya no tenía razón de ser una vez que dejaron de diferir.
- Skill `estilo-bold-accent` actualizada (`SKILL.md`) para reflejar que `rounded-full` ya NO existe como excepción del CTA primario — quedaba documentado como regla vigente y hubiera confundido a la próxima sesión que la leyera antes de tocar un botón nuevo.

## Próximo paso

Falta el commit y la verificación visual manual en navegador (paso 4 del procedimiento).
