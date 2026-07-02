import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  exito(mensaje: string, titulo = 'Listo'): void {
    Swal.fire({ icon: 'success', title: titulo, text: mensaje, timer: 2000, showConfirmButton: false });
  }

  error(mensaje: string, titulo = 'Error'): void {
    Swal.fire({ icon: 'error', title: titulo, text: mensaje });
  }

  toast(mensaje: string, icon: 'success' | 'info' | 'error' = 'success'): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: mensaje,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  }
}
