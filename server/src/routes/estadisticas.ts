import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const estadisticasRouter = Router();
estadisticasRouter.use(authMiddleware);

// GET /api/estadisticas/dashboard
estadisticasRouter.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalEntrevistas,
      entrevistasHoy,
      entrevistasMes,
      porEstado,
      porResultado,
      recientes,
      entrevistadoresActivos,
    ] = await Promise.all([
      prisma.entrevista.count(),
      prisma.entrevista.count({
        where: {
          fecha_entrevista: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.entrevista.count({
        where: {
          fecha_entrevista: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.entrevista.groupBy({
        by: ['estado'],
        _count: { estado: true },
      }),
      prisma.validaciones.groupBy({
        by: ['resultado_general'],
        _count: { resultado_general: true },
      }),
      prisma.entrevista.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          datos_personales: { select: { nombres: true, apellidos: true, cargo_aplicar: true } },
          validaciones: { select: { resultado_general: true } },
        },
      }),
      prisma.entrevistador.count({ where: { activo: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totales: { totalEntrevistas, entrevistasHoy, entrevistasMes, entrevistadoresActivos },
        porEstado,
        porResultado,
        recientes,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});
