import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Paginado } from '../crud/crud.service';

// Composición para componentes standalone (signals, sin herencia) que solo
// necesitan paginar un listado — mismo guard de "página fuera de rango" que
// CrudListBase.cargar(), pero sin los miembros de alta/edición/borrado que no
// aplican a recursos sin CRUD completo (movimientos, ventas, productos por
// ubicación). CrudListBase sigue siendo la base correcta para los recursos
// con create/update/delete; esto es para todo lo demás.
export function crearListadoPaginado<T>(fetch: (pagina: number) => Observable<Paginado<T>>) {
  const pagina = signal(1);
  const totalPaginas = signal(1);
  const cargando = signal(false);
  const filas = signal<T[]>([]);

  function cargar(): void {
    cargando.set(true);
    fetch(pagina()).subscribe({
      next: ({ data, meta }) => {
        const paginas = Math.max(meta.pages, 1);
        // Se borró la última fila de una página > 1: esa página ya no existe,
        // recargar en la última página válida en vez de mostrar una tabla vacía.
        if (pagina() > paginas) {
          pagina.set(paginas);
          cargando.set(false);
          cargar();
          return;
        }
        filas.set(data);
        totalPaginas.set(paginas);
        cargando.set(false);
      },
      error: () => cargando.set(false),
    });
  }

  function paginaSiguiente(): void {
    if (pagina() >= totalPaginas()) return;
    pagina.update((p) => p + 1);
    cargar();
  }

  function paginaAnterior(): void {
    if (pagina() <= 1) return;
    pagina.update((p) => p - 1);
    cargar();
  }

  return { pagina, totalPaginas, cargando, filas, cargar, paginaSiguiente, paginaAnterior };
}
