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
            Bienvenido
          </div>
          <h2 class="mb-3 text-4xl font-bold leading-tight">Tu negocio te espera.</h2>
          <p class="text-white/90">Iniciá sesión y continuá donde lo dejaste.</p>
        </div>
      </div>

      <div class="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <div class="w-full max-w-sm">
          @if (paso() === 'form') {
            <form [formGroup]="form" (ngSubmit)="submit()" class="relative">
              <div class="bg-primario absolute -top-2 -left-2 h-12 w-12 rounded-xl"></div>
              <h1 class="relative mb-1 text-4xl font-bold tracking-tight text-texto">Ingresar.</h1>
              <p class="mb-8 text-sm text-secundario">
                ¿No tenés cuenta?
                <a routerLink="/registro" class="text-primario font-semibold hover:underline">Registrá tu empresa</a>
              </p>

              @if (sinCuenta()) {
                <p class="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  No encontramos una cuenta con ese email. <a routerLink="/registro" class="underline">Registrá tu empresa</a>.
                </p>
              }

              <div class="flex flex-col gap-4">
                <div>
                  <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Email</label>
                  <input formControlName="email" type="email" autocomplete="username"
                         spellcheck="false" autocorrect="off" autocapitalize="off"
                         class="neo-sm neo-panel bg-superficie shadow-neo-inset focus:ring-primario/40 w-full rounded-xl px-4 py-3 text-sm text-texto outline-none focus:ring-2" />
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-semibold tracking-wider text-secundario uppercase">Contraseña</label>
                  <div class="neo-sm neo-panel bg-superficie shadow-neo-inset focus-within:ring-primario/40 relative rounded-xl focus-within:ring-2">
                    <input formControlName="password" [type]="tipoInput('password')" autocomplete="current-password"
                           spellcheck="false" autocorrect="off" autocapitalize="off"
                           class="w-full bg-transparent px-4 py-3 pr-10 text-sm text-texto outline-none" />
                    <app-ojo-toggle [visible]="esVisible('password')" (alternar)="alternarVisibilidad('password')" />
                  </div>
                </div>

                <app-boton type="submit" [disabled]="form.invalid || loading()"
                           class="mt-2 block [&>button]:w-full [&>button]:rounded-xl [&>button]:py-3.5 [&>button]:text-sm [&>button]:font-bold [&>button]:tracking-wider [&>button]:uppercase">
                  {{ loading() ? 'Ingresando...' : 'Ingresar' }}
                </app-boton>

                @if (recordarEmpresa()) {
                  <button type="button" (click)="olvidarEmpresa()" class="block w-full text-center text-xs text-secundario underline">
                    ¿No es tu empresa? Cambiar
                  </button>
                }
              </div>
            </form>
          }

          @if (paso() === 'seleccionar') {
            <div class="space-y-2">
              <h1 class="mb-1 text-2xl font-bold text-texto">Elegí tu empresa.</h1>
              <p class="mb-4 text-sm text-secundario">Tu email está en más de una empresa. Elegí con cuál ingresar:</p>
              @for (empresa of empresasDisponibles(); track empresa.public_id) {
                <button type="button" (click)="seleccionarEmpresa(empresa)"
                        class="neo-sm neo-panel bg-superficie shadow-neo hover:shadow-neo-hover block w-full rounded-xl px-4 py-3 text-left text-sm text-texto transition-shadow">
                  {{ empresa.nombre }}
                </button>
              }
              <button type="button" (click)="volver()" class="text-sm text-secundario underline">Volver</button>
            </div>
          }

          @if (paso() === 'reintentar') {
            <form [formGroup]="formReintento" (ngSubmit)="reintentar()">
              <h1 class="mb-1 text-2xl font-bold text-texto">Confirmá tu contraseña.</h1>
              <p class="mb-4 text-sm text-secundario">
                Tu contraseña en <strong>{{ empresaSeleccionada()?.nombre }}</strong> es distinta. Ingresála:
              </p>
              <div class="neo-sm neo-panel bg-superficie shadow-neo-inset focus-within:ring-primario/40 relative mb-4 rounded-xl focus-within:ring-2">
                <input formControlName="password" [type]="tipoInput('reintento')" autocomplete="current-password"
                       spellcheck="false" autocorrect="off" autocapitalize="off"
                       class="w-full bg-transparent px-4 py-3 pr-10 text-sm text-texto outline-none" />
                <app-ojo-toggle [visible]="esVisible('reintento')" (alternar)="alternarVisibilidad('reintento')" />
              </div>
              <app-boton type="submit" [disabled]="formReintento.invalid || loading()"
                         class="mb-3 block [&>button]:w-full [&>button]:rounded-xl [&>button]:py-3.5 [&>button]:text-sm [&>button]:font-bold [&>button]:tracking-wider [&>button]:uppercase">
                {{ loading() ? 'Ingresando...' : 'Ingresar' }}
              </app-boton>
              <button type="button" (click)="volver()" class="block w-full text-center text-sm text-secundario underline">Volver</button>
            </form>
          }
        </div>
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
