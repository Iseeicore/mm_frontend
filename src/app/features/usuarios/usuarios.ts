import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CrudListBase } from '../../shared/crud/crud-list.base';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { Usuario, UsuarioPayload, UsuarioService } from './usuario.service';
import { Rol, RolService } from '../roles/rol.service';

const COLUMNAS: ColumnaTabla<Usuario>[] = [
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'email', titulo: 'Email' },
];

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Usuarios</h1>
        @if (auth.tienePermiso('usuarios.create')) {
          <app-boton (click)="abrirCrear()">Nuevo usuario</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</h2>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre</label>
            <input formControlName="nombre" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input formControlName="email" type="email" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          @if (!editando()) {
            <div>
              <label class="block text-sm font-medium text-gray-700">Contraseña</label>
              <input formControlName="password" type="password" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
          }

          @if (editando(); as usuario) {
            @if (auth.tienePermiso('usuarios.update')) {
              <div>
                <app-boton variante="secundario" type="button" [disabled]="desbloqueando()" (click)="desbloquearUsuario(usuario)">
                  {{ desbloqueando() ? 'Desbloqueando...' : 'Desbloquear cuenta' }}
                </app-boton>
              </div>
            }

            @if (auth.tienePermiso('roles.assign')) {
              <div>
                <span class="block text-sm font-medium text-gray-700">Roles asignados (se aplican al instante)</span>
                <div class="mt-1 space-y-1">
                  @for (rol of todosLosRoles(); track rol.public_id) {
                    <label class="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" class="rounded border-gray-300"
                             [checked]="rolesAsignadosIds().has(rol.public_id)"
                             (change)="toggleRol(rol, $any($event.target).checked)" />
                      {{ rol.nombre }}
                    </label>
                  }
                </div>
              </div>
            }
          }

          <div class="flex gap-2">
            <app-boton type="submit" [disabled]="form.invalid">Guardar</app-boton>
            <app-boton variante="secundario" type="button" (click)="cancelar()">Cancelar</app-boton>
          </div>
        </form>
      }

      @if (cargando()) {
        <p class="text-sm text-gray-400">Cargando...</p>
      } @else {
        <app-tabla [columnas]="columnas" [filas]="filas()" [clave]="idDe"
                   [puedeEditar]="auth.tienePermiso('usuarios.update')"
                   [puedeEliminar]="auth.tienePermiso('usuarios.delete')"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (editar)="abrirEditar($event)" (eliminar)="eliminar($event)"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Usuarios extends CrudListBase<Usuario, UsuarioPayload> implements OnInit {
  protected servicio = inject(UsuarioService);
  protected auth = inject(AuthService);
  private rolService = inject(RolService);
  private fb = inject(FormBuilder);

  protected columnas = COLUMNAS;

  protected todosLosRoles = signal<Rol[]>([]);
  protected rolesDelUsuario = signal<Rol[]>([]);
  protected rolesAsignadosIds = computed(() => new Set(this.rolesDelUsuario().map((r) => r.public_id)));
  protected desbloqueando = signal(false);

  ngOnInit(): void {
    this.cargar();
    if (this.auth.tienePermiso('roles.assign')) {
      this.rolService.listar(1, 100).subscribe(({ data }) => this.todosLosRoles.set(data));
    }
  }

  protected override abrirEditar(usuario: Usuario): void {
    super.abrirEditar(usuario);
    this.cargarRolesDeUsuario(usuario);
  }

  private cargarRolesDeUsuario(usuario: Usuario): void {
    this.servicio.obtenerRoles(usuario.public_id).subscribe((roles) => this.rolesDelUsuario.set(roles));
  }

  protected desbloquearUsuario(usuario: Usuario): void {
    this.desbloqueando.set(true);
    this.servicio.desbloquear(usuario.public_id).subscribe({
      next: ({ mensaje }) => {
        this.desbloqueando.set(false);
        this.notificacion.toast(mensaje);
      },
      error: (err) => {
        this.desbloqueando.set(false);
        this.notificacion.error(err.error?.error ?? 'Error al desbloquear');
      },
    });
  }

  protected toggleRol(rol: Rol, marcado: boolean): void {
    const usuario = this.editando();
    if (!usuario) return;

    const onError = (err: { error?: { error?: string } }) =>
      this.notificacion.error(err.error?.error ?? 'Error al actualizar roles');

    if (marcado) {
      this.servicio.asignarRol(usuario.public_id, rol.public_id).subscribe({
        next: () => this.cargarRolesDeUsuario(usuario),
        error: onError,
      });
    } else {
      this.servicio.quitarRol(usuario.public_id, rol.public_id).subscribe({
        next: () => this.cargarRolesDeUsuario(usuario),
        error: onError,
      });
    }
  }

  protected form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
  });

  protected resetForm(usuario?: Usuario): void {
    this.form.reset({ nombre: usuario?.nombre ?? '', email: usuario?.email ?? '', password: '' });
    if (usuario) {
      this.form.controls.password.clearValidators();
      this.form.controls.password.disable();
    } else {
      this.form.controls.password.enable();
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.form.controls.password.updateValueAndValidity();
  }

  protected formularioValido(): boolean {
    return this.form.valid;
  }

  protected crearPayload(): UsuarioPayload {
    return this.form.getRawValue();
  }

  protected actualizarPayload(): Partial<UsuarioPayload> {
    const { nombre, email } = this.form.getRawValue();
    return { nombre, email };
  }

  protected etiqueta(usuario: Usuario): string {
    return usuario.nombre;
  }

  protected idDe(usuario: Usuario): string {
    return usuario.public_id;
  }
}
