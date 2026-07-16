import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CrudService, Paginado } from '../../shared/crud/crud.service';
import { ProductoDeUbicacion } from '../productos/producto.service';

export interface Almacen {
  public_id: string;
  nombre: string;
  ubicacion: string | null;
  empresa_id: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string;
}

// create/update body coincide con el modelo de lectura (nombre, ubicacion) —
// no hace falta el segundo genérico de CrudService acá.
@Injectable({ providedIn: 'root' })
export class AlmacenService extends CrudService<Almacen> {
  protected recurso = 'almacenes';

  // `base` de CrudService es private, no accesible desde acá — se arma la URL
  // a mano con `this.recurso` para no repetir el literal 'almacenes'.
  productos(almacenId: string, page = 1, limit = 20) {
    return this.http.get<Paginado<ProductoDeUbicacion>>(
      `${environment.apiUrl}/${this.recurso}/${almacenId}/productos`,
      { params: { page, limit } },
    );
  }
}
