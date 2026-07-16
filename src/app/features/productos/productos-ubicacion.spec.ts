import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ProductosUbicacion } from './productos-ubicacion';
import { environment } from '../../../environments/environment';

function activatedRouteConTipo(tipo: 'almacen' | 'tienda') {
  return {
    snapshot: {
      paramMap: convertToParamMap({ id: 'abc-123' }),
      data: { tipo },
    },
  };
}

describe('ProductosUbicacion', () => {
  it('con tipo=almacen pide el nombre y los productos de /almacenes/:id/productos', () => {
    TestBed.configureTestingModule({
      imports: [ProductosUbicacion],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: activatedRouteConTipo('almacen') },
      ],
    });

    const fixture = TestBed.createComponent(ProductosUbicacion);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/almacenes/abc-123`).flush({
      public_id: 'abc-123',
      nombre: 'Depósito central',
      ubicacion: null,
      empresa_id: 1,
      activo: true,
      fecha_creacion: '',
      fecha_modificacion: '',
    });
    http
      .expectOne(`${environment.apiUrl}/almacenes/abc-123/productos?page=1&limit=20`)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });

  it('con tipo=tienda pide el nombre y los productos de /tiendas/:id/productos', () => {
    TestBed.configureTestingModule({
      imports: [ProductosUbicacion],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: activatedRouteConTipo('tienda') },
      ],
    });

    const fixture = TestBed.createComponent(ProductosUbicacion);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/tiendas/abc-123`).flush({
      public_id: 'abc-123',
      nombre: 'Sucursal centro',
      ubicacion: null,
      empresa_id: 1,
      activo: true,
      fecha_creacion: '',
      fecha_modificacion: '',
    });
    http
      .expectOne(`${environment.apiUrl}/tiendas/abc-123/productos?page=1&limit=20`)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });
});
