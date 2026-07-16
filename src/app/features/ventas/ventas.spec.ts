import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Ventas } from './ventas';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/ui/notificacion.service';
import { Venta } from './venta.service';

// Forma mínima del FormGroup de línea que necesitan estos tests — no importa
// el tipo real de ventas.ts (privado) porque el acceso al componente ya pasa
// por `as unknown as` más abajo.
interface LineaVentaGroupTest {
  controls: {
    producto_id: { setValue: (v: string) => void; value: string };
    origen_id: { setValue: (v: string) => void; value: string };
    origen_tipo: { value: 'almacen' | 'tienda' };
    cantidad: { setValue: (v: number) => void; value: number };
  };
}

function flushCargaInicial(http: HttpTestingController): void {
  http.expectOne(`${environment.apiUrl}/ventas?page=1&limit=20`).flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
  http.expectOne(`${environment.apiUrl}/productos?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
  http.expectOne(`${environment.apiUrl}/almacenes?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
  http.expectOne(`${environment.apiUrl}/tiendas?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
}

describe('Ventas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Ventas],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('construye y pide el listado y los selects de referencia en ngOnInit sin explotar', () => {
    const fixture = TestBed.createComponent(Ventas);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http);
    http.verify();
  });

  it('crear() arma el payload con N líneas, sin mandar precio_unitario ni subtotal', () => {
    const fixture = TestBed.createComponent(Ventas);
    const componente = fixture.componentInstance as unknown as {
      form: { patchValue: (v: object) => void; controls: { tienda_id: { setValue: (v: string) => void }; lineas: { push: (g: unknown) => void; at: (i: number) => { patchValue: (v: object) => void } } } };
      agregarLinea: () => void;
      crear: () => void;
    };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(NotificacionService), 'toast').mockImplementation(() => {});
    flushCargaInicial(http);

    componente.form.controls.tienda_id.setValue('tienda-1');
    componente.form.controls.lineas.at(0).patchValue({
      producto_id: 'prod-1',
      cantidad: 3,
      origen_tipo: 'almacen',
      origen_id: 'alm-1',
    });

    componente.agregarLinea();
    componente.form.controls.lineas.at(1).patchValue({
      producto_id: 'prod-2',
      cantidad: 5,
      origen_tipo: 'tienda',
      origen_id: 'tie-1',
    });

    componente.crear();

    const req = http.expectOne(`${environment.apiUrl}/ventas`);
    expect(req.request.body).toEqual({
      tienda_id: 'tienda-1',
      lineas: [
        { producto_id: 'prod-1', cantidad: 3, origen_tipo: 'almacen', origen_id: 'alm-1' },
        { producto_id: 'prod-2', cantidad: 5, origen_tipo: 'tienda', origen_id: 'tie-1' },
      ],
    });
    req.flush({} as Venta);
    http.expectOne(`${environment.apiUrl}/ventas?page=1&limit=20`).flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });

  it('opcionesOrigen filtra por stock_actual > 0 y no mezcla el stock entre líneas', () => {
    const fixture = TestBed.createComponent(Ventas);
    const componente = fixture.componentInstance as unknown as {
      form: { controls: { lineas: { at: (i: number) => LineaVentaGroupTest } } };
      agregarLinea: () => void;
      alCambiarProducto: (linea: LineaVentaGroupTest) => void;
      opcionesOrigen: (linea: LineaVentaGroupTest, tipo: 'almacen' | 'tienda') => { public_id: string; nombre: string }[];
    };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http);

    componente.agregarLinea();

    const linea0 = componente.form.controls.lineas.at(0);
    const linea1 = componente.form.controls.lineas.at(1);

    linea0.controls.producto_id.setValue('prod-1');
    componente.alCambiarProducto(linea0);
    http.expectOne(`${environment.apiUrl}/productos/prod-1/stock`).flush({
      almacenes: [
        { public_id: 'alm-con-stock', nombre: 'Depósito', stock_actual: 5, stock_minimo: null, fecha_actualizacion: '' },
        { public_id: 'alm-sin-stock', nombre: 'Vacío', stock_actual: 0, stock_minimo: null, fecha_actualizacion: '' },
      ],
      tiendas: [],
    });

    linea1.controls.producto_id.setValue('prod-2');
    componente.alCambiarProducto(linea1);
    http.expectOne(`${environment.apiUrl}/productos/prod-2/stock`).flush({
      almacenes: [],
      tiendas: [{ public_id: 'tie-con-stock', nombre: 'Sucursal', stock_actual: 2, stock_minimo: null, fecha_actualizacion: '' }],
    });

    const opcionesLinea0 = componente.opcionesOrigen(linea0, 'almacen');
    expect(opcionesLinea0.map((o) => o.public_id)).toEqual(['alm-con-stock']);

    const opcionesLinea1Tienda = componente.opcionesOrigen(linea1, 'tienda');
    expect(opcionesLinea1Tienda.map((o) => o.public_id)).toEqual(['tie-con-stock']);

    // El stock de la línea 1 no debe filtrarse con datos de la línea 0.
    expect(componente.opcionesOrigen(linea1, 'almacen')).toEqual([]);

    http.verify();
  });

  it('opcionesOrigen no mezcla el stock si se borra una línea anterior mientras un fetch está en vuelo', () => {
    const fixture = TestBed.createComponent(Ventas);
    const componente = fixture.componentInstance as unknown as {
      form: { controls: { lineas: { at: (i: number) => LineaVentaGroupTest } } };
      agregarLinea: () => void;
      quitarLinea: (i: number) => void;
      alCambiarProducto: (linea: LineaVentaGroupTest) => void;
      opcionesOrigen: (linea: LineaVentaGroupTest, tipo: 'almacen' | 'tienda') => { public_id: string; nombre: string }[];
    };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http);

    // 3 líneas: la línea 2 (índice 2) dispara un fetch de stock que queda en
    // vuelo mientras se borra la línea 0 — el stock de la línea 2 debe seguir
    // asociado a SU FormGroup, sin importar que su índice haya cambiado a 1.
    componente.agregarLinea();
    componente.agregarLinea();
    const lineaObjetivo = componente.form.controls.lineas.at(2);

    lineaObjetivo.controls.producto_id.setValue('prod-3');
    componente.alCambiarProducto(lineaObjetivo);

    componente.quitarLinea(0);

    http.expectOne(`${environment.apiUrl}/productos/prod-3/stock`).flush({
      almacenes: [{ public_id: 'alm-con-stock', nombre: 'Depósito', stock_actual: 7, stock_minimo: null, fecha_actualizacion: '' }],
      tiendas: [],
    });

    expect(componente.opcionesOrigen(lineaObjetivo, 'almacen').map((o) => o.public_id)).toEqual(['alm-con-stock']);

    http.verify();
  });

  it('mensajeStock avisa cuando la cantidad supera el stock del origen elegido, y se recalcula al bajarla', () => {
    const fixture = TestBed.createComponent(Ventas);
    const componente = fixture.componentInstance as unknown as {
      form: { controls: { lineas: { at: (i: number) => LineaVentaGroupTest } } };
      alCambiarProducto: (linea: LineaVentaGroupTest) => void;
      mensajeStock: (linea: LineaVentaGroupTest) => string | null;
    };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http);

    const linea0 = componente.form.controls.lineas.at(0);
    linea0.controls.producto_id.setValue('prod-1');
    componente.alCambiarProducto(linea0);
    http.expectOne(`${environment.apiUrl}/productos/prod-1/stock`).flush({
      almacenes: [{ public_id: 'alm-1', nombre: 'Depósito', stock_actual: 5, stock_minimo: null, fecha_actualizacion: '' }],
      tiendas: [],
    });
    linea0.controls.origen_id.setValue('alm-1');

    linea0.controls.cantidad.setValue(8);
    expect(componente.mensajeStock(linea0)).toBe('Superaste el stock disponible en ese origen (5).');

    linea0.controls.cantidad.setValue(5);
    expect(componente.mensajeStock(linea0)).toBeNull();

    http.verify();
  });

  it('crear() no manda el request si alguna línea supera el stock del origen elegido', () => {
    const fixture = TestBed.createComponent(Ventas);
    const componente = fixture.componentInstance as unknown as {
      form: { controls: { tienda_id: { setValue: (v: string) => void }; lineas: { at: (i: number) => LineaVentaGroupTest } } };
      alCambiarProducto: (linea: LineaVentaGroupTest) => void;
      hayErroresStock: () => boolean;
      crear: () => void;
    };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http);

    componente.form.controls.tienda_id.setValue('tienda-1');
    const linea0 = componente.form.controls.lineas.at(0);
    linea0.controls.producto_id.setValue('prod-1');
    componente.alCambiarProducto(linea0);
    http.expectOne(`${environment.apiUrl}/productos/prod-1/stock`).flush({
      almacenes: [{ public_id: 'alm-1', nombre: 'Depósito', stock_actual: 5, stock_minimo: null, fecha_actualizacion: '' }],
      tiendas: [],
    });
    linea0.controls.origen_id.setValue('alm-1');
    linea0.controls.cantidad.setValue(8);

    expect(componente.hayErroresStock()).toBe(true);
    componente.crear();
    http.expectNone(`${environment.apiUrl}/ventas`);

    http.verify();
  });

  it('irADetalle navega a /ventas/:public_id', () => {
    const fixture = TestBed.createComponent(Ventas);
    const componente = fixture.componentInstance as unknown as { irADetalle: (v: Venta) => void };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http);

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    componente.irADetalle({
      public_id: 'venta-1',
      tienda_public_id: 't1',
      tienda_nombre: 'Sucursal',
      total: 100,
      fecha_creacion: '',
      creado_por_nombre: 'Cajero',
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/ventas', 'venta-1']);
    http.verify();
  });
});
