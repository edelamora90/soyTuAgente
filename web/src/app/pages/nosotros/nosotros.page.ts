import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-nosotros',
  imports: [CommonModule, RouterModule],
  templateUrl: './nosotros.page.html',
  styleUrls: ['./nosotros.page.scss'],
})
export class NosotrosPage {
  // Ajusta los nombres/archivos según tengas en assets/nosotros
  ASSETS = {
    hero: 'assets/nosotros/Banner-agentes.jpg',
    avatars: ['assets/nosotros/perfiles-agentes.png'],
    mini: 'assets/nosotros/agentesaprendiendo.png',
    cardFormacion: 'assets/nosotros/card-formacion.jpg',
    cardActualizaciones: 'assets/nosotros/card-actualizaciones.jpg',
  };

  faqs = [
    {
      q: '¿Por qué el servicio de formación de Soy tu Agente es gratuito?',
      a: 'Texto de ejemplo: nuestro programa está patrocinado por aliados del sector y busca impulsar la profesionalización de agentes. Aquí puedes colocar una explicación real.',
    },
    {
      q: '¿Puedo iniciar aunque no tenga experiencia previa en seguros?',
      a: 'Sí. Comenzamos desde los fundamentos. Recibirás acompañamiento y materiales prácticos para avanzar paso a paso.',
    },
    {
      q: '¿Qué beneficios tengo al formar parte de Soy tu Agente?',
      a: 'Red de expertos, mentorías, preparación para certificaciones y una comunidad activa. Cambia este texto por la descripción final.',
    },
  ];
}
