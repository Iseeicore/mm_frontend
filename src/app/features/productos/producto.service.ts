import { Injectable } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class ProductoService extends CrudService<Producto, ProductoPayload> {
  protected recurso = 'productos';
}
