import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';

export const getPublicFaqs = async (req: Request, res: Response) => {
  try {
    const faqs = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ],
      take: 5
    });
    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error('Error fetching public FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAdminFaqs = async (req: Request, res: Response) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    res.json({ success: true, data: faqs, totalCount: faqs.length, maxLimit: 5 });
  } catch (error) {
    console.error('Error fetching admin FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer, isActive = true } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }
    if (!answer || !String(answer).trim()) {
      return res.status(400).json({ success: false, message: 'Answer is required' });
    }

    const currentCount = await prisma.faq.count();
    if (currentCount >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum limit of 5 FAQs reached. You cannot add more than 5 FAQs. Please edit or delete an existing one.' 
      });
    }

    const newFaq = await prisma.faq.create({
      data: {
        question: String(question).trim(),
        answer: String(answer).trim(),
        order: currentCount,
        isActive: Boolean(isActive)
      }
    });

    res.status(201).json({ success: true, data: newFaq });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { question, answer, isActive, order } = req.body;

    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    const updated = await prisma.faq.update({
      where: { id },
      data: {
        ...(question !== undefined ? { question: String(question).trim() } : {}),
        ...(answer !== undefined ? { answer: String(answer).trim() } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(order !== undefined ? { order: Number(order) } : {})
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    await prisma.faq.delete({ where: { id } });

    // Re-index orders
    const remaining = await prisma.faq.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i) {
        await prisma.faq.update({
          where: { id: remaining[i].id },
          data: { order: i }
        });
      }
    }

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const reorderFaqs = async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { id: string, order: number }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }

    for (const item of items) {
      if (item.id && typeof item.order === 'number') {
        await prisma.faq.update({
          where: { id: item.id },
          data: { order: item.order }
        });
      }
    }

    res.json({ success: true, message: 'FAQs reordered successfully' });
  } catch (error) {
    console.error('Error reordering FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
