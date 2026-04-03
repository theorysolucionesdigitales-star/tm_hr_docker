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
│   ├── Auth.tsx         # Página de login/registro
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

## Base de Datos

### Migraciones

Las migraciones se encuentran en `supabase/migrations/` y se ejecutan en orden cronológico.

```sh
# Ejecutar migraciones con Supabase CLI
supabase db push

# O manualmente con psql (en orden):
psql -h <DB_HOST> -U postgres -d postgres -f supabase/migrations/<archivo>.sql
```

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
- **Si no requieres confirmación vía email** (ideal si el Administrador del sistema crea las cuentas y reparte credenciales): Configura `ENABLE_EMAIL_AUTOCONFIRM=true` dentro de tu directorio `supabase-docker/.env`.
- **Si gestionarás reestablecimiento de contraseñas u otros mensajes**: Reemplaza la configuración temporal `SMTP_...` en el `.env` por las llaves reales de un proveedor de correos transaccionales (Ej: Resend, SendGrid, ElasticEmail).

## 🚀 Despliegue en Producción (Hostinger VPS)

El proyecto está íntegramente dockerizado, permitiendo un despliegue aislado, replicable y con control total en tu propio servidor VPS virtual.

### Pasos Rápidos
1. Ingresa a tu servidor vía SSH: `ssh root@<IP_DEL_VPS>`
2. Instala el motor de Docker (Vía script sugerido para Ubuntu): `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
3. Clona tu repositorio en un espacio administrado, por ejemplo `/opt/`.
4. Crea tu archivo `.env` (no viaja por Git por seguridad): Cópialo manualmente desde tu PC usando `nano .env` y pega tus contraseñas maestras. Asegúrate de modificar `SUPABASE_PUBLIC_URL` y `API_EXTERNAL_URL` por la **IP real** de tu servidor en lugar de *localhost*.
5. Construye la aplicación y levanta todo orquestado:
   ```sh
   cd supabase-docker
   docker compose up -d --build
   ```
6. Recuerda liberar los puertos principales usando tu cortafuegos (Ej: `sudo ufw allow 80/tcp`).

> 📖 **Guía Completa**: Para detalles finos, consejos y advertencias, consulta la amplia [Guía de Dockerización y Despliegue](./Guia_Dockerizacion_y_Despliegue.md) ya incluida en el código fuente.

### 🚧 Próximos Pasos (Networking y Dominios)
Al presente la herramienta opera de forma eficaz mediante dirección IP. En un futuro cercano, actualizaremos esta zona al definir el ruteo de un Custom Domain (dominio propio amigable). Utilizaremos preferentemente un Proxy Reverso (como *Nginx Proxy Manager* o túneles cifrados de *Cloudflare*) para encriptar este tráfico con SSL válido y lograr rutas profesionales para la compañía.
