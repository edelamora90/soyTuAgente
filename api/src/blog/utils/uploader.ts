import { diskStorage } from 'multer';
import { extname } from 'path';

export const blogMulterConfig = {
  storage: diskStorage({
    destination: './public/uploads/blog',
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  }),
};

export const blogAssetsMulterConfig = blogMulterConfig;
