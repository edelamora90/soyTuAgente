// web/src/app/shared/multi-check/multi-check.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type Opt = string | number | Record<string, any>;

@Component({
  selector: 'app-multi-check',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiCheckComponent),
      multi: true,
    },
  ],
  styles: [`
:host{display:block;position:relative}
.btn{
  width:100%; min-height:40px; border:1px solid #d0d5dd; border-radius:10px;
  background:#fff; display:flex; align-items:center; justify-content:space-between;
  gap:8px; padding:8px 12px; cursor:pointer;
}
.btn.disabled{opacity:.6; cursor:default}
.btn .ph{color:#6a7f79}
.btn .sel{display:flex; gap:6px; flex-wrap:wrap}
.badge{background:#f2f4f7; border:1px solid #e5e7eb; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700}
.chev{opacity:.7; margin-left:auto}
.panel{
  position:absolute; left:0; right:0; z-index:40;
  margin-top:6px; background:#fff; border:1px solid #e6ece9; border-radius:12px;
  box-shadow:0 10px 30px rgba(16,24,40,.12); padding:8px; display:grid; gap:8px;
}
.tools{display:flex; gap:6px}
.tools input[type="search"]{flex:1; border:1px solid #d0d5dd; border-radius:8px; height:34px; padding:0 8px}
.btn-sm{height:34px; padding:0 10px; border:1px solid #d0d5dd; border-radius:8px; background:#fff; font-weight:700; cursor:pointer}
.list{max-height:260px; overflow:auto; border:1px solid #eef2f1; border-radius:8px; padding:6px; display:grid; gap:6px}
.item{display:flex; align-items:center; gap:10px; padding:4px 6px; border-radius:8px}
.item:hover{background:#f7faf9}
.empty,.loading{color:#6a7f79; font-size:12px; padding:6px}
.actions{display:flex; justify-content:flex-end; gap:6px}
  `],
  template: `
<button
  type="button"
  class="btn"
  [class.disabled]="disabled"
  (click)="toggleOpen()"
  [attr.aria-expanded]="open">
  <span *ngIf="displaySelected.length; else ph" class="sel">
    <span class="badge" *ngFor="let t of displaySelected | slice:0:3">{{ t }}</span>
    <span class="badge" *ngIf="displaySelected.length > 3">+{{ displaySelected.length - 3 }}</span>
  </span>
  <ng-template #ph><span class="ph">{{ placeholder }}</span></ng-template>
  <span class="chev">▾</span>
</button>

<div class="panel" *ngIf="open">
  <div class="tools">
    <input
      type="search"
      [value]="q"
      (input)="q = $any($event.target).value"
      placeholder="Buscar..." />
    <button class="btn-sm" type="button" (click)="selectAll()">Todos</button>
    <button class="btn-sm" type="button" (click)="clear()">Limpiar</button>
  </div>

  <div *ngIf="loading" class="loading">Cargando…</div>

  <div class="list" *ngIf="!loading">
    <label class="item" *ngFor="let o of filtered">
      <input
        type="checkbox"
        [checked]="isSelected(valOf(o))"
        (change)="toggleValue(valOf(o), $any($event.target).checked)"
        [disabled]="disabled"
      />
      <span>{{ labelOf(o) }}</span>
    </label>

    <div class="empty" *ngIf="filtered.length === 0">Sin resultados.</div>
  </div>

  <div class="actions">
    <button class="btn-sm" type="button" (click)="close()">Cerrar</button>
  </div>
</div>
  `
})
export class MultiCheckComponent implements ControlValueAccessor {
  // ===== Inputs =====
  @Input() options: Opt[] = [];
  @Input() placeholder = 'Selecciona…';
  @Input() disabled = false;
  @Input() loading = false;

  /** Clave para mostrar etiqueta cuando options son objetos */
  @Input() labelKey: string | null = null;
  /** Clave para el valor cuando options son objetos */
  @Input() valueKey: string | null = null;

  /** Alternativa: funciones para label/value */
  @Input() labelFn?: (o: Opt) => string;
  @Input() valueFn?: (o: Opt) => any;

  // UI
  open = false;
  q = '';

  // selección interna
  private selected = new Set<any>();

  // ===== Derivados para la plantilla =====
  get filtered(): Opt[] {
    const term = this.q.trim().toLowerCase();
    if (!term) return this.options;
    return this.options.filter(o => this.labelOf(o).toLowerCase().includes(term));
  }

  get displaySelected(): string[] {
    if (!this.options?.length || this.selected.size === 0) return [];
    const out: string[] = [];
    for (const o of this.options) {
      const v = this.valOf(o);
      if (this.selected.has(v)) out.push(this.labelOf(o));
    }
    return out;
  }

  labelOf(o: Opt): string {
    if (this.labelFn) return this.labelFn(o);
    if (this.labelKey && typeof o === 'object' && o) {
      const v = (o as any)[this.labelKey];
      return String(v ?? '');
    }
    return String(o ?? '');
  }

  valOf(o: Opt): any {
    if (this.valueFn) return this.valueFn(o);
    if (this.valueKey && typeof o === 'object' && o) {
      return (o as any)[this.valueKey];
    }
    return o;
  }

  // ===== Interacción =====
  toggleOpen() {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) this.onTouched();
  }
  close() { this.open = false; }

  isSelected(v: any): boolean { return this.selected.has(v); }

  toggleValue(v: any, on: boolean) {
    if (on) this.selected.add(v); else this.selected.delete(v);
    this.emit();
  }

  selectAll() {
    for (const o of this.filtered) this.selected.add(this.valOf(o));
    this.emit();
  }

  clear() {
    this.selected.clear();
    this.emit();
  }

  // ===== ControlValueAccessor =====
  private onChange: (v: any) => void = () => {/**    */};
  private onTouched: () => void = () => {/**    */};

  writeValue(v: any): void {
    const arr = Array.isArray(v) ? v : (v ? [v] : []);
    this.selected = new Set(arr);
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  private emit() {
    this.onChange(Array.from(this.selected));
  }
}
