import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-inicio',
  imports: [],
  template: `
    <div class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div class="bg-primario/10 text-primario flex h-14 w-14 items-center justify-center rounded-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-7 w-7">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </div>
      <h1 class="text-texto text-xl font-bold">Hola, {{ auth.nombre() }}.</h1>
      <p class="text-secundario max-w-sm text-sm">Elegí una sección del menú para empezar a trabajar.</p>
    </div>
  `,
})
export class Inicio {
  protected auth = inject(AuthService);
}
