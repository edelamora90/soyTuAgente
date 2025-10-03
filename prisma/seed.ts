// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  // Limpia si quieres idempotencia al reseedar
  await prisma.agent.deleteMany();

  const data = [
    {
      slug: 'alondra-cardenas',
      nombre: 'Alondra Preciado Cárdenas',
      cedula: 'Cédula: 4598821 33441122',
      verificado: true,
      avatar: 'assets/agents/alondra.jpg',
      ubicacion: 'Colima, Colima',
      especialidades: ['vehiculos', 'salud-asistencia'],
      mediaHero: 'assets/agents/profile-hero.jpg',
      mediaThumbs: [],
      experiencia: ['+5 años ayudando a familias y empresas.'],
      servicios: ['Pólizas autos', 'Salud', 'Asistencia en siniestros'],
      certificaciones: ['Qualitas Pro 2024'],
      aseguradoras: ['assets/qualitas.png'],
      whatsapp: '5213121234567',
      redes: [
        { icon: 'assets/icons/linkedin.svg', url: 'https://linkedin.com/in/...' },
        { icon: 'assets/icons/facebook.svg', url: 'https://facebook.com/...' },
      ],
    },
    {
      slug: 'jaime-solorzano',
      nombre: 'Jaime Martín Solórzano',
      cedula: 'Cédula: 889922 1112233',
      verificado: true,
      avatar: 'assets/agents/jaime.jpg',
      ubicacion: 'Colima, Colima',
      especialidades: ['vehiculos'],
      mediaHero: 'assets/agents/profile-hero.jpg',
      mediaThumbs: [],
      experiencia: ['Especialista en autos y flotillas.'],
      servicios: ['Pólizas autos', 'Flotillas', 'Empresarial'],
      certificaciones: [],
      aseguradoras: ['assets/metlife.png'],
      whatsapp: '5213121234567',
      redes: [],
    },
    {
      slug: 'martin-castellanos',
      nombre: 'Martín Castellanos Arias',
      cedula: 'Cédula: 667788 990011',
      verificado: true,
      avatar: 'assets/agents/martin.jpg',
      ubicacion: 'Manzanillo, Colima',
      especialidades: ['vehiculos'],
      mediaHero: 'assets/agents/profile-hero.jpg',
      mediaThumbs: [],
      experiencia: ['Atención en Manzanillo, autos y transporte.'],
      servicios: ['Pólizas autos'],
      certificaciones: [],
      aseguradoras: ['assets/bbva.png'],
      whatsapp: '5213121234567',
      redes: [],
    },
    {
      slug: 'maria-fernanda-castillo',
      nombre: 'María Fernanda Castillo',
      cedula: 'Cédula: 998877 221133',
      verificado: true,
      avatar: 'assets/agents/maria.jpg',
      ubicacion: 'Cd. Guzmán, Jalisco',
      especialidades: ['vehiculos', 'salud-asistencia', 'hogar-negocio'],
      mediaHero: 'assets/agents/profile-hero.jpg',
      mediaThumbs: [],
      experiencia: ['+6 años con clientes de hogar y salud.'],
      servicios: ['Pólizas autos', 'Hogar', 'Salud'],
      certificaciones: [],
      aseguradoras: [],
      whatsapp: '5213121234567',
      redes: [],
    },
  ];

  // Inserta uno por uno para respetar `slug` único y campos opcionales
  for (const a of data) {
    await prisma.agent.create({ data: a as any });
  }

  console.log('✅ Seed insertado');
}

run()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// Este script se ejecuta con `npx prisma db seed`
// Asegúrate de tener configurado el script en package.json