import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud/crud.service';
import { Rol } from '../roles/rol.service';
import { environment } from '../../../environments/environment';

export interface Usuario {
  public_id: string;
  nombre: string;
  email: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface UsuarioPayload {
  nombre: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService extends CrudService<Usuario, UsuarioPayload> {
  protected recurso = 'usuarios';

  private urlRoles(id: string): string {
    return `${environment.apiUrl}/${this.recurso}/${id}/roles`;
  }

  obtenerRoles(id: string) {
    return this.http.get<Rol[]>(this.urlRoles(id));
  }

  // El backend responde con la lista actualizada de roles tras el INSERT.
  asignarRol(id: string, rolId: string) {
    return this.http.post<Rol[]>(this.urlRoles(id), { rol_id: rolId });
  }

  quitarRol(id: string, rolId: string) {
    return this.http.delete<void>(`${this.urlRoles(id)}/${rolId}`);
  }

  // Idempotente: si el usuario no estaba bloqueado, el backend responde
  // { ok: true, mensaje: 'El usuario no estaba bloqueado' } sin romper nada.
  desbloquear(id: string) {
    return this.http.post<{ ok: boolean; mensaje: string }>(
      `${environment.apiUrl}/${this.recurso}/${id}/desbloquear`,
      {}
    );
  }
}
