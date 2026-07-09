import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Paginado<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

// Los 4 recursos (usuarios, roles, sistemas, configuraciones) exponen el mismo
// contrato REST en el backend: GET / paginado, GET/PUT/DELETE /:id por public_id.
// Cada servicio concreto solo define `recurso`.
//
// C = forma del payload de creación, cuando difiere del modelo de lectura
// (ej. Usuario lee {nombre, email} pero crea con {nombre, email, password}).
// Por defecto es Partial<T>, que alcanza para Roles/Sistemas/Configuración.
export abstract class CrudService<T, C = Partial<T>> {
  protected http = inject(HttpClient);
  protected abstract recurso: string;

  private get base(): string {
    return `${environment.apiUrl}/${this.recurso}`;
  }

  listar(page = 1, limit = 20) {
    return this.http.get<Paginado<T>>(this.base, { params: { page, limit } });
  }

  obtener(id: string | number) {
    return this.http.get<T>(`${this.base}/${id}`);
  }

  crear(payload: C) {
    return this.http.post<T>(this.base, payload);
  }

  actualizar(id: string | number, payload: Partial<C>) {
    return this.http.put<T>(`${this.base}/${id}`, payload);
  }

  eliminar(id: string | number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
