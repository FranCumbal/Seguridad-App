import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Prisma } from '@prisma/client';

// Helper de rutas para desarrollo y pkg (.exe)
const isPkg = typeof (process as any).pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : path.join(__dirname, '../../');

// ── Multer: fotos de candidatos ──────────────────────────────
const storageCandidatos = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(baseDir, 'uploads/candidatos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `candidato-${Date.now()}${ext}`);
  },
});
const uploadCandidato = multer({
  storage: storageCandidatos,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Solo imágenes JPG, PNG o WEBP'));
  },
});

// ── Multer: fotos de tatuajes ────────────────────────────────
const storageTatuajes = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(baseDir, 'uploads/tatuajes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `tatuaje-${Date.now()}${ext}`);
  },
});
const uploadTatuaje = multer({
  storage: storageTatuajes,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Solo imágenes JPG, PNG o WEBP'));
  },
});

// --- HELPER: Limpieza de archivos físicos ---
const borrarArchivoFisico = (rutaRelativa: string | null) => {
  if (!rutaRelativa) return;
  // Eliminamos el '/' inicial si existe para evitar problemas de path.join en Windows
  const rutaLimpia = rutaRelativa.startsWith('/') ? rutaRelativa.slice(1) : rutaRelativa;
  const filePath = path.join(baseDir, rutaLimpia);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (err) { console.error(err); }
  }
};

// --- HELPER: Manejo de Errores de BD ---
const handlePrismaError = (error: any, res: Response, defaultMessage: string) => {
  console.error(`[API Error]: ${defaultMessage}`, error);
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Código P2000: El texto excede el VarChar
    if (error.code === 'P2000') {
      const columna = error.meta?.column_name || 'un campo';
      return res.status(400).json({ 
        success: false, 
        message: `El texto ingresado es demasiado largo para ${columna}. Por favor, resúmalo.` 
      });
    }
    // Código P2002: Violación de restricción única (ej. código duplicado)
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: `Ya existe un registro con este dato único. Verifique que no haya duplicados.` 
      });
    }
  }
  
  res.status(500).json({ success: false, message: defaultMessage });
};

export const entrevistasRouter = Router();
entrevistasRouter.use(authMiddleware);

// Generar código único de entrevista
const generarCodigo = () => {
  const year = new Date().getFullYear();
  const short = uuidv4().split('-')[0].toUpperCase();
  return `ENT-${year}-${short}`;
};

