import { HttpInterceptorFn } from '@angular/common/http';

// El backend usa 401 tanto para "token inválido" como para "credenciales
// incorrectas" (login, cambiar contraseña) — no se puede distinguir acá cuál
// es cuál, así que este interceptor NO decide sesión ni redirige. Esa
// responsabilidad es única del authGuard, que sí sabe cuándo estás entrando
// a una zona protegida.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
