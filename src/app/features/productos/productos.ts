import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CrudListBase } from '../../shared/crud/crud-list.base';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/boton/boton';
import { Producto, ProductoPayload, ProductoService } from './producto.service';

const COLUMNAS: ColumnaTabla<Producto>[] = [
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'codigo_barras', titulo: 'Código de barras' },
  { clave: 'precio_venta_unidad', titulo: 'Precio venta (unidad)' },
];

@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, Tabla, Boton],
  template: `
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">Productos</h1>
        @if (auth.tienePermiso('productos.create')) {
          <app-boton (click)="abrirCrear()">Nuevo producto</app-boton>
        }
      </div>

      @if (mostrarForm()) {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-gray-700">{{ editando() ? 'Editar producto' : 'Nuevo producto' }}</h2>

          <div>
            <label class="block text-sm font-medium text-gray-700">Nombre</label>
            <input formControlName="nombre" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Código de barras</label>
              <input formControlName="codigo_barras" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Unidades por paquete</label>
              <input formControlName="unidades_por_paquete" type="number" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Descripción</label>
            <input formControlName="descripcion" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>

          @if (!editando()) {
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">Precio compra (paquete)</label>
                <input formControlName="precio_compra_paquete" type="number" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Precio venta (unidad)</label>
                <input formControlName="precio_venta_unidad" type="number" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Precio venta (paquete)</label>
                <input formControlName="precio_venta_paquete" type="number" class="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
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
                   [puedeEditar]="auth.tienePermiso('productos.update')"
                   [puedeEliminar]="auth.tienePermiso('productos.delete')"
                   [paginaActual]="pagina()" [totalPaginas]="totalPaginas()"
                   (editar)="abrirEditar($event)" (eliminar)="eliminar($event)"
                   (anterior)="paginaAnterior()" (siguiente)="paginaSiguiente()" />
      }
    </div>
  `,
})
export class Productos extends CrudListBase<Producto, ProductoPayload> implements OnInit {
  protected servicio = inject(ProductoService);
  protected auth = inject(AuthService);
  private fb = inject(FormBuilder);

  protected columnas = COLUMNAS;

  ngOnInit(): void {
    this.cargar();
  }

  protected form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    codigo_barras: [''],
    descripcion: [''],
    unidades_por_paquete: [1, Validators.required],
    precio_compra_paquete: [0],
    precio_venta_unidad: [0, Validators.required],
    precio_venta_paquete: [null as number | null],
  });

  // precio_venta_unidad solo es obligatorio al crear: en edición el input está
  // oculto (el PUT no acepta precios) y no debe bloquear el submit por su
  // propia validación.
  protected resetForm(producto?: Producto): void {
    this.form.reset({
      nombre: producto?.nombre ?? '',
      codigo_barras: producto?.codigo_barras ?? '',
      descripcion: producto?.descripcion ?? '',
      unidades_por_paquete: producto?.unidades_por_paquete ?? 1,
      precio_compra_paquete: producto?.precio_compra_paquete ?? 0,
      precio_venta_unidad: producto?.precio_venta_unidad ?? 0,
      precio_venta_paquete: producto?.precio_venta_paquete ?? null,
    });

    if (producto) {
      this.form.controls.precio_venta_unidad.clearValidators();
    } else {
      this.form.controls.precio_venta_unidad.setValidators(Validators.required);
    }
    this.form.controls.precio_venta_unidad.updateValueAndValidity();
  }

  protected formularioValido(): boolean {
    return this.form.valid;
  }

  // Único de los 4 recursos previos donde crear/actualizar mandan payloads
  // distintos de verdad: el alta manda precios, la edición no puede mandarlos
  // (400 del backend si los incluye), así que actualizarPayload() no reusa
  // crearPayload() y arma un subset explícito con los 4 campos que el PUT acepta.
  // codigo_barras vacío se manda como null, no '': el índice único parcial del
  // backend (empresa_id, codigo_barras) WHERE codigo_barras IS NOT NULL solo
  // excluye NULL, no ''. Mandar '' choca entre sí en el segundo producto sin
  // código de barras (409 falso de "duplicado").
  protected crearPayload(): ProductoPayload {
    const { precio_venta_paquete, codigo_barras, descripcion, ...resto } = this.form.getRawValue();
    return {
      ...resto,
      codigo_barras: codigo_barras || null,
      descripcion: descripcion || null,
      ...(precio_venta_paquete != null ? { precio_venta_paquete } : {}),
    };
  }

  protected actualizarPayload(): Partial<ProductoPayload> {
    const { nombre, codigo_barras, descripcion, unidades_por_paquete } = this.form.getRawValue();
    return { nombre, codigo_barras: codigo_barras || null, descripcion: descripcion || null, unidades_por_paquete };
  }

  protected etiqueta(producto: Producto): string {
    return producto.nombre;
  }

  protected idDe(producto: Producto): string {
    return producto.public_id;
  }
}
