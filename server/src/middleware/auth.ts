import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    username: string;
    rol: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    const sesion = await prisma.sesion.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { usuario: true },
    });

    if (!sesion || !sesion.usuario.activo) {
      res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
      return;
    }

    req.usuario = {
      id: sesion.usuario.id,
      username: sesion.usuario.username,
      rol: sesion.usuario.rol,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

export const requireRol = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      res.status(403).json({ success: false, message: 'Permisos insuficientes' });
      return;
    }
    next();
  };
};
