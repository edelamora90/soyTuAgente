// web/src/app/pages/blog/blog.routes.ts
import { Routes } from '@angular/router';
import { BlogListComponent } from '../blog-list/blog-list.component';
import { BlogPostComponent } from '../blog-post/blog-post.component';
import { blogPostResolver } from '../blog-post/blog-post.resolver';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    component: BlogListComponent,      // /blog
  },
  {
    path: ':slug',
    component: BlogPostComponent,      // /blog/:slug
    resolve: {
      post: blogPostResolver,
    },
  },
];
