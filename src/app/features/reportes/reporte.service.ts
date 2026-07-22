import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Paginado } from '../../shared/crud/crud.service';

export type TipoTrazabilidad = 'salida' | 'traspaso' | 'venta';
export type TipoUbicacionReporte = 'almacen' | 'tienda';

export interface TrazabilidadItem {
  tipo: TipoTrazabilidad;
  producto_public_id: string;
  producto_nombre: string;
  ubicacion_tipo: TipoUbicacionReporte;
  ubicacion_public_id: string;
  ubicacion_nombre: string;
  cantidad: number;
  fecha_creacion: string;
  motivo: string | null;
}

export interface TrazabilidadResumenItem {
  producto_public_id: string;
  producto_nombre: string;
  ubicacion_tipo: TipoUbicacionReporte;
  ubicacion_public_id: string;
  ubicacion_nombre: string;
  cantidad_total: number;
}

export interface FiltrosTrazabilidad {
  fecha: string;
  origenTipo?: TipoUbicacionReporte;
  origenId?: string;
  productoId?: string;
}

// GET-only (bases-api/src/routes/v1/reporte.js:11-12): no extiende CrudService,
// mismo criterio que MovimientoService — el backend no expone create/update/delete
// para reportes.
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reportes`;

  // origen_tipo/origen_id viajan juntos o no viajan (400 si viene solo uno,
  // ver reporte.js:62-64) — se arma acá para no repetir la regla en cada método.
  private params(filtros: FiltrosTrazabilidad, pagina: number, limite: number) {
    return {
      fecha: filtros.fecha,
      page: pagina,
      limit: limite,
      ...(filtros.origenTipo && filtros.origenId
        ? { origen_tipo: filtros.origenTipo, origen_id: filtros.origenId }
        : {}),
      ...(filtros.productoId ? { producto_id: filtros.productoId } : {}),
    };
  }

  trazabilidad(filtros: FiltrosTrazabilidad, pagina: number, limite: number) {
    return this.http.get<Paginado<TrazabilidadItem>>(`${this.base}/trazabilidad`, {
      params: this.params(filtros, pagina, limite),
    });
  }

  trazabilidadResumen(filtros: FiltrosTrazabilidad, pagina: number, limite: number) {
    return this.http.get<Paginado<TrazabilidadResumenItem>>(`${this.base}/trazabilidad/resumen`, {
      params: this.params(filtros, pagina, limite),
    });
  }
}
