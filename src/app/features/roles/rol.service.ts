import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud/crud.service';

export interface Rol {
  public_id: string;
  nombre: string;
  descripcion: string | null;
  es_default: boolean;
  activo: boolean;
  fecha_creacion: string;
}

// create/update body coincide con el modelo de lectura (nombre, descripcion,
// es_default) — no hace falta el segundo genérico de CrudService acá.
@Injectable({ providedIn: 'root' })
export class RolService extends CrudService<Rol> {
  protected recurso = 'roles';
}
