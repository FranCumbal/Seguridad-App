# 🛡️ Seguridad App
## Sistema Empresarial de Entrevistas de Seguridad y Validación de Personal

---

## 🧱 Stack Tecnológico

| Capa            | Tecnología                           |
|-----------------|--------------------------------------|
| Desktop         | **Tauri v1**                         |
| Frontend        | **React 18 + TypeScript**            |
| UI/UX           | **Ant Design 5** (tema oscuro)       |
| Formularios     | **React Hook Form + Zod**            |
| Estado global   | **Zustand**                          |
| Backend         | **Express.js + TypeScript**          |
| ORM             | **Prisma 5.22** (schema en server/)  |
| Base de datos   | **SQL Server 2022 / Express**        |
| PDF             | **pdfmake**                          |
| Seguridad       | **bcryptjs + JWT**                   |

---

## 📋 Requisitos Previos

```
✅ Node.js >= 18.x   → https://nodejs.org
✅ SQL Server Express → ya instalado (SQLEXPRESS)
✅ SSMS 2022         → SQL Server Management Studio
✅ Rust (solo para compilar .exe) → https://rustup.rs
```

---

## ⚙️ Instalación Paso a Paso

### 1. Instalar dependencias

```powershell
# Desde la raíz del proyecto
npm run setup
```

### 2. Configurar variables de entorno

```powershell
# Copiar plantillas
copy .env.example .env
copy server\.env.example server\.env
```

Editar **`server\.env`** con tu cadena de conexión:

```env
DATABASE_URL="sqlserver://localhost;instance=SQLEXPRESS;database=SEGURIDADAPP;integratedSecurity=true;encrypt=true;trustServerCertificate=true"
```

> ⚠️ **IMPORTANTE**: El formato correcto para Prisma usa `instance=SQLEXPRESS`
> como parámetro separado, NO `localhost\SQLEXPRESS`.

### 3. Crear la base de datos en SSMS

Abre SQL Server Management Studio y ejecuta:

```sql
CREATE DATABASE PromptMaestro;
GO
```

### 4. Crear las tablas (desde la carpeta `server/`)

```powershell
cd server

# Generar el cliente Prisma
.\node_modules\.bin\prisma generate

# Crear todas las tablas en SQL Server
.\node_modules\.bin\prisma db push

# Insertar datos iniciales
npm run db:seed
```

### 5. Iniciar la aplicación

```powershell
# Desde la raíz del proyecto — inicia backend + frontend juntos
cd ..
npm run dev:full
```

O por separado:

```powershell
# Terminal 1 — Backend Express (puerto 3001)
cd server
npm run dev

# Terminal 2 — Frontend Tauri (puerto 1420)
cd ..
npm run tauri:dev
```

---

## 🔐 Credenciales por Defecto

| Usuario         | Contraseña    | Rol            |
|-----------------|---------------|----------------|
| `admin`         | `Admin123!`   | ADMINISTRADOR  |
| `entrevistador` | `Entrev123!`  | ENTREVISTADOR  |

> ⚠️ Cambiar estas contraseñas antes de usar en producción.

---

## 📁 Estructura del Proyecto

```
prompt-maestro/
├── src/                          # Frontend React
│   ├── core/config/theme.ts      # Tema Ant Design oscuro
│   ├── modules/
│   │   ├── auth/                 # Login
│   │   ├── dashboard/            # Dashboard estadísticas
│   │   ├── entrevistas/          # CRUD + 9 tabs
│   │   └── entrevistadores/      # CRUD equipo
│   ├── shared/utils/pdf.ts       # Generación PDF
│   ├── infrastructure/api/       # Axios + servicios
│   ├── store/                    # Zustand
│   └── layouts/                  # Sidebar + Header
│
├── server/                       # Backend Express
│   ├── prisma/
│   │   └── schema.prisma         # ← Schema SQL Server aquí
│   └── src/
│       ├── index.ts              # Entry Express
│       ├── routes/               # auth, entrevistas, etc.
│       ├── middleware/auth.ts     # JWT
│       └── utils/
│           ├── prisma.ts         # Cliente singleton
│           └── seed.ts           # Datos iniciales
│
├── src-tauri/                    # Tauri Rust
├── .env.example                  # Variables frontend
├── setup.bat                     # Setup automático Windows
└── package.json
```

---

## 📡 API Endpoints Principales

| Método | Ruta                                      | Descripción              |
|--------|-------------------------------------------|--------------------------|
| POST   | `/api/auth/login`                         | Iniciar sesión           |
| GET    | `/api/entrevistas`                        | Listar (filtros+páginas) |
| POST   | `/api/entrevistas`                        | Crear entrevista         |
| PUT    | `/api/entrevistas/:id/datos-personales`   | Guardar sección          |
| PUT    | `/api/entrevistas/:id/familia`            | Guardar familia          |
| PUT    | `/api/entrevistas/:id/finanzas`           | Guardar finanzas         |
| PUT    | `/api/entrevistas/:id/judicial`           | Guardar judicial         |
| PUT    | `/api/entrevistas/:id/infiltracion`       | Guardar infiltración     |
| PUT    | `/api/entrevistas/:id/validaciones`       | Resultado final          |
| GET    | `/api/estadisticas/dashboard`             | Stats para dashboard     |

---

## 🗄️ Comandos Prisma (desde `server/`)

```powershell
# Generar cliente
.\node_modules\.bin\prisma generate

# Aplicar schema a la BD
.\node_modules\.bin\prisma db push

# Ver datos en el navegador
.\node_modules\.bin\prisma studio

# Seed de datos
npm run db:seed
```

---

## 🏗️ Compilar .exe para Windows

```powershell
# Compilar backend
cd server && npm run build && cd ..

# Compilar app de escritorio
npm run tauri:build
```

Salida en: `src-tauri/target/release/bundle/`

---

## ❗ Solución de Problemas

**Error: Invalid instance name in database URL**
```
Verifica que DATABASE_URL use el formato correcto:
✅ sqlserver://localhost;instance=SQLEXPRESS;...
❌ sqlserver://localhost\SQLEXPRESS;...
```

**Error: Cannot find module '@prisma/client'**
```powershell
cd server
.\node_modules\.bin\prisma generate
```

**SQL Server no conecta**
```
1. Servicios Windows → SQL Server (SQLEXPRESS) → Iniciado
2. SQL Server Config Manager → TCP/IP → Habilitado
3. Firewall → Puerto 1433 abierto
4. SSMS → Conectar con Windows Authentication
```

**Puerto 3001 ocupado**
```powershell
netstat -ano | findstr :3001
taskkill /PID <número> /F
```
