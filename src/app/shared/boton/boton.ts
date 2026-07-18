import { Component, computed, input } from '@angular/core';

type Variante = 'primario' | 'secundario' | 'peligro';

const CLASES_BASE = 'px-3 py-2 text-sm font-medium disabled:opacity-50';
const CLASES_VARIANTE: Record<Variante, string> = {
  primario: 'rounded bg-primario text-white hover:bg-acento',
  secundario: 'rounded border border-gray-300 text-gray-700 hover:bg-gray-100',
  peligro: 'rounded bg-red-600 text-white hover:bg-red-700',
};

// Opt-in (skill estilo-neomorfico, ver agents.md): mismo mecanismo de sombra
// dual ya usado en el shell del dashboard, pero acá como variante deliberada
// por vista (elevado=true), no un default global — piloteado en ventas.ts.
// Más ancho que el plano (px-6 vs px-3) y con bg-* explícito: neo-panel/
// neo-primario solo definen las variables de la sombra, no el relleno —
// sin el bg-*, el botón queda "lavado" (se ve el fondo de la página a
// través, no un color sólido).
const CLASES_BASE_ELEVADA = 'inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold disabled:opacity-50';
const CLASES_VARIANTE_ELEVADA: Record<Variante, string> = {
  primario: 'neo-sm neo-primario bg-primario shadow-neo hover:shadow-neo-hover active:shadow-neo-inset disabled:shadow-neo-disabled transition-shadow rounded-full text-white',
  // rounded-lg (no rounded-full): un pill completo en un botón chico de fila
  // de tabla ("Ver detalle") se lee "demasiado circular" — el pill entero
  // queda reservado para el CTA primario.
  secundario: 'neo-sm neo-panel bg-superficie shadow-neo hover:shadow-neo-hover active:shadow-neo-inset disabled:shadow-neo-disabled transition-shadow rounded-lg text-primario',
  peligro: 'neo-sm neo-peligro bg-red-600 shadow-neo hover:shadow-neo-hover active:shadow-neo-inset disabled:shadow-neo-disabled transition-shadow rounded-lg text-white',
};

@Component({
  selector: 'app-boton',
  template: `<button [type]="type()" [disabled]="disabled()" [class]="clases()"><ng-content /></button>`,
})
export class Boton {
  variante = input<Variante>('primario');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
  // Ver estilo-neomorfico/agents.md — pill/relieve elevado en vez del look plano actual.
  elevado = input(false);

  protected clases = computed(() =>
    this.elevado()
      ? `${CLASES_BASE_ELEVADA} ${CLASES_VARIANTE_ELEVADA[this.variante()]}`
      : `${CLASES_BASE} ${CLASES_VARIANTE[this.variante()]}`,
  );
}