// POST /api/entrevistas
entrevistasRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entrevistadorIds, observaciones_iniciales } = req.body;

    if (!entrevistadorIds || entrevistadorIds.length === 0) {
      res.status(400).json({ success: false, message: 'Debe seleccionar al menos un entrevistador' });
      return;
    }

    const nuevaEntrevista = await prisma.entrevista.create({
      data: {
        codigo: generarCodigo(),
        observaciones_iniciales: observaciones_iniciales || null,
        // Conectamos los entrevistadores seleccionados usando la tabla intermedia
        entrevistadores: {
          create: entrevistadorIds.map((id: number, index: number) => ({
            entrevistadorId: id,
            orden: index + 1, // Guardamos el orden en el que fueron seleccionados
          })),
        },
      },
    });

    res.status(201).json({ success: true, data: nuevaEntrevista });
  } catch (error) {
    console.error('Error al crear entrevista:', error);
    res.status(500).json({ success: false, message: 'Error al crear la entrevista' });
  }
});

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
        datos_personales: true, 
        familia: true, 
        estudios: true,
        drogas_alcohol: true, 
        judicial: true, 
        infiltracion: {
          include: { tatuajes: true }
        }, 
        validaciones: true,
        // Traemos finanzas con sus listas anidadas
        finanzas: {
          include: { bienes_inmuebles: true, vehiculos: true, creditos: true, deudas_personales: true, reportes_negativos: true }
        },
        // Traemos el historial laboral con su tabla anidada de experiencias
        historial_laboral: {
          include: { experiencias: true }
        },
      },
    });
    
    if (!entrevista) { 
      res.status(404).json({ success: false, message: 'Entrevista no encontrada' }); 
      return; 
    }
    
    res.json({ success: true, data: entrevista });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener entrevista' }); 
  }
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
entrevistasRouter.put('/:id/datos-personales', uploadCandidato.single('fotografia'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { id, entrevistaId: _, ...rawBody } = req.body;

    // Buscamos la data vieja para saber si ya tenía una foto
    const oldData = await prisma.datosPersonales.findUnique({ where: { entrevistaId } });

    const data: any = {};
    for (const [key, val] of Object.entries(rawBody)) {
      data[key] = (val === '' || val === 'null' || val === 'undefined') ? null : val;
    }

    if (data.fecha_nacimiento) data.fecha_nacimiento = new Date(data.fecha_nacimiento as string);
    if (data.edad) data.edad = parseInt(data.edad as string, 10);
    
    if (req.file) {
      data.fotografia = `/uploads/candidatos/${req.file.filename}`;
      // Si subió una foto nueva, y ya existía una vieja, destruimos la vieja del disco duro
      if (oldData?.fotografia && oldData.fotografia !== data.fotografia) {
        borrarArchivoFisico(oldData.fotografia);
      }
    }

    const resultado = await prisma.datosPersonales.upsert({
      where: { entrevistaId },
      update: data,
      create: { ...data, entrevistaId },
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    handlePrismaError(error, res, 'Error al guardar datos personales');
  }
});

// POST /api/entrevistas/:id/tatuajes
entrevistasRouter.post('/:id/tatuajes', uploadTatuaje.single('fotografia'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);

    let infiltracion = await prisma.infiltracion.findUnique({ where: { entrevistaId } });
    if (!infiltracion) {
      infiltracion = await prisma.infiltracion.create({ data: { entrevistaId } });
    }

    const { descripcion } = req.body;
    const fotografia = req.file ? `/uploads/tatuajes/${req.file.filename}` : null;

    const tatuaje = await prisma.tatuaje.create({
      data: {
        infiltracionId: infiltracion.id,
        descripcion: descripcion || null,
        fotografia,
      },
    });
    res.status(201).json({ success: true, data: tatuaje });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al agregar tatuaje' });
  }
});

// PUT /api/entrevistas/:id/tatuajes/:tatuajeId
entrevistasRouter.put('/:id/tatuajes/:tatuajeId', uploadTatuaje.single('fotografia'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { descripcion } = req.body;
    const dataToUpdate: any = {};
    
    if (descripcion !== undefined) {
      dataToUpdate.descripcion = (descripcion === 'null' || descripcion === '') ? null : descripcion;
    }

    // Permitimos que el frontend elimine la foto enviando null
    if (req.body.fotografia === 'null' || req.body.fotografia === '') {
      dataToUpdate.fotografia = null;
    }

    if (req.file) {
      dataToUpdate.fotografia = `/uploads/tatuajes/${req.file.filename}`;
    }

    const tatuaje = await prisma.tatuaje.update({
      where: { id: Number(req.params.tatuajeId) },
      data: dataToUpdate,
    });
    
    res.json({ success: true, data: tatuaje });
  } catch (error) {
    console.error('Error al actualizar tatuaje:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar tatuaje' });
  }
});

// DELETE /api/entrevistas/:id/tatuajes/:tatuajeId
entrevistasRouter.delete('/:id/tatuajes/:tatuajeId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tatuajeId = Number(req.params.tatuajeId);
    // 1. Buscamos el tatuaje antes de borrarlo para obtener la ruta de la foto
    const oldTatuaje = await prisma.tatuaje.findUnique({ where: { id: tatuajeId } });
    
    // 2. Lo eliminamos de la base de datos
    await prisma.tatuaje.delete({ where: { id: tatuajeId } });
    
    // 3. Borramos el archivo físico asociado
    if (oldTatuaje?.fotografia) {
      borrarArchivoFisico(oldTatuaje.fotografia);
    }
    
    res.json({ success: true, message: 'Tatuaje eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar tatuaje' });
  }
});

