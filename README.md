# Tailor Made - Human Consulting Platform

Sistema de gestión de reclutamiento y head hunting para **Tailor Made Human Consulting** usando arquitectura Dockerizada (Nginx, React/Vite) y Supabase Autohospedado.

## Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS (glassmorphism, modo claro/oscuro)
- **Backend & Orquestación**: Docker Compose + Supabase Self-Hosted (Auth, Database, Storage, RLS)
- **Servidor Web**: Nginx (alpine)
- **PDF**: jsPDF + jsPDF-autotable (generación de reportes)
- **State**: TanStack React Query (caché y prefetch)
- **Deploy**: VPS Ubuntu (Hostinger)

## Características

- **Gestión de Clientes**: CRUD completo con soft delete y restauración.
- **Gestión de Procesos**: Creación y seguimiento de procesos de reclutamiento con estados (Activo, En Pausa, Finalizado, Cancelado).
- **Gestión de Postulantes**: Fichas completas con foto (crop integrado), observaciones, y estados de avance.
- **Reporte PDF**: Generación automática de reportes profesionales con portada rediseñada (fondo blanco, modo presentación optimizado), perfiles detallados y tabla resumen.
- **Reporte en Línea Seguro**: Enlace público protegido con código PIN y fuertes medidas anti-descargas (bloqueo de clic derecho, arrastre y selección) para que los clientes vean avances de forma 100% visual.
- **Gestión de Usuarios y Seguridad**: Roles (admin, consultor, junior) con asignación de clientes, y un sistema de auto-cerrado de sesión inteligente tras 60 minutos de inactividad (detectando clics, tipeo o movimiento).
- **Tema Claro/Oscuro**: Tema adaptable con persistencia en localStorage.
- **Skeleton Loaders**: Indicadores de carga animados en todas las tablas para una mejor UX.
- **Scrollbar Personalizada**: Delgada, redondeada y adaptable al tema.
- **Glassmorphism**: Efecto de vidrio esmerilado en tablas y tarjetas.
- **Micro-animaciones**: Hover con escala en nombres, transiciones suaves y colores refinados para filas (Dark Mode/Light Mode).

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── AppLayout.tsx    # Layout principal con sidebar
│   ├── ClienteForm.tsx  # Formulario de clientes
│   ├── ProcesoForm.tsx  # Formulario de procesos
│   ├── PostulanteForm.tsx   # Formulario de postulantes (con crop de imagen)
│   ├── ConfirmDialog.tsx    # Diálogo de confirmación reutilizable
│   ├── ImageCropperModal.tsx # Modal de recorte de imágenes
│   ├── NavLink.tsx      # Link de navegación del sidebar
│   ├── ObservacionesResearchForm.tsx # Formulario de observaciones
│   ├── ThemeProvider.tsx # Proveedor de tema claro/oscuro
│   └── ThemeToggle.tsx  # Botón de alternancia de tema
├── contexts/
│   └── AuthContext.tsx  # Contexto de autenticación (rol, usuario)
├── hooks/
│   ├── use-mobile.tsx   # Hook de detección de dispositivo móvil
│   └── use-toast.ts     # Hook de notificaciones toast
├── integrations/
│   └── supabase/        # Cliente y tipos de Supabase
├── lib/
│   ├── cropImage.ts     # Utilidad de recorte de imágenes
│   ├── pdfReport.tsx    # Generador de reportes PDF
│   └── utils.ts         # Utilidades generales (cn)
├── pages/
│   ├── Auth.tsx         # Página de login/registro + olvide mi contraseña
│   ├── ResetPassword.tsx # Página de restablecimiento de contraseña (token email)
│   ├── Clientes.tsx     # Lista de clientes
│   ├── ClienteDetail.tsx # Detalle de un cliente
│   ├── Procesos.tsx     # Lista de procesos
│   ├── ProcesoDetail.tsx # Detalle de un proceso
│   ├── PublicReport.tsx # Reporte público (carrusel)
│   ├── Usuarios.tsx     # Gestión de usuarios
│   └── NotFound.tsx     # Página 404
├── test/                # Tests (Vitest)
├── App.tsx              # Rutas y proveedores globales
├── main.tsx             # Punto de entrada
└── index.css            # Estilos globales y variables de tema
```

## 🛠 Entorno de Desarrollo (Local)

Existen dos formas de correr el proyecto localmente.

### Opción A: Desarrollo Rápido Frontend (Node)
Si requieres editar el aspecto visual rápidamente y estás conectado a un Supabase remoto:
```sh
# 1. Instalar dependencias
npm install
# 2. Configurar variables de entorno (Crear .env)
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y VITE_SUPABASE_PUBLISHABLE_KEY
# 3. Iniciar entorno Vite
npm run dev
```

### Opción B: Entorno Completo con Docker (Recomendado)
Simula idénticamente el ecosistema de producción abarcando tu Frontend estático (Nginx) y todos los servicios de Backend (Supabase):
```sh
# 1. Navegar a la carpeta contenedora
cd supabase-docker
# 2. Asegúrate de tener configurado tu .env con credenciales
# 3. Construir y levantar contenedores
docker compose up -d --build
```
> En esta configuración el Frontend responderá en `http://localhost` y el panel nativo de Supabase Studio en `http://localhost:8000`.
> El Supabase Studio también puede abrirse directamente en `http://localhost:3000`.

## Base de Datos

### Migraciones

Las migraciones se encuentran en `supabase/migrations/` y se ejecutan en orden cronológico.

#### opcion via Supabase cli, (no implementado)

