import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CrudListBase } from '../../shared/crud/crud-list.base';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { Tienda, TiendaService } from './tienda.service';

const COLUMNAS: ColumnaTabla<Tienda>[] = [
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'ubicacion', titulo: 'Ubicación' },
];

@Component({
  selector: 'app-tiendas',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Tiendas</h1>
        @if (auth.tienePermiso('tiendas.create')) {
          <app-boton (click)="abrirCrear()">Nueva tienda</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">{{ editando() ? 'Editar tienda' : 'Nueva tienda' }}</h2>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre</label>
            <input formControlName="nombre" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Ubicación</label>
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
                   [puedeEditar]="auth.tienePermiso('tiendas.update')"
                   [puedeEliminar]="auth.tienePermiso('tiendas.delete')"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (editar)="abrirEditar($event)" (eliminar)="eliminar($event)"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Tiendas extends CrudListBase<Tienda> implements OnInit {
  protected servicio = inject(TiendaService);
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);

  protected columnas = COLUMNAS;

  ngOnInit(): void {
    this.cargar();
  }

  protected form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    ubicacion: [''],
  });

  protected resetForm(tienda?: Tienda): void {
    this.form.reset({
      nombre: tienda?.nombre ?? '',
      ubicacion: tienda?.ubicacion ?? '',
    });
  }

  protected formularioValido(): boolean {
    return this.form.valid;
  }

  protected crearPayload(): Partial<Tienda> {
    return this.form.getRawValue();
  }

  protected actualizarPayload(): Partial<Tienda> {
    return this.form.getRawValue();
  }

  protected etiqueta(tienda: Tienda): string {
    return tienda.nombre;
  }

  protected idDe(tienda: Tienda): string {
    return tienda.public_id;
  }
}
