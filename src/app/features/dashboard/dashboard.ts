import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { Boton } from '../../shared/boton/boton';

interface ItemMenu {
  label: string;
  ruta: string;
  // Sin permiso => visible para cualquier usuario autenticado (igual que
  // GET /permisos en el backend, que solo exige requireAuth, ninguna
  // requirePermiso puntual).
  permiso?: string;
}

// Qué entra al sidebar lo decide el backend (get_matriz_permisos), esta lista
// solo mapea permiso -> ruta/label. Si el usuario no tiene el permiso, no aparece.
const MENU: ItemMenu[] = [
  { label: 'Usuarios', ruta: '/usuarios', permiso: 'usuarios.read' },
  { label: 'Roles', ruta: '/roles', permiso: 'roles.read' },
  { label: 'Sistemas', ruta: '/sistemas', permiso: 'sistemas.read' },
  { label: 'Configuración', ruta: '/configuraciones', permiso: 'sistemas.read' },
  { label: 'Tiendas', ruta: '/tiendas', permiso: 'tiendas.read' },
  { label: 'Almacenes', ruta: '/almacenes', permiso: 'almacenes.read' },
  { label: 'Productos', ruta: '/productos', permiso: 'productos.read' },
  { label: 'Permisos', ruta: '/permisos' },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterOutlet, Boton],
  template: `
    <div class="flex h-screen bg-gray-50">
      <aside class="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
        <nav class="space-y-1">
          @for (item of menuVisible(); track item.ruta) {
            <a [routerLink]="item.ruta"
               class="block rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="flex flex-1 flex-col">
        <header class="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-3">
          <span class="text-sm font-semibold text-gray-500">Navbar</span>

          <div class="relative flex-1 max-w-md">
            <input type="search" placeholder="Buscar..."
                   class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                 class="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          <a routerLink="/cambiar-password" class="ml-auto text-sm text-gray-500 hover:text-gray-700 hover:underline">
            Cambiar contraseña
          </a>

          <app-boton variante="secundario" type="button" (click)="cerrarSesion()">Cerrar sesión</app-boton>

          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
                  aria-label="Notificaciones">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
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

  protected menuVisible = computed(() => MENU.filter((item) => !item.permiso || this.auth.tienePermiso(item.permiso)));

  constructor() {
    this.notificacion.toast(`Bienvenido, ${this.auth.nombre()}`);
  }

  protected cerrarSesion(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
