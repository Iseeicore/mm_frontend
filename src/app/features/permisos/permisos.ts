import { Component, inject, OnInit, signal } from '@angular/core';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Permiso, PermisoService } from './permiso.service';

const COLUMNAS: ColumnaTabla<Permiso>[] = [
  { clave: 'modulo', titulo: 'Módulo' },
  { clave: 'accion', titulo: 'Acción' },
  { clave: 'clave', titulo: 'Clave' },
  { clave: 'descripcion', titulo: 'Descripción' },
];

// Catálogo de solo lectura: el backend no expone create/update/delete para
// S_permisos (se siembra por migración), así que esta vista no extiende
// CrudListBase — no hay form, ni guardar, ni eliminar que orquestar. La
// paginación sí se cablea igual que en los CRUD (mismo limit=20 por defecto
// de CrudService) para que el footer de Tabla sea consistente en toda la app.
@Component({
  selector: 'app-permisos',
  imports: [Tabla],
  template: `
    <div class="p-6">
      <div class="mb-4">
        <h1 class="text-xl font-semibold text-gray-900">Permisos</h1>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <app-tabla [columnas]="columnas" [filas]="filas()" [clave]="idDe"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Permisos implements OnInit {
  private servicio = inject(PermisoService);

  protected columnas = COLUMNAS;
  protected filas = signal<Permiso[]>([]);
  protected cargando = signal(false);
  protected pagina = signal(1);
  protected totalPaginas = signal(1);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.servicio.listar(this.pagina()).subscribe({
      next: ({ data, meta }) => {
        this.filas.set(data);
        this.totalPaginas.set(Math.max(meta.pages, 1));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected paginaSiguiente(): void {
    if (this.pagina() >= this.totalPaginas()) return;
    this.pagina.update((p) => p + 1);
    this.cargar();
  }

  protected paginaAnterior(): void {
    if (this.pagina() <= 1) return;
    this.pagina.update((p) => p - 1);
    this.cargar();
  }

  protected idDe(permiso: Permiso): string {
    return permiso.clave;
  }
}
