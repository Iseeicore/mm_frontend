import { inject, signal } from '@angular/core';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { CrudService } from './crud.service';

// Orquestación genérica de un CRUD con listado + alta/edición + borrado
// (cargar/abrir/guardar/eliminar es igual para Usuarios, Roles, Sistemas,
// Configuración). Lo que cambia por recurso (forma del form, columnas,
// mapeo a payload) queda en los métodos abstractos que cada subclase define.
//
// cargar() se llama desde ngOnInit() del componente concreto (@Component),
// NO desde acá: un constructor/hook de la clase base corre ANTES que los
// campos propios de la subclase (`servicio`) se inicialicen, así que
// llamarlo acá revienta con "servicio is undefined". Angular además exige
// que ngOnInit viva en una clase decorada (@Component/@Directive), una
// clase base abstracta sin decorador no puede implementarlo.
export abstract class CrudListBase<T, C = Partial<T>> {
  protected abstract servicio: CrudService<T, C>;
  protected notificacion = inject(NotificacionService);

  protected filas = signal<T[]>([]);
  protected cargando = signal(false);
  protected editando = signal<T | null>(null);
  protected mostrarForm = signal(false);
  protected pagina = signal(1);
  protected totalPaginas = signal(1);

  // El backend siempre pagina (page/limit/meta.pages) — acá se refleja esa
  // paginación real en vez de pedir siempre la página 1 y descartar meta,
  // que dejaba invisible todo lo que pasara de 20 filas.
  protected cargar(): void {
    this.cargando.set(true);
    this.servicio.listar(this.pagina()).subscribe({
      next: ({ data, meta }) => {
        const paginas = Math.max(meta.pages, 1);
        // Se borró la última fila de una página > 1: esa página ya no existe,
        // recargar en la última página válida en vez de mostrar una tabla vacía.
        if (this.pagina() > paginas) {
          this.pagina.set(paginas);
          this.cargando.set(false);
          this.cargar();
          return;
        }
        this.filas.set(data);
        this.totalPaginas.set(paginas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected paginaSiguiente(): void {
    if (this.pagina() >= this.totalPaginas()) return;
    this.pagina.update((p) => p + 1);
    this.cargar();
  }

  protected paginaAnterior(): void {
    if (this.pagina() <= 1) return;
    this.pagina.update((p) => p - 1);
    this.cargar();
  }

  protected abrirCrear(): void {
    this.editando.set(null);
    this.resetForm();
    this.mostrarForm.set(true);
  }

  protected abrirEditar(item: T): void {
    this.editando.set(item);
    this.resetForm(item);
    this.mostrarForm.set(true);
  }

  protected cancelar(): void {
    this.mostrarForm.set(false);
  }

  protected guardar(): void {
    if (!this.formularioValido()) return;

    const editando = this.editando();
    const peticion = editando
      ? this.servicio.actualizar(this.idDe(editando), this.actualizarPayload())
      : this.servicio.crear(this.crearPayload());

    peticion.subscribe({
      next: () => {
        this.notificacion.toast(editando ? 'Actualizado' : 'Creado');
        this.mostrarForm.set(false);
        this.cargar();
      },
      error: (err) => this.notificacion.error(err.error?.error ?? 'Error al guardar'),
    });
  }

  protected async eliminar(item: T): Promise<void> {
    const confirmado = await this.notificacion.confirmar(`Se eliminará ${this.etiqueta(item)}.`);
    if (!confirmado) return;

    this.servicio.eliminar(this.idDe(item)).subscribe({
      next: () => {
        this.notificacion.toast('Eliminado');
        this.cargar();
      },
      error: (err) => this.notificacion.error(err.error?.error ?? 'Error al eliminar'),
    });
  }

  protected abstract resetForm(item?: T): void;
  protected abstract formularioValido(): boolean;
  protected abstract crearPayload(): C;
  protected abstract actualizarPayload(): Partial<C>;
  protected abstract etiqueta(item: T): string;
  protected abstract idDe(item: T): string | number;
}
