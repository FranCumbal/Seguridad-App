import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const entrevistasRouter = Router();
entrevistasRouter.use(authMiddleware);

// Generar código único de entrevista
const generarCodigo = () => {
  const year = new Date().getFullYear();
  const short = uuidv4().split('-')[0].toUpperCase();
  return `ENT-${year}-${short}`;
};

// GET /api/entrevistas
entrevistasRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, estado, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (estado) where.estado = estado;
    if (search) {
      where.OR = [
        { codigo: { contains: String(search) } },
        { datos_personales: { nombres: { contains: String(search) } } },
        { datos_personales: { apellidos: { contains: String(search) } } },
        { datos_personales: { cedula: { contains: String(search) } } },
      ];
    }

    const [total, entrevistas] = await Promise.all([
      prisma.entrevista.count({ where }),
      prisma.entrevista.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          datos_personales: {
            // Aquí está el cambio principal
            select: { nombres: true, apellidos: true, cedula: true, cargo_postula: true },
          },
          entrevistadores: {
            include: {
              entrevistador: { select: { nombre_completo: true, cargo: true, fotografia: true } },
            },
          },
          validaciones: { select: { resultado_general: true, calificacion: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: entrevistas,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener entrevistas' });
  }
});

// GET /api/entrevistas/:id (completa actualizada)
entrevistasRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevista = await prisma.entrevista.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        entrevistadores: { include: { entrevistador: true }, orderBy: { orden: 'asc' } },
        datos_personales: true, familia: true, estudios: true,
        historial_laboral: true, drogas_alcohol: true, judicial: true, infiltracion: true, validaciones: true,
        // Traemos finanzas con sus listas anidadas
        finanzas: {
          include: { bienes_inmuebles: true, vehiculos: true, creditos: true, deudas_personales: true, reportes_negativos: true }
        },
      },
    });
    if (!entrevista) { res.status(404).json({ success: false, message: 'Entrevista no encontrada' }); return; }
    res.json({ success: true, data: entrevista });
  } catch (error) { res.status(500).json({ success: false, message: 'Error al obtener entrevista' }); }
});

// PUT /api/entrevistas/:id/finanzas
entrevistasRouter.put('/:id/finanzas', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { id, entrevistaId: _, bienes_inmuebles, vehiculos, creditos, deudas_personales, reportes_negativos, ...datosLimpios } = req.body;

    const limpiarLista = (arr: any[]) => arr ? arr.map(({ key, id, finanzasId, ...rest }) => rest) : [];

    const resultado = await prisma.finanzas.upsert({
      where: { entrevistaId },
      update: {
        ...datosLimpios,
        bienes_inmuebles: { deleteMany: {}, create: limpiarLista(bienes_inmuebles) as any },
        vehiculos: { deleteMany: {}, create: limpiarLista(vehiculos) as any },
        creditos: { deleteMany: {}, create: limpiarLista(creditos) as any },
        deudas_personales: { deleteMany: {}, create: limpiarLista(deudas_personales) as any },
        reportes_negativos: { deleteMany: {}, create: limpiarLista(reportes_negativos) as any },
      },
      create: {
        ...datosLimpios,
        entrevistaId,
        bienes_inmuebles: { create: limpiarLista(bienes_inmuebles) as any },
        vehiculos: { create: limpiarLista(vehiculos) as any },
        creditos: { create: limpiarLista(creditos) as any },
        deudas_personales: { create: limpiarLista(deudas_personales) as any },
        reportes_negativos: { create: limpiarLista(reportes_negativos) as any },
      },
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar finanzas' });
  }
});

// PUT /api/entrevistas/:id/datos-personales
entrevistasRouter.put('/:id/datos-personales', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    // Limpiamos id para evitar el error de IDENTITY en SQL Server
    const { id, entrevistaId: _, ...datosLimpios } = req.body;

    const resultado = await prisma.datosPersonales.upsert({
      where: { entrevistaId },
      update: datosLimpios,
      create: { 
        ...datosLimpios, 
        entrevistaId 
      },
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar datos personales' });
  }
});

