import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { crearListadoPaginado } from '../../shared/paginacion/listado-paginado';
import { Movimiento, MovimientoPayload, MovimientoService, TipoUbicacion } from './movimiento.service';
import { Producto, ProductoService, StockUbicacion } from '../productos/producto.service';
import { Almacen, AlmacenService } from '../almacenes/almacen.service';
import { Tienda, TiendaService } from '../tiendas/tienda.service';

const COLUMNAS: ColumnaTabla<Movimiento>[] = [
  { clave: 'tipo', titulo: 'Tipo' },
  { clave: 'producto_nombre', titulo: 'Producto' },
  { clave: 'cantidad', titulo: 'Cantidad' },
  { clave: 'ubicacion_nombre', titulo: 'Ubicación' },
  { clave: 'ubicacion_destino_nombre', titulo: 'Destino' },
  { clave: 'fecha_creacion', titulo: 'Fecha' },
];

@Component({
  selector: 'app-movimientos',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Movimientos</h1>
        @if (auth.tienePermiso('movimientos.create')) {
          <app-boton (click)="abrirCrear()">Nuevo movimiento</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="crear()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">Nuevo movimiento</h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Producto</label>
              <select formControlName="producto_id" (change)="alCambiarProducto()" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="" disabled>Seleccionar...</option>
                @for (producto of productos(); track producto.public_id) {
                  <option [value]="producto.public_id">{{ producto.nombre }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Tipo</label>
              <select formControlName="tipo" (change)="form.controls.ubicacion_id.setValue('')" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
                <option value="traspaso">Traspaso</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ etiquetaTipoUbicacion() }}</label>
              <select formControlName="ubicacion_tipo" (change)="form.controls.ubicacion_id.setValue('')" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="almacen">Almacén</option>
                <option value="tienda">Tienda</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ etiquetaUbicacion() }}</label>
              <select formControlName="ubicacion_id" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="" disabled>Seleccionar...</option>
                @for (opcion of opcionesUbicacionOrigen(form.controls.ubicacion_tipo.value); track opcion.public_id) {
                  <option [value]="opcion.public_id">{{ opcion.nombre }}</option>
                }
              </select>
            </div>
          </div>

          @if (esTraspaso()) {
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">Tipo de ubicación (destino)</label>
                <select formControlName="ubicacion_destino_tipo" (change)="form.controls.ubicacion_destino_id.setValue('')" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  <option value="almacen">Almacén</option>
                  <option value="tienda">Tienda</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Ubicación (destino)</label>
                <select formControlName="ubicacion_destino_id" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  <option value="" disabled>Seleccionar...</option>
                  @for (opcion of opcionesUbicacionDestino(form.controls.ubicacion_destino_tipo.value); track opcion.public_id) {
                    <option [value]="opcion.public_id">{{ opcion.nombre }}</option>
                  }
                </select>
              </div>
            </div>
          }

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Cantidad</label>
              <input formControlName="cantidad" type="number" min="1" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Motivo</label>
              <input formControlName="motivo" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div class="flex gap-2">
            <app-boton type="submit" [disabled]="!formularioValido()">Guardar</app-boton>
            <app-boton variante="secundario" type="button" (click)="cancelar()">Cancelar</app-boton>
          </div>
        </form>
      }

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <app-tabla [columnas]="columnas" [filas]="filas()" [clave]="idDe"
                   [puedeEditar]="false" [puedeEliminar]="false"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Movimientos implements OnInit {
  protected auth = inject(AuthService);
  private notificacion = inject(NotificacionService);
  private movimientoService = inject(MovimientoService);
  private productoService = inject(ProductoService);
  private almacenService = inject(AlmacenService);
  private tiendaService = inject(TiendaService);
  private fb = inject(FormBuilder);

  protected columnas = COLUMNAS;
  protected mostrarForm = signal(false);

  private listado = crearListadoPaginado<Movimiento>((pagina) => this.movimientoService.listar(pagina, 20));
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
  protected stockProducto = signal<{ almacenes: StockUbicacion[]; tiendas: StockUbicacion[] } | null>(null);

  protected form = this.fb.nonNullable.group({
    producto_id: ['', Validators.required],
    tipo: ['entrada' as 'entrada' | 'salida' | 'traspaso', Validators.required],
    ubicacion_tipo: ['almacen' as TipoUbicacion, Validators.required],
    ubicacion_id: ['', Validators.required],
    ubicacion_destino_tipo: ['almacen' as TipoUbicacion],
    ubicacion_destino_id: [''],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    motivo: [''],
  });

  ngOnInit(): void {
    this.cargar();
    // ponytail: limit=100 asume catálogos chicos de producto/almacén/tienda —
    // no escala con más de 100 registros. Upgrade: autocomplete con búsqueda
    // paginada en el backend cuando el volumen lo justifique; hoy sería
    // sobre-ingeniería.
    this.productoService.listar(1, 100).subscribe(({ data }) => this.productos.set(data));
    this.almacenService.listar(1, 100).subscribe(({ data }) => this.almacenes.set(data));
    this.tiendaService.listar(1, 100).subscribe(({ data }) => this.tiendas.set(data));
  }

  protected abrirCrear(): void {
    this.form.reset({
      producto_id: '',
      tipo: 'entrada',
      ubicacion_tipo: 'almacen',
      ubicacion_id: '',
      ubicacion_destino_tipo: 'almacen',
      ubicacion_destino_id: '',
      cantidad: 1,
      motivo: '',
    });
    this.stockProducto.set(null);
    this.mostrarForm.set(true);
  }

  protected cancelar(): void {
    this.mostrarForm.set(false);
  }

  protected esTraspaso(): boolean {
    return this.form.controls.tipo.value === 'traspaso';
  }

  // ubicacion_id es donde el trigger SUMA stock en entrada (destino real, la
  // compra no tiene origen físico modelado) y donde RESTA en salida/traspaso
  // (origen real) — etiquetarlo "origen" en los 3 casos confunde al usuario en
  // entrada, que ve un campo obligatorio sin nada que conceptualmente elegir ahí.
  protected etiquetaTipoUbicacion(): string {
    return this.form.controls.tipo.value === 'entrada' ? 'Tipo de ubicación' : 'Tipo de ubicación (origen)';
  }

  protected etiquetaUbicacion(): string {
    return this.form.controls.tipo.value === 'entrada' ? 'Ubicación' : 'Ubicación (origen)';
  }

  // producto_id cambió: el stock filtrado del producto anterior ya no aplica,
  // y la ubicación_id elegida antes puede no tener stock del nuevo producto.
  protected alCambiarProducto(): void {
    this.form.controls.ubicacion_id.setValue('');
    this.form.controls.ubicacion_destino_id.setValue('');
    const productoId = this.form.controls.producto_id.value;
    if (!productoId) {
      this.stockProducto.set(null);
      return;
    }
    // Guard contra respuestas fuera de orden: si el usuario ya cambió a otro
    // producto cuando esta respuesta llega, se descarta en vez de pisar el
    // stock del producto que está seleccionado ahora.
    this.productoService.stock(productoId).subscribe((stock) => {
      if (this.form.controls.producto_id.value === productoId) this.stockProducto.set(stock);
    });
  }

  // ubicacion_destino_id (traspaso, el trigger SUMA ahí) nunca requiere stock
  // previo: siempre lista el catálogo completo.
  protected opcionesUbicacionDestino(tipo: TipoUbicacion): (Almacen | Tienda)[] {
    return tipo === 'almacen' ? this.almacenes() : this.tiendas();
  }

  // ubicacion_id (origen): en entrada el trigger SUMA ahí (no requiere stock
  // previo, catálogo completo); en salida/traspaso el trigger RESTA, así que
  // solo se listan ubicaciones donde el producto ya tiene stock > 0 — evita
  // que el usuario elija una ubicación sin stock y recién se entere con el
  // 409 del backend al guardar.
  protected opcionesUbicacionOrigen(tipo: TipoUbicacion): { public_id: string; nombre: string }[] {
    if (this.form.controls.tipo.value === 'entrada') {
      return tipo === 'almacen' ? this.almacenes() : this.tiendas();
    }
    const stock = this.stockProducto();
    if (!stock) return [];
    const lista = tipo === 'almacen' ? stock.almacenes : stock.tiendas;
    return lista
      .filter((u) => u.stock_actual > 0)
      .map((u) => ({ public_id: u.public_id, nombre: `${u.nombre} (${u.stock_actual} disponibles)` }));
  }

  // ubicacion_destino_tipo/id solo son obligatorios cuando tipo === 'traspaso'
  // (el backend rechaza con 400 si vienen en entrada/salida) — form.invalid no
  // alcanza porque esos dos controles no llevan Validators.required estático.
  protected formularioValido(): boolean {
    if (this.form.invalid) return false;
    if (!this.esTraspaso()) return true;
    const { ubicacion_destino_tipo, ubicacion_destino_id } = this.form.getRawValue();
    return !!ubicacion_destino_tipo && !!ubicacion_destino_id;
  }

  protected crear(): void {
    if (!this.formularioValido()) return;

    const v = this.form.getRawValue();
    const payload: MovimientoPayload = {
      producto_id: v.producto_id,
      tipo: v.tipo,
      ubicacion_tipo: v.ubicacion_tipo,
      ubicacion_id: v.ubicacion_id,
      cantidad: v.cantidad,
      ...(v.motivo ? { motivo: v.motivo } : {}),
      ...(v.tipo === 'traspaso'
        ? { ubicacion_destino_tipo: v.ubicacion_destino_tipo, ubicacion_destino_id: v.ubicacion_destino_id }
        : {}),
    };

    this.movimientoService.crear(payload).subscribe({
      next: () => {
        this.notificacion.toast('Movimiento creado');
        this.mostrarForm.set(false);
        this.cargar();
      },
      // 409 de stock insuficiente en salida/traspaso o 400 de validación:
      // mostrar err.error?.error tal cual llega del backend, no hardcodear el mensaje.
      error: (err) => this.notificacion.error(err.error?.error ?? 'Error al guardar'),
    });
  }

  protected idDe(movimiento: Movimiento): string {
    return movimiento.public_id;
  }
}
