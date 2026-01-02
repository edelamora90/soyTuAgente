import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastData | null>(null);
  toast$ = this.toastSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastSubject.next({ message, type });

    // Se oculta automáticamente después de 2.5 segundos
    setTimeout(() => {
      this.toastSubject.next(null);
    }, 2500);
  }
}
