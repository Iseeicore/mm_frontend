import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { VisualizarInputSensible } from '../../shared/visualizar-input-sensible';
import { rucPeruValidator, validarRucPeru } from '../../shared/ruc-peru';
import { OjoToggle } from '../../shared/ojo-toggle/ojo-toggle';
import { Boton } from '../../shared/boton/boton';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, OjoToggle, Boton],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <form [formGroup]="form" (ngSubmit)="submit()" class="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 class="text-xl font-semibold text-gray-900">Registrar empresa</h1>

        <div>
          <label class="block text-sm font-medium text-gray-700">Nombre de la empresa</label>
          <input formControlName="empresa_nombre" type="text"
                 class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">RUC</label>
          <input formControlName="empresa_ruc" type="text" maxlength="11" inputmode="numeric"
                 class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          @if (mensajeRuc(); as mensaje) {
            <p class="mt-1 text-xs text-amber-600">{{ mensaje }}</p>
          }
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Tu nombre</label>
          <input formControlName="admin_nombre" type="text"
                 class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input formControlName="admin_email" type="email" autocomplete="username"
                 class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Contraseña</label>
          <div class="relative mt-1">
            <input formControlName="admin_password" [type]="tipoInput('admin_password')" autocomplete="new-password"
                   class="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none" />
            <app-ojo-toggle [visible]="esVisible('admin_password')" (alternar)="alternarVisibilidad('admin_password')" />
          </div>
        </div>

        <app-boton type="submit" [disabled]="form.invalid || loading()" class="block w-full">
          {{ loading() ? 'Registrando...' : 'Registrar' }}
        </app-boton>

        <p class="text-center text-sm text-gray-500">
          ¿Ya tenés cuenta? <a routerLink="/login" class="text-blue-600 underline">Iniciá sesión</a>
        </p>
      </form>
    </div>
  `,
})
export class Registro extends VisualizarInputSensible {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  protected loading = signal(false);

  protected form = this.fb.nonNullable.group({
    empresa_nombre: ['', Validators.required],
    empresa_ruc: ['', [Validators.required, rucPeruValidator]],
    admin_nombre: ['', Validators.required],
    admin_email: ['', [Validators.required, Validators.email]],
    admin_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  // Mensaje en vivo (no bloqueante hasta submit): se recalcula con cada tecla via signal.
  private rucValor = toSignal(this.form.controls.empresa_ruc.valueChanges, { initialValue: '' });
  protected mensajeRuc = computed(() => {
    const valor = this.rucValor();
    return valor ? validarRucPeru(valor) : null;
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    this.auth.registrar(this.form.getRawValue()).subscribe({
      next: () => {
        this.notificacion.exito('Empresa registrada. Ya podés iniciar sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notificacion.error(err.error?.error ?? err.message ?? 'Error al registrar');
      },
    });
  }
}
