export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina acentos
    .replace(/[^a-z0-9]+/g, '-')     // reemplaza no alfanuméricos con guión
    .replace(/(^-|-$)+/g, '');       // elimina guiones iniciales/finales
}
