import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ruta donde se guardarán las imágenes del BLOG
const UPLOAD_DIR = join(__dirname, '../../../uploads/blog');

// Aseguramos que la carpeta exista
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const blogMulterConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}.${ext}`);
    },
  }),
};
