import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { crearListadoPaginado } from '../../shared/paginacion/listado-paginado';
import { Boton } from '../../shared/boton/boton';
import { CalendarioFecha } from './calendario-fecha';
import {
  FiltrosTrazabilidad,
  ReporteService,
  TipoTrazabilidad,
  TipoUbicacionReporte,
  TrazabilidadItem,
  TrazabilidadResumenItem,
} from './reporte.service';
import { Producto, ProductoService } from '../productos/producto.service';
import { Almacen, AlmacenService } from '../almacenes/almacen.service';
import { Tienda, TiendaService } from '../tiendas/tienda.service';

const LIMITE = 20;

const ETIQUETA_TIPO: Record<TipoTrazabilidad, string> = { salida: 'Salida', traspaso: 'Traspaso', venta: 'Venta' };
// Badges con tokens de marca (primario/secundario/acento), nunca hex fijo —
// estilo-bold-accent solo permite color fijo para "peligro" (rojo), y esto no
// lo es. 3 tonos del propio tenant alcanzan para distinguir los 3 tipos.
const CLASE_TIPO: Record<TipoTrazabilidad, string> = {
  salida: 'bg-secundario/10 text-secundario',
  traspaso: 'bg-primario/10 text-primario',
  venta: 'bg-acento/10 text-acento',
};
const ETIQUETA_UBICACION: Record<TipoUbicacionReporte, string> = { almacen: 'Almacén', tienda: 'Tienda' };
const CLASE_UBICACION: Record<TipoUbicacionReporte, string> = {
  almacen: 'bg-primario/10 text-primario',
  tienda: 'bg-secundario/10 text-secundario',
};

