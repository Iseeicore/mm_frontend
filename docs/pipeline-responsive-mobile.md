# Pipeline responsive/mobile (bases-front)

Estado del trabajo de cerrar 2 gaps reales de responsive encontrados probando la app en pantallas chicas: falta de scroll horizontal en listados anchos, y falta de nav móvil (hamburguesa) en el shell del Dashboard. Se actualiza cada vez que se cierra un ítem. Última actualización: 2026-07-22.

## Procedimiento fijo por ítem

1. Confirmar el archivo/patrón real (grep, leer el componente) antes de asumir estructura — no asumir que todo el ancho se resuelve igual (`<table>` vs CSS grid se comportan distinto ante contenido angosto).
2. Aplicar el fix (wrapper de overflow / drawer) sin tocar lógica, inputs/outputs, ni firmas de componentes compartidos.
3. Build + suite de tests completa (`ng build`, `npx ng test --watch=false`).
4. Verificar en navegador a viewport angosto (DevTools responsive, ~375-390px) antes de comitear.
5. Confirmar que desktop (`lg:` en adelante) queda visualmente idéntico a como estaba.
6. `commit-summary` — commit por ítem, no uno solo gigante.

## Ítems

| # | Ítem | Estado | Commit | Notas |
|---|---|---|---|---|
| 1 | Scroll horizontal en `venta-detalle.ts` | ✅ Cerrado | _(pendiente de commit)_ | Se agregó `overflow-x-auto` al mismo div que ya tenía `overflow-y-auto` (scroll vertical de líneas largas) — un solo elemento scrollea ambos ejes, sin anidar otro div. `<thead sticky top-0>` sigue funcionando igual. |
| 2 | Scroll horizontal en `<app-tabla>` (componente compartido, ~9+ vistas) | ✅ Cerrado | _(pendiente de commit)_ | Wrapper `overflow-x-auto` nuevo alrededor de `<table>` únicamente; el pie de paginación (`pieClases()`) queda afuera, como hermano, y no scrollea junto con la tabla. El `overflow-hidden` del contenedor exterior (variante `elevado`, para recortar esquinas redondeadas) no se tocó — vive en un div distinto, no choca con el wrapper interior. |
| 3 | Scroll horizontal en `reportes-trazabilidad.ts` (listado "notebook sheet", no usa `<app-tabla>`) | ✅ Cerrado | _(pendiente de commit)_ | Mismo wrapper `overflow-x-auto` en las 2 pestañas (Detalle y Resumen). A diferencia de `<table>`, un `grid grid-cols-12` se comprime en vez de desbordar — hubo que agregar `min-w-[640px]` en las filas (header + datos, 4 lugares en total) para que el contenido deje de encogerse y dispare el scroll real. |
| 4 | Nav móvil en `dashboard.ts` (hamburguesa + drawer) | ✅ Cerrado | _(pendiente de commit)_ | Nueva señal `menuMovilAbierto`. Botón hamburguesa en el header (`lg:hidden`, mismo estilo redondo que la campana). `<aside>` pasa a clases dinámicas: en `lg:+` queda estático e igual que siempre (`lg:static lg:translate-x-0`); por debajo, es un drawer `fixed` que entra/sale con `translate-x`. Backdrop (`bg-black/20 backdrop-blur-sm`, mismo estilo que los modales) para cerrar con un clic afuera. Se extendió el `@HostListener('document:click')` YA existente (el del menú de usuario) para que en el mismo método también cierre el drawer si el clic fue afuera de `[data-menu-movil]` — Angular no permite dos listeners del mismo evento en la misma clase. Cierra también al navegar (mismo patrón `(click)` que ya usaba el link "Cambiar contraseña" del menú de usuario). Breakpoint `lg:` reusado porque ya era el único breakpoint estructural del archivo (el buscador del header ya usaba `hidden ... lg:flex`). |

## Aprendizajes clave

- `overflow-hidden` (contenedor exterior, para bordes redondeados) y `overflow-x-auto` (wrapper interior nuevo, para el scroll) no chocan mientras estén en dos elementos anidados distintos con responsabilidades distintas — patrón reusable en cualquier card con contenido ancho adentro.
- CSS grid (`grid-cols-12`) NO da scroll horizontal gratis como `<table>`: sin un `min-width` explícito en las filas, el grid simplemente comprime columnas en vez de desbordar, y el wrapper `overflow-x-auto` no tiene ningún efecto visible.
- Reusar un breakpoint estructural ya existente (`lg:` en este caso, por el buscador del header) evita terminar con dos criterios distintos de "dónde empieza desktop" en el mismo shell.
- Un solo `@HostListener('document:click')` puede cerrar N menús/paneles distintos (cada uno con su propio atributo `data-*` de guard) dentro del mismo método — no hace falta (ni se puede) declarar un `@HostListener` por panel.
- Verificado: `reportes-trazabilidad.spec.ts` (único spec que toca alguno de los 4 archivos) solo verifica llamadas HTTP/estado, no estructura de DOM — cero riesgo de romperlo con cambios de template/CSS puros.
- Los 5 fallos de `ventas.spec.ts` (API vieja de `FormArray`/`agregarLinea()` que ya no existe en el componente actual) son preexistentes, confirmados en sesión anterior — no los causa este trabajo.

## Próximo paso

Los 4 ítems están cerrados a nivel código; falta el commit (el usuario decide cuándo cerrar y el mensaje, según `commit-summary`) y la verificación visual manual en navegador a viewport angosto que pide el procedimiento fijo (paso 4).
