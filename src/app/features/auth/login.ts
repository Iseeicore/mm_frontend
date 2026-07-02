import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { VisualizarInputSensible } from '../../shared/visualizar-input-sensible';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <form [formGroup]="form" (ngSubmit)="submit()" class="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 class="text-xl font-semibold text-gray-900">Iniciar sesión</h1>

        @if (!auth.empresaId) {
          <p class="rounded bg-amber-50 p-3 text-sm text-amber-800">
            No hay empresa registrada en este navegador. <a routerLink="/registro" class="underline">Registrate primero</a>.
          </p>
        }

        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input formControlName="email" type="email" autocomplete="username"
                 class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Contraseña</label>
          <div class="relative mt-1">
            <input formControlName="password" [type]="tipoInput('password')" autocomplete="current-password"
                   class="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none" />
            <button type="button" (click)="alternarVisibilidad('password')"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    [attr.aria-label]="esVisible('password') ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              @if (esVisible('password')) {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              }
            </button>
          </div>
        </div>

        <button type="submit" [disabled]="form.invalid || loading()"
                class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {{ loading() ? 'Ingresando...' : 'Ingresar' }}
        </button>

        <p class="text-center text-sm text-gray-500">
          ¿No tenés cuenta? <a routerLink="/registro" class="text-blue-600 underline">Registrá tu empresa</a>
        </p>
      </form>
    </div>
  `,
})
export class Login extends VisualizarInputSensible {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  protected loading = signal(false);

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.loading.set(false);
        this.notificacion.error(err.error?.error ?? err.message ?? 'Error al iniciar sesión');
      },
    });
  }
}
