import { Router } from 'express';
import FileProcessController from '../controllers/rest/FileProcessController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * File Process Routes
 * Base path: /file-process
 * All routes require authentication
 */


router.use(authMiddleware);


router.post(
  '/upload',
  FileProcessController.getUploadMiddleware(),
  FileProcessController.uploadFile
);


router.post('/process-url', FileProcessController.processFromUrl);


router.get('/', FileProcessController.getAll);


router.get('/:id', FileProcessController.getById);


router.post('/:id/retry', FileProcessController.retry);


router.get('/:id/products', FileProcessController.getProducts);

export default router;