function hoyIso(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-reportes-trazabilidad',
  imports: [Boton, CalendarioFecha],
  template: `
    <div class="p-6">
      <div class="mb-4">
        <h1 class="text-texto text-xl font-semibold">Reportes de trazabilidad de stock</h1>
      </div>

      <div class="bg-fondo mb-4 space-y-3 rounded-lg border border-black/5 p-4 shadow-sm">
        <div>
          <label class="text-secundario block text-sm font-medium">Fecha del reporte</label>
          <div class="mt-2">
            <app-calendario-fecha [fecha]="fecha()" (fechaCambio)="alCambiarFecha($event)" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="text-secundario block text-sm font-medium">Tipo de ubicación</label>
            <div class="relative mt-1">
              <select [value]="origenTipo()" (change)="alCambiarOrigenTipo($event)"
                      class="border-black/10 text-texto w-full appearance-none rounded-full border bg-black/[0.02] px-4 py-2.5 pr-9 text-sm">
                <option value="">Todas</option>
                <option value="almacen">Almacén</option>
                <option value="tienda">Tienda</option>
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   class="text-secundario pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
          <div>
            <label class="text-secundario block text-sm font-medium">Ubicación</label>
            <div class="relative mt-1">
              <select [value]="origenId()" (change)="origenId.set($any($event.target).value); aplicarFiltros()" [disabled]="!origenTipo()"
                      class="border-black/10 text-texto w-full appearance-none rounded-full border bg-black/[0.02] px-4 py-2.5 pr-9 text-sm disabled:opacity-50">
                <option value="">Todas</option>
                @for (opcion of opcionesUbicacion(); track opcion.public_id) {
                  <option [value]="opcion.public_id">{{ opcion.nombre }}</option>
                }
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   class="text-secundario pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label class="text-secundario block text-sm font-medium">Producto</label>
          <div class="relative mt-1">
            <input type="text" [value]="busquedaProducto()" (input)="alEscribirProducto($any($event.target).value)"
                   (focus)="mostrarSugerenciasProducto.set(true)" (blur)="alSalirBusquedaProducto()"
                   spellcheck="false" autocomplete="off" placeholder="Todos los productos..."
                   class="border-black/10 text-texto w-full rounded-full border bg-black/[0.02] px-4 py-2.5 pr-9 text-sm" />
            @if (productoId()) {
              <button type="button" (mousedown)="limpiarProducto()"
                      class="text-secundario hover:text-texto absolute top-1/2 right-3 -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   class="text-secundario pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            }
            @if (mostrarSugerenciasProducto() && productosFiltrados().length > 0) {
              <div class="bg-fondo absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-black/10 p-1 shadow-lg">
                @for (producto of productosFiltrados(); track producto.public_id) {
                  <button type="button" (mousedown)="elegirProducto(producto)"
                          class="block w-full rounded-lg px-3 py-2 text-left text-sm text-texto hover:bg-black/5">
                    {{ producto.nombre }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <div class="mb-4 inline-flex gap-1 rounded-lg bg-black/5 p-1">
        <button type="button" (click)="pestanaActiva.set('detalle')"
                class="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
                [class.bg-fondo]="pestanaActiva() === 'detalle'" [class.text-primario]="pestanaActiva() === 'detalle'"
                [class.shadow-sm]="pestanaActiva() === 'detalle'" [class.text-secundario]="pestanaActiva() !== 'detalle'">
          Detalle
        </button>
        <button type="button" (click)="pestanaActiva.set('resumen')"
                class="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
                [class.bg-fondo]="pestanaActiva() === 'resumen'" [class.text-primario]="pestanaActiva() === 'resumen'"
                [class.shadow-sm]="pestanaActiva() === 'resumen'" [class.text-secundario]="pestanaActiva() !== 'resumen'">
          Resumen
        </button>
      </div>

      @if (pestanaActiva() === 'detalle') {
        @if (listadoDetalle.cargando()) {
          <p class="text-sm text-gray-400">Cargando...</p>
        } @else {
          <div class="notebook-sheet rounded-lg border border-black/5 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
            <div class="notebook-line grid min-w-[640px] grid-cols-12 items-center gap-3 pr-4 text-[10px] font-bold tracking-wider text-secundario uppercase opacity-70">
              <div class="col-span-5">Producto</div>
              <div class="col-span-3">Tipo / Ubicación</div>
              <div class="col-span-2 text-right">Cantidad</div>
              <div class="col-span-2 text-right">Fecha</div>
            </div>
            @for (fila of listadoDetalle.filas(); track $index) {
              <div class="notebook-line grid min-w-[640px] grid-cols-12 items-center gap-3 pr-4">
                <div class="col-span-5 min-w-0">
                  <div class="text-texto truncate text-sm font-semibold">{{ fila.producto_nombre }}</div>
                  @if (fila.motivo) {
                    <div class="text-secundario truncate text-[11px]">{{ fila.motivo }}</div>
                  }
                </div>
                <div class="col-span-3 flex flex-wrap items-center gap-1">
                  <span class="rounded-lg px-2 py-0.5 text-[10px] font-semibold" [class]="claseTipo(fila.tipo)">{{ etiquetaTipo(fila.tipo) }}</span>
                  <span class="rounded-lg px-2 py-0.5 text-[10px] font-semibold" [class]="claseUbicacion(fila.ubicacion_tipo)">{{ fila.ubicacion_nombre }}</span>
                </div>
                <div class="text-primario col-span-2 text-right text-sm font-bold">{{ fila.cantidad }} uds.</div>
                <div class="text-secundario col-span-2 text-right text-[11px]">{{ fila.fecha_creacion }}</div>
              </div>
            } @empty {
              <div class="text-secundario px-4 py-8 text-center text-sm">Sin movimientos para este filtro.</div>
            }
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <app-boton variante="secundario" [disabled]="listadoDetalle.pagina() <= 1" (click)="listadoDetalle.paginaAnterior()">Anterior</app-boton>
            <span class="text-secundario text-sm">Página {{ listadoDetalle.pagina() }} de {{ listadoDetalle.totalPaginas() }}</span>
            <app-boton variante="secundario" [disabled]="listadoDetalle.pagina() >= listadoDetalle.totalPaginas()" (click)="listadoDetalle.paginaSiguiente()">Siguiente</app-boton>
          </div>
        }
      } @else {
        @if (listadoResumen.cargando()) {
          <p class="text-sm text-gray-400">Cargando...</p>
        } @else {
          <div class="notebook-sheet rounded-lg border border-black/5 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
            <div class="notebook-line grid min-w-[640px] grid-cols-12 items-center gap-3 pr-4 text-[10px] font-bold tracking-wider text-secundario uppercase opacity-70">
              <div class="col-span-7">Producto</div>
              <div class="col-span-3">Ubicación</div>
              <div class="col-span-2 text-right">Cantidad</div>
            </div>
            @for (fila of listadoResumen.filas(); track $index) {
              <div class="notebook-line grid min-w-[640px] grid-cols-12 items-center gap-3 pr-4">
                <div class="col-span-7 min-w-0 text-texto truncate text-sm font-semibold">{{ fila.producto_nombre }}</div>
                <div class="col-span-3">
                  <span class="rounded-lg px-2 py-0.5 text-[10px] font-semibold" [class]="claseUbicacion(fila.ubicacion_tipo)">{{ fila.ubicacion_nombre }}</span>
                </div>
                <div class="text-primario col-span-2 text-right text-sm font-bold">{{ fila.cantidad_total }} uds.</div>
              </div>
            } @empty {
              <div class="text-secundario px-4 py-8 text-center text-sm">Sin movimientos para este filtro.</div>
            }
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <app-boton variante="secundario" [disabled]="listadoResumen.pagina() <= 1" (click)="listadoResumen.paginaAnterior()">Anterior</app-boton>
            <span class="text-secundario text-sm">Página {{ listadoResumen.pagina() }} de {{ listadoResumen.totalPaginas() }}</span>
            <app-boton variante="secundario" [disabled]="listadoResumen.pagina() >= listadoResumen.totalPaginas()" (click)="listadoResumen.paginaSiguiente()">Siguiente</app-boton>
          </div>
        }
      }
    </div>
  `,
})
export class ReportesTrazabilidad implements OnInit {
  private reporteService = inject(ReporteService);
  private productoService = inject(ProductoService);
  private almacenService = inject(AlmacenService);
  private tiendaService = inject(TiendaService);

