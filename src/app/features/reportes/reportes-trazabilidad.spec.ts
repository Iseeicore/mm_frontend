import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportesTrazabilidad } from './reportes-trazabilidad';
import { environment } from '../../../environments/environment';

describe('ReportesTrazabilidad', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReportesTrazabilidad],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function flushCargaInicial(http: HttpTestingController, fecha: string) {
    http
      .expectOne((req) => req.url === `${environment.apiUrl}/reportes/trazabilidad` && req.params.get('fecha') === fecha)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http
      .expectOne((req) => req.url === `${environment.apiUrl}/reportes/trazabilidad/resumen` && req.params.get('fecha') === fecha)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/productos?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/almacenes?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/tiendas?page=1&limit=100`).flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
  }

  it('construye y pide trazabilidad + resumen con la fecha de hoy sin explotar', () => {
    const fixture = TestBed.createComponent(ReportesTrazabilidad);
    const hoy = new Date();
    const isoHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http, isoHoy);
    http.verify();
  });

  it('origen_tipo y origen_id nunca viajan solos: elegir solo el tipo no agrega el filtro', () => {
    const fixture = TestBed.createComponent(ReportesTrazabilidad);
    const componente = fixture.componentInstance as unknown as {
      origenTipo: { set: (v: string) => void };
      aplicarFiltros: () => void;
    };
    const hoy = new Date();
    const isoHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    flushCargaInicial(http, isoHoy);

    componente.origenTipo.set('almacen');
    componente.aplicarFiltros();

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/reportes/trazabilidad`);
    expect(req.request.params.has('origen_tipo')).toBe(false);
    expect(req.request.params.has('origen_id')).toBe(false);
    req.flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.expectOne((r) => r.url === `${environment.apiUrl}/reportes/trazabilidad/resumen`).flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });

    http.verify();
  });
});
