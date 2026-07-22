import { Component, computed, input, output, signal } from '@angular/core';

// ponytail: vive acá y no en shared/ — hoy es el único consumidor (reportes de
// trazabilidad). Si un segundo reporte necesita filtro de fecha, recién ahí se
// mueve a shared/calendario-fecha/ (mismo criterio que iniciales()/codigoCorto()
// en tabla.ts: se extrae con el segundo uso real, no antes).

// 'YYYY-MM-DD' <-> Date en horario LOCAL — never new Date('YYYY-MM-DD') ni
// .toISOString(): ambos pasan por UTC y corren el día en timezones negativos
// (ej. Perú UTC-5), mostrando el día anterior.
function aFecha(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function aIso(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function sumarDias(iso: string, delta: number): string {
  const fecha = aFecha(iso);
  fecha.setDate(fecha.getDate() + delta);
  return aIso(fecha);
}

interface DiaCelda {
  numero: number;
  iso: string;
  esHoy: boolean;
  esSeleccionado: boolean;
}

const DIAS_SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const FORMATO_LARGO = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const FORMATO_MES = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' });

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

@Component({
  selector: 'app-calendario-fecha',
  template: `
    <div class="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap sm:justify-between">
      <button type="button" (click)="irADia(-1)"
              class="border-black/10 text-primario order-2 flex shrink-0 items-center gap-1.5 rounded-full border bg-black/[0.02] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 sm:order-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Día anterior
      </button>

      <button type="button" (click)="toggleCalendario()"
              class="bg-primario order-1 flex w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors sm:order-2 sm:w-auto">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <span class="truncate capitalize">{{ etiquetaFecha() }}</span>
      </button>

      <button type="button" (click)="irADia(1)"
              class="border-black/10 text-primario order-3 flex shrink-0 items-center gap-1.5 rounded-full border bg-black/[0.02] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5">
        Día siguiente
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    @if (abierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" (click)="cerrarSiEsFondo($event)">
        <div class="bg-fondo w-full max-w-xs rounded-lg shadow-2xl">
          <div class="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <button type="button" (click)="cambiarMes(-1)" class="text-primario rounded-lg px-2 py-1 text-lg hover:bg-black/5">‹</button>
            <span class="text-texto text-sm font-semibold capitalize">{{ etiquetaMes() }}</span>
            <button type="button" (click)="cambiarMes(1)" class="text-primario rounded-lg px-2 py-1 text-lg hover:bg-black/5">›</button>
          </div>
          <div class="grid grid-cols-7 gap-1 p-3">
            @for (dia of diasSemana; track dia) {
              <div class="text-secundario text-center text-[11px] font-bold uppercase">{{ dia }}</div>
            }
            @for (hueco of huecosMes(); track $index) {
              <div></div>
            }
            @for (celda of celdasMes(); track celda.iso) {
              <button type="button" (click)="seleccionar(celda.iso)"
                      class="rounded-lg py-1.5 text-center text-sm transition-colors hover:bg-black/5"
                      [class.bg-primario]="celda.esSeleccionado" [class.text-white]="celda.esSeleccionado" [class.font-semibold]="celda.esSeleccionado"
                      [class.border]="celda.esHoy && !celda.esSeleccionado" [class.border-primario]="celda.esHoy && !celda.esSeleccionado">
                {{ celda.numero }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class CalendarioFecha {
  fecha = input.required<string>();
  fechaCambio = output<string>();

  protected abierto = signal(false);
  private mesVisible = signal(new Date());
  protected diasSemana = DIAS_SEMANA;

  protected etiquetaFecha = computed(() => capitalizar(FORMATO_LARGO.format(aFecha(this.fecha()))));
  protected etiquetaMes = computed(() => capitalizar(FORMATO_MES.format(this.mesVisible())));

  protected huecosMes = computed(() => {
    const vista = this.mesVisible();
    const primerDiaSemana = new Date(vista.getFullYear(), vista.getMonth(), 1).getDay();
    return Array.from({ length: primerDiaSemana });
  });

  protected celdasMes = computed((): DiaCelda[] => {
    const vista = this.mesVisible();
    const hoy = aIso(new Date());
    const seleccionada = this.fecha();
    const diasEnMes = new Date(vista.getFullYear(), vista.getMonth() + 1, 0).getDate();
    return Array.from({ length: diasEnMes }, (_, i) => {
      const iso = aIso(new Date(vista.getFullYear(), vista.getMonth(), i + 1));
      return { numero: i + 1, iso, esHoy: iso === hoy, esSeleccionado: iso === seleccionada };
    });
  });

  protected toggleCalendario(): void {
    if (!this.abierto()) this.mesVisible.set(aFecha(this.fecha()));
    this.abierto.update((v) => !v);
  }

  protected cambiarMes(delta: number): void {
    this.mesVisible.update((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  protected seleccionar(iso: string): void {
    this.abierto.set(false);
    this.fechaCambio.emit(iso);
  }

  protected irADia(delta: number): void {
    this.fechaCambio.emit(sumarDias(this.fecha(), delta));
  }

  protected cerrarSiEsFondo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) this.abierto.set(false);
  }
}
