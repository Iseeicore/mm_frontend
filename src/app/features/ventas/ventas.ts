import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { crearListadoPaginado } from '../../shared/paginacion/listado-paginado';
import { Venta, VentaPayload, VentaService, TipoOrigenVenta } from './venta.service';
import { Producto, ProductoService, StockUbicacion } from '../productos/producto.service';
import { Almacen, AlmacenService } from '../almacenes/almacen.service';
import { Tienda, TiendaService } from '../tiendas/tienda.service';

const COLUMNAS: ColumnaTabla<Venta>[] = [
  { clave: 'tienda_nombre', titulo: 'Tienda' },
  { clave: 'total', titulo: 'Total' },
  { clave: 'fecha_creacion', titulo: 'Fecha' },
  { clave: 'creado_por_nombre', titulo: 'Creado por' },
];

type StockProducto = { almacenes: StockUbicacion[]; tiendas: StockUbicacion[] };

function crearLineaVenta(fb: FormBuilder) {
  return fb.nonNullable.group({
    producto_id: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    origen_tipo: ['almacen' as TipoOrigenVenta, Validators.required],
    origen_id: ['', Validators.required],
  });
}

type LineaVentaGroup = ReturnType<typeof crearLineaVenta>;

@Component({
  selector: 'app-ventas',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Ventas</h1>
        @if (auth.tienePermiso('ventas.create')) {
          <app-boton (click)="abrirCrear()">Nueva venta</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="crear()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">Nueva venta</h2>

          <div>
            <label class="block text-sm font-medium text-gray-700">Tienda</label>
            <select formControlName="tienda_id" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option value="" disabled>Seleccionar...</option>
              @for (tienda of tiendas(); track tienda.public_id) {
                <option [value]="tienda.public_id">{{ tienda.nombre }}</option>
              }
            </select>
          </div>

          <div class="space-y-3">
            @for (linea of form.controls.lineas.controls; track $index; let i = $index) {
              <div [formGroup]="linea" class="space-y-3 rounded border border-gray-200 p-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-gray-500">Línea {{ i + 1 }}</span>
                  <app-boton variante="peligro" type="button" [disabled]="form.controls.lineas.length <= 1" (click)="quitarLinea(i)">
                    Quitar
                  </app-boton>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Producto</label>
                    <select formControlName="producto_id" (change)="alCambiarProducto(linea)" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                      <option value="" disabled>Seleccionar...</option>
                      @for (producto of productos(); track producto.public_id) {
                        <option [value]="producto.public_id">{{ producto.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input formControlName="cantidad" type="number" min="1" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Tipo de origen</label>
                    <select formControlName="origen_tipo" (change)="alCambiarTipoOrigen(linea)" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                      <option value="almacen">Almacén</option>
                      <option value="tienda">Tienda</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Origen</label>
                    <select formControlName="origen_id" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                      <option value="" disabled>Seleccionar...</option>
                      @for (opcion of opcionesOrigen(linea, linea.controls.origen_tipo.value); track opcion.public_id) {
                        <option [value]="opcion.public_id">{{ opcion.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>
              </div>
            }
          </div>

          <app-boton variante="secundario" type="button" (click)="agregarLinea()">Agregar línea</app-boton>

          <div class="flex gap-2">
            <app-boton type="submit" [disabled]="form.invalid">Guardar</app-boton>
            <app-boton variante="secundario" type="button" (click)="cancelar()">Cancelar</app-boton>
          </div>
        </form>
      }

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <app-tabla [columnas]="columnas" [filas]="filas()" [clave]="idDe"
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
  private fb = inject(FormBuilder);
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

  // Stock del producto elegido en cada línea, asociado por REFERENCIA al
  // FormGroup de esa línea (no por índice): si el usuario borra/reordena
  // líneas mientras un fetch de stock está en vuelo, el índice puede pasar a
  // referirse a otra línea y el stock se escribiría en el slot equivocado.
  // WeakMap en vez de Map: al eliminar una línea, su FormGroup deja de estar
  // referenciado en ningún otro lado y la entrada se libera sola, sin tener
  // que tocar esta estructura desde agregarLinea/quitarLinea.
  private stockPorLinea = new WeakMap<LineaVentaGroup, StockProducto>();

  protected form = this.fb.nonNullable.group({
    tienda_id: ['', Validators.required],
    lineas: this.fb.array([crearLineaVenta(this.fb)]),
  });

  ngOnInit(): void {
    this.cargar();
    // ponytail: limit=100 asume catálogos chicos de producto/almacén/tienda —
    // mismo criterio ya documentado en movimientos.ts.
    this.productoService.listar(1, 100).subscribe(({ data }) => this.productos.set(data));
    this.almacenService.listar(1, 100).subscribe(({ data }) => this.almacenes.set(data));
    this.tiendaService.listar(1, 100).subscribe(({ data }) => this.tiendas.set(data));
  }

  protected abrirCrear(): void {
    this.form.reset({ tienda_id: '' });
    while (this.form.controls.lineas.length > 1) this.form.controls.lineas.removeAt(0);
    const primeraLinea = this.form.controls.lineas.at(0);
    primeraLinea?.reset({ producto_id: '', cantidad: 1, origen_tipo: 'almacen', origen_id: '' });
    if (primeraLinea) this.stockPorLinea.delete(primeraLinea);
    this.mostrarForm.set(true);
  }

  protected cancelar(): void {
    this.mostrarForm.set(false);
  }

  protected agregarLinea(): void {
    this.form.controls.lineas.push(crearLineaVenta(this.fb));
  }

  protected quitarLinea(i: number): void {
    if (this.form.controls.lineas.length <= 1) return;
    this.form.controls.lineas.removeAt(i);
  }

  // producto_id de esta línea cambió: el stock filtrado anterior ya no aplica
  // y origen_id elegido puede no tener stock del nuevo producto.
  protected alCambiarProducto(linea: LineaVentaGroup): void {
    linea.controls.origen_id.setValue('');
    const productoId = linea.controls.producto_id.value;
    if (!productoId) {
      this.stockPorLinea.delete(linea);
      return;
    }
    // Guard contra respuestas fuera de orden: si el producto de esta línea ya
    // cambió cuando la respuesta llega, se descarta en vez de pisar el stock
    // del producto seleccionado ahora. Al asociar por referencia del
    // FormGroup (no por índice), borrar otras líneas mientras este fetch está
    // en vuelo no afecta: la respuesta siempre escribe en el slot de ESTA línea.
    this.productoService.stock(productoId).subscribe((stock) => {
      if (linea.controls.producto_id.value === productoId) {
        this.stockPorLinea.set(linea, stock);
      }
    });
  }

  protected alCambiarTipoOrigen(linea: LineaVentaGroup): void {
    linea.controls.origen_id.setValue('');
  }

  // origen_id siempre resta stock real (el trigger de s_venta_detalle descuenta
  // en toda línea, sin excepción tipo "entrada" como en movimientos) — por eso
  // acá SIEMPRE se filtra por stock_actual > 0, sin rama alternativa.
  protected opcionesOrigen(linea: LineaVentaGroup, tipo: TipoOrigenVenta): { public_id: string; nombre: string }[] {
    const stock = this.stockPorLinea.get(linea);
    if (!stock) return [];
    const lista = tipo === 'almacen' ? stock.almacenes : stock.tiendas;
    return lista
      .filter((u) => u.stock_actual > 0)
      .map((u) => ({ public_id: u.public_id, nombre: `${u.nombre} (${u.stock_actual} disponibles)` }));
  }

  protected crear(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: VentaPayload = {
      tienda_id: v.tienda_id,
      lineas: v.lineas.map((l) => ({
        producto_id: l.producto_id,
        cantidad: l.cantidad,
        origen_tipo: l.origen_tipo,
        origen_id: l.origen_id,
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
