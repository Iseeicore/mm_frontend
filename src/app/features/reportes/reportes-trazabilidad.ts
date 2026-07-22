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
        <app-calendario-fecha [fecha]="fecha()" (fechaCambio)="alCambiarFecha($event)" />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label class="text-secundario block text-sm font-medium">Tipo de ubicación</label>
            <select [value]="origenTipo()" (change)="alCambiarOrigenTipo($event)"
                    class="border-black/10 text-texto mt-1 w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todas</option>
              <option value="almacen">Almacén</option>
              <option value="tienda">Tienda</option>
            </select>
          </div>
          <div>
            <label class="text-secundario block text-sm font-medium">Ubicación</label>
            <select [value]="origenId()" (change)="origenId.set($any($event.target).value); aplicarFiltros()" [disabled]="!origenTipo()"
                    class="border-black/10 text-texto mt-1 w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
              <option value="">Todas</option>
              @for (opcion of opcionesUbicacion(); track opcion.public_id) {
                <option [value]="opcion.public_id">{{ opcion.nombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-secundario block text-sm font-medium">Producto</label>
            <select [value]="productoId()" (change)="productoId.set($any($event.target).value); aplicarFiltros()"
                    class="border-black/10 text-texto mt-1 w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todos</option>
              @for (producto of productos(); track producto.public_id) {
                <option [value]="producto.public_id">{{ producto.nombre }}</option>
              }
            </select>
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
          <div class="bg-fondo divide-y divide-black/5 rounded-lg border border-black/5 shadow-sm">
            @for (fila of listadoDetalle.filas(); track $index) {
              <div class="flex items-start justify-between gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <div class="text-texto truncate text-sm font-semibold">{{ fila.producto_nombre }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-1.5">
                    <span class="rounded-lg px-2 py-0.5 text-[11px] font-semibold" [class]="claseTipo(fila.tipo)">{{ etiquetaTipo(fila.tipo) }}</span>
                    <span class="rounded-lg px-2 py-0.5 text-[11px] font-semibold" [class]="claseUbicacion(fila.ubicacion_tipo)">{{ fila.ubicacion_nombre }}</span>
                  </div>
                  @if (fila.motivo) {
                    <div class="text-secundario mt-1 text-xs">{{ fila.motivo }}</div>
                  }
                </div>
                <div class="shrink-0 text-right">
                  <div class="text-texto text-sm font-bold">{{ fila.cantidad }} uds.</div>
                  <div class="text-secundario text-xs">{{ fila.fecha_creacion }}</div>
                </div>
              </div>
            } @empty {
              <div class="text-secundario px-4 py-8 text-center text-sm">Sin movimientos para este filtro.</div>
            }
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
          <div class="bg-fondo divide-y divide-black/5 rounded-lg border border-black/5 shadow-sm">
            @for (fila of listadoResumen.filas(); track $index) {
              <div class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="min-w-0 flex-1">
                  <div class="text-texto truncate text-sm font-semibold">{{ fila.producto_nombre }}</div>
                  <span class="mt-1 inline-block rounded-lg px-2 py-0.5 text-[11px] font-semibold" [class]="claseUbicacion(fila.ubicacion_tipo)">{{ fila.ubicacion_nombre }}</span>
                </div>
                <div class="text-texto shrink-0 text-sm font-bold">{{ fila.cantidad_total }} uds.</div>
              </div>
            } @empty {
              <div class="text-secundario px-4 py-8 text-center text-sm">Sin movimientos para este filtro.</div>
            }
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
  protected pestanaActiva = signal<'detalle' | 'resumen'>('detalle');

  protected productos = signal<Producto[]>([]);
  protected almacenes = signal<Almacen[]>([]);
  protected tiendas = signal<Tienda[]>([]);

  protected opcionesUbicacion = computed(() => (this.origenTipo() === 'almacen' ? this.almacenes() : this.tiendas()));

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

  protected aplicarFiltros(): void {
    this.listadoDetalle.pagina.set(1);
    this.listadoResumen.pagina.set(1);
    this.listadoDetalle.cargar();
    this.listadoResumen.cargar();
  }
}
