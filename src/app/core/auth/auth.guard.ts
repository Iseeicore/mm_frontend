import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Permisos frescos en cada entrada a zona protegida (incluye refresh de página).
  return auth.cargarMe().pipe(
    map(() => true),
    catchError(() => {
      auth.setAuthenticated(false);
      router.navigate(['/login']);
      return of(false);
    })
  );
};
