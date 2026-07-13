import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Productos } from './productos';
import { environment } from '../../../environments/environment';

describe('Productos', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Productos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('construye y pide el listado en ngOnInit sin explotar', () => {
    const fixture = TestBed.createComponent(Productos);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(`${environment.apiUrl}/productos?page=1&limit=20`);
    req.flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });
});
