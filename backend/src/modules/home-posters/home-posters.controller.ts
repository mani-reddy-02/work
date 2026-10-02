import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';

export const getAdminPosters = async (req: Request, res: Response) => {
  try {
    const posters = await prisma.homePagePoster.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    res.json({ success: true, data: posters });
  } catch (error) {
    console.error('Error fetching admin posters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPublicPosters = async (req: Request, res: Response) => {
  try {
    const posters = await prisma.homePagePoster.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    res.json({ success: true, data: posters });
  } catch (error) {
    console.error('Error fetching public posters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createPoster = async (req: Request, res: Response) => {
  try {
    const { imageUrl, buttonAction, isActive } = req.body;
    
    const count = await prisma.homePagePoster.count();
    
    const newPoster = await prisma.homePagePoster.create({
      data: {
        imageUrl: imageUrl || '',
        buttonAction: buttonAction || '',
        isActive: isActive !== undefined ? isActive : true,
        isDefault: false,
        displayOrder: count + 1
      }
    });
    
    res.status(201).json({ success: true, data: newPoster });
  } catch (error) {
    console.error('Error creating poster:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePoster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl, buttonAction, isActive } = req.body;
    
    const existing = await prisma.homePagePoster.findUnique({ where: { id: id as string } });
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    
    let updateData: any = { isActive };
    
    if (!existing.isDefault) {
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (buttonAction !== undefined) updateData.buttonAction = buttonAction;
    }
    
    const updated = await prisma.homePagePoster.update({
      where: { id: id as string },
      data: updateData
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating poster:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePosterStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const updated = await prisma.homePagePoster.update({
      where: { id: id as string },
      data: { isActive }
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating poster status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deletePoster = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.homePagePoster.findUnique({ where: { id: id as string } });
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (existing.isDefault) {
      return res.status(403).json({ success: false, message: 'Cannot delete default posters' });
    }
    
    await prisma.homePagePoster.delete({ where: { id: id as string } });
    
    res.json({ success: true, message: 'Poster deleted' });
  } catch (error) {
    console.error('Error deleting poster:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const reorderPosters = async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { id, displayOrder }
    
    // Process sequentially or use transaction
    for (const item of items) {
      if (item.id && typeof item.displayOrder === 'number') {
        await prisma.homePagePoster.update({
          where: { id: item.id as string },
          data: { displayOrder: item.displayOrder }
        });
      }
    }
    
    res.json({ success: true, message: 'Posters reordered' });
  } catch (error) {
    console.error('Error reordering posters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
