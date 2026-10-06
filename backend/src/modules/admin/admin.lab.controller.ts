import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getLabs = async (req: any, res: any, next: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const type = req.query.type as string;
    const place = req.query.place as string;
    const hospitalId = req.query.hospitalId as string;

    const where: any = { AND: [] };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
          { hospital: { name: { contains: search, mode: 'insensitive' } } },
          { city: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { contactPhone: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (place && place !== 'ALL') {
      where.AND.push({
        OR: [
          { city: { contains: place, mode: 'insensitive' } },
          { address: { contains: place, mode: 'insensitive' } }
        ]
      });
    }

    if (hospitalId && hospitalId !== 'ALL') {
      where.hospitalId = hospitalId;
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const totalCount = await prisma.lab.count({ where });

    const labs = await prisma.lab.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        hospital: { select: { name: true } }
      }
    });

    const formatted = labs.map((l: any) => ({
      id: l.id.substring(0, 8).toUpperCase(),
      rawId: l.id,
      name: l.name,
      type: l.type,
      hospitalName: l.hospital?.name || 'Standalone',
      location: l.city ? `${l.address ? l.address + ', ' : ''}${l.city}` : (l.address || '—'),
      contactPhone: l.contactPhone,
      status: l.status,
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLabById = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const lab = await prisma.lab.findUnique({
      where: { id },
      include: {
        hospital: true,
      }
    });

    if (!lab) {
      return res.status(404).json({ success: false, message: 'Lab not found' });
    }

    res.json({ success: true, data: lab });
  } catch (error) {
    next(error);
  }
};

export const createLab = async (req: any, res: any, next: any) => {
  try {
    const {
      name,
      type,
      hospitalId,
      contactPhone,
      email,
      address,
      city,
      state,
      pinCode,
      description,
      status
    } = req.body;

    const newLab = await prisma.lab.create({
      data: {
        name,
        type: type || 'STANDALONE',
        hospitalId: type === 'HOSPITAL_BASED' ? hospitalId : null,
        contactPhone,
        email,
        address,
        city,
        state,
        pinCode,
        description,
        status: status || 'Active'
      }
    });

    res.json({ success: true, data: newLab, message: 'Lab created successfully' });
  } catch (error) {
    next(error);
  }
};
