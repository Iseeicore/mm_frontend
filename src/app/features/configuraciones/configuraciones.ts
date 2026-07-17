import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CrudListBase } from '../../shared/crud/crud-list.base';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { Sistema, SistemaService } from '../sistemas/sistema.service';
import { Configuracion, ConfiguracionPayload, ConfiguracionService } from './configuracion.service';
import { TemaService } from '../../core/tema/tema.service';

const COLUMNAS: ColumnaTabla<Configuracion>[] = [
  { clave: 'tema', titulo: 'Tema' },
  { clave: 'color_primario', titulo: 'Color primario' },
  { clave: 'es_activa', titulo: 'Activa' },
];

@Component({
  selector: 'app-configuraciones',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Configuraciones</h1>
        @if (auth.tienePermiso('sistemas.create')) {
          <app-boton (click)="abrirCrear()">Nueva configuración</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">{{ editando() ? 'Editar configuración' : 'Nueva configuración' }}</h2>

          @if (!editando()) {
            <div>
              <label class="block text-sm font-medium text-gray-700">Sistema</label>
              <select formControlName="sistema_public_id" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                <option value="" disabled>Elegí un sistema</option>
                @for (sistema of sistemas(); track sistema.public_id) {
                  <option [value]="sistema.public_id">{{ sistema.nombre_proyecto }}</option>
                }
              </select>
            </div>
          }

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Primario</label>
              <input formControlName="color_primario" type="color" class="mt-1 h-10 w-full rounded border border-gray-300" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Secundario</label>
              <input formControlName="color_secundario" type="color" class="mt-1 h-10 w-full rounded border border-gray-300" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Acento</label>
              <input formControlName="color_acento" type="color" class="mt-1 h-10 w-full rounded border border-gray-300" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Tema</label>
            <select formControlName="tema" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          @if (editando()) {
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input formControlName="es_activa" type="checkbox" class="rounded border-gray-300" />
              Es la configuración activa del sistema
            </label>
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
                   [puedeEditar]="auth.tienePermiso('sistemas.update')"
                   [puedeEliminar]="auth.tienePermiso('sistemas.delete')"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (editar)="abrirEditar($event)" (eliminar)="eliminar($event)"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Configuraciones extends CrudListBase<Configuracion, ConfiguracionPayload> implements OnInit {
  protected servicio = inject(ConfiguracionService);
  protected auth = inject(AuthService);
  private sistemaService = inject(SistemaService);
  private temaService = inject(TemaService);
  private fb = inject(FormBuilder);

  protected columnas = COLUMNAS;
  protected sistemas = signal<Sistema[]>([]);

  ngOnInit(): void {
    this.cargar();
    this.sistemaService.listar(1, 100).subscribe(({ data }) => this.sistemas.set(data));
  }

  protected form = this.fb.nonNullable.group({
    sistema_public_id: ['', Validators.required],
    color_primario: ['#1976D2', Validators.required],
    color_secundario: ['#424242', Validators.required],
    color_acento: ['#FF4081', Validators.required],
    tema: ['light'],
    es_activa: [false],
  });

  // sistema_public_id solo se pide al crear — la configuración no puede
  // cambiar de sistema una vez creada (el backend no lo acepta en update).
  protected resetForm(config?: Configuracion): void {
    this.form.reset({
      sistema_public_id: '',
      color_primario: config?.color_primario ?? '#1976D2',
      color_secundario: config?.color_secundario ?? '#424242',
      color_acento: config?.color_acento ?? '#FF4081',
      tema: config?.tema ?? 'light',
      es_activa: config?.es_activa ?? false,
    });

    if (config) {
      this.form.controls.sistema_public_id.clearValidators();
    } else {
      this.form.controls.sistema_public_id.setValidators(Validators.required);
    }
    this.form.controls.sistema_public_id.updateValueAndValidity();
  }

  protected formularioValido(): boolean {
    return this.form.valid;
  }

  protected crearPayload(): ConfiguracionPayload {
    return this.form.getRawValue();
  }

  protected actualizarPayload(): Partial<ConfiguracionPayload> {
    const { color_primario, color_secundario, color_acento, tema, es_activa } = this.form.getRawValue();
    return { color_primario, color_secundario, color_acento, tema, es_activa };
  }

  protected etiqueta(config: Configuracion): string {
    return `la configuración "${config.tema}"`;
  }

  protected idDe(config: Configuracion): number {
    return config.id;
  }

  // Re-pide la config activa tras cualquier guardado: si lo que se guardó
  // no era la activa, esto es un no-op visual (misma config de siempre); si
  // sí lo era, el tema se refleja al instante en esta misma sesión.
  protected override afterGuardar(): void {
    this.temaService.cargar().subscribe();
  }
}
