//web/src/app/pages/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { PostFormComponent } from './post-form/post-form.component';

export const ADMIN_ROUTES: Routes = [
  { path: 'posts/new', component: PostFormComponent },
  { path: 'posts/edit/:id', component: PostFormComponent },
];
