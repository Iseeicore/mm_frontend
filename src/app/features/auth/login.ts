import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, EmpresaDisponible } from '../../core/auth/auth.service';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { VisualizarInputSensible } from '../../shared/visualizar-input-sensible';
import { OjoToggle } from '../../shared/ojo-toggle/ojo-toggle';
import { Boton } from '../../shared/boton/boton';

type Paso = 'form' | 'seleccionar' | 'reintentar';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, OjoToggle, Boton],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 class="text-xl font-semibold text-gray-900">Iniciar sesión</h1>

        @if (paso() === 'form') {
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            @if (sinCuenta()) {
              <p class="rounded bg-amber-50 p-3 text-sm text-amber-800">
                No encontramos una cuenta con ese email. <a routerLink="/registro" class="underline">Registrá tu empresa</a>.
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
                <app-ojo-toggle [visible]="esVisible('password')" (alternar)="alternarVisibilidad('password')" />
              </div>
            </div>

            <app-boton type="submit" [disabled]="form.invalid || loading()" class="block w-full">
              {{ loading() ? 'Ingresando...' : 'Ingresar' }}
            </app-boton>

            @if (recordarEmpresa()) {
              <button type="button" (click)="olvidarEmpresa()" class="block w-full text-center text-xs text-gray-400 underline">
                ¿No es tu empresa? Cambiar
              </button>
            }

            <p class="text-center text-sm text-gray-500">
              ¿No tenés cuenta? <a routerLink="/registro" class="text-blue-600 underline">Registrá tu empresa</a>
            </p>
          </form>
        }

        @if (paso() === 'seleccionar') {
          <div class="space-y-2">
            <p class="text-sm text-gray-600">Tu email está en más de una empresa. Elegí con cuál ingresar:</p>
            @for (empresa of empresasDisponibles(); track empresa.public_id) {
              <button type="button" (click)="seleccionarEmpresa(empresa)"
                      class="block w-full rounded border border-gray-300 px-3 py-2 text-left text-sm hover:bg-gray-50">
                {{ empresa.nombre }}
              </button>
            }
            <button type="button" (click)="volver()" class="text-sm text-gray-500 underline">Volver</button>
          </div>
        }

        @if (paso() === 'reintentar') {
          <form [formGroup]="formReintento" (ngSubmit)="reintentar()" class="space-y-4">
            <p class="text-sm text-gray-600">
              Tu contraseña en <strong>{{ empresaSeleccionada()?.nombre }}</strong> es distinta. Ingresála:
            </p>
            <div class="relative">
              <input formControlName="password" [type]="tipoInput('reintento')" autocomplete="current-password"
                     class="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none" />
              <app-ojo-toggle [visible]="esVisible('reintento')" (alternar)="alternarVisibilidad('reintento')" />
            </div>
            <app-boton type="submit" [disabled]="formReintento.invalid || loading()" class="block w-full">
              {{ loading() ? 'Ingresando...' : 'Ingresar' }}
            </app-boton>
            <button type="button" (click)="volver()" class="block w-full text-center text-sm text-gray-500 underline">Volver</button>
          </form>
        }
      </div>
    </div>
  `,
})
export class Login extends VisualizarInputSensible {
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  protected loading = signal(false);
  protected sinCuenta = signal(false);
  protected recordarEmpresa = signal(!!this.auth.empresaId);

  protected paso = signal<Paso>('form');
  protected empresasDisponibles = signal<EmpresaDisponible[]>([]);
  protected empresaSeleccionada = signal<EmpresaDisponible | null>(null);

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected formReintento = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.sinCuenta.set(false);

    const { email, password } = this.form.getRawValue();

    if (this.auth.empresaId) {
      this.auth.login(email, password).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => this.error(err),
      });
      return;
    }

    this.auth.buscarEmpresas(email).subscribe({
      next: (empresas) => {
        this.loading.set(false);
        if (empresas.length === 0) {
          this.sinCuenta.set(true);
        } else if (empresas.length === 1) {
          this.intentarLogin(empresas[0], password);
        } else {
          this.empresasDisponibles.set(empresas);
          this.paso.set('seleccionar');
        }
      },
      error: (err) => this.error(err),
    });
  }

  protected seleccionarEmpresa(empresa: EmpresaDisponible): void {
    const { password } = this.form.getRawValue();
    this.intentarLogin(empresa, password);
  }

  protected reintentar(): void {
    if (this.formReintento.invalid) return;
    const empresa = this.empresaSeleccionada();
    if (!empresa) return;

    const { password } = this.formReintento.getRawValue();
    this.intentarLogin(empresa, password);
  }

  protected volver(): void {
    this.paso.set('form');
    this.empresasDisponibles.set([]);
    this.empresaSeleccionada.set(null);
  }

  protected olvidarEmpresa(): void {
    this.auth.olvidarEmpresa();
    this.recordarEmpresa.set(false);
  }

  private intentarLogin(empresa: EmpresaDisponible, password: string): void {
    this.loading.set(true);
    const { email } = this.form.getRawValue();

    this.auth.loginEnEmpresa(empresa.public_id, email, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.empresaSeleccionada.set(empresa);
          this.formReintento.reset();
          this.paso.set('reintentar');
        } else {
          this.notificacion.error(err.error?.error ?? 'Error al iniciar sesión');
        }
      },
    });
  }

  private error(err: { error?: { error?: string }; message?: string }): void {
    this.loading.set(false);
    this.notificacion.error(err.error?.error ?? err.message ?? 'Error al iniciar sesión');
  }
}
