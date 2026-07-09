import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { VisualizarInputSensible } from '../../shared/visualizar-input-sensible';
import { OjoToggle } from '../../shared/ojo-toggle/ojo-toggle';
import { Boton } from '../../shared/boton/boton';

@Component({
  selector: 'app-cambiar-password',
  imports: [ReactiveFormsModule, RouterLink, OjoToggle, Boton],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <form [formGroup]="form" (ngSubmit)="submit()" class="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 class="text-xl font-semibold text-gray-900">Cambiar contraseña</h1>

        <div>
          <label class="block text-sm font-medium text-gray-700">Contraseña actual</label>
          <div class="relative mt-1">
            <input formControlName="passwordActual" [type]="tipoInput('actual')" autocomplete="current-password"
                   class="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none" />
            <app-ojo-toggle [visible]="esVisible('actual')" (alternar)="alternarVisibilidad('actual')" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Contraseña nueva</label>
          <div class="relative mt-1">
            <input formControlName="passwordNueva" [type]="tipoInput('nueva')" autocomplete="new-password"
                   class="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none" />
            <app-ojo-toggle [visible]="esVisible('nueva')" (alternar)="alternarVisibilidad('nueva')" />
          </div>
          <p class="mt-1 text-xs text-gray-500">Mínimo 8 caracteres.</p>
        </div>

        <app-boton type="submit" [disabled]="form.invalid || loading()" class="block w-full">
          {{ loading() ? 'Guardando...' : 'Guardar' }}
        </app-boton>

        <a routerLink="/" class="block text-center text-sm text-gray-500 underline">Cancelar</a>
      </form>
    </div>
  `,
})
export class CambiarPassword extends VisualizarInputSensible {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  protected loading = signal(false);

  protected form = this.fb.nonNullable.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { passwordActual, passwordNueva } = this.form.getRawValue();
    this.auth.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: ({ mensaje }) => {
        this.notificacion.exito(mensaje);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notificacion.error(err.error?.error ?? err.message ?? 'Error al cambiar la contraseña');
      },
    });
  }
}
