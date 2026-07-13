import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud/crud.service';

export interface Tienda {
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
export class TiendaService extends CrudService<Tienda> {
  protected recurso = 'tiendas';
}
