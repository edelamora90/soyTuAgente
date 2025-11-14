export interface Post {
  id: string;
  title: string;
  slug: string;
  img?: string;
  tag?: string;
  readMinutes?: number;
  topic?: string;
  date?: string;
  published?: boolean;
  publishedAt?: string;
  contentMd?: string;
  content?: string;
  externalUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type NewPost = Partial<Omit<Post, 'id' | 'publishedAt'>>;
