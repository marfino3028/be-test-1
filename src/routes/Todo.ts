import { Router } from 'express';
import TodoController from '../controllers/rest/TodoController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Todo Routes
 * Base path: /todos
 * All routes require authentication
 */

router.use(authMiddleware);

router.post('/', TodoController.create);

router.get('/', TodoController.getAll);

router.get('/:id', TodoController.getById);

router.patch('/:id', TodoController.update);

router.delete('/:id', TodoController.delete);

router.post('/delete-multiple', TodoController.deleteMultiple);

export default router;
