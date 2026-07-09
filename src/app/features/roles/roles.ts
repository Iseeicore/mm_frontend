import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CrudListBase } from '../../shared/crud/crud-list.base';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { Rol, RolService } from './rol.service';

const COLUMNAS: ColumnaTabla<Rol>[] = [
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'descripcion', titulo: 'Descripción' },
];

@Component({
  selector: 'app-roles',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Roles</h1>
        @if (auth.tienePermiso('roles.create')) {
          <app-boton (click)="abrirCrear()">Nuevo rol</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">{{ editando() ? 'Editar rol' : 'Nuevo rol' }}</h2>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre</label>
            <input formControlName="nombre" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Descripción</label>
            <input formControlName="descripcion" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input formControlName="es_default" type="checkbox" class="rounded border-gray-300" />
            Rol por defecto para nuevos usuarios
          </label>

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
                   [puedeEditar]="auth.tienePermiso('roles.update')"
                   [puedeEliminar]="auth.tienePermiso('roles.delete')"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (editar)="abrirEditar($event)" (eliminar)="eliminar($event)"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Roles extends CrudListBase<Rol> implements OnInit {
  protected servicio = inject(RolService);
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);

  protected columnas = COLUMNAS;

  ngOnInit(): void {
    this.cargar();
  }

  protected form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    es_default: [false],
  });

  protected resetForm(rol?: Rol): void {
    this.form.reset({
      nombre: rol?.nombre ?? '',
      descripcion: rol?.descripcion ?? '',
      es_default: rol?.es_default ?? false,
    });
  }

  protected formularioValido(): boolean {
    return this.form.valid;
  }

  protected crearPayload(): Partial<Rol> {
    return this.form.getRawValue();
  }

  protected actualizarPayload(): Partial<Rol> {
    return this.form.getRawValue();
  }

  protected etiqueta(rol: Rol): string {
    return rol.nombre;
  }

  protected idDe(rol: Rol): string {
    return rol.public_id;
  }
}
