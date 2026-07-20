import { Component, computed, input, output } from '@angular/core';
import { Boton } from '../boton/boton';
import { formatoMoneda } from '../moneda';

export interface ColumnaTabla<T> {
  clave: keyof T & string;
  titulo: string;
  // 'texto' (default) = como hoy. 'moneda'/'avatar'/'codigo' son formatos
  // genéricos — cualquier vista los puede usar, no son específicos de
  // ventas.ts (ver estilo-neomorfico/agents.md, patrón confirmado y
  // piloteado en Ventas).
  tipo?: 'texto' | 'moneda' | 'avatar' | 'codigo';
  // Solo para tipo 'codigo': prefijo de negocio (ej. 'V' -> "#V-43d7a30d…").
  // El código es el valor REAL de la columna (ej. public_id) recortado a los
  // primeros 8 caracteres + "…" — no un número de venta secuencial aparte.
  // El valor completo queda en el atributo title (tooltip nativo al hacer
  // hover), así el recorte es visualmente obvio y el dato real no se pierde.
  prefijo?: string;
}

// Exportadas: venta-detalle.ts las reusa para su cabecera/tabla local (no
// pasa por <app-tabla> porque necesita scroll + buscador propios, ver skill
// estilo-bold-accent — no ameritaba duplicar esta lógica de 2 líneas).
export function iniciales(valor: unknown): string {
  const partes = String(valor ?? '').trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

export function codigoCorto(valor: unknown): string {
  const texto = String(valor ?? '');
  return texto.length > 8 ? `${texto.slice(0, 8)}…` : texto;
}

// Genérica sobre cualquier recurso (usuarios, roles, sistemas, configuraciones).
// Columnas se definen por config; el identificador de fila también se recibe
// por config (`clave`) porque no todos los recursos tienen public_id —
// Configuración se identifica por id numérico, no UUID.
@Component({
  selector: 'app-tabla',
  imports: [Boton],
  template: `
    <div [class]="contenedorClases()">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr [class]="filaHeaderClases()">
            @for (columna of columnas(); track columna.clave) {
              <th [class]="thClases()">{{ columna.titulo }}</th>
            }
            @if (puedeEditar() || puedeEliminar() || puedeVerDetalle()) {
              <th [class]="thClases() + ' text-right'">Acciones</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (fila of filas(); track clave()(fila)) {
            <tr [class]="filaClases()">
              @for (columna of columnas(); track columna.clave) {
                <td class="px-3 py-2.5 text-gray-700">
                  @switch (columna.tipo ?? 'texto') {
                    @case ('moneda') {
                      <span [class]="chipMonedaClases()">S/ {{ formatoMoneda(fila[columna.clave]) }}</span>
                    }
                    @case ('avatar') {
                      <div class="flex items-center gap-2">
                        <span [class]="avatarClases()">{{ iniciales(fila[columna.clave]) }}</span>
                        <span>{{ fila[columna.clave] }}</span>
                      </div>
                    }
                    @case ('codigo') {
                      <div class="flex items-center gap-3">
                        <span [class]="iconoCodigoClases()">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                          </svg>
                        </span>
                        <span class="font-bold text-gray-900" [title]="texto(fila[columna.clave])">#{{ columna.prefijo }}-{{ codigoCorto(fila[columna.clave]) }}</span>
                      </div>
                    }
                    @default {
                      {{ fila[columna.clave] }}
                    }
                  }
                </td>
              }
              @if (puedeEditar() || puedeEliminar() || puedeVerDetalle()) {
                <td class="flex justify-end gap-2 px-3 py-2.5">
                  @if (puedeVerDetalle()) {
                    <app-boton variante="secundario" [elevado]="elevado()" (click)="verDetalle.emit(fila)">{{ etiquetaVerDetalle() }}</app-boton>
                  }
                  @if (puedeEditar()) {
                    <app-boton variante="secundario" [elevado]="elevado()" (click)="editar.emit(fila)">Editar</app-boton>
                  }
                  @if (puedeEliminar()) {
                    <app-boton variante="peligro" [elevado]="elevado()" (click)="eliminar.emit(fila)">Eliminar</app-boton>
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columnas().length + 1" class="px-3 py-6 text-center text-gray-400">
                Sin registros.
              </td>
            </tr>
          }
        </tbody>
      </table>

      <div [class]="pieClases()">
        <app-boton variante="secundario" [elevado]="elevado()" [disabled]="paginaActual() <= 1" (click)="anterior.emit()">Anterior</app-boton>
        <span [class]="elevado() ? 'bg-primario/10 rounded-full px-4 py-1.5 text-primario font-semibold' : ''">Página {{ paginaActual() }} de {{ totalPaginas() }}</span>
        <app-boton variante="secundario" [elevado]="elevado()" [disabled]="paginaActual() >= totalPaginas()" (click)="siguiente.emit()">Siguiente</app-boton>
      </div>
    </div>
  `,
})
export class Tabla<T> {
  columnas = input.required<ColumnaTabla<T>[]>();
  filas = input.required<T[]>();
  clave = input.required<(fila: T) => string | number>();
  puedeEditar = input(false);
  puedeEliminar = input(false);
  puedeVerDetalle = input(false);
  etiquetaVerDetalle = input('Ver');
  paginaActual = input(1);
  totalPaginas = input(1);
  // Opt-in (ver estilo-neomorfico/agents.md): default 'plano' deja el look
  // actual intacto en todas las vistas que no lo pasan explícitamente.
  variante = input<'plano' | 'elevado'>('plano');

  editar = output<T>();
  eliminar = output<T>();
  verDetalle = output<T>();
  anterior = output<void>();
  siguiente = output<void>();

  // Bold Accent (ver estilo-bold-accent/agents.md): cards blancas con borde
  // sutil + sombra suave de un solo tono — NO neomorfismo (sin sombra dual,
  // sin shadow-neo-inset). El neomorfismo queda reservado a casos puntuales
  // ya confirmados (inputs de login/registro/cambiar-password).
  protected elevado = computed(() => this.variante() === 'elevado');
  protected contenedorClases = computed(() =>
    this.elevado() ? 'bg-fondo border border-black/5 shadow-sm overflow-hidden rounded-lg' : '',
  );
  // Header con tinte del color secundario de la marca (antes era un negro al
  // 2%, casi invisible — pedido explícito: "ponle el color secundario").
  protected filaHeaderClases = computed(() =>
    this.elevado()
      ? 'border-b border-black/5 bg-secundario/10'
      : 'border-b border-gray-200 text-gray-500',
  );
  protected thClases = computed(() =>
    this.elevado() ? 'px-3 py-3 text-xs font-bold uppercase tracking-wider text-primario' : 'px-3 py-2 font-medium',
  );
  protected filaClases = computed(() =>
    this.elevado() ? 'border-b border-black/5 hover:bg-black/[0.015] transition-colors' : 'border-b border-gray-100 hover:bg-gray-50',
  );
  protected pieClases = computed(() =>
    this.elevado()
      ? 'flex items-center justify-between border-t border-black/5 px-3 py-3 text-sm text-secundario'
      : 'flex items-center justify-between border-t border-gray-200 px-3 py-2 text-sm text-gray-500',
  );
  protected chipMonedaClases = computed(() =>
    this.elevado() ? 'bg-primario/10 inline-block rounded-lg px-3 py-1 font-mono font-bold text-primario' : 'font-mono',
  );
  protected avatarClases = computed(() =>
    this.elevado()
      ? 'bg-primario/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primario'
      : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-600',
  );
  protected iconoCodigoClases = computed(() =>
    this.elevado()
      ? 'bg-primario/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primario'
      : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500',
  );

  protected iniciales = iniciales;
  protected codigoCorto = codigoCorto;
  protected formatoMoneda = formatoMoneda;
  protected texto(valor: unknown): string {
    return String(valor ?? '');
  }
}
