import { Router } from 'express';
import TodoController from '../controllers/rest/TodoController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Todo Routes
 * Base path: /todos
 * All routes require authentication
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /todos - Create new todo
router.post('/', TodoController.create);

// GET /todos - Get all todos with filtering and pagination
router.get('/', TodoController.getAll);

// GET /todos/:id - Get single todo
router.get('/:id', TodoController.getById);

// PATCH /todos/:id - Update todo
router.patch('/:id', TodoController.update);

// DELETE /todos/:id - Delete todo
router.delete('/:id', TodoController.delete);

// POST /todos/delete-multiple - Delete multiple todos
router.post('/delete-multiple', TodoController.deleteMultiple);

export default router;
