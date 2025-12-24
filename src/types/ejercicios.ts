// Tipos para la Biblioteca de Ejercicios

export type CategoriaEjercicio = 'Volea' | 'Bandeja' | 'Defensa' | 'Táctica' | 'Calentamiento' | 'Remate' | 'Saque' | 'Globo' | 'Dejada' | 'Víbora' | 'Ataque' | 'Transiciones';

export type NivelEjercicio = 'Iniciación' | 'Intermedio' | 'Avanzado';

export type IntensidadEjercicio = 'Baja' | 'Media' | 'Alta';

export interface PosicionJugador {
  x: number; // Porcentaje 0-100
  y: number; // Porcentaje 0-100
  label: string; // Ej: "A", "B", "1", "2"
  color: string; // Color hex
}

export interface Movimiento {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'bola' | 'jugador' | 'globo' | 'bandeja';
  color?: string;
}

export interface Ejercicio {
  id: string;
  club_id: string;
  nombre: string;
  categoria: CategoriaEjercicio;
  nivel: NivelEjercicio;
  duracion: number; // en minutos
  jugadores: number; // 2-4
  intensidad: IntensidadEjercicio;
  objetivo: string;
  descripcion?: string;
  tags: string[];
  posiciones: PosicionJugador[];
  movimientos: Movimiento[];
  created_by?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  clubs?: {
    name: string;
  };
}

export interface CreateEjercicioData {
  club_id: string;
  nombre: string;
  categoria: CategoriaEjercicio;
  nivel: NivelEjercicio;
  duracion: number;
  jugadores: number;
  intensidad: IntensidadEjercicio;
  objetivo: string;
  descripcion?: string;
  tags?: string[];
  posiciones?: PosicionJugador[];
  movimientos?: Movimiento[];
}

export interface UpdateEjercicioData {
  nombre?: string;
  categoria?: CategoriaEjercicio;
  nivel?: NivelEjercicio;
  duracion?: number;
  jugadores?: number;
  intensidad?: IntensidadEjercicio;
  objetivo?: string;
  descripcion?: string;
  tags?: string[];
  posiciones?: PosicionJugador[];
  movimientos?: Movimiento[];
  activo?: boolean;
}

export interface EjercicioFilters {
  search?: string;
  categoria?: CategoriaEjercicio;
  nivel?: NivelEjercicio;
  intensidad?: IntensidadEjercicio;
  jugadores?: number;
  tieneVideo?: boolean;
}

// Constantes para los selects
export const CATEGORIAS: CategoriaEjercicio[] = [
  'Volea',
  'Bandeja',
  'Defensa',
  'Táctica',
  'Calentamiento',
  'Remate',
  'Saque',
  'Globo',
  'Dejada',
  'Víbora',
  'Ataque',
  'Transiciones'
];

export const NIVELES: NivelEjercicio[] = [
  'Iniciación',
  'Intermedio',
  'Avanzado'
];

export const INTENSIDADES: IntensidadEjercicio[] = [
  'Baja',
  'Media',
  'Alta'
];

export const JUGADORES_OPTIONS = [2, 3, 4];

// Colores por defecto para jugadores
export const COLORES_JUGADORES = [
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#F59E0B', // Amarillo
  '#EF4444', // Rojo
];
