import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CrudListBase } from '../../shared/crud/crud-list.base';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { Sistema, SistemaPayload, SistemaService } from './sistema.service';

const COLUMNAS: ColumnaTabla<Sistema>[] = [
  { clave: 'nombre_proyecto', titulo: 'Proyecto' },
  { clave: 'db_host', titulo: 'DB host' },
  { clave: 'db_nombre', titulo: 'DB nombre' },
];

@Component({
  selector: 'app-sistemas',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Sistemas</h1>
        @if (auth.tienePermiso('sistemas.create')) {
          <app-boton (click)="abrirCrear()">Nuevo sistema</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">{{ editando() ? 'Editar sistema' : 'Nuevo sistema' }}</h2>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre del proyecto</label>
            <input formControlName="nombre_proyecto" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">DB host</label>
              <input formControlName="db_host" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">DB puerto</label>
              <input formControlName="db_puerto" type="number" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">DB nombre</label>
            <input formControlName="db_nombre" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">DB usuario</label>
              <input formControlName="db_usuario" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                     [placeholder]="editando() ? 'Dejar vacío para no cambiar' : ''" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">DB password (ref)</label>
              <input formControlName="db_password_ref" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                     [placeholder]="editando() ? 'Dejar vacío para no cambiar' : ''" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Ubicación (opcional)</label>
            <input formControlName="ubicacion" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

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
                   [puedeEditar]="auth.tienePermiso('sistemas.update')"
                   [puedeEliminar]="auth.tienePermiso('sistemas.delete')"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (editar)="abrirEditar($event)" (eliminar)="eliminar($event)"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Sistemas extends CrudListBase<Sistema, SistemaPayload> implements OnInit {
  protected servicio = inject(SistemaService);
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);

  protected columnas = COLUMNAS;

  ngOnInit(): void {
    this.cargar();
  }

  protected form = this.fb.nonNullable.group({
    nombre_proyecto: ['', Validators.required],
    db_host: ['', Validators.required],
    db_nombre: ['', Validators.required],
    db_usuario: [''],
    db_password_ref: [''],
    db_puerto: [5432],
    ubicacion: [''],
  });

  // db_usuario/db_password_ref: el backend no los devuelve en la lectura
  // (getAll/getById no los exponen), así que en edición quedan vacíos —
  // solo son obligatorios al crear.
  protected resetForm(sistema?: Sistema): void {
    this.form.reset({
      nombre_proyecto: sistema?.nombre_proyecto ?? '',
      db_host: sistema?.db_host ?? '',
      db_nombre: sistema?.db_nombre ?? '',
      db_usuario: '',
      db_password_ref: '',
      db_puerto: sistema?.db_puerto ?? 5432,
      ubicacion: '',
    });

    if (sistema) {
      this.form.controls.db_usuario.clearValidators();
      this.form.controls.db_password_ref.clearValidators();
    } else {
      this.form.controls.db_usuario.setValidators(Validators.required);
      this.form.controls.db_password_ref.setValidators(Validators.required);
    }
    this.form.controls.db_usuario.updateValueAndValidity();
    this.form.controls.db_password_ref.updateValueAndValidity();
  }

  protected formularioValido(): boolean {
    return this.form.valid;
  }

  protected crearPayload(): SistemaPayload {
    return this.form.getRawValue();
  }

  protected actualizarPayload(): Partial<SistemaPayload> {
    return this.form.getRawValue();
  }

  protected etiqueta(sistema: Sistema): string {
    return sistema.nombre_proyecto;
  }

  protected idDe(sistema: Sistema): string {
    return sistema.public_id;
  }
}
