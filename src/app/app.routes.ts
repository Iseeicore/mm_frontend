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
import { Productos } from './features/productos/productos';
import { ProductoStock } from './features/productos/producto-stock';
import { ProductosUbicacion } from './features/productos/productos-ubicacion';
import { Movimientos } from './features/movimientos/movimientos';
import { Ventas } from './features/ventas/ventas';
import { VentaDetalle } from './features/ventas/venta-detalle';
import { ReportesTrazabilidad } from './features/reportes/reportes-trazabilidad';

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
      { path: 'tiendas/:id/productos', component: ProductosUbicacion, data: { tipo: 'tienda' } },
      { path: 'almacenes', component: Almacenes },
      { path: 'almacenes/:id/productos', component: ProductosUbicacion, data: { tipo: 'almacen' } },
      { path: 'productos', component: Productos },
      { path: 'productos/:id/stock', component: ProductoStock },
      { path: 'movimientos', component: Movimientos },
      { path: 'ventas', component: Ventas },
      { path: 'ventas/:id', component: VentaDetalle },
      { path: 'reportes/trazabilidad', component: ReportesTrazabilidad },
    ],
  },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'cambiar-password', component: CambiarPassword, canActivate: [authGuard] },
  { path: '**', component: NotFound },
];
