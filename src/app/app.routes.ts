import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { Login } from './features/auth/login';
import { Registro } from './features/auth/registro';
import { CambiarPassword } from './features/auth/cambiar-password';
import { Dashboard } from './features/dashboard/dashboard';
import { Inicio } from './features/dashboard/inicio';
import { NotFound } from './features/not-found/not-found';
import { Usuarios } from './features/usuarios/usuarios';
import { Roles } from './features/roles/roles';
import { Sistemas } from './features/sistemas/sistemas';
import { Configuraciones } from './features/configuraciones/configuraciones';
import { Permisos } from './features/permisos/permisos';
import { Tiendas } from './features/tiendas/tiendas';
import { Almacenes } from './features/almacenes/almacenes';

export const routes: Routes = [
  {
    path: '',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', component: Inicio },
      { path: 'usuarios', component: Usuarios },
      { path: 'roles', component: Roles },
      { path: 'sistemas', component: Sistemas },
      { path: 'configuraciones', component: Configuraciones },
      { path: 'permisos', component: Permisos },
      { path: 'tiendas', component: Tiendas },
      { path: 'almacenes', component: Almacenes },
    ],
  },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'cambiar-password', component: CambiarPassword, canActivate: [authGuard] },
  { path: '**', component: NotFound },
];
