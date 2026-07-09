import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud/crud.service';

// getAll/getById NO devuelven db_usuario/db_password_ref/color_background/ubicacion
// (el backend no los expone en la lectura), pero create SÍ los exige.
export interface Sistema {
  public_id: string;
  nombre_proyecto: string;
  empresa_id: number;
  db_host: string;
  db_puerto: number;
  db_nombre: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface SistemaPayload {
  nombre_proyecto: string;
  db_host: string;
  db_nombre: string;
  db_usuario: string;
  db_password_ref: string;
  color_background?: string;
  db_puerto?: number;
  ubicacion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SistemaService extends CrudService<Sistema, SistemaPayload> {
  protected recurso = 'sistemas';
}
