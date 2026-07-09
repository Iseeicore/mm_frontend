import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Configuraciones } from './configuraciones';
import { environment } from '../../../environments/environment';

describe('Configuraciones', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Configuraciones],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('construye y pide configuraciones + sistemas en ngOnInit sin explotar', () => {
    const fixture = TestBed.createComponent(Configuraciones);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/configuraciones?page=1&limit=20`)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.expectOne(`${environment.apiUrl}/sistemas?page=1&limit=100`)
      .flush({ data: [], meta: { total: 0, page: 1, limit: 100, pages: 0 } });
    http.verify();
  });
});
