import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud/crud.service';

export interface Permiso {
  modulo: string;
  accion: string;
  clave: string;
  descripcion: string | null;
  activo: boolean;
  fecha_creacion: string;
}

// Catálogo de solo lectura (S_permisos se siembra por migración, no tiene
// create/update/delete en el backend) — solo se usa listar()/obtener() de
// CrudService, nunca crear()/actualizar()/eliminar().
@Injectable({ providedIn: 'root' })
export class PermisoService extends CrudService<Permiso> {
  protected recurso = 'permisos';
}
