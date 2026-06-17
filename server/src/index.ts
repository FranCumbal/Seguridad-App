import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth';
import { entrevistasRouter } from './routes/entrevistas';
import { entrevistadoresRouter } from './routes/entrevistadores';
import { usuariosRouter } from './routes/usuarios';
import { estadisticasRouter } from './routes/estadisticas';
import configuracionRouter from './routes/configuracion';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// MIDDLEWARE GLOBAL
// =============================================
app.use(cors({
  origin: true, // Permitir todas las URLs de origen (puede ser ajustado a dominios específicos)
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Servir archivos estáticos (fotos, documentos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =============================================
// RUTAS DE LA API
// =============================================
app.use('/api/auth',            authRouter);
app.use('/api/entrevistas',     entrevistasRouter);
app.use('/api/entrevistadores', entrevistadoresRouter);
app.use('/api/usuarios',        usuariosRouter);
app.use('/api/estadisticas',    estadisticasRouter);
app.use('/api/configuracion',   configuracionRouter); // <-- LÍNEA AGREGADA

// =============================================
// HEALTH CHECK
// =============================================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    app: 'Prompt Maestro API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// MANEJO DE ERRORES GLOBAL
// =============================================
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// =============================================
// INICIO DEL SERVIDOR
// =============================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     SEGURIDAD APP — API SERVER          ║
  ║     Puerto: ${PORT}                        ║
  ║     Entorno: ${process.env.NODE_ENV}     ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;

