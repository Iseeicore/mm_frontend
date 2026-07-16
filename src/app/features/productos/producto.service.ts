import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CrudService } from '../../shared/crud/crud.service';

export interface Producto {
  public_id: string;
  codigo_barras: string | null;
  nombre: string;
  descripcion: string | null;
  unidades_por_paquete: number;
  precio_compra_paquete: number;
  precio_venta_unidad: number;
  precio_venta_paquete: number | null;
  empresa_id: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

// El PUT del backend solo acepta nombre/codigo_barras/descripcion/unidades_por_paquete
// (400 si se mandan los 3 campos de precio) — por eso ProductoPayload lleva los
// precios como el shape de creación completo, y productos.ts arma el payload de
// actualización con un subset explícito en vez de reusar crearPayload().
export interface ProductoPayload {
  nombre: string;
  codigo_barras: string | null;
  descripcion: string | null;
  unidades_por_paquete: number;
  precio_compra_paquete: number;
  precio_venta_unidad: number;
  precio_venta_paquete?: number;
}

export interface StockUbicacion {
  public_id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number | null;
  fecha_actualizacion: string;
}

// Shape de ProductoStockNormalizador en bases-api (GET /almacenes/:id/productos
// y GET /tiendas/:id/productos) — misma forma para ambos recursos, se define
// una sola vez acá (dominio "producto") y la reusan almacen.service.ts / tienda.service.ts.
export interface ProductoDeUbicacion {
  producto_public_id: string;
  producto_nombre: string;
  precio_venta_unidad: number;
  precio_venta_paquete: number | null;
  unidades_por_paquete: number;
  stock_actual: number;
  paquetes_completos: number;
  stock_minimo: number | null;
  fecha_actualizacion: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoService extends CrudService<Producto, ProductoPayload> {
  protected recurso = 'productos';

  // `base` de CrudService es private, no accesible desde acá — se arma la URL
  // con `this.recurso` para no hardcodear 'productos' dos veces.
  stock(publicId: string) {
    return this.http.get<{ almacenes: StockUbicacion[]; tiendas: StockUbicacion[] }>(
      `${environment.apiUrl}/${this.recurso}/${publicId}/stock`,
    );
  }
}
