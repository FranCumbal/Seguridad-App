import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ── Crear usuario administrador ──────────────────────────
  const adminExists = await prisma.usuario.findFirst({ where: { username: 'admin' } });
  if (!adminExists) {
    const password_hash = await bcrypt.hash('Admin123!', 12);
    await prisma.usuario.create({
      data: {
        username: 'admin',
        email: 'admin@promptmaestro.com',
        password_hash,
        nombre: 'Administrador',
        apellido: 'Sistema',
        rol: 'ADMINISTRADOR',
      },
    });
    console.log('✅ Usuario administrador creado → admin / Admin123!');
  } else {
    console.log('⚠️  Usuario admin ya existe, omitiendo...');
  }

  // ── Crear usuario entrevistador demo ─────────────────────
  const entrevistadorUserExists = await prisma.usuario.findFirst({ where: { username: 'entrevistador' } });
  if (!entrevistadorUserExists) {
    const password_hash = await bcrypt.hash('Entrev123!', 12);
    await prisma.usuario.create({
      data: {
        username: 'entrevistador',
        email: 'entrevistador@promptmaestro.com',
        password_hash,
        nombre: 'Usuario',
        apellido: 'Entrevistador',
        rol: 'ENTREVISTADOR',
      },
    });
    console.log('✅ Usuario entrevistador creado → entrevistador / Entrev123!');
  }

  // ── Crear entrevistadores predefinidos ───────────────────
  const entrevistadoresPredefinidos = [
    { nombre_completo: 'Jaime Bautista',    cargo: 'Jefe de Seguridad' },
    { nombre_completo: 'Julio Campoverde',  cargo: 'Analista de Seguridad' },
    { nombre_completo: 'Hugo López',        cargo: 'Supervisor de RRHH' },
    { nombre_completo: 'Hitler Román',      cargo: 'Coordinador de Seguridad' },
    { nombre_completo: 'Francisco López',   cargo: 'Investigador de Personal' },
  ];

  for (const e of entrevistadoresPredefinidos) {
    const exists = await prisma.entrevistador.findFirst({
      where: { nombre_completo: e.nombre_completo },
    });
    if (!exists) {
      await prisma.entrevistador.create({ data: e });
      console.log(`✅ Entrevistador creado: ${e.nombre_completo}`);
    } else {
      console.log(`⚠️  Entrevistador "${e.nombre_completo}" ya existe, omitiendo...`);
    }
  }

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('──────────────────────────────────────');
  console.log('  Credenciales por defecto:');
  console.log('  Admin:         admin / Admin123!');
  console.log('  Entrevistador: entrevistador / Entrev123!');
  console.log('──────────────────────────────────────\n');
}

seed()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