  protected fecha = signal(hoyIso());
  protected origenTipo = signal<TipoUbicacionReporte | ''>('');
  protected origenId = signal('');
  protected productoId = signal('');
  protected busquedaProducto = signal('');
  protected mostrarSugerenciasProducto = signal(false);
  protected pestanaActiva = signal<'detalle' | 'resumen'>('detalle');

  protected productos = signal<Producto[]>([]);
  protected almacenes = signal<Almacen[]>([]);
  protected tiendas = signal<Tienda[]>([]);

  protected opcionesUbicacion = computed(() => (this.origenTipo() === 'almacen' ? this.almacenes() : this.tiendas()));

  // Mismo patrón que la búsqueda de producto en ventas.ts: sin texto muestra
  // los primeros de la lista para que se pueda "explorar" igual que un select,
  // con texto filtra por nombre.
  protected productosFiltrados = computed(() => {
    const texto = this.busquedaProducto().trim().toLowerCase();
    const lista = texto ? this.productos().filter((p) => p.nombre.toLowerCase().includes(texto)) : this.productos();
    return lista.slice(0, 8);
  });

  private filtros = (): FiltrosTrazabilidad => ({
    fecha: this.fecha(),
    ...(this.origenTipo() && this.origenId() ? { origenTipo: this.origenTipo() as TipoUbicacionReporte, origenId: this.origenId() } : {}),
    ...(this.productoId() ? { productoId: this.productoId() } : {}),
  });

  protected listadoDetalle = crearListadoPaginado<TrazabilidadItem>((pagina) =>
    this.reporteService.trazabilidad(this.filtros(), pagina, LIMITE),
  );
  protected listadoResumen = crearListadoPaginado<TrazabilidadResumenItem>((pagina) =>
    this.reporteService.trazabilidadResumen(this.filtros(), pagina, LIMITE),
  );

  protected etiquetaTipo = (tipo: TipoTrazabilidad) => ETIQUETA_TIPO[tipo];
  protected claseTipo = (tipo: TipoTrazabilidad) => CLASE_TIPO[tipo];
  protected claseUbicacion = (tipo: TipoUbicacionReporte) => CLASE_UBICACION[tipo];

  ngOnInit(): void {
    this.aplicarFiltros();
    // ponytail: limit=100 asume catálogos chicos, mismo criterio ya documentado
    // en movimientos.ts — upgrade a autocomplete paginado si el volumen lo justifica.
    this.productoService.listar(1, 100).subscribe(({ data }) => this.productos.set(data));
    this.almacenService.listar(1, 100).subscribe(({ data }) => this.almacenes.set(data));
    this.tiendaService.listar(1, 100).subscribe(({ data }) => this.tiendas.set(data));
  }

  protected alCambiarFecha(nuevaFecha: string): void {
    this.fecha.set(nuevaFecha);
    this.aplicarFiltros();
  }

  protected alCambiarOrigenTipo(evento: Event): void {
    this.origenTipo.set((evento.target as HTMLSelectElement).value as TipoUbicacionReporte | '');
    this.origenId.set('');
    this.aplicarFiltros();
  }

  protected alEscribirProducto(valor: string): void {
    this.busquedaProducto.set(valor);
    this.mostrarSugerenciasProducto.set(true);
    if (!valor && this.productoId()) {
      this.productoId.set('');
      this.aplicarFiltros();
    }
  }

  protected elegirProducto(producto: Producto): void {
    this.productoId.set(producto.public_id);
    this.busquedaProducto.set(producto.nombre);
    this.mostrarSugerenciasProducto.set(false);
    this.aplicarFiltros();
  }

  protected limpiarProducto(): void {
    this.productoId.set('');
    this.busquedaProducto.set('');
    this.aplicarFiltros();
  }

  // Delay corto para que (mousedown) de una sugerencia se dispare antes de que
  // el blur cierre la lista — mismo criterio que alSalirBusqueda en ventas.ts.
  protected alSalirBusquedaProducto(): void {
    setTimeout(() => this.mostrarSugerenciasProducto.set(false), 150);
  }

  protected aplicarFiltros(): void {
    this.listadoDetalle.pagina.set(1);
    this.listadoResumen.pagina.set(1);
    this.listadoDetalle.cargar();
    this.listadoResumen.cargar();
  }
}
