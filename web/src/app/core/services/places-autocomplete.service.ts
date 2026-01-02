// web/src/app/core/services/places-autocomplete.service.ts
//------------------------------------------------------------
// PlacesAutocompleteService
// -----------------------------------------------------------
// Servicio encargado de consumir la API de autocompletado de
// Geoapify. Provee sugerencias de direcciones mientras el
// usuario escribe.
//
// NOTAS IMPORTANTES:
// - Mantener la API Key en environment.ts (no aquí).
// - Este servicio NO guarda nada en BD, sólo provee
//   sugerencias al formulario.
// - API utilizada: https://api.geoapify.com/v1/geocode/autocomplete
//------------------------------------------------------------

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
} from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================================
// 1) Interface para cada sugerencia de dirección
// ============================================================

export interface PlaceSuggestion {
  formatted: string; // ejemplo: "Corregidora 352, Colima, México"
}

// ============================================================
// 2) Servicio
// ============================================================

@Injectable({ providedIn: 'root' })
export class PlacesAutocompleteService {
  private http = inject(HttpClient);

  /**
   * Endpoint de Geoapify para autocompletar direcciones.
   * - Usa environment.geoapifyKey (defínelo en tu environment.ts)
   */
  private apiUrl = 'https://api.geoapify.com/v1/geocode/autocomplete';

  /**
   * Busca sugerencias en Geoapify.
   * @param text Texto ingresado por el usuario.
   *
   * Retorna lista de sugerencias con formato:
   * [
   *   { formatted: "Dirección completa ..." },
   *   { formatted: "..." }
   * ]
   */
  search(text: string): Observable<PlaceSuggestion[]> {
    if (!text || text.length < 3) {
      // Evita llamadas innecesarias
      return of([]);
    }

    const url = `${this.apiUrl}?text=${encodeURIComponent(
      text,
    )}&format=json&apiKey=${environment.geoapifyKey}`;

    return this.http.get<any>(url).pipe(
      map((resp) => {
        if (!resp?.results) return [];
        return resp.results.map((r: any) => ({
          formatted: r.formatted,
        })) as PlaceSuggestion[];
      }),
    );
  }

  /**
   * Crea un observable preparado para conectar directamente
   * con un control de formulario (valueChanges).
   *
   * Aplica:
   * → debounce 300ms
   * → distinctUntilChanged
   * → switchMap (cancela búsquedas anteriores)
   */
  bindToControl(controlValue$: Observable<string>): Observable<PlaceSuggestion[]> {
    return controlValue$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((text) => this.search(text)),
    );
  }
}