// PUT /api/entrevistas/:id/familia
entrevistasRouter.put('/:id/familia', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { conviveCon, calificacionFamilia, familiares } = req.body;

    await prisma.entrevista.update({
      where: { id: entrevistaId },
      data: {
        conviveCon: conviveCon,
        calificacionFamilia: calificacionFamilia
      }
    });

    await prisma.familia.deleteMany({ where: { entrevistaId } });
    
    let resultado: any = null; 
    
    if (familiares && familiares.length > 0) {
      resultado = await prisma.familia.createMany({
        data: familiares.map((f: any) => {
          const { key, id, ...datosLimpios } = f;
          
          return { 
            ...datosLimpios, 
            entrevistaId 
          };
        }),
      });
    }
    
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error en ruta familia:', error);
    res.status(500).json({ success: false, message: 'Error al guardar familia' });
  }
});

// PUT /api/entrevistas/:id/estudios
entrevistasRouter.put('/:id/estudios', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { estudios } = req.body;

    await prisma.estudio.deleteMany({ where: { entrevistaId } });
    
    const result = await prisma.estudio.createMany({
      data: estudios.map((e: any) => {
        // Extraemos 'key' y 'id' para ignorarlos
        const { key, id, ...datosLimpios } = e;
        
        return {
          ...datosLimpios,
          entrevistaId
        };
      }),
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar estudios' });
  }
});

// PUT /api/entrevistas/:id/finanzas
entrevistasRouter.put('/:id/finanzas', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { id, entrevistaId: _, ...datosLimpios } = req.body;

    const resultado = await prisma.finanzas.upsert({
      where: { entrevistaId },
      update: datosLimpios,
      create: { 
        ...datosLimpios, 
        entrevistaId 
      },
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar finanzas' });
  }
});

// PUT /api/entrevistas/:id/historial-laboral
entrevistasRouter.put('/:id/historial-laboral', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { trabajos } = req.body;

    await prisma.historialLaboral.deleteMany({ where: { entrevistaId } });
    
    const result = await prisma.historialLaboral.createMany({
      data: trabajos.map((t: any) => {
        // Extraemos 'key' e 'id' para que Prisma no intente guardarlos
        const { key, id, ...datosLimpios } = t;
        
        return {
          ...datosLimpios,
          entrevistaId
        };
      }),
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar historial laboral' });
  }
});

// PUT /api/entrevistas/:id/drogas-alcohol
entrevistasRouter.put('/:id/drogas-alcohol', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { id, entrevistaId: _, ...datosLimpios } = req.body;

    const resultado = await prisma.drogasAlcohol.upsert({
      where: { entrevistaId },
      update: datosLimpios,
      create: { 
        ...datosLimpios, 
        entrevistaId 
      },
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar registro de drogas/alcohol' });
  }
});

// PUT /api/entrevistas/:id/judicial
entrevistasRouter.put('/:id/judicial', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { id, entrevistaId: _, ...datosLimpios } = req.body;

    const resultado = await prisma.judicial.upsert({
      where: { entrevistaId },
      update: datosLimpios,
      create: { 
        ...datosLimpios, 
        entrevistaId 
      },
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar antecedentes judiciales' });
  }
});

// PUT /api/entrevistas/:id/infiltracion
entrevistasRouter.put('/:id/infiltracion', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { id, entrevistaId: _, ...datosLimpios } = req.body;

    const resultado = await prisma.infiltracion.upsert({
      where: { entrevistaId },
      update: datosLimpios,
      create: { 
        ...datosLimpios, 
        entrevistaId 
      },
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar riesgo de infiltración' });
  }
});

// PUT /api/entrevistas/:id/validaciones
entrevistasRouter.put('/:id/validaciones', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    
    // Extraemos 'id' y 'entrevistaId' para que no contaminen el UPDATE de SQL Server
    const { id, entrevistaId: _, ...datosLimpios } = req.body;

    const resultado = await prisma.validaciones.upsert({
      where: { entrevistaId },
      update: datosLimpios, 
      create: { 
        ...datosLimpios, 
        entrevistaId 
      },
    });

    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al guardar validaciones' });
  }
});

// DELETE /api/entrevistas/:id
entrevistasRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.entrevista.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Entrevista eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar entrevista' });
  }
});
