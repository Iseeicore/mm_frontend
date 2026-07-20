import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { formatoMoneda } from '../../shared/moneda';
import { crearListadoPaginado } from '../../shared/paginacion/listado-paginado';
import { Venta, VentaPayload, VentaService, TipoOrigenVenta } from './venta.service';
import { Producto, ProductoService, StockUbicacion } from '../productos/producto.service';
import { Almacen, AlmacenService } from '../almacenes/almacen.service';
import { Tienda, TiendaService } from '../tiendas/tienda.service';

const COLUMNAS: ColumnaTabla<Venta>[] = [
  { clave: 'public_id', titulo: 'Número de venta', tipo: 'codigo', prefijo: 'V' },
  { clave: 'tienda_nombre', titulo: 'Tienda' },
  { clave: 'total', titulo: 'Total', tipo: 'moneda' },
  { clave: 'fecha_creacion', titulo: 'Fecha' },
  { clave: 'creado_por_nombre', titulo: 'Creado por', tipo: 'avatar' },
];

type StockProducto = { almacenes: StockUbicacion[]; tiendas: StockUbicacion[] };

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  origen_tipo: TipoOrigenVenta;
  origen_id: string;
  origen_nombre: string;
}

@Component({
  selector: 'app-ventas',
  imports: [Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Ventas</h1>
        @if (auth.tienePermiso('ventas.create')) {
          <app-boton [elevado]="true" (click)="abrirCrear()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva venta
          </app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" (click)="cancelar()">
          <div class="bg-fondo flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg shadow-2xl" (click)="$event.stopPropagation()">
            <div class="flex items-start justify-between px-8 py-6">
              <div>
                <p class="text-xs font-bold tracking-widest text-secundario uppercase">Nueva venta</p>
                <h2 class="text-2xl font-bold text-texto">Registrar venta</h2>
              </div>
              <button type="button" (click)="cancelar()"
                      class="rounded-lg p-2 text-secundario transition-colors hover:bg-black/5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="flex-1 space-y-6 overflow-y-auto px-8 pb-6">
              <div>
                <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Tienda</label>
                <select [value]="tiendaId()" (change)="tiendaId.set($any($event.target).value)"
                        class="bg-fondo focus:border-primario w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-texto outline-none">
                  <option value="" disabled>Seleccionar...</option>
                  @for (tienda of tiendas(); track tienda.public_id) {
                    <option [value]="tienda.public_id">{{ tienda.nombre }}</option>
                  }
                </select>
              </div>

              <div class="space-y-4 rounded-lg border border-black/5 bg-black/[0.02] p-6">
                <p class="flex items-center gap-2 text-xs font-bold tracking-wider text-secundario uppercase">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  Buscar producto
                </p>

                <div class="relative">
                  <input type="text" [value]="busquedaProducto()" (input)="busquedaProducto.set($any($event.target).value); mostrarSugerencias.set(true)"
                         (focus)="mostrarSugerencias.set(true)" (blur)="alSalirBusqueda()"
                         spellcheck="false" autocomplete="off" placeholder="Nombre o código de barras..."
                         class="bg-fondo focus:border-primario w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-texto outline-none" />
                  @if (mostrarSugerencias() && productosFiltrados().length > 0) {
                    <div class="bg-fondo absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-black/10 p-1 shadow-lg">
                      @for (producto of productosFiltrados(); track producto.public_id) {
                        <button type="button" (mousedown)="elegirProducto(producto)"
                                class="block w-full rounded-lg px-3 py-2 text-left text-sm text-texto hover:bg-black/5">
                          {{ producto.nombre }}
                          @if (producto.codigo_barras) {
                            <span class="text-secundario"> · {{ producto.codigo_barras }}</span>
                          }
                        </button>
                      }
                    </div>
                  }
                </div>

                @if (productoSeleccionado(); as producto) {
                  <div class="flex flex-wrap items-end gap-4">
                    <div class="min-w-[10rem] flex-1">
                      <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Producto elegido</label>
                      <p class="bg-fondo rounded-lg border border-black/10 px-4 py-3 text-sm font-semibold text-texto">{{ producto.nombre }}</p>
                    </div>
                    <div class="min-w-[12rem]">
                      <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Tipo de origen</label>
                      <div class="flex gap-1.5 rounded-lg bg-black/5 p-1.5">
                        <button type="button" (click)="elegirTipoOrigen('almacen')" [class]="claseTipoOrigen('almacen')">Almacén</button>
                        <button type="button" (click)="elegirTipoOrigen('tienda')" [class]="claseTipoOrigen('tienda')">Tienda</button>
                      </div>
                    </div>
                    <div class="min-w-[12rem]">
                      <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Origen</label>
                      <select [value]="origenId()" (change)="origenId.set($any($event.target).value)"
                              class="bg-fondo focus:border-primario w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-texto outline-none">
                        <option value="" disabled>Seleccionar...</option>
                        @for (opcion of opcionesOrigen(); track opcion.public_id) {
                          <option [value]="opcion.public_id">{{ opcion.nombre }} ({{ opcion.stock_actual }} disponibles)</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Cantidad</label>
                      <input type="number" min="1" step="1" [value]="cantidad()" (input)="alCambiarCantidad($any($event.target).value)"
                             class="bg-fondo focus:border-primario w-24 rounded-lg border border-black/10 px-4 py-3 text-center text-sm font-bold text-texto outline-none" />
                    </div>
                    <app-boton [elevado]="true" type="button" [disabled]="!puedeAgregar()" (click)="agregarAlCarrito()">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Agregar producto
                    </app-boton>
                  </div>

                  @if (mensajeStockActual(); as mensaje) {
                    <p class="text-xs text-amber-600">{{ mensaje }}</p>
                  } @else if (origenId()) {
                    <p class="text-xs text-secundario">Stock disponible: <strong class="text-primario">{{ stockSeleccionado() }}</strong></p>
                  }
                }
              </div>

              <div>
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="text-xs font-bold tracking-wider text-secundario uppercase">Resumen de venta</h3>
                  @if (carrito().length > 0) {
                    <button type="button" (click)="carrito.set([])" class="text-xs font-bold text-primario hover:underline">Vaciar carrito</button>
                  }
                </div>

                @if (carrito().length === 0) {
                  <p class="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-secundario">Todavía no agregaste productos.</p>
                } @else {
                  <div class="space-y-3">
                    @for (item of carrito(); track $index; let i = $index) {
                      <div class="bg-fondo flex flex-wrap items-center gap-4 rounded-lg border border-black/5 p-4 shadow-sm">
                        <div class="flex-1">
                          <p class="font-semibold text-texto">{{ item.producto.nombre }}</p>
                          <p class="text-xs text-secundario">{{ item.origen_nombre }} · x{{ item.cantidad }}</p>
                        </div>
                        <p class="font-mono font-bold text-primario">S/ {{ subtotal(item) }}</p>
                        <div class="flex items-center gap-1">
                          <button type="button" (click)="editarDelCarrito(i)" title="Editar"
                                  class="rounded-lg p-2 text-secundario transition-colors hover:bg-black/5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                          <button type="button" (click)="quitarDelCarrito(i)" title="Eliminar"
                                  class="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="flex flex-col items-center justify-between gap-4 border-t border-black/5 bg-black/[0.02] px-8 py-6 sm:flex-row">
              <div>
                <p class="text-xs font-bold tracking-wider text-secundario uppercase">Total a pagar</p>
                <p class="text-3xl font-black text-texto">S/ {{ totalFormateado() }}</p>
              </div>
              <div class="flex gap-3">
                <app-boton variante="secundario" [elevado]="true" type="button" (click)="cancelar()">Cancelar</app-boton>
                <app-boton [elevado]="true" type="button" [disabled]="!puedeConfirmar()" (click)="crear()">Confirmar venta</app-boton>
              </div>
            </div>
          </div>
        </div>
      }

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <app-tabla [columnas]="columnas" [filas]="filas()" [clave]="idDe" variante="elevado"
                   [puedeEditar]="false" [puedeEliminar]="false" [puedeVerDetalle]="true" etiquetaVerDetalle="Ver detalle"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" (verDetalle)="irADetalle($event)" />
      }
    </div>
  `,
})
export class Ventas implements OnInit {
  protected auth = inject(AuthService);
  private notificacion = inject(NotificacionService);
  private ventaService = inject(VentaService);
  private productoService = inject(ProductoService);
  private almacenService = inject(AlmacenService);
  private tiendaService = inject(TiendaService);
  private router = inject(Router);

  protected columnas = COLUMNAS;
  protected mostrarForm = signal(false);

  private listado = crearListadoPaginado<Venta>((pagina) => this.ventaService.listar(pagina, 20));
  protected filas = this.listado.filas;
  protected cargando = this.listado.cargando;
  protected pagina = this.listado.pagina;
  protected totalPaginas = this.listado.totalPaginas;
  protected cargar = this.listado.cargar;
  protected paginaSiguiente = this.listado.paginaSiguiente;
  protected paginaAnterior = this.listado.paginaAnterior;

  protected productos = signal<Producto[]>([]);
  protected almacenes = signal<Almacen[]>([]);
  protected tiendas = signal<Tienda[]>([]);

  // Estado del "renglón" de alta en curso — no es un FormGroup: no hay N
  // líneas editables en paralelo (ver estilo-bold-accent/agents.md, patrón
  // "elevado" piloteado acá), solo un producto a la vez que se confirma con
  // "Agregar producto" y pasa a `carrito`.
  protected tiendaId = signal('');
  protected busquedaProducto = signal('');
  protected mostrarSugerencias = signal(false);
  protected productoSeleccionado = signal<Producto | null>(null);
  protected origenTipo = signal<TipoOrigenVenta>('almacen');
  protected origenId = signal('');
  protected cantidad = signal(1);
  private stockProductoActual = signal<StockProducto | null>(null);

  protected carrito = signal<ItemCarrito[]>([]);

  ngOnInit(): void {
    this.cargar();
    // ponytail: limit=100 asume catálogos chicos de producto/almacén/tienda —
    // mismo criterio ya documentado en movimientos.ts.
    this.productoService.listar(1, 100).subscribe(({ data }) => this.productos.set(data));
    this.almacenService.listar(1, 100).subscribe(({ data }) => this.almacenes.set(data));
    this.tiendaService.listar(1, 100).subscribe(({ data }) => this.tiendas.set(data));
  }

  protected abrirCrear(): void {
    this.tiendaId.set('');
    this.carrito.set([]);
    this.busquedaProducto.set('');
    this.mostrarSugerencias.set(false);
    this.productoSeleccionado.set(null);
    this.stockProductoActual.set(null);
    this.origenTipo.set('almacen');
    this.origenId.set('');
    this.cantidad.set(1);
    this.mostrarForm.set(true);
  }

  protected cancelar(): void {
    this.mostrarForm.set(false);
  }

  protected alSalirBusqueda(): void {
    // Delay corto para que el (mousedown) de una sugerencia se dispare antes
    // de que el blur cierre la lista (blur ocurre antes que click en el
    // mismo ciclo de eventos).
    setTimeout(() => this.mostrarSugerencias.set(false), 150);
  }

  protected productosFiltrados = computed(() => {
    const texto = this.busquedaProducto().trim().toLowerCase();
    if (!texto) return [];
    return this.productos()
      .filter((p) => p.nombre.toLowerCase().includes(texto) || (p.codigo_barras ?? '').toLowerCase().includes(texto))
      .slice(0, 8);
  });

  protected elegirProducto(producto: Producto): void {
    this.productoSeleccionado.set(producto);
    this.busquedaProducto.set('');
    this.mostrarSugerencias.set(false);
    this.origenId.set('');
    this.cantidad.set(1);
    // Guard contra respuestas fuera de orden: si el usuario ya eligió otro
    // producto cuando esta respuesta llega, se descarta.
    this.productoService.stock(producto.public_id).subscribe((stock) => {
      if (this.productoSeleccionado()?.public_id === producto.public_id) this.stockProductoActual.set(stock);
    });
  }

  protected elegirTipoOrigen(tipo: TipoOrigenVenta): void {
    this.origenTipo.set(tipo);
    this.origenId.set('');
  }

  protected claseTipoOrigen(tipo: TipoOrigenVenta): string {
    const base = 'flex-1 rounded-md py-2.5 text-xs font-bold uppercase tracking-wide transition-colors';
    return this.origenTipo() === tipo ? `${base} bg-primario text-white shadow-sm` : `${base} text-secundario hover:text-texto`;
  }

  // Cantidad es siempre entero: se prefiere edición directa por teclado a
  // botones +/- (pedido explícito: versatilidad de tipeo sobre estética de
  // stepper). alCambiarCantidad trunca cualquier decimal tipeado.
  protected alCambiarCantidad(valor: string): void {
    const n = Number(valor);
    this.cantidad.set(Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1);
  }

  // Cuánto de este producto+origen ya está "apartado" en otras líneas del
  // carrito en curso (mismo public_id de origen) — el backend solo ve el
  // stock real en el momento de leerlo, no sabe que el carrito ya piensa
  // usar parte de ese mismo stock en otra línea. Sin esto, el desplegable y
  // el mensaje de stock mostraban el stock crudo del servidor aunque ya
  // hubiera 2 líneas previas del mismo origen, dejando agregar de más (el
  // backend recién lo frenaba al confirmar, con las líneas ya cargadas).
  private reservadoEnCarrito(productoId: string, origenId: string): number {
    return this.carrito()
      .filter((item) => item.producto.public_id === productoId && item.origen_id === origenId)
      .reduce((suma, item) => suma + item.cantidad, 0);
  }

  // origen_id siempre resta stock real (el trigger de s_venta_detalle descuenta
  // en toda línea, sin excepción tipo "entrada" como en movimientos) — por eso
  // acá SIEMPRE se filtra por stock_actual > 0, mismo criterio que ya estaba.
  protected opcionesOrigen(): { public_id: string; nombre: string; stock_actual: number }[] {
    const stock = this.stockProductoActual();
    const producto = this.productoSeleccionado();
    if (!stock || !producto) return [];
    const lista = this.origenTipo() === 'almacen' ? stock.almacenes : stock.tiendas;
    return lista
      .map((u) => ({ public_id: u.public_id, nombre: u.nombre, stock_actual: u.stock_actual - this.reservadoEnCarrito(producto.public_id, u.public_id) }))
      .filter((u) => u.stock_actual > 0);
  }

  protected stockSeleccionado = computed(() => {
    const stock = this.stockProductoActual();
    const id = this.origenId();
    const producto = this.productoSeleccionado();
    if (!stock || !id || !producto) return 0;
    const lista = this.origenTipo() === 'almacen' ? stock.almacenes : stock.tiendas;
    const disponible = lista.find((u) => u.public_id === id)?.stock_actual ?? 0;
    return disponible - this.reservadoEnCarrito(producto.public_id, id);
  });

  private origenSeleccionadoNombre(): string {
    const stock = this.stockProductoActual();
    const id = this.origenId();
    if (!stock || !id) return '';
    const lista = this.origenTipo() === 'almacen' ? stock.almacenes : stock.tiendas;
    return lista.find((u) => u.public_id === id)?.nombre ?? '';
  }

  // Mensaje en vivo (no bloqueante hasta agregar, mismo patrón que mensajeRuc
  // en registro.ts): el backend sigue siendo la autoridad final (CHECK
  // stock_actual >= 0 -> 23514 -> 400) por si el stock cambia entre que se
  // leyó y que se confirma la venta.
  protected mensajeStockActual = computed(() => {
    if (!this.origenId()) return null;
    const disponible = this.stockSeleccionado();
    if (this.cantidad() > disponible) return `Superaste el stock disponible en ese origen (${disponible}).`;
    return null;
  });

  protected puedeAgregar = computed(
    () => !!this.productoSeleccionado() && !!this.origenId() && this.cantidad() >= 1 && !this.mensajeStockActual(),
  );

  protected agregarAlCarrito(): void {
    const producto = this.productoSeleccionado();
    if (!producto || !this.puedeAgregar()) return;

    this.carrito.update((lista) => [
      ...lista,
      {
        producto,
        cantidad: this.cantidad(),
        origen_tipo: this.origenTipo(),
        origen_id: this.origenId(),
        origen_nombre: this.origenSeleccionadoNombre(),
      },
    ]);

    this.productoSeleccionado.set(null);
    this.stockProductoActual.set(null);
    this.origenId.set('');
    this.cantidad.set(1);
  }

  // Reusa el mismo formulario de alta para editar: saca el item del carrito
  // y lo vuelve a dejar en el "renglón" en curso, listo para reconfirmar con
  // "Agregar producto". ponytail: si el usuario cancela sin reagregarlo, el
  // item se pierde del carrito — mismo riesgo que descartar un draft, no
  // amerita un modal de edición aparte para este alcance (solo Ventas).
  protected editarDelCarrito(indice: number): void {
    const item = this.carrito()[indice];
    if (!item) return;

    this.productoSeleccionado.set(item.producto);
    this.origenTipo.set(item.origen_tipo);
    this.origenId.set(item.origen_id);
    this.cantidad.set(item.cantidad);
    this.busquedaProducto.set('');
    this.mostrarSugerencias.set(false);

    this.productoService.stock(item.producto.public_id).subscribe((stock) => {
      if (this.productoSeleccionado()?.public_id === item.producto.public_id) this.stockProductoActual.set(stock);
    });

    this.carrito.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected async quitarDelCarrito(indice: number): Promise<void> {
    const item = this.carrito()[indice];
    if (!item) return;
    const confirmado = await this.notificacion.confirmar(`Se quitará "${item.producto.nombre}" del carrito.`);
    if (!confirmado) return;
    this.carrito.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected subtotal(item: ItemCarrito): string {
    return formatoMoneda(item.producto.precio_venta_unidad * item.cantidad);
  }

  protected total = computed(() => this.carrito().reduce((suma, item) => suma + item.producto.precio_venta_unidad * item.cantidad, 0));
  protected totalFormateado = computed(() => formatoMoneda(this.total()));

  protected puedeConfirmar = computed(() => !!this.tiendaId() && this.carrito().length > 0);

  protected crear(): void {
    if (!this.puedeConfirmar()) return;

    const payload: VentaPayload = {
      tienda_id: this.tiendaId(),
      lineas: this.carrito().map((item) => ({
        producto_id: item.producto.public_id,
        cantidad: item.cantidad,
        origen_tipo: item.origen_tipo,
        origen_id: item.origen_id,
      })),
    };

    this.ventaService.crear(payload).subscribe({
      next: () => {
        this.notificacion.toast('Venta registrada');
        this.mostrarForm.set(false);
        this.cargar();
      },
      // 400 de validación o de stock insuficiente (23514 traducido por el backend):
      // mostrar err.error?.error tal cual llega, no hardcodear el mensaje.
      error: (err) => this.notificacion.error(err.error?.error ?? 'Error al guardar'),
    });
  }

  protected irADetalle(venta: Venta): void {
    this.router.navigate(['/ventas', venta.public_id]);
  }

  protected idDe(venta: Venta): string {
    return venta.public_id;
  }
}
