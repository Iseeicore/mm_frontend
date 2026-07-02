import { signal } from '@angular/core';

// Heredable: cualquier componente con inputs sensibles (password, tokens, etc.)
// extiende esta clase y usa tipoInput()/alternarVisibilidad() por nombre de campo.
export abstract class VisualizarInputSensible {
  private camposVisibles = signal<Record<string, boolean>>({});

  esVisible(campo: string): boolean {
    return !!this.camposVisibles()[campo];
  }

  alternarVisibilidad(campo: string): void {
    this.camposVisibles.update((estado) => ({ ...estado, [campo]: !estado[campo] }));
  }

  tipoInput(campo: string): 'text' | 'password' {
    return this.esVisible(campo) ? 'text' : 'password';
  }
}
