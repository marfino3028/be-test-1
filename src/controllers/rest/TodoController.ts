import { Request, Response } from 'express';
import TodoService from '../../services/TodoService';
import { prisma } from '../../utils/prisma.utils';
import { successResponse, errorResponse } from '../../utils/response.utils';
import { TodoStatus } from '@prisma/client';

const todoService = new TodoService(prisma);

/**
 * Todo Controller
 * Handles todo-related HTTP requests
 */
export default class TodoController {
  /**
   * Create a new todo
   * POST /todos
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { task } = req.body;

      if (!task || task.trim() === '') {
        res.status(400).json(errorResponse('Task is required'));
        return;
      }

      const todo = await todoService.create({
        userId: req.user.userId,
        task: task.trim(),
      });

      res.status(201).json(
        successResponse(todo, 'Todo created successfully')
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to create todo'));
    }
  }

  /**
   * Get all todos with filtering and pagination
   * GET /todos
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const result = await todoService.getTodos(req.user.userId, req.query);

      res.status(200).json(
        successResponse(result, 'Todos retrieved successfully')
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to get todos'));
    }
  }

  /**
   * Get single todo by ID
   * GET /todos/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { id } = req.params;
      const todo = await todoService.getById(id, req.user.userId);

      if (!todo) {
        res.status(404).json(errorResponse('Todo not found'));
        return;
      }

      res.status(200).json(
        successResponse(todo, 'Todo retrieved successfully')
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to get todo'));
    }
  }

  /**
   * Update todo
   * PATCH /todos/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { id } = req.params;
      const { task, status } = req.body;

      if (status && !Object.values(TodoStatus).includes(status)) {
        res.status(400).json(
          errorResponse('Invalid status. Must be PENDING or SUCCESS')
        );
        return;
      }

      const updateData: any = {};
      if (task !== undefined) updateData.task = task.trim();
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json(
          errorResponse('No update data provided')
        );
        return;
      }

      const todo = await todoService.update(id, req.user.userId, updateData);

      res.status(200).json(
        successResponse(todo, 'Todo updated successfully')
      );
    } catch (error: any) {
      if (error.message === 'Todo not found or access denied') {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to update todo'));
      }
    }
  }

  /**
   * Delete todo
   * DELETE /todos/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { id } = req.params;
      await todoService.delete(id, req.user.userId);

      res.status(200).json(
        successResponse(null, 'Todo deleted successfully')
      );
    } catch (error: any) {
      if (error.message === 'Todo not found or access denied') {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to delete todo'));
      }
    }
  }

  /**
   * Delete multiple todos
   * POST /todos/delete-multiple
   */
  static async deleteMultiple(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json(
          errorResponse('ids must be a non-empty array')
        );
        return;
      }

      const count = await todoService.deleteMultiple(ids, req.user.userId);

      res.status(200).json(
        successResponse(
          { deletedCount: count },
          `${count} todo(s) deleted successfully`
        )
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to delete todos'));
    }
  }
}
