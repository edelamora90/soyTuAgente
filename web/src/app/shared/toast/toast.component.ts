import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastData } from './toast.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastData | null = null;
  sub!: Subscription;

  ngOnInit() {
    this.sub = this.toastService.toast$.subscribe(t => {
      this.toast = t;
    });
  }

  constructor(private toastService: ToastService) {}

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
