import { Service } from '../entities/Service';
import { PrismaClient, Todo, TodoStatus } from '@prisma/client';
import { FilterQueryV2 } from './helpers/FilterQueryV2';

export interface CreateTodoDTO {
  userId: string;
  task: string;
}

export interface UpdateTodoDTO {
  task?: string;
  status?: TodoStatus;
}

/**
 * Todo Service
 * Handles todo CRUD operations with filtering and pagination
 */
export default class TodoService extends Service {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * Create a new todo
   */
  async create(data: CreateTodoDTO): Promise<Todo> {
    return this.prisma.todo.create({
      data: {
        userId: data.userId,
        task: data.task,
        status: TodoStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get todos with filtering and pagination
   */
  async getTodos(userId: string, queryParams: any) {
    // Build base where clause
    const baseWhere = { userId };

    // Use FilterQueryV2 to handle filtering, searching, and pagination
    const filterQuery = new FilterQueryV2(
      queryParams,
      this.prisma.todo,
      baseWhere
    );

    const result = await filterQuery.execute();
    return result;
  }

  /**
   * Get single todo by ID
   */
  async getById(id: string, userId: string): Promise<Todo | null> {
    return this.prisma.todo.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update todo
   */
  async update(
    id: string,
    userId: string,
    data: UpdateTodoDTO
  ): Promise<Todo> {
    // Check if todo exists and belongs to user
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!todo) {
      throw new Error('Todo not found or access denied');
    }

    return this.prisma.todo.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete todo
   */
  async delete(id: string, userId: string): Promise<void> {
    // Check if todo exists and belongs to user
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!todo) {
      throw new Error('Todo not found or access denied');
    }

    await this.prisma.todo.delete({
      where: { id },
    });
  }

  /**
   * Delete multiple todos
   */
  async deleteMultiple(ids: string[], userId: string): Promise<number> {
    const result = await this.prisma.todo.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return result.count;
  }
}
