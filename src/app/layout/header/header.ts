import { Component } from '@angular/core';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [FooterComponent]
})
export class HeaderComponent {}
