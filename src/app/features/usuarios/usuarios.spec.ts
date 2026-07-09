import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Usuarios } from './usuarios';
import { environment } from '../../../environments/environment';

// Este test existe porque CrudListBase llamaba cargar() en su constructor,
// que corre ANTES de que `servicio` (campo de la subclase) se inicialice —
// el componente se rompía al construirse y nunca llegaba a pintar nada.
describe('Usuarios', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Usuarios],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('construye y pide el listado en ngOnInit sin explotar', () => {
    const fixture = TestBed.createComponent(Usuarios);
    expect(() => fixture.detectChanges()).not.toThrow();

    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(`${environment.apiUrl}/usuarios?page=1&limit=20`);
    req.flush({ data: [], meta: { total: 0, page: 1, limit: 20, pages: 0 } });
    http.verify();
  });
});
