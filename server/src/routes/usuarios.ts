import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware, requireRol, AuthRequest } from '../middleware/auth';

export const usuariosRouter = Router();
usuariosRouter.use(authMiddleware);

// GET /api/usuarios
usuariosRouter.get('/', requireRol('ADMINISTRADOR', 'SUPERVISOR'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, username: true, nombre: true, apellido: true, email: true, rol: true, activo: true, createdAt: true },
      orderBy: { nombre: 'asc' },
    });
    res.json({ success: true, data: usuarios });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});

// POST /api/usuarios
usuariosRouter.post(
  '/',
  requireRol('ADMINISTRADOR'),
  [
    body('username').trim().notEmpty().isLength({ min: 4 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('nombre').trim().notEmpty(),
    body('apellido').trim().notEmpty(),
    body('rol').isIn(['ADMINISTRADOR', 'SUPERVISOR', 'ENTREVISTADOR']),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      const { username, email, password, nombre, apellido, rol } = req.body;
      const password_hash = await bcrypt.hash(password, 12);
      const usuario = await prisma.usuario.create({
        data: { username, email, password_hash, nombre, apellido, rol },
        select: { id: true, username: true, nombre: true, apellido: true, email: true, rol: true },
      });
      res.status(201).json({ success: true, data: usuario });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({ success: false, message: 'Usuario o email ya existe' });
        return;
      }
      res.status(500).json({ success: false, message: 'Error al crear usuario' });
    }
  }
);

// PUT /api/usuarios/:id
usuariosRouter.put('/:id', requireRol('ADMINISTRADOR'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, rol, activo, password } = req.body;
    const data: any = { nombre, apellido, email, rol, activo };
    if (password) data.password_hash = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, username: true, nombre: true, apellido: true, email: true, rol: true, activo: true },
    });
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
});

// DELETE /api/usuarios/:id
usuariosRouter.delete('/:id', requireRol('ADMINISTRADOR'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (Number(req.params.id) === req.usuario!.id) {
      res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario' });
      return;
    }
    await prisma.usuario.update({ where: { id: Number(req.params.id) }, data: { activo: false } });
    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
  }
});
