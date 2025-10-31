import { Service } from '../entities/Service';
import { PrismaClient, FileProcess, ProcessStatus, Product } from '@prisma/client';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { FilterQueryV2 } from './helpers/FilterQueryV2';

export interface ProcessFileDTO {
  userId: string;
  fileName: string;
  fileUrl: string;
}

interface ExcelRow {
  name?: string;
  category?: string;
  price?: number | string;
  stock?: number | string;
  description?: string;
}

/**
 * File Processing Service
 * Handles Excel file upload, background processing, and status tracking
 */
export default class FileProcessService extends Service {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * Initiate file processing
   * Creates a file process entry and starts background processing
   */
  async initiateProcessing(data: ProcessFileDTO): Promise<FileProcess> {
    // Create file process record with IN_PROGRESS status
    const fileProcess = await this.prisma.fileProcess.create({
      data: {
        userId: data.userId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        status: ProcessStatus.IN_PROGRESS,
      },
    });

    // Start background processing (non-blocking)
    this.processFileInBackground(fileProcess.id, data.fileUrl).catch((error) => {
      console.error(`Background processing failed for file ${fileProcess.id}:`, error);
    });

    return fileProcess;
  }

  /**
   * Process Excel file in background
   * This runs asynchronously without blocking the API response
   */
  private async processFileInBackground(
    fileProcessId: string,
    fileUrl: string
  ): Promise<void> {
    try {
      // Download file from URL
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
      });

      // Parse Excel file
      const workbook = XLSX.read(response.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

      const totalRows = rows.length;

      // Update total rows
      await this.prisma.fileProcess.update({
        where: { id: fileProcessId },
        data: { totalRows },
      });

      // Process rows in batches
      const batchSize = 100;
      let processedRows = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        // Prepare products data
        const products = batch
          .filter((row) => row.name && row.category && row.price)
          .map((row) => ({
            fileProcessId,
            name: String(row.name).trim(),
            category: String(row.category).trim(),
            price: parseFloat(String(row.price)),
            stock: row.stock ? parseInt(String(row.stock)) : 0,
            description: row.description ? String(row.description).trim() : null,
          }));

        // Bulk insert products
        if (products.length > 0) {
          await this.prisma.product.createMany({
            data: products,
            skipDuplicates: true,
          });
        }

        processedRows += batch.length;

        // Update progress
        await this.prisma.fileProcess.update({
          where: { id: fileProcessId },
          data: { processedRows },
        });

        // Small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Mark as completed
      await this.prisma.fileProcess.update({
        where: { id: fileProcessId },
        data: {
          status: ProcessStatus.COMPLETED,
          completedAt: new Date(),
          processedRows: totalRows,
        },
      });
    } catch (error: any) {
      // Mark as failed with error message
      await this.prisma.fileProcess.update({
        where: { id: fileProcessId },
        data: {
          status: ProcessStatus.FAILED,
          errorMessage: error.message || 'Unknown error occurred',
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Get file processes with filtering and pagination
   */
  async getFileProcesses(userId: string, queryParams: any) {
    const baseWhere = { userId };

    const filterQuery = new FilterQueryV2(
      queryParams,
      this.prisma.fileProcess,
      baseWhere
    );

    return filterQuery.execute();
  }

  /**
   * Get single file process by ID
   */
  async getById(id: string, userId: string): Promise<FileProcess | null> {
    return this.prisma.fileProcess.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Retry failed file processing
   */
  async retryProcessing(id: string, userId: string): Promise<FileProcess> {
    const fileProcess = await this.prisma.fileProcess.findFirst({
      where: { id, userId },
    });

    if (!fileProcess) {
      throw new Error('File process not found or access denied');
    }

    if (fileProcess.status !== ProcessStatus.FAILED) {
      throw new Error('Only failed processes can be retried');
    }

    // Reset status and counters
    const updated = await this.prisma.fileProcess.update({
      where: { id },
      data: {
        status: ProcessStatus.IN_PROGRESS,
        processedRows: 0,
        errorMessage: null,
        completedAt: null,
        startedAt: new Date(),
      },
    });

    // Delete old products
    await this.prisma.product.deleteMany({
      where: { fileProcessId: id },
    });

    // Start background processing again
    this.processFileInBackground(id, fileProcess.fileUrl).catch((error) => {
      console.error(`Retry processing failed for file ${id}:`, error);
    });

    return updated;
  }

  /**
   * Get products from a file process
   */
  async getProducts(fileProcessId: string, userId: string, queryParams: any) {
    // Verify file process belongs to user
    const fileProcess = await this.prisma.fileProcess.findFirst({
      where: { id: fileProcessId, userId },
    });

    if (!fileProcess) {
      throw new Error('File process not found or access denied');
    }

    const baseWhere = { fileProcessId };

    const filterQuery = new FilterQueryV2(
      queryParams,
      this.prisma.product,
      baseWhere
    );

    return filterQuery.execute();
  }
}
