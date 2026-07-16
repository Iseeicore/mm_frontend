import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Venta, VentaLineaDetalle, VentaService } from './venta.service';

// Fila de solo lectura de una línea de venta — combina origen_tipo/origen_nombre
// en un solo texto (mismo criterio de aFilas que producto-stock.ts para no
// agregar una columna extra solo para el tipo) y agrega `idx` porque
// producto_public_id no es único dentro de una venta (un mismo producto puede
// venderse en dos líneas con distinto origen).
interface VentaLineaFila {
  idx: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  origen: string;
}

const COLUMNAS: ColumnaTabla<VentaLineaFila>[] = [
  { clave: 'producto_nombre', titulo: 'Producto' },
  { clave: 'cantidad', titulo: 'Cantidad' },
  { clave: 'precio_unitario', titulo: 'Precio unitario' },
  { clave: 'subtotal', titulo: 'Subtotal' },
  { clave: 'origen', titulo: 'Origen' },
];

function aFilas(lineas: VentaLineaDetalle[]): VentaLineaFila[] {
  return lineas.map((l, idx) => ({
    idx,
    producto_nombre: l.producto_nombre,
    cantidad: l.cantidad,
    precio_unitario: l.precio_unitario,
    subtotal: l.subtotal,
    origen: `${l.origen_tipo === 'almacen' ? 'Almacén' : 'Tienda'}: ${l.origen_nombre}`,
  }));
}

// Detalle de solo lectura (cabecera + líneas) — no paginado (el backend no
// pagina el detalle de una venta), no extiende CrudListBase, mismo criterio
// que producto-stock.ts.
@Component({
  selector: 'app-venta-detalle',
  imports: [RouterLink, Tabla],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Venta {{ venta()?.public_id }}</h1>
        <a routerLink="/ventas" class="text-sm text-blue-600 hover:underline">Volver a ventas</a>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <div class="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4">
          <div>
            <span class="block text-xs font-medium text-gray-500">Tienda</span>
            <span class="text-sm text-gray-900">{{ venta()?.tienda_nombre }}</span>
          </div>
          <div>
            <span class="block text-xs font-medium text-gray-500">Total</span>
            <span class="text-sm text-gray-900">{{ venta()?.total }}</span>
          </div>
          <div>
            <span class="block text-xs font-medium text-gray-500">Fecha</span>
            <span class="text-sm text-gray-900">{{ venta()?.fecha_creacion }}</span>
          </div>
          <div>
            <span class="block text-xs font-medium text-gray-500">Creado por</span>
            <span class="text-sm text-gray-900">{{ venta()?.creado_por_nombre }}</span>
          </div>
        </div>

        <app-tabla [columnas]="columnas" [filas]="filas()" [clave]="idDe"
                   [puedeEditar]="false" [puedeEliminar]="false" [puedeVerDetalle]="false"
                   [paginaActual]="1" [totalPaginas]="1"
                   (anterior)="sinOp()" (siguiente)="sinOp()" />
      }
    </div>
  `,
})
export class VentaDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private ventaService = inject(VentaService);

  protected columnas = COLUMNAS;
  protected venta = signal<Venta | null>(null);
  protected filas = signal<VentaLineaFila[]>([]);
  protected cargando = signal(false);

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

  protected idDe(fila: VentaLineaFila): number {
    return fila.idx;
  }

  protected sinOp(): void {}
}
