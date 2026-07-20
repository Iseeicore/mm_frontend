import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { codigoCorto, iniciales } from '../../shared/tabla/tabla';
import { formatoMoneda } from '../../shared/moneda';
import { Venta, VentaLineaDetalle, VentaService } from './venta.service';

// Fila de solo lectura de una línea de venta — combina origen_tipo/origen_nombre
// en un solo texto (mismo criterio de aFilas que producto-stock.ts para no
// agregar una columna extra solo para el tipo) y agrega `idx` porque
// producto_public_id no es único dentro de una venta (un mismo producto puede
// venderse en dos líneas con distinto origen). origen_tipo se conserva aparte
// del texto para pintar el punto de color sin re-parsear el string.
interface VentaLineaFila {
  idx: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  origen_tipo: 'almacen' | 'tienda';
  origen: string;
}

function aFilas(lineas: VentaLineaDetalle[]): VentaLineaFila[] {
  return lineas.map((l, idx) => ({
    idx,
    producto_nombre: l.producto_nombre,
    cantidad: l.cantidad,
    precio_unitario: l.precio_unitario,
    subtotal: l.subtotal,
    origen_tipo: l.origen_tipo,
    origen: `${l.origen_tipo === 'almacen' ? 'Almacén' : 'Tienda'}: ${l.origen_nombre}`,
  }));
}

