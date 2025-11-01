import { Request, Response } from 'express';
import FileProcessService from '../../services/FileProcessService';
import { prisma } from '../../utils/prisma.utils';
import { successResponse, errorResponse } from '../../utils/response.utils';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const fileProcessService = new FileProcessService(prisma);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  },
});

/**
 * File Process Controller
 * Handles file upload and background processing
 */
export default class FileProcessController {
  /**
   * Get multer middleware for file upload
   */
  static getUploadMiddleware() {
    return upload.single('file');
  }

  /**
   * Upload and process Excel file
   * POST /file-process/upload
   */
  static async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      if (!req.file) {
        res.status(400).json(errorResponse('File is required'));
        return;
      }

      
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      const fileProcess = await fileProcessService.initiateProcessing({
        userId: req.user.userId,
        fileName: req.file.originalname,
        fileUrl,
      });

      res.status(200).json(
        successResponse(
          fileProcess,
          'File uploaded successfully. Processing started in background.'
        )
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to upload file'));
    }
  }

  /**
   * Process file from URL (alternative to upload)
   * POST /file-process/process-url
   */
  static async processFromUrl(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { fileUrl, fileName } = req.body;

      if (!fileUrl) {
        res.status(400).json(errorResponse('fileUrl is required'));
        return;
      }

      
      try {
        new URL(fileUrl);
      } catch {
        res.status(400).json(errorResponse('Invalid URL format'));
        return;
      }

      const fileProcess = await fileProcessService.initiateProcessing({
        userId: req.user.userId,
        fileName: fileName || 'file.xlsx',
        fileUrl,
      });

      res.status(200).json(
        successResponse(
          fileProcess,
          'File processing started in background.'
        )
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to process file'));
    }
  }

  /**
   * Get all file processes with filtering and pagination
   * GET /file-process
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const result = await fileProcessService.getFileProcesses(
        req.user.userId,
        req.query
      );

      res.status(200).json(
        successResponse(result, 'File processes retrieved successfully')
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to get file processes'));
    }
  }

  /**
   * Get single file process by ID
   * GET /file-process/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { id } = req.params;
      const fileProcess = await fileProcessService.getById(id, req.user.userId);

      if (!fileProcess) {
        res.status(404).json(errorResponse('File process not found'));
        return;
      }

      res.status(200).json(
        successResponse(fileProcess, 'File process retrieved successfully')
      );
    } catch (error: any) {
      res.status(500).json(errorResponse('Failed to get file process'));
    }
  }

  /**
   * Retry failed file processing
   * POST /file-process/:id/retry
   */
  static async retry(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { id } = req.params;
      const fileProcess = await fileProcessService.retryProcessing(
        id,
        req.user.userId
      );

      res.status(200).json(
        successResponse(fileProcess, 'File processing restarted')
      );
    } catch (error: any) {
      if (
        error.message === 'File process not found or access denied' ||
        error.message === 'Only failed processes can be retried'
      ) {
        res.status(400).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to retry processing'));
      }
    }
  }

  /**
   * Get products from a file process
   * GET /file-process/:id/products
   */
  static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Authentication required'));
        return;
      }

      const { id } = req.params;
      const result = await fileProcessService.getProducts(
        id,
        req.user.userId,
        req.query
      );

      res.status(200).json(
        successResponse(result, 'Products retrieved successfully')
      );
    } catch (error: any) {
      if (error.message === 'File process not found or access denied') {
        res.status(404).json(errorResponse(error.message));
      } else {
        res.status(500).json(errorResponse('Failed to get products'));
      }
    }
  }
}
