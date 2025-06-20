import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy  } from '@angular/core';

interface Testimonio {
  foto: string;
  titulo: string;
  texto: string;
  nombre: string;
}


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
   sliderImgs = [
    'assets/sec-4-slider1.png',
    'assets/sec-4-slider2.png',
    'assets/sec-4-slider3.png'
  ];
  sliderImgIndex = 0;
  prevSliderIndex = 0;
  justSlid = false;
  private imgInterval: any;

   testimonios: Testimonio[] = [
    {
      foto: 'assets/testimonio1.png',
      titulo: 'Rápido y profesional',
      texto: 'Fué muy rápido el proceso.',
      nombre: 'María Gómez'
    },
    {
      foto: 'assets/testimonio2.png',
      titulo: 'Muy buen trato',
      texto: 'Me sentí seguro en todo el proceso.',
      nombre: 'Carlos Pérez'
    },
    {
      foto: 'assets/testimonio3.png',
      titulo: 'Atención personalizada',
      texto: 'Resolvieron todas mis dudas.',
      nombre: 'Juan Martínez'
    }
  ];
  testimonioIndex = 0;
  private testimonialInterval: any;

  ngOnInit() {
    this.imgInterval = setInterval(() => {
      this.justSlid = true;
      this.prevSliderIndex = this.sliderImgIndex;
      this.sliderImgIndex = (this.sliderImgIndex + 1) % this.sliderImgs.length;

      // Permitir que la animación termine antes de resetear justSlid
      setTimeout(() => { this.justSlid = false; }, 500); // Duración de animación
    }, 3000);

    this.testimonialInterval = setInterval(() => {
      this.testimonioIndex = (this.testimonioIndex + 1) % this.testimonios.length;
    }, 3500);
  }

  ngOnDestroy() {
    if (this.imgInterval) {
      clearInterval(this.imgInterval);
    }

    if (this.testimonialInterval) {
      clearInterval(this.testimonialInterval);
    }
  }

  
}