```sh
# Ejecutar migraciones con Supabase CLI
supabase db push

# O manualmente con psql (en orden):
psql -h <DB_HOST> -U postgres -d postgres -f supabase/migrations/<archivo>.sql
```
#### Opción via Supabase Studio Web
- **Local**: `http://localhost:8000` → SQL Editor → ejecutar el contenido de cada migration/seed.
- **Producción (VPS)**: `https://tailormaderesearch.cl:8443` → autenticarse → SQL Editor.
  > ⚠️ Requiere que el puerto 8443 esté abierto en el firewall del VPS (`sudo ufw allow 8443/tcp`).

### Seeders

Los seeders se encuentran en `supabase/seed/` y deben ejecutarse **después** de las migraciones.

#### Seeder Básico (usuario admin)

Crea un usuario administrador inicial del sistema.

```sh
psql -h <DB_HOST> -U postgres -d postgres -f supabase/seed/01_basic_seed.sql
```

**Credenciales del admin creado:**
| Campo    | Valor                |
|----------|----------------------|
| Email    | admin@tailormade.cl  |
| Password | Admin2026!           |

#### Seeder de Relleno (datos de prueba)

Crea datos realistas para testing: 1 cliente, 3 procesos y 18 postulantes (con historiales consolidados).

```sh
psql -h <DB_HOST> -U postgres -d postgres -f supabase/seed/02_fill_seed.sql
```

> **Nota:** Reemplaza `<DB_HOST>` con el host de tu base de datos Supabase. Puedes encontrarlo en **Supabase Dashboard → Settings → Database → Connection string**.

## ✉️ Configuración de Correos (Auth)

El flujo de autenticación de Supabase Docker no cuenta con un servidor SMTP por defecto.

### Modo sin correos (Panel Administrativo)
Si el administrador crea las cuentas y entrega credenciales a mano, configura:
```
ENABLE_EMAIL_AUTOCONFIRM=true   # en supabase-docker/.env
```

### Modo con correos reales — "Olvidé mi contraseña" (Producción)
El flujo de recuperación de contraseña **requiere SMTP real**. Proveedor recomendado: **[Resend](https://resend.com)** (3000 emails/mes gratis).

**1. Crea una cuenta en [resend.com](https://resend.com) y obtén tu API Key.**

**2. Edita `supabase-docker/.env` con estos valores:**
```env
SMTP_ADMIN_EMAIL=noreply@tudominio.com
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_TU_API_KEY_DE_RESEND
SMTP_SENDER_NAME=Tailor Made HR
ENABLE_EMAIL_AUTOCONFIRM=false
```

**3. Actualiza también `SITE_URL` con la URL real de la app:**
```env
# Local:
SITE_URL=http://localhost
ADDITIONAL_REDIRECT_URLS=http://localhost/reset-password

# VPS Hostinger (con dominio y HTTPS):
SITE_URL=https://tailormaderesearch.cl
ADDITIONAL_REDIRECT_URLS=https://tailormaderesearch.cl/reset-password
```
> ⚠️ Si `SITE_URL` apunta a `localhost` en producción, los links del correo serán inservibles.

**4. Template de correo personalizado (en español):**
El proyecto incluye un template HTML de recuperación en español ubicado en `public/email-recovery.html`.
GoTrue lo descarga vía la URL interna `http://frontend:80/email-recovery.html` (ya configurado en `docker-compose.yml`).
Para modificar el diseño del correo, edita `public/email-recovery.html` y redesplega el frontend.

## 🚀 Despliegue en Producción (Hostinger VPS)

El proyecto está íntegramente dockerizado y actualmente operativo con **HTTPS/SSL automático** vía Caddy en `https://tailormaderesearch.cl`.

### Pasos para el Primer Despliegue
1. Ingresa a tu servidor vía SSH: `ssh root@187.127.12.121`
2. Instala Docker: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
3. Clona el repositorio en `/opt/`: `git clone https://github.com/theorysolucionesdigitales-star/tm_hr_docker.git proyecto`
4. Crea el `.env` (no viaja por Git): `cd proyecto/supabase-docker && cp .env.example .env && nano .env`  
   Asegúrate de configurar `SUPABASE_PUBLIC_URL`, `API_EXTERNAL_URL` y `SITE_URL` con `https://tailormaderesearch.cl`.
5. Abre los puertos del firewall:
   ```sh
   sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp
   sudo ufw allow 8443/tcp  # Supabase Studio
   sudo ufw reload
   ```
6. Verifica que el DNS apunte al VPS (`nslookup tailormaderesearch.cl` → `187.127.12.121`) y luego levanta con Caddy:
   ```sh
   docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
   ```

> 📖 **Guía Completa**: Para detalles finos, configuración de SMTP, migraciones y advertencias, consulta la [Guía de Dockerización y Despliegue](./Guia_Dockerizacion_y_Despliegue.md).

### URLs de Producción
| Servicio | URL |
|----------|-----|
| Aplicación | `https://tailormaderesearch.cl` |
| Supabase Studio | `https://tailormaderesearch.cl:8443` |

### 🔄 Redespliegues y Actualización de Código

#### Redespliegue rápido (solo cambios de código del Frontend)
El escenario más común. No toca Supabase ni la base de datos:
```sh
cd /opt/proyecto/supabase-docker
git pull
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build frontend
```
El flag `--build frontend` reconstruye únicamente el contenedor de React, haciendo el proceso considerablemente más rápido.

#### Redespliegue completo (cambios en `.env` o infraestructura)
Cuando hay cambios en variables de entorno o configuración de Caddy:
```sh
# 1. Traer cambios
cd /opt/proyecto/supabase-docker && git pull

# 2. Editar el .env con los nuevos valores
nano .env

# 3. Bajar el stack y levantar de nuevo
docker compose down
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```
> ⚠️ Verifica siempre que el DNS apunte correctamente antes de levantar con Caddy, de lo contrario Let's Encrypt no podrá emitir el certificado SSL.
