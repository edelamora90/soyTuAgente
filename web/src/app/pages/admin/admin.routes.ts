// web/src/app/pages/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { PostsAdminListComponent } from './blog/posts-admin-list.component';
import { PostEditorComponent } from './blog/post-editor.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'blog',
    children: [
      { path: '', component: PostsAdminListComponent },   // /admin/blog
      { path: 'new', component: PostEditorComponent },    // /admin/blog/new
      { path: ':id/edit', component: PostEditorComponent } // /admin/blog/:id/edit
    ],
  },
  // ...otras rutas admin que ya tengas
];
