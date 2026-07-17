import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { Boton } from '../../shared/boton/boton';
import { GrupoMenu, MENU_GRUPOS, MENU_SUELTO } from './dashboard.menu';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Boton],
  template: `
    <div class="flex h-screen bg-superficie">
      <aside class="w-56 shrink-0 neo-lg neo-panel bg-superficie shadow-neo p-4">
        <nav class="space-y-1">
          @for (grupo of gruposVisibles(); track grupo.label) {
            <div>
              <button type="button" (click)="toggleGrupo(grupo.label)"
                      class="flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium text-secundario hover:bg-black/5 transition-colors">
                <span class="flex items-center gap-2" [class.text-primario]="grupoAbierto(grupo)">
                  @if (grupo.label === 'Administración') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  } @else if (grupo.label === 'Inventario') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                  }
                  <span>{{ grupo.label }}</span>
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                     class="h-4 w-4 transition-transform" [class.rotate-180]="grupoAbierto(grupo)" [class.text-primario]="grupoAbierto(grupo)">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              @if (grupoAbierto(grupo)) {
                <div class="ml-2 space-y-1 border-l border-black/10 pl-3">
                  @for (item of grupo.hijos; track item.ruta) {
                    <a [routerLink]="item.ruta" routerLinkActive="neo-sm neo-primario shadow-neo-inset text-primario font-bold"
                       class="block rounded px-3 py-2 text-sm font-medium text-secundario hover:bg-black/5 transition-colors">
                      {{ item.label }}
                    </a>
                  }
                </div>
              }
            </div>
          }
          @for (item of sueltoVisible(); track item.ruta) {
            <a [routerLink]="item.ruta" routerLinkActive="neo-sm neo-primario shadow-neo-inset text-primario font-bold"
               class="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-secundario hover:bg-black/5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="flex flex-1 flex-col">
        <header class="flex items-center gap-4 neo-lg neo-panel bg-superficie shadow-neo px-6 py-3">
          <span class="text-sm font-semibold text-secundario"></span>

          <div class="relative flex-1 max-w-md">
            <input type="text" placeholder="Buscar..."
                   class="neo-sm neo-panel bg-superficie shadow-neo focus:shadow-neo-inset focus:outline-none transition-shadow w-full rounded-full px-4 py-2 text-sm text-texto" />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                 class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secundario">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          <a routerLink="/cambiar-password" class="ml-auto text-sm text-secundario hover:text-primario hover:underline">
            Cambiar contraseña
          </a>

          <app-boton variante="secundario" type="button" (click)="cerrarSesion()">Cerrar sesión</app-boton>

          <button type="button"
                  class="relative flex h-9 w-9 items-center justify-center rounded-full neo-sm neo-panel bg-superficie shadow-neo hover:shadow-neo-hover active:shadow-neo-inset transition-shadow text-secundario"
                  aria-label="Notificaciones">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <span class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-acento border-2 border-superficie"></span>
          </button>
        </header>

        <main class="flex flex-1 flex-col overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Dashboard {
  protected auth = inject(AuthService);
  private notificacion = inject(NotificacionService);
  private router = inject(Router);

  protected gruposVisibles = computed(() =>
    MENU_GRUPOS
      .map((grupo) => ({ ...grupo, hijos: grupo.hijos.filter((h) => !h.permiso || this.auth.tienePermiso(h.permiso)) }))
      .filter((grupo) => grupo.hijos.length > 0),
  );
  protected sueltoVisible = computed(() => MENU_SUELTO.filter((item) => !item.permiso || this.auth.tienePermiso(item.permiso)));

  // Grupos togglados a mano. Un grupo también se ve abierto si contiene la
  // ruta activa aunque no esté en este set (auto-open al entrar directo por
  // URL); eso implica que no se puede colapsar a mano el grupo de la ruta
  // actual, aceptado como caso borde menor.
  private abiertos = signal<Set<string>>(new Set());

  constructor() {
    this.notificacion.toast(`Bienvenido, ${this.auth.nombre()}`);
  }

  protected toggleGrupo(label: string): void {
    this.abiertos.update((set) => {
      const nuevo = new Set(set);
      nuevo.has(label) ? nuevo.delete(label) : nuevo.add(label);
      return nuevo;
    });
  }

  protected grupoAbierto(grupo: GrupoMenu): boolean {
    return this.abiertos().has(grupo.label) || grupo.hijos.some((h) => this.router.url.startsWith(h.ruta));
  }

  protected cerrarSesion(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
