import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Inicializa el entorno de pruebas para Angular
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Encuentra y carga todos los tests (*.spec.ts) bajo src/
const context = (require as any).context('./', true, /\.spec\.ts$/);
context.keys().forEach(context);