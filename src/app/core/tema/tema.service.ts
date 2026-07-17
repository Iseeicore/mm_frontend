import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ConfiguracionActiva {
  id: number;
  sistema_id: number;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  color_texto: string;
  color_fondo: string;
  tema: string;
}

@Injectable({ providedIn: 'root' })
export class TemaService {
  private http = inject(HttpClient);

  cargar() {
    return this.http.get<ConfiguracionActiva>(`${environment.apiUrl}/configuraciones/activa`).pipe(
      tap((config) => this.aplicar(config)),
      catchError((error) => {
        console.error('No se pudo cargar la configuración de tema activa', error);
        return of(null);
      }),
    );
  }

  aplicar(config: ConfiguracionActiva): void {
    const raiz = document.documentElement.style;
    raiz.setProperty('--color-primario', config.color_primario);
    raiz.setProperty('--color-secundario', config.color_secundario);
    raiz.setProperty('--color-acento', config.color_acento);
    raiz.setProperty('--color-texto', config.color_texto);
    raiz.setProperty('--color-fondo', config.color_fondo);
  }
}
