import { Component, computed, input } from '@angular/core';

type Variante = 'primario' | 'secundario' | 'peligro';

const CLASES_BASE = 'rounded px-3 py-2 text-sm font-medium disabled:opacity-50';
const CLASES_VARIANTE: Record<Variante, string> = {
  primario: 'bg-primario text-white hover:bg-acento',
  secundario: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
};

@Component({
  selector: 'app-boton',
  template: `<button [type]="type()" [disabled]="disabled()" [class]="clases()"><ng-content /></button>`,
})
export class Boton {
  variante = input<Variante>('primario');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);

  protected clases = computed(() => `${CLASES_BASE} ${CLASES_VARIANTE[this.variante()]}`);
}
