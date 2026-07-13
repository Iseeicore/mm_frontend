import { Component, input, output } from '@angular/core';
import { Boton } from '../boton/boton';

export interface ColumnaTabla<T> {
  clave: keyof T & string;
  titulo: string;
}

// Genérica sobre cualquier recurso (usuarios, roles, sistemas, configuraciones).
// Columnas se definen por config; el identificador de fila también se recibe
// por config (`clave`) porque no todos los recursos tienen public_id —
// Configuración se identifica por id numérico, no UUID.
@Component({
  selector: 'app-tabla',
  imports: [Boton],
  template: `
    <div>
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-gray-500">
            @for (columna of columnas(); track columna.clave) {
              <th class="px-3 py-2 font-medium">{{ columna.titulo }}</th>
            }
            @if (puedeEditar() || puedeEliminar() || puedeVerDetalle()) {
              <th class="px-3 py-2 font-medium">Acciones</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (fila of filas(); track clave()(fila)) {
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              @for (columna of columnas(); track columna.clave) {
                <td class="px-3 py-2 text-gray-700">{{ fila[columna.clave] }}</td>
              }
              @if (puedeEditar() || puedeEliminar() || puedeVerDetalle()) {
                <td class="flex gap-2 px-3 py-2">
                  @if (puedeVerDetalle()) {
                    <app-boton variante="secundario" (click)="verDetalle.emit(fila)">{{ etiquetaVerDetalle() }}</app-boton>
                  }
                  @if (puedeEditar()) {
                    <app-boton variante="secundario" (click)="editar.emit(fila)">Editar</app-boton>
                  }
                  @if (puedeEliminar()) {
                    <app-boton variante="peligro" (click)="eliminar.emit(fila)">Eliminar</app-boton>
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columnas().length + 1" class="px-3 py-6 text-center text-gray-400">
                Sin registros.
              </td>
            </tr>
          }
        </tbody>
      </table>

      <div class="flex items-center justify-between border-t border-gray-200 px-3 py-2 text-sm text-gray-500">
        <app-boton variante="secundario" [disabled]="paginaActual() <= 1" (click)="anterior.emit()">Anterior</app-boton>
        <span>Página {{ paginaActual() }} de {{ totalPaginas() }}</span>
        <app-boton variante="secundario" [disabled]="paginaActual() >= totalPaginas()" (click)="siguiente.emit()">Siguiente</app-boton>
      </div>
    </div>
  `,
})
export class Tabla<T> {
  columnas = input.required<ColumnaTabla<T>[]>();
  filas = input.required<T[]>();
  clave = input.required<(fila: T) => string | number>();
  puedeEditar = input(false);
  puedeEliminar = input(false);
  puedeVerDetalle = input(false);
  etiquetaVerDetalle = input('Ver');
  paginaActual = input(1);
  totalPaginas = input(1);

  editar = output<T>();
  eliminar = output<T>();
  verDetalle = output<T>();
  anterior = output<void>();
  siguiente = output<void>();
}
