import { Component } from '@angular/core';
import { HeaderComponent } from './header/header';
import { FooterComponent } from './footer/footer';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    RouterOutlet
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {}
