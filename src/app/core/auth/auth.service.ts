import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const AUTH_FLAG = 'mm_auth';
const EMPRESA_KEY = 'mm_empresa_id';

export interface RegistroPayload {
  empresa_nombre: string;
  empresa_ruc: string;
  admin_nombre: string;
  admin_email: string;
  admin_password: string;
}

interface MeResponse {
  nombre: string;
  email: string;
  permisos: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // Flag de UX para el guard; la cookie httpOnly es la autoridad real.
  isAuthenticated = signal(localStorage.getItem(AUTH_FLAG) === '1');

  // Se cargan con GET /auth/me (usa get_matriz_permisos() de la base de datos:
  // las reglas de qué se muestra las define el backend, no el frontend).
  nombre = signal('');
  permisos = signal<string[]>([]);

  // POST /registro crea una empresa nueva por llamada (multi-tenant real, no demo).
  // El public_id no se hardcodea: se guarda acá tras registrar y se reusa para loguear.
  get empresaId(): string | null {
    return localStorage.getItem(EMPRESA_KEY);
  }

  tienePermiso(clave: string): boolean {
    return this.permisos().includes(clave);
  }

  registrar(payload: RegistroPayload) {
    return this.http
      .post<{ empresa_public_id: string; email: string }>(`${environment.apiUrl}/registro`, payload)
      .pipe(tap(({ empresa_public_id }) => localStorage.setItem(EMPRESA_KEY, empresa_public_id)));
  }

  login(email: string, password: string) {
    if (!this.empresaId) {
      return throwError(() => new Error('No hay empresa registrada en este navegador. Registrate primero.'));
    }
    return this.http
      .post<{ ok: boolean }>(`${environment.apiUrl}/empresas/${this.empresaId}/auth/login`, { email, password })
      .pipe(tap(() => this.setAuthenticated(true)));
  }

  cargarMe() {
    return this.http
      .get<MeResponse>(`${environment.apiUrl}/empresas/${this.empresaId}/auth/me`)
      .pipe(tap(({ nombre, permisos }) => {
        this.nombre.set(nombre);
        this.permisos.set(permisos);
      }));
  }

  logout() {
    return this.http
      .post<{ ok: boolean }>(`${environment.apiUrl}/empresas/${this.empresaId}/auth/logout`, {})
      .pipe(tap(() => this.setAuthenticated(false)));
  }

  setAuthenticated(value: boolean): void {
    this.isAuthenticated.set(value);
    if (value) localStorage.setItem(AUTH_FLAG, '1');
    else localStorage.removeItem(AUTH_FLAG);
    if (!value) {
      this.nombre.set('');
      this.permisos.set([]);
    }
  }
}
