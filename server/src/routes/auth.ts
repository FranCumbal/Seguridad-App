import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// =============================================
// POST /api/auth/login
// =============================================
authRouter.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Usuario requerido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { username, password } = req.body;

      const usuario = await prisma.usuario.findFirst({
        where: {
          OR: [{ username }, { email: username }],
          activo: true,
        },
      });

      if (!usuario) {
        res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        return;
      }

      const passwordValida = await bcrypt.compare(password, usuario.password_hash);
      if (!passwordValida) {
        res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        return;
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      const token = jwt.sign(
        { id: usuario.id, username: usuario.username, rol: usuario.rol },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '8h' }
      );

      await prisma.sesion.create({
        data: { usuarioId: usuario.id, token, expiresAt },
      });

      res.json({
        success: true,
        data: {
          token,
          usuario: {
            id: usuario.id,
            username: usuario.username,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol,
          },
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
    }
  }
);

// =============================================
// POST /api/auth/logout
// =============================================
authRouter.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await prisma.sesion.deleteMany({ where: { token } });
    }
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
  }
});

// =============================================
// GET /api/auth/me
// =============================================
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario!.id },
      select: { id: true, username: true, nombre: true, apellido: true, email: true, rol: true },
    });
    res.json({ success: true, data: usuario });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
});
