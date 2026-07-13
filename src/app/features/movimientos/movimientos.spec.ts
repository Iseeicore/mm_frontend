import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Movimientos } from './movimientos';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../../core/ui/notificacion.service';

describe('Movimientos', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Movimientos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('construye y pide el listado y los selects de referencia en ngOnInit sin explotar', () => {
    const fixture = TestBed.createComponent(Movimientos);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);

    const req = http.expectOne(`${environment.apiUrl}/movimientos?page=1&limit=20`);
    req.flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });

    http
      .expectOne(`${environment.apiUrl}/productos?page=1&limit=100`)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http
      .expectOne(`${environment.apiUrl}/almacenes?page=1&limit=100`)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http
      .expectOne(`${environment.apiUrl}/tiendas?page=1&limit=100`)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });

    http.verify();
  });

  it('crear() en entrada no manda ubicacion_destino_tipo/ubicacion_destino_id', () => {
    const fixture = TestBed.createComponent(Movimientos);
    const componente = fixture.componentInstance as unknown as {
      form: { patchValue: (v: object) => void };
      crear: () => void;
    };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    // SweetAlert2 no funciona en jsdom (sin window.matchMedia) — se espía en vez
    // de dejar que el callback de éxito dispare el toast real.
    vi.spyOn(TestBed.inject(NotificacionService), 'toast').mockImplementation(() => {});
    http.expectOne(`${environment.apiUrl}/movimientos?page=1&limit=20`).flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/productos?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/almacenes?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/tiendas?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });

    componente.form.patchValue({
      producto_id: 'prod-1',
      tipo: 'entrada',
      ubicacion_tipo: 'almacen',
      ubicacion_id: 'alm-1',
      cantidad: 5,
    });
    componente.crear();

    const req = http.expectOne(`${environment.apiUrl}/movimientos`);
    expect(req.request.body.ubicacion_destino_tipo).toBeUndefined();
    expect(req.request.body.ubicacion_destino_id).toBeUndefined();
    req.flush({});
    http.expectOne(`${environment.apiUrl}/movimientos?page=1&limit=20`).flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });

  it('crear() en traspaso sí manda ubicacion_destino_tipo/ubicacion_destino_id', () => {
    const fixture = TestBed.createComponent(Movimientos);
    const componente = fixture.componentInstance as unknown as {
      form: { patchValue: (v: object) => void };
      crear: () => void;
    };
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    // SweetAlert2 no funciona en jsdom (sin window.matchMedia) — se espía en vez
    // de dejar que el callback de éxito dispare el toast real.
    vi.spyOn(TestBed.inject(NotificacionService), 'toast').mockImplementation(() => {});
    http.expectOne(`${environment.apiUrl}/movimientos?page=1&limit=20`).flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/productos?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/almacenes?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/tiendas?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });

    componente.form.patchValue({
      producto_id: 'prod-1',
      tipo: 'traspaso',
      ubicacion_tipo: 'almacen',
      ubicacion_id: 'alm-1',
      ubicacion_destino_tipo: 'tienda',
      ubicacion_destino_id: 'tie-1',
      cantidad: 5,
    });
    componente.crear();

    const req = http.expectOne(`${environment.apiUrl}/movimientos`);
    expect(req.request.body.ubicacion_destino_tipo).toBe('tienda');
    expect(req.request.body.ubicacion_destino_id).toBe('tie-1');
    req.flush({});
    http.expectOne(`${environment.apiUrl}/movimientos?page=1&limit=20`).flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });
});
