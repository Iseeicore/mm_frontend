import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Paginado } from '../../shared/crud/crud.service';

export type TipoOrigenVenta = 'almacen' | 'tienda';

// Línea de detalle tal como la devuelve el backend (GET /ventas/:id, POST /ventas).
export interface VentaLineaDetalle {
  producto_public_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  origen_tipo: TipoOrigenVenta;
  origen_public_id: string;
  origen_nombre: string;
}

export interface Venta {
  public_id: string;
  tienda_public_id: string;
  tienda_nombre: string;
  total: number;
  fecha_creacion: string;
  creado_por_nombre: string;
  // Solo viene en GET /ventas/:id y en la respuesta de POST /ventas — el
  // listado (GET /ventas) no lo trae.
  detalle?: VentaLineaDetalle[];
}

// Línea que manda el cliente al crear — el backend calcula precio_unitario
// (snapshot del precio del producto) y subtotal, nunca se mandan.
export interface VentaLineaPayload {
  producto_id: string;
  cantidad: number;
  origen_tipo: TipoOrigenVenta;
  origen_id: string;
}

export interface VentaPayload {
  tienda_id: string;
  lineas: VentaLineaPayload[];
}

// No extiende CrudService: s_ventas es un ledger de solo inserción (sin
// UPDATE/DELETE en el backend) — el backend solo expone GET (listar/obtener)
// y POST (crear), igual que movimientos.
@Injectable({ providedIn: 'root' })
export class VentaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ventas`;

  listar(pagina: number, limite: number) {
    return this.http.get<Paginado<Venta>>(this.base, { params: { page: pagina, limit: limite } });
  }

  obtener(id: string) {
    return this.http.get<Venta>(`${this.base}/${id}`);
  }

  crear(payload: VentaPayload) {
    return this.http.post<Venta>(this.base, payload);
  }
}