// Detalle de solo lectura (cabecera + líneas) — no paginado (el backend no
// pagina el detalle de una venta), no extiende CrudListBase, mismo criterio
// que producto-stock.ts. No usa <app-tabla>: esta lista necesita scroll
// vertical + buscador propios que ese componente compartido no ofrece (son
// específicos de este reporte, no algo que tenga sentido meterle a la tabla
// genérica paginada — ver estilo-bold-accent/SKILL.md).
@Component({
  selector: 'app-venta-detalle',
  imports: [RouterLink],
  template: `
    <div class="p-6">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-gray-900">Detalle de venta</h1>
          <p class="flex items-center gap-1.5 text-xs text-secundario">
            ID:
            <span class="bg-secundario/10 rounded px-2 py-0.5 font-mono text-secundario" [title]="venta()?.public_id">
              #{{ idCorto() }}
            </span>
          </p>
        </div>
        <a routerLink="/ventas" class="flex items-center gap-1.5 text-sm font-bold text-primario hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
          </svg>
          Volver a ventas
        </a>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <div class="bg-fondo mb-6 grid grid-cols-2 gap-6 rounded-lg border border-black/5 p-6 shadow-sm sm:grid-cols-4">
          <div class="space-y-1">
            <span class="block text-xs font-bold tracking-wider text-secundario uppercase">Tienda</span>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 text-primario">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M2.361 9.35V21m0-11.65a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 8.25 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614M2.361 9.35a3.004 3.004 0 0 1-.621-4.72L2.929 3.44A1.5 1.5 0 0 1 3.99 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" />
              </svg>
              <p class="text-sm font-bold text-texto">{{ venta()?.tienda_nombre }}</p>
            </div>
          </div>
          <div class="space-y-1">
            <span class="block text-xs font-bold tracking-wider text-secundario uppercase">Total</span>
            <p class="font-mono text-2xl font-black text-primario">S/ {{ totalFormateado() }}</p>
          </div>
          <div class="space-y-1">
            <span class="block text-xs font-bold tracking-wider text-secundario uppercase">Fecha</span>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 text-secundario">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <p class="text-sm text-texto">{{ venta()?.fecha_creacion }}</p>
            </div>
          </div>
          <div class="space-y-1">
            <span class="block text-xs font-bold tracking-wider text-secundario uppercase">Creado por</span>
            <div class="flex items-center gap-2">
              <span class="bg-primario/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primario">
                {{ inicialesCreador() }}
              </span>
              <p class="text-sm text-texto">{{ venta()?.creado_por_nombre }}</p>
            </div>
          </div>
        </div>

        <div class="bg-fondo overflow-hidden rounded-lg border border-black/5 shadow-sm">
          <div class="flex flex-wrap items-center gap-3 border-b border-black/5 bg-black/[0.02] p-4">
            <h3 class="text-xs font-bold tracking-wider text-secundario uppercase">Productos</h3>
            <span class="bg-secundario/10 rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide text-secundario uppercase">
              {{ filas().length }} {{ filas().length === 1 ? 'ítem' : 'ítems' }}
            </span>
            <div class="relative ml-auto max-w-xs flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                   class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secundario">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input type="text" [value]="busqueda()" (input)="busqueda.set($any($event.target).value)"
                     placeholder="Buscar producto..." spellcheck="false" autocomplete="off"
                     class="bg-fondo focus:border-primario w-full rounded-lg border border-black/10 py-2 pr-3 pl-9 text-sm text-texto outline-none" />
            </div>
          </div>

          <div class="max-h-[400px] overflow-y-auto">
            <table class="w-full border-collapse text-left text-sm">
              <thead class="sticky top-0 z-10 bg-secundario/10">
                <tr class="border-b border-black/5">
                  <th class="px-4 py-3 text-xs font-bold tracking-wider text-primario uppercase">Producto</th>
                  <th class="px-4 py-3 text-center text-xs font-bold tracking-wider text-primario uppercase">Cantidad</th>
                  <th class="px-4 py-3 text-right text-xs font-bold tracking-wider text-primario uppercase">Precio unitario</th>
                  <th class="px-4 py-3 text-right text-xs font-bold tracking-wider text-primario uppercase">Subtotal</th>
                  <th class="px-4 py-3 text-xs font-bold tracking-wider text-primario uppercase">Origen</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                @for (linea of filasFiltradas(); track linea.idx) {
                  <tr class="transition-colors hover:bg-black/[0.015]">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <span class="bg-primario/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primario">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25m0-9L3 7.5m9 5.25v9M3 7.5v9l9 5.25" />
                          </svg>
                        </span>
                        <p class="font-semibold text-texto">{{ linea.producto_nombre }}</p>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="bg-primario/10 inline-block rounded-lg px-3 py-1 font-bold text-primario">{{ linea.cantidad }}</span>
                    </td>
                    <td class="px-4 py-3 text-right font-medium text-texto">S/ {{ formatoMoneda(linea.precio_unitario) }}</td>
                    <td class="px-4 py-3 text-right font-bold text-primario">S/ {{ formatoMoneda(linea.subtotal) }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <span [class]="'h-2 w-2 rounded-full ' + (linea.origen_tipo === 'almacen' ? 'bg-secundario' : 'bg-primario')"></span>
                        <span class="text-secundario">{{ linea.origen }}</span>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-4 py-6 text-center text-secundario">Sin productos que coincidan con la búsqueda.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class VentaDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private ventaService = inject(VentaService);

  protected venta = signal<Venta | null>(null);
  protected filas = signal<VentaLineaFila[]>([]);
  protected cargando = signal(false);
  protected busqueda = signal('');

  protected filasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.filas();
    return this.filas().filter((f) => f.producto_nombre.toLowerCase().includes(texto));
  });

  protected idCorto = computed(() => codigoCorto(this.venta()?.public_id));
  protected inicialesCreador = computed(() => iniciales(this.venta()?.creado_por_nombre));
  protected totalFormateado = computed(() => formatoMoneda(this.venta()?.total));
  protected formatoMoneda = formatoMoneda;

  ngOnInit(): void {
    // Sin withComponentInputBinding() en app.config.ts: el param se lee vía
    // ActivatedRoute, no vía input() de ruta (mismo criterio que producto-stock.ts).
    const id = this.route.snapshot.paramMap.get('id')!;
    this.cargando.set(true);
    this.ventaService.obtener(id).subscribe({
      next: (venta) => {
        this.venta.set(venta);
        this.filas.set(aFilas(venta.detalle ?? []));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
