import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // La cookie httpOnly es la única autoridad real — se valida contra el
  // backend en cada entrada a zona protegida (incluye refresh de página),
  // sin cachear un flag local que pueda quedar desincronizado.
  return auth.cargarMe().pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
