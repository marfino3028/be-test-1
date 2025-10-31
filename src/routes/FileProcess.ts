import { Router } from 'express';
import FileProcessController from '../controllers/rest/FileProcessController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * File Process Routes
 * Base path: /file-process
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /file-process/upload - Upload and process Excel file
router.post(
  '/upload',
  FileProcessController.getUploadMiddleware(),
  FileProcessController.uploadFile
);

// POST /file-process/process-url - Process Excel file from URL
router.post('/process-url', FileProcessController.processFromUrl);

// GET /file-process - Get all file processes with filtering and pagination
router.get('/', FileProcessController.getAll);

// GET /file-process/:id - Get single file process
router.get('/:id', FileProcessController.getById);

// POST /file-process/:id/retry - Retry failed processing
router.post('/:id/retry', FileProcessController.retry);

// GET /file-process/:id/products - Get products from file process
router.get('/:id/products', FileProcessController.getProducts);

export default router;
