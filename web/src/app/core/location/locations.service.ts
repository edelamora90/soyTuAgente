import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError } from 'rxjs';

// Estados de la República (ligero mantenerlos en código)
export const MX_STATES = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Coahuila',
  'Colima','Chiapas','Chihuahua','Ciudad de México','Durango','Guanajuato','Guerrero',
  'Hidalgo','Jalisco','México','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca',
  'Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco',
  'Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'
] as const;

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<string[]>>();

  getStates(): string[] {
    return [...MX_STATES];
  }

  private slugify(s: string): string {
    return (s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Carga municipios desde /assets/locations/municipios/<slug>.json
   * Cachea por estado (slug) y devuelve [] si no existe el archivo.
   */
  loadMunicipios(estado: string): Observable<string[]> {
    const slug = this.slugify(estado);
    if (!slug) return of([]);

    const cached = this.cache.get(slug);
    if (cached) return cached;

    const req$ = this.http
      .get<string[]>(`/assets/locations/municipios/${slug}.json`)
      .pipe(
        catchError(() => of<string[]>([])),
        shareReplay(1) // cache observable
      );

    this.cache.set(slug, req$);
    return req$;
  }
}