// PUT /api/entrevistas/:id/familia
entrevistasRouter.put('/:id/familia', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    // Agregamos lugar_hermanos a la desestructuración del req.body
    const { conviveCon, calificacionFamilia, lugar_hermanos, familiares } = req.body;

    // Ejecutamos todo dentro de una transacción segura de Prisma usando 'tx'
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.entrevista.update({
        where: { id: entrevistaId },
        data: {
          conviveCon: conviveCon,
          calificacionFamilia: calificacionFamilia,
          lugar_hermanos: lugar_hermanos
        }
      });

      await tx.familia.deleteMany({ where: { entrevistaId } });
      
      if (familiares && familiares.length > 0) {
        return await tx.familia.createMany({
          data: familiares.map((f: any) => {
            const { key, id, ...datosLimpios } = f;
            return { 
              ...datosLimpios, 
              entrevistaId 
            };
          }),
        });
      }
      return null;
    });
    
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

    // Ejecutamos todo dentro de una transacción segura de Prisma usando 'tx'
    const result = await prisma.$transaction(async (tx) => {
      await tx.estudio.deleteMany({ where: { entrevistaId } });
      
      if (estudios && estudios.length > 0) {
        return await tx.estudio.createMany({
          data: estudios.map((e: any) => {
            const { key, id, ...datosLimpios } = e;
            return {
              ...datosLimpios,
              entrevistaId
            };
          }),
        });
      }
      return null;
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
    console.log("PAYLOAD RECIBIDO EN BACKEND:", req.body); // <-- Agrega esta línea
    const entrevistaId = Number(req.params.id);
    const { medio_vacante, acto_ilicito, detalle_grave, observaciones, experiencias } = req.body;

    const limpiarLista = (arr: any[]) => arr ? arr.map(({ key, id, historialLaboralId, createdAt, updatedAt, ...rest }) => ({
      ...rest,
      fecha_inicio: rest.fecha_inicio ? new Date(rest.fecha_inicio) : new Date(),
      fecha_fin: rest.fecha_fin ? new Date(rest.fecha_fin) : null,
    })) : [];

    // Construcción segura del objeto update. Si un campo no viene, no lo sobrescribe con undefined/null.
    const updateData: any = {};
    if (medio_vacante !== undefined) updateData.medio_vacante = medio_vacante === '' ? null : medio_vacante;
    if (acto_ilicito !== undefined) updateData.acto_ilicito = (String(acto_ilicito) === 'true');
    if (detalle_grave !== undefined) updateData.detalle_grave = detalle_grave === '' ? null : detalle_grave;
    if (observaciones !== undefined) updateData.observaciones = observaciones === '' ? null : observaciones;

    // Limpiamos la lista independientemente para poder usarla en create sin el deleteMany
    const experienciasLimpias = limpiarLista(experiencias);

    // PREVENCIÓN DE REGRESIÓN: En UPDATE sí usamos deleteMany para limpiar los registros antiguos
    if (experiencias !== undefined) {
      updateData.experiencias = {
        deleteMany: {},
        create: experienciasLimpias as any
      };
    }

    const resultado = await prisma.historialLaboral.upsert({
      where: { entrevistaId },
      update: updateData,
      create: {
        entrevistaId,
        medio_vacante: updateData.medio_vacante,
        acto_ilicito: updateData.acto_ilicito || false,
        detalle_grave: updateData.detalle_grave,
        observaciones: updateData.observaciones,
        // En CREATE no podemos enviar 'deleteMany', solo creamos los registros directamente
        experiencias: {
          create: experienciasLimpias as any
        }
      }
    });

    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error al guardar historial laboral:', error);
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
    console.error('Error en drogas/alcohol:', error);
    res.status(500).json({ success: false, message: 'Error al guardar registro de drogas/alcohol' });
  }
});

// PUT /api/entrevistas/:id/judicial
entrevistasRouter.put('/:id/judicial', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entrevistaId = Number(req.params.id);
    const { id, entrevistaId: _, ultima_verificacion_judicial, ...datosLimpios } = req.body;

    // Convertimos la fecha si existe, de lo contrario la dejamos nula
    const dataToSave = {
      ...datosLimpios,
      ultima_verificacion_judicial: ultima_verificacion_judicial ? new Date(ultima_verificacion_judicial) : null,
      entrevistaId
    };

    const resultado = await prisma.judicial.upsert({
      where: { entrevistaId },
      update: dataToSave,
      create: dataToSave,
    });
    
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error en Judicial:', error);
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
