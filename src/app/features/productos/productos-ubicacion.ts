import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { AlmacenService } from '../almacenes/almacen.service';
import { TiendaService } from '../tiendas/tienda.service';
import { TipoUbicacion } from '../movimientos/movimiento.service';
import { ProductoDeUbicacion } from './producto.service';

// Fila de solo lectura: precio_venta_paquete y stock_minimo se muestran como
// '—' cuando son null en vez del null crudo (<app-tabla> renderiza
// fila[columna.clave] directo, sin hook de formato) — mismo criterio que
// producto-stock.ts.
interface ProductoUbicacionFila {
  producto_public_id: string;
  producto_nombre: string;
  precio_venta_unidad: number;
  precio_venta_paquete: number | string;
  stock_actual: number;
  paquetes_completos: number;
  stock_minimo: number | string;
  fecha_actualizacion: string;
}

const COLUMNAS: ColumnaTabla<ProductoUbicacionFila>[] = [
  { clave: 'producto_nombre', titulo: 'Nombre' },
  { clave: 'precio_venta_unidad', titulo: 'Precio unidad' },
  { clave: 'precio_venta_paquete', titulo: 'Precio paquete' },
  { clave: 'stock_actual', titulo: 'Stock actual' },
  { clave: 'paquetes_completos', titulo: 'Paquetes completos' },
  { clave: 'stock_minimo', titulo: 'Stock mínimo' },
  { clave: 'fecha_actualizacion', titulo: 'Última actualización' },
];

function aFilas(lista: ProductoDeUbicacion[]): ProductoUbicacionFila[] {
  return lista.map((p) => ({
    ...p,
    precio_venta_paquete: p.precio_venta_paquete ?? '—',
    stock_minimo: p.stock_minimo ?? '—',
  }));
}

// Listado de solo lectura de productos por almacén o por tienda. Un solo
// componente parametrizado por route `data.tipo` en vez de
// almacen-productos.ts + tienda-productos.ts: ambos backends devuelven el
// mismo shape (ProductoStockNormalizador) y la única diferencia real es qué
// servicio llamar — mismo criterio ya usado en movimientos.ts, que inyecta
// AlmacenService y TiendaService juntos y elige por tipo.
// Paginado de verdad (a diferencia de producto-stock.ts, que no pagina) pero
// no extiende CrudListBase: no es CRUD, no hay form que justifique sus
// miembros abstractos.
@Component({
  selector: 'app-productos-ubicacion',
  imports: [RouterLink, Tabla],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Productos de {{ nombreUbicacion() }}</h1>
        <a [routerLink]="['/', tipoPlural()]" class="text-sm text-blue-600 hover:underline">Volver a {{ tipoPlural() }}</a>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <app-tabla [columnas]="columnas" [filas]="filas()" [clave]="idDe"
                   [puedeEditar]="false" [puedeEliminar]="false" [puedeVerDetalle]="false"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class ProductosUbicacion implements OnInit {
  private route = inject(ActivatedRoute);
  private almacenService = inject(AlmacenService);
  private tiendaService = inject(TiendaService);

  protected columnas = COLUMNAS;
  protected nombreUbicacion = signal('');
  protected filas = signal<ProductoUbicacionFila[]>([]);
  protected cargando = signal(false);
  protected pagina = signal(1);
  protected totalPaginas = signal(1);

  private tipo!: TipoUbicacion;
  private id!: string;

  ngOnInit(): void {
    // Sin withComponentInputBinding() en app.config.ts: el param se lee vía
    // ActivatedRoute, no vía input() de ruta (mismo criterio que producto-stock.ts).
    const tipo = this.route.snapshot.data['tipo'];
    if (tipo !== 'almacen' && tipo !== 'tienda') {
      throw new Error(`Ruta mal configurada: data.tipo debe ser 'almacen' o 'tienda', recibió '${tipo}'`);
    }
    this.tipo = tipo;
    this.id = this.route.snapshot.paramMap.get('id')!;

    this.servicio()
      .obtener(this.id)
      .subscribe((ubicacion) => this.nombreUbicacion.set(ubicacion.nombre));
    this.cargar();
  }

  protected tipoPlural(): string {
    return this.tipo === 'almacen' ? 'almacenes' : 'tiendas';
  }

  private servicio(): AlmacenService | TiendaService {
    return this.tipo === 'almacen' ? this.almacenService : this.tiendaService;
  }

  // Mismo guard que CrudListBase.cargar(): si la página actual quedó fuera de
  // rango (ej. se vendió/traspasó suficiente stock como para que desaparezca
  // la última página), recargar en la última página válida en vez de mostrar
  // una tabla vacía con un número de página inválido.
  protected cargar(): void {
    this.cargando.set(true);
    this.servicio()
      .productos(this.id, this.pagina())
      .subscribe({
        next: ({ data, meta }) => {
          const paginas = Math.max(meta.pages, 1);
          if (this.pagina() > paginas) {
            this.pagina.set(paginas);
            this.cargando.set(false);
            this.cargar();
            return;
          }
          this.filas.set(aFilas(data));
          this.totalPaginas.set(paginas);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  // ponytail: paginaSiguiente/paginaAnterior/el guard de página fuera de rango
  // de cargar() son la tercera copia literal de la misma lógica (CrudListBase
  // y movimientos.ts ya la tienen cada uno por su lado). No se extrajo a un
  // helper compartido acá para no tocar 3 archivos en esta iteración — subir
  // a `deuda-tecnica` si aparece una cuarta copia.
  protected paginaSiguiente(): void {
    if (this.pagina() >= this.totalPaginas()) return;
    this.pagina.update((p) => p + 1);
    this.cargar();
  }

  protected paginaAnterior(): void {
    if (this.pagina() <= 1) return;
    this.pagina.update((p) => p - 1);
    this.cargar();
  }

  protected idDe(fila: ProductoUbicacionFila): string {
    return fila.producto_public_id;
  }
}
