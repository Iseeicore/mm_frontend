import { Injectable } from '@angular/core';
import { CrudService } from '../../shared/crud/crud.service';

// Único recurso sin public_id: se identifica por id numérico (S_configuraciones
// no tiene columna public_id en el schema).
export interface Configuracion {
  id: number;
  sistema_id: number;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  color_texto: string;
  color_fondo: string;
  tema: string;
  es_activa: boolean;
  activo: boolean;
  fecha_creacion: string;
}

export interface ConfiguracionPayload {
  sistema_public_id: string;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  color_texto?: string;
  color_fondo?: string;
  tema?: string;
  es_activa?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService extends CrudService<Configuracion, ConfiguracionPayload> {
  protected recurso = 'configuraciones';
}
