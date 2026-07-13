import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Producto, ProductoService, StockUbicacion } from './producto.service';

// Fila de solo lectura: stock_minimo se muestra como '—' cuando es null en vez
// del null crudo (<app-tabla> renderiza fila[columna.clave] directo, sin hook
// de formato), así que la conversión pasa antes, al armar las filas.
interface StockFila {
  public_id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number | string;
  fecha_actualizacion: string;
}

const COLUMNAS: ColumnaTabla<StockFila>[] = [
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'stock_actual', titulo: 'Stock actual' },
  { clave: 'stock_minimo', titulo: 'Stock mínimo' },
  { clave: 'fecha_actualizacion', titulo: 'Última actualización' },
];

function aFilas(lista: StockUbicacion[]): StockFila[] {
  return lista.map((u) => ({ ...u, stock_minimo: u.stock_minimo ?? '—' }));
}

// No paginado (backend no pagina), no extiende CrudListBase (no es CRUD, es
// solo consulta) — mismo criterio que movimientos.ts para un listado que igual
// reusa <app-tabla>.
@Component({
  selector: 'app-producto-stock',
  imports: [RouterLink, Tabla],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Stock de {{ producto()?.nombre }}</h1>
        <a routerLink="/productos" class="text-sm text-blue-600 hover:underline">Volver a productos</a>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <div class="space-y-6">
          <div>
            <h2 class="mb-2 text-sm font-semibold text-gray-700">Almacenes</h2>
            <app-tabla [columnas]="columnas" [filas]="almacenes()" [clave]="idDe"
                       [puedeEditar]="false" [puedeEliminar]="false" [puedeVerDetalle]="false"
                       [paginaActual]="1" [totalPaginas]="1"
                       (anterior)="sinOp()" (siguiente)="sinOp()" />
          </div>

          <div>
            <h2 class="mb-2 text-sm font-semibold text-gray-700">Tiendas</h2>
            <app-tabla [columnas]="columnas" [filas]="tiendas()" [clave]="idDe"
                       [puedeEditar]="false" [puedeEliminar]="false" [puedeVerDetalle]="false"
                       [paginaActual]="1" [totalPaginas]="1"
                       (anterior)="sinOp()" (siguiente)="sinOp()" />
          </div>
        </div>
      }
    </div>
  `,
})
export class ProductoStock implements OnInit {
  private route = inject(ActivatedRoute);
  private productoService = inject(ProductoService);

  protected columnas = COLUMNAS;
  protected producto = signal<Producto | null>(null);
  protected almacenes = signal<StockFila[]>([]);
  protected tiendas = signal<StockFila[]>([]);
  protected cargando = signal(false);

  ngOnInit(): void {
    // Sin withComponentInputBinding() en app.config.ts: el param se lee vía
    // ActivatedRoute, no vía input() de ruta.
    const id = this.route.snapshot.paramMap.get('id')!;
    this.cargando.set(true);
    this.productoService.obtener(id).subscribe((producto) => this.producto.set(producto));
    this.productoService.stock(id).subscribe({
      next: ({ almacenes, tiendas }) => {
        this.almacenes.set(aFilas(almacenes));
        this.tiendas.set(aFilas(tiendas));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected idDe(fila: StockFila): string {
    return fila.public_id;
  }

  protected sinOp(): void {}
}
