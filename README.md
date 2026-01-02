SoyTuAgente

Plataforma web para conectar personas con agentes de seguros, permitiendo buscar, filtrar y contactar agentes de forma sencilla, así como un panel administrativo para la gestión de contenido.

Este repositorio contiene la versión estable de producción actualmente desplegada en servidor.


====================
STACK TECNOLÓGICO
====================

Frontend
- Angular
- TypeScript
- SCSS

Backend
- NestJS
- Prisma ORM
- PostgreSQL

Infraestructura
- NGINX (reverse proxy y estáticos)
- PM2 (process manager)
- Docker (PostgreSQL en contenedor)
- Ubuntu Server


====================
ESTRUCTURA DEL REPOSITORIO
====================

/
├── web/                  Frontend Angular
├── api/                  Backend NestJS
├── prisma/               Esquema y migraciones Prisma
├── public/               Assets públicos (no sensibles)
├── scripts/              Scripts de apoyo
├── ecosystem.config.js   Configuración PM2
├── docker-compose.yml    Servicios (DB, etc.)
└── README.md


====================
REQUISITOS
====================

- Node.js (LTS recomendado)
- npm o pnpm
- Docker y Docker Compose (para base de datos)
- PostgreSQL (si no se usa Docker)


====================
EJECUCIÓN EN DESARROLLO (RESUMEN)
====================

Backend
cd api
npm install
npm run start:dev

Frontend
cd web
npm install
npm run start


====================
BASE DE DATOS (PRISMA)
====================

npx prisma generate
npx prisma migrate deploy


====================
PRODUCCIÓN (RESUMEN)
====================

PM2
El backend se ejecuta con PM2 usando el archivo:
ecosystem.config.js

Comandos habituales:
pm2 start ecosystem.config.js
pm2 restart soyTuAgente-api
pm2 logs soyTuAgente-api
pm2 save

PM2 está configurado para iniciar automáticamente con el sistema (pm2 startup).


NGINX
- Sirve el frontend compilado
- Proxy para /api hacia el backend NestJS

Estructura conceptual:
/        → Frontend
/api     → Backend (NestJS)


====================
VARIABLES DE ENTORNO
====================

Las variables reales NO están en el repositorio.
Se incluye únicamente:
.env.example

Cada entorno debe definir su propio archivo .env


====================
NOTAS IMPORTANTES
====================

- Este repositorio refleja el estado real y estable de producción
- No se versionan:
  - .env
  - node_modules
  - uploads
  - builds temporales
- Usar siempre `pm2 save` después de cambios en producción


====================
VERSIONADO
====================

La versión estable de producción está marcada con el tag:
prod-stable


====================
AUTOR
====================

Proyecto desarrollado y mantenido por:
Efrén De la Mora
