export interface ItemMenu {
  label: string;
  ruta: string;
  // Sin permiso => visible para cualquier usuario autenticado (igual que
  // GET /permisos en el backend, que solo exige requireAuth, ninguna
  // requirePermiso puntual).
  permiso?: string;
}

export interface GrupoMenu {
  label: string;
  hijos: ItemMenu[];
}

// Qué entra al sidebar lo decide el backend (get_matriz_permisos), esta lista
// solo mapea permiso -> ruta/label/grupo. Si el usuario no tiene el permiso,
// no aparece (y si un grupo queda sin hijos visibles, tampoco).
export const MENU_GRUPOS: GrupoMenu[] = [
  {
    label: 'Administración',
    hijos: [
      { label: 'Usuarios', ruta: '/usuarios', permiso: 'usuarios.read' },
      { label: 'Roles', ruta: '/roles', permiso: 'roles.read' },
      { label: 'Sistemas', ruta: '/sistemas', permiso: 'sistemas.read' },
      { label: 'Configuración', ruta: '/configuraciones', permiso: 'sistemas.read' },
      { label: 'Permisos', ruta: '/permisos' },
    ],
  },
  {
    label: 'Inventario',
    hijos: [
      { label: 'Productos', ruta: '/productos', permiso: 'productos.read' },
      { label: 'Almacenes', ruta: '/almacenes', permiso: 'almacenes.read' },
      { label: 'Tiendas', ruta: '/tiendas', permiso: 'tiendas.read' },
      { label: 'Movimientos', ruta: '/movimientos', permiso: 'movimientos.read' },
    ],
  },
];

export const MENU_SUELTO: ItemMenu[] = [
  { label: 'Ventas', ruta: '/ventas', permiso: 'ventas.read' },
];
