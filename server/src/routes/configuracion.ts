import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// GET: Obtener configuración global (Patrón Singleton)
router.get('/', async (req, res) => {
  try {
    let config = await prisma.configuracion.findUnique({
      where: { id: 1 }
    });

    // Inicialización perezosa si no existe
    if (!config) {
      config = await prisma.configuracion.create({
        data: {
          id: 1,
          color_corporativo: '#1e3a5f',
          texto_footer: 'SEGURIDAD GRUPO EMPRESARIAL ROJAS',
          logo_izq_visible: true,
          logo_der_visible: true,
          logo_izq_opacidad: 0.35,
          logo_der_opacidad: 0.35
        }
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración global' });
  }
});

// PUT: Actualizar configuración global
router.put('/', async (req, res) => {
  try {
    const data = req.body;

    const config = await prisma.configuracion.upsert({
      where: { id: 1 },
      update: {
        logo_izq_url: data.logo_izq_url,
        logo_der_url: data.logo_der_url,
        logo_izq_opacidad: data.logo_izq_opacidad,
        logo_der_opacidad: data.logo_der_opacidad,
        logo_izq_visible: data.logo_izq_visible,
        logo_der_visible: data.logo_der_visible,
        color_corporativo: data.color_corporativo,
        texto_footer: data.texto_footer,
      },
      create: {
        id: 1,
        ...data
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración global' });
  }
});

export default router;