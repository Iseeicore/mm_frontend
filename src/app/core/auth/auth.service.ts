import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const EMPRESA_KEY = 'mm_empresa_id';

export interface RegistroPayload {
  empresa_nombre: string;
  empresa_ruc: string;
  admin_nombre: string;
  admin_email: string;
  admin_password: string;
}

export interface EmpresaDisponible {
  public_id: string;
  nombre: string;
}

interface MeResponse {
  nombre: string;
  email: string;
  permisos: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // Se cargan con GET /auth/me (usa get_matriz_permisos() de la base de datos:
  // las reglas de qué se muestra las define el backend, no el frontend).
  nombre = signal('');
  permisos = signal<string[]>([]);

  // El public_id de la empresa activa en este navegador. Se completa de 3 formas:
  // POST /registro (crea empresa nueva), selección manual cuando un email
  // tiene cuentas en más de una empresa, o auto-selección cuando tiene solo una.
  get empresaId(): string | null {
    return localStorage.getItem(EMPRESA_KEY);
  }

  // Escape hatch: si el email pertenece a otra empresa, hay que poder re-resolver.
  olvidarEmpresa(): void {
    localStorage.removeItem(EMPRESA_KEY);
  }

  tienePermiso(clave: string): boolean {
    return this.permisos().includes(clave);
  }

  registrar(payload: RegistroPayload) {
    return this.http
      .post<{ empresa_public_id: string; email: string }>(`${environment.apiUrl}/registro`, payload)
      .pipe(tap(({ empresa_public_id }) => localStorage.setItem(EMPRESA_KEY, empresa_public_id)));
  }

  // Un mismo email puede tener cuenta en varias empresas (el login se valida
  // por empresa). Se llama cuando todavía no hay empresaId cacheado.
  buscarEmpresas(email: string) {
    return this.http.get<EmpresaDisponible[]>(`${environment.apiUrl}/auth/empresas`, { params: { email } });
  }

  // Fast path: ya sabemos a qué empresa pertenece este navegador.
  login(email: string, password: string) {
    return this.loginEnEmpresa(this.empresaId!, email, password);
  }

  loginEnEmpresa(empresaId: string, email: string, password: string) {
    return this.http
      .post<{ ok: boolean }>(`${environment.apiUrl}/empresas/${empresaId}/auth/login`, { email, password })
      .pipe(tap(() => localStorage.setItem(EMPRESA_KEY, empresaId)));
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
      .pipe(tap(() => this.limpiarSesion()));
  }

  // El backend limpia la cookie tras cambiar la contraseña (fuerza relogin).
  cambiarPassword(passwordActual: string, passwordNueva: string) {
    return this.http
      .put<{ ok: boolean; mensaje: string }>(`${environment.apiUrl}/empresas/${this.empresaId}/auth/password`, {
        password_actual: passwordActual,
        password_nueva: passwordNueva,
      })
      .pipe(tap(() => this.limpiarSesion()));
  }

  private limpiarSesion(): void {
    this.nombre.set('');
    this.permisos.set([]);
  }
}
