import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-center">
      <h1 class="text-4xl font-bold text-gray-900">404</h1>
      <p class="text-gray-500">La página que buscás no existe.</p>
      <a routerLink="/" class="text-blue-600 underline">Volver al inicio</a>
    </div>
  `,
})
export class NotFound {}
