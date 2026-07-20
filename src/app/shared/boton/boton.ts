import { Component, computed, input } from '@angular/core';

type Variante = 'primario' | 'secundario' | 'peligro';

const CLASES_BASE = 'px-3 py-2 text-sm font-medium disabled:opacity-50';
const CLASES_VARIANTE: Record<Variante, string> = {
  primario: 'rounded bg-primario text-white hover:bg-acento',
  secundario: 'rounded border border-gray-300 text-gray-700 hover:bg-gray-100',
  peligro: 'rounded bg-red-600 text-white hover:bg-red-700',
};

// Opt-in (skill estilo-bold-accent, ver agents.md): default del proyecto para
// tablas/cards/botones "elevado" — piloteado en ventas.ts, no un default
// global todavía. El neomorfismo (shadow-neo/neo-panel) queda reservado para
// casos puntuales ya confirmados (inputs de login/registro/cambiar-password),
// NO es la base de este mecanismo.
// Más ancho que el plano (px-6 vs px-3).
const CLASES_BASE_ELEVADA = 'inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold disabled:opacity-50 transition-all active:scale-[0.98]';
const CLASES_VARIANTE_ELEVADA: Record<Variante, string> = {
  // El "botón 3D" del Login Bold Accent / dashboard.jsx: relleno sólido +
  // sombra plana (no difusa) del color de acento, se levanta en hover.
  primario: 'bg-primario text-white uppercase tracking-wide rounded-full shadow-[0_4px_0_0_var(--color-acento)] hover:-translate-y-0.5 active:translate-y-0',
  // rounded-lg (no rounded-full): un pill completo en un botón chico de fila
  // de tabla ("Ver detalle") se lee "demasiado circular" — el pill entero
  // queda reservado para el CTA primario.
  secundario: 'bg-fondo text-primario rounded-lg border border-black/10 shadow-sm hover:bg-black/5',
  peligro: 'bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700',
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
