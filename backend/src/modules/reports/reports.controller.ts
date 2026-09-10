import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads/reports');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const getReports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const reports = await prisma.patientReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

const uploadSchema = z.object({
  title: z.string(),
  hospital: z.string(),
  doctor: z.string().optional(),
  date: z.string(),
  pages: z.string().optional().default('1 page'),
  status: z.string().optional().default('Normal'),
  summary: z.string().optional(),
  fileData: z.string(), // Base64 encoded string
  fileName: z.string(),
});

export const uploadReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const validatedData = uploadSchema.parse(req.body);
    
    // Process base64 file data
    // Format is typically "data:application/pdf;base64,JVBERi..."
    const matches = validatedData.fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid file data format' });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    const safeFileName = `${Date.now()}-${validatedData.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    
    fs.writeFileSync(filePath, fileBuffer);

    const newReport = await prisma.patientReport.create({
      data: {
        userId,
        title: validatedData.title,
        hospital: validatedData.hospital,
        doctor: validatedData.doctor,
        date: validatedData.date,
        pages: validatedData.pages,
        status: validatedData.status,
        summary: validatedData.summary,
        fileUrl: `/uploads/reports/${safeFileName}`,
      },
    });

    res.status(201).json({ success: true, data: newReport });
  } catch (error) {
    console.error('Error uploading report:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.flatten() });
    }
    res.status(500).json({ success: false, message: 'Failed to upload report' });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const reportId = req.params.id as string;
    
    const report = await prisma.patientReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this report' });
    }

    // Delete physical file if exists
    if (report.fileUrl) {
      const fileName = path.basename(report.fileUrl);
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.patientReport.delete({
      where: { id: reportId },
    });

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const reportId = req.params.id as string;
    
    const report = await prisma.patientReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this report' });
    }

    if (!report.fileUrl) {
      return res.status(404).json({ success: false, message: 'Report file not found' });
    }

    const fileName = path.basename(report.fileUrl);
    const filePath = path.join(UPLOADS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file missing on server' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ success: false, message: 'Failed to download report' });
  }
};
