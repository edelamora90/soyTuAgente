import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value?: string | null, max = 150): string {
    const s = (value ?? '').trim();
    if (!s) return '';
    if (s.length <= max) return s;
    return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }
}
