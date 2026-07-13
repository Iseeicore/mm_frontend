import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Paginado } from '../../shared/crud/crud.service';

export type TipoMovimiento = 'entrada' | 'salida' | 'traspaso';
export type TipoUbicacion = 'almacen' | 'tienda';

export interface Movimiento {
  public_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  fecha_creacion: string;
  producto_public_id: string;
  producto_nombre: string;
  ubicacion_tipo: TipoUbicacion;
  ubicacion_public_id: string;
  ubicacion_nombre: string;
  ubicacion_destino_tipo: TipoUbicacion | null;
  ubicacion_destino_public_id: string | null;
  ubicacion_destino_nombre: string | null;
  creado_por_nombre: string;
}

export interface MovimientoPayload {
  producto_id: string;
  tipo: TipoMovimiento;
  ubicacion_tipo: TipoUbicacion;
  ubicacion_id: string;
  ubicacion_destino_tipo?: TipoUbicacion;
  ubicacion_destino_id?: string;
  cantidad: number;
  motivo?: string;
}

// No extiende CrudService: el backend solo expone GET (listar) y POST (crear)
// para movimientos, sin PUT/DELETE — forzar la jerarquía CRUD agregaría dos
// métodos (actualizar/eliminar) que no existen en la API.
@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/movimientos`;

  listar(pagina: number, limite: number) {
    return this.http.get<Paginado<Movimiento>>(this.base, { params: { page: pagina, limit: limite } });
  }

  crear(payload: MovimientoPayload) {
    return this.http.post<Movimiento>(this.base, payload);
  }
}
