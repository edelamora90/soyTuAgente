// web/src/app/core/models/post.model.ts
export interface PostDto {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentMd?: string | null;
  img?: string | null;
  assets: string[];
  topic: string;
  tag?: string | null;
  author: string;
  readMinutes?: number | null;
  externalUrl?: string | null;
  isFeatured: boolean;
  published: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// payloads que manda el editor
export interface CreatePostPayload {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  contentMd?: string | null;
  img?: string | null;
  assets?: string[];
  topic: string;
  tag?: string | null;
  author: string;
  readMinutes?: number | null;
  externalUrl?: string | null;
  isFeatured?: boolean;
  published?: boolean;
  publishedAt?: string | null;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;
