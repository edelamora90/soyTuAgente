// web/src/app/shared/constants/especialidades.ts

export type EspecialidadKey =
  | 'vida'
  | 'salud'
  | 'autos'
  | 'hogar'
  | 'finanza-caucion'
  | 'danos-patrimoniales';

export const ESPECIALIDADES = [
  {
    key: 'vida',
    label: 'Vida',
    icon: 'assets/icons/vida.svg',
  },
  {
    key: 'salud',
    label: 'Salud',
    icon: 'assets/icons/corazon.svg',
  },
  {
    key: 'autos',
    label: 'Autos',
    icon: 'assets/icons/rep-auto.svg',
  },
  {
    key: 'hogar',
    label: 'Hogar',
    icon: 'assets/icons/seguro-hogar.svg',
  },
  {
    key: 'finanza-caucion',
    label: 'Finanza / Caución',
    icon: 'assets/icons/obtener-dinero.svg',
  },
  {
    key: 'danos-patrimoniales',
    label: 'Daños Patrimoniales / Generales',
    icon: 'assets/icons/escudo.png',
  },
] as const;
