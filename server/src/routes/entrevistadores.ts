import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const entrevistadoresRouter = Router();
entrevistadoresRouter.use(authMiddleware);

// Configuración de multer para fotos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../uploads/entrevistadores');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `entrevistador-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
    }
  },
});

// GET /api/entrevistadores
entrevistadoresRouter.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistadores = await prisma.entrevistador.findMany({
      orderBy: { nombre_completo: 'asc' },
    });
    res.json({ success: true, data: entrevistadores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener entrevistadores' });
  }
});

// GET /api/entrevistadores/:id
entrevistadoresRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistador = await prisma.entrevistador.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        entrevistas_asignadas: {
          include: { entrevista: { select: { id: true, codigo: true, fecha_entrevista: true, estado: true } } },
        },
      },
    });
    if (!entrevistador) {
      res.status(404).json({ success: false, message: 'Entrevistador no encontrado' });
      return;
    }
    res.json({ success: true, data: entrevistador });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener entrevistador' });
  }
});

// POST /api/entrevistadores
entrevistadoresRouter.post(
  '/',
  upload.single('fotografia'),
  [
    body('nombre_completo').trim().notEmpty().withMessage('Nombre completo requerido'),
    body('cargo').trim().notEmpty().withMessage('Cargo requerido'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      const { nombre_completo, cargo, activo } = req.body;
      const fotografia = req.file
        ? `/uploads/entrevistadores/${req.file.filename}`
        : null;

      const entrevistador = await prisma.entrevistador.create({
        data: { nombre_completo, cargo, fotografia, activo: activo !== 'false' },
      });
      res.status(201).json({ success: true, data: entrevistador });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al crear entrevistador' });
    }
  }
);

// PUT /api/entrevistadores/:id
entrevistadoresRouter.put(
  '/:id',
  upload.single('fotografia'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { nombre_completo, cargo, activo } = req.body;
      const data: any = { nombre_completo, cargo, activo: activo !== 'false' };

      if (req.file) {
        data.fotografia = `/uploads/entrevistadores/${req.file.filename}`;
      }

      const entrevistador = await prisma.entrevistador.update({
        where: { id: Number(req.params.id) },
        data,
      });
      res.json({ success: true, data: entrevistador });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar entrevistador' });
    }
  }
);

// DELETE /api/entrevistadores/:id
entrevistadoresRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.entrevistador.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Entrevistador eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar entrevistador' });
  }
});
