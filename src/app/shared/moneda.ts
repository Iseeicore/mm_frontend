// Formato de moneda del proyecto: soles peruanos (contexto ya establecido por
// rucPeruValidator en registro.ts), no "$". Compartido entre tabla.ts y
// cualquier vista que necesite mostrar montos (ej. el carrito de ventas.ts).
export function formatoMoneda(valor: unknown): string {
  return Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
