import { AbstractControl, ValidationErrors } from '@angular/forms';

// Algoritmo estándar (mod 11) usado por validadores de RUC en Perú.
// SUNAT no publica el algoritmo oficial; este es el reverse-engineered de uso común.
const FACTORES = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

const PREFIJOS_VALIDOS = new Set(['10', '15', '17', '20']);

// ponytail: valida solo estructura (formato + checksum), no contra el padrón real de SUNAT.
// Un RUC puede pasar este checksum y no existir o estar dado de baja.
// Upgrade: cuando se integre la API de consulta RUC de SUNAT, agregar verificación real acá.
export function validarRucPeru(ruc: string): string | null {
  if (!/^\d{11}$/.test(ruc)) return 'El RUC debe tener 11 dígitos numéricos';

  const prefijo = ruc.slice(0, 2);
  if (!PREFIJOS_VALIDOS.has(prefijo)) return `Debe iniciar con 10, 15, 17 o 20 (tiene "${prefijo}")`;

  const digitos = ruc.split('').map(Number);
  const suma = FACTORES.reduce((acc, factor, i) => acc + factor * digitos[i], 0);
  const resto = suma % 11;
  let verificador = 11 - resto;
  if (verificador === 11) verificador = 0;
  if (verificador === 10) verificador = 1;

  if (verificador !== digitos[10]) return 'Dígito verificador inválido — revisá el RUC';

  return null;
}

export function rucPeruValidator(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null; // el vacío lo maneja Validators.required
  const mensaje = validarRucPeru(valor);
  return mensaje ? { ruc: mensaje } : null;
}
