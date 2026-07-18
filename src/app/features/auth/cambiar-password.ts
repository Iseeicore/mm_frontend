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
    <div class="flex min-h-screen w-full bg-fondo">
      <div class="relative hidden flex-col justify-end overflow-hidden p-10 text-white md:flex md:w-1/2 lg:p-14"
           style="background: linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%)">
        <div class="absolute -top-24 -right-24 h-[22rem] w-[22rem] rounded-full bg-white/15"></div>
        <div class="absolute bottom-32 -left-12 h-40 w-40 rounded-full bg-white/10"></div>
        <div class="absolute right-[28%] -bottom-8 h-32 w-32 rotate-12 rounded-2xl bg-white/15"></div>

        <div class="relative z-10 max-w-md">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
            </svg>
            Seguridad
          </div>
          <h2 class="mb-3 text-4xl font-bold leading-tight">Protegé tu cuenta.</h2>
          <p class="text-white/90">Actualizá tu contraseña para seguir tranquilo.</p>
        </div>
      </div>

      <div class="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <form [formGroup]="form" (ngSubmit)="submit()" class="relative w-full max-w-sm">
          <div class="bg-primario absolute -top-2 -left-2 h-12 w-12 rounded-xl"></div>
          <h1 class="relative mb-1 text-4xl font-bold tracking-tight text-texto">Cambiar clave.</h1>
          <p class="mb-8 text-sm text-secundario">Actualizá tu contraseña para seguir usando tu cuenta.</p>

          <div class="flex flex-col gap-4">
            <div>
              <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Contraseña actual</label>
              <div class="neo-sm neo-panel bg-superficie shadow-neo-inset focus-within:ring-primario/40 relative rounded-xl focus-within:ring-2">
                <input formControlName="passwordActual" [type]="tipoInput('actual')" autocomplete="current-password"
                       spellcheck="false" autocorrect="off" autocapitalize="off"
                       class="w-full bg-transparent px-4 py-3 pr-10 text-sm text-texto outline-none" />
                <app-ojo-toggle [visible]="esVisible('actual')" (alternar)="alternarVisibilidad('actual')" />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Contraseña nueva</label>
              <div class="neo-sm neo-panel bg-superficie shadow-neo-inset focus-within:ring-primario/40 relative rounded-xl focus-within:ring-2">
                <input formControlName="passwordNueva" [type]="tipoInput('nueva')" autocomplete="new-password"
                       spellcheck="false" autocorrect="off" autocapitalize="off"
                       class="w-full bg-transparent px-4 py-3 pr-10 text-sm text-texto outline-none" />
                <app-ojo-toggle [visible]="esVisible('nueva')" (alternar)="alternarVisibilidad('nueva')" />
              </div>
              <p class="mt-1.5 text-xs text-secundario">Mínimo 8 caracteres.</p>
            </div>

            <app-boton type="submit" [disabled]="form.invalid || loading()"
                       class="mt-2 block [&>button]:w-full [&>button]:rounded-xl [&>button]:py-3.5 [&>button]:text-sm [&>button]:font-bold [&>button]:tracking-wider [&>button]:uppercase">
              {{ loading() ? 'Guardando...' : 'Guardar' }}
            </app-boton>

            <a routerLink="/" class="block text-center text-sm text-secundario underline">Cancelar</a>
          </div>
        </form>
      </div>
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
