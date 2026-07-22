import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { GrupoMenu, ItemMenu, MENU_GRUPOS, MENU_SUELTO } from './dashboard.menu';

// Hover diferencial por sección (Bold Accent): strings literales completos
// para que Tailwind los detecte en el build (no armar la clase por interpolación).
const TINT_HOVER: Record<string, string> = {
  violeta: 'hover:bg-violet-50 hover:text-violet-700',
  ambar: 'hover:bg-amber-50 hover:text-amber-700',
  azul: 'hover:bg-blue-50 hover:text-blue-700',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="bg-superficie flex h-screen gap-4 p-4"
         style="background-image: radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--color-primario) 8%, transparent), transparent 55%), radial-gradient(circle at 85% 100%, color-mix(in srgb, var(--color-acento) 8%, transparent), transparent 55%)">
      @if (menuMovilAbierto()) {
        <div class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" (click)="menuMovilAbierto.set(false)"></div>
      }

      <aside data-menu-movil [class]="asideClases()">
        <div class="mb-6 flex items-center gap-2.5 px-1">
          <div class="relative h-9 w-9 shrink-0">
            <div class="bg-texto absolute inset-0 rounded-[0.625rem]"></div>
            <div class="bg-primario absolute top-1 right-1 h-3 w-3 rounded-sm"></div>
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-texto text-sm font-bold tracking-tight">MM Market</span>
            <span class="text-secundario text-[0.65rem] font-semibold tracking-widest uppercase">Panel admin</span>
          </div>
        </div>

        <div class="text-secundario mb-2 px-2 text-[0.65rem] font-bold tracking-widest uppercase">Menú</div>

        <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <a routerLink="/" routerLinkActive="bg-texto text-fondo font-semibold" [routerLinkActiveOptions]="{ exact: true }"
             (click)="menuMovilAbierto.set(false)"
             class="text-secundario hover:bg-black/5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Escritorio
          </a>

          @for (grupo of gruposVisibles(); track grupo.label) {
            <div>
              <button type="button" (click)="toggleGrupo(grupo.label)"
                      class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                      [class]="grupoAbierto(grupo) ? 'text-texto' : 'text-secundario ' + tintHover(grupo.color)">
                <span class="flex items-center gap-3">
                  @if (grupo.label === 'Administración') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 shrink-0">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  } @else if (grupo.label === 'Inventario') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 shrink-0">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                  } @else if (grupo.label === 'Reportes') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 shrink-0">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                  }
                  <span>{{ grupo.label }}</span>
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                     class="h-4 w-4 shrink-0 transition-transform" [class.rotate-180]="grupoAbierto(grupo)" [class.text-primario]="grupoAbierto(grupo)">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              @if (grupoAbierto(grupo)) {
                <div class="relative mt-0.5 mb-1 ml-2 flex flex-col gap-0.5 border-l border-black/10 pl-4">
                  @for (item of grupo.hijos; track item.ruta) {
                    <a [routerLink]="item.ruta" routerLinkActive="text-texto font-semibold"
                       (click)="menuMovilAbierto.set(false)"
                       class="text-secundario hover:text-texto group flex items-center gap-2.5 rounded-lg py-2 pr-3 text-[0.83rem] font-medium transition-colors">
                      <span class="bg-primario h-1.5 w-1.5 shrink-0 rounded-full opacity-0 transition-opacity"
                            [class.opacity-100]="esRutaActiva(item.ruta)"></span>
                      {{ item.label }}
                    </a>
                  }
                </div>
              }
            </div>
          }
          @for (item of sueltoVisible(); track item.ruta) {
            <a [routerLink]="item.ruta" routerLinkActive="bg-texto text-fondo font-semibold"
               (click)="menuMovilAbierto.set(false)"
               class="text-secundario hover:bg-black/5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="flex flex-1 flex-col gap-4 overflow-hidden">
        <header class="bg-fondo/70 flex items-center gap-3 rounded-full border border-black/5 py-2 pr-2 pl-5 shadow-sm backdrop-blur-xl">
          <button type="button" data-menu-movil (click)="menuMovilAbierto.set(!menuMovilAbierto())"
                  class="text-secundario flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5 lg:hidden"
                  aria-label="Abrir menú">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div class="flex flex-1 flex-col leading-tight">
            <span class="text-secundario text-[0.65rem] font-semibold tracking-widest uppercase">{{ breadcrumbActual() }}</span>
            <h1 class="text-texto text-[1.05rem] font-bold tracking-tight">{{ tituloActual() }}</h1>
          </div>

          <div class="border-black/8 hidden min-w-[14rem] items-center gap-2 rounded-full border bg-black/[0.02] px-3 py-1.5 lg:flex">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-secundario h-4 w-4 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" placeholder="Buscar..." class="text-texto w-full bg-transparent text-sm outline-none" />
          </div>

          <button type="button" class="text-secundario relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                  aria-label="Notificaciones">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <span class="bg-acento border-fondo absolute top-1.5 right-2 h-2 w-2 rounded-full border-2"></span>
          </button>

          <div class="relative" data-menu-usuario>
            <button type="button" (click)="menuUsuario.set(!menuUsuario())"
                    class="flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 transition-colors hover:bg-black/5">
              <span class="bg-texto text-fondo flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                {{ inicialNombre() }}
              </span>
              <span class="text-texto hidden text-sm font-semibold sm:inline">{{ auth.nombre() }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-secundario h-3.5 w-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            @if (menuUsuario()) {
              <div class="bg-fondo absolute top-[calc(100%+0.5rem)] right-0 z-50 min-w-[13rem] rounded-2xl border border-black/5 p-1.5 shadow-lg">
                <a routerLink="/cambiar-password" (click)="menuUsuario.set(false)"
                   class="text-secundario hover:bg-black/5 hover:text-texto flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                  </svg>
                  Cambiar contraseña
                </a>
                <div class="my-1 h-px bg-black/5"></div>
                <button type="button" (click)="cerrarSesion()"
                        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            }
          </div>
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

  protected menuUsuario = signal(false);
  // Drawer del sidebar en pantallas chicas (< lg): en lg+ queda estático e
  // inline como siempre, esta señal no tiene efecto visual ahí.
  protected menuMovilAbierto = signal(false);

  protected asideClases = computed(() =>
    'bg-fondo flex w-64 shrink-0 flex-col rounded-2xl border border-black/5 p-4 shadow-sm ' +
    'fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ' +
    (this.menuMovilAbierto() ? 'translate-x-0' : '-translate-x-full'),
  );

  protected gruposVisibles = computed(() =>
    MENU_GRUPOS
      .map((grupo) => ({ ...grupo, hijos: grupo.hijos.filter((h) => !h.permiso || this.auth.tienePermiso(h.permiso)) }))
      .filter((grupo) => grupo.hijos.length > 0),
  );
  protected sueltoVisible = computed(() => MENU_SUELTO.filter((item) => !item.permiso || this.auth.tienePermiso(item.permiso)));

  protected inicialNombre = computed(() => (this.auth.nombre()[0] ?? '?').toUpperCase());

  // Grupos togglados a mano. Un grupo también se ve abierto si contiene la
  // ruta activa aunque no esté en este set (auto-open al entrar directo por
  // URL); eso implica que no se puede colapsar a mano el grupo de la ruta
  // actual, aceptado como caso borde menor.
  private abiertos = signal<Set<string>>(new Set());

  constructor() {
    this.notificacion.toast(`Bienvenido, ${this.auth.nombre()}`);
  }

  @HostListener('document:click', ['$event'])
  protected cerrarMenusAlClickAfuera(evento: MouseEvent): void {
    const objetivo = evento.target as HTMLElement;
    if (this.menuUsuario() && !objetivo.closest('[data-menu-usuario]')) this.menuUsuario.set(false);
    if (this.menuMovilAbierto() && !objetivo.closest('[data-menu-movil]')) this.menuMovilAbierto.set(false);
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

  protected esRutaActiva(ruta: string): boolean {
    return this.router.url.split('?')[0] === ruta;
  }

  protected tintHover(color: string): string {
    return TINT_HOVER[color] ?? '';
  }

  protected tituloActual(): string {
    const url = this.router.url.split('?')[0];
    if (url === '/') return 'Escritorio';
    for (const grupo of MENU_GRUPOS) {
      const hijo = grupo.hijos.find((h) => url === h.ruta || url.startsWith(h.ruta + '/'));
      if (hijo) return hijo.label;
    }
    const suelto = MENU_SUELTO.find((i: ItemMenu) => url === i.ruta || url.startsWith(i.ruta + '/'));
    return suelto?.label ?? 'Escritorio';
  }

  protected breadcrumbActual(): string {
    const url = this.router.url.split('?')[0];
    if (url === '/') return 'Vista principal';
    const grupo = MENU_GRUPOS.find((g) => g.hijos.some((h) => url === h.ruta || url.startsWith(h.ruta + '/')));
    return grupo?.label ?? 'Vista principal';
  }

  protected cerrarSesion(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
