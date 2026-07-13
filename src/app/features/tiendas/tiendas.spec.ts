import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Tiendas } from './tiendas';
import { environment } from '../../../environments/environment';

describe('Tiendas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Tiendas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('construye y pide el listado en ngOnInit sin explotar', () => {
    const fixture = TestBed.createComponent(Tiendas);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(`${environment.apiUrl}/tiendas?page=1&limit=20`);
    req.flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });
});
