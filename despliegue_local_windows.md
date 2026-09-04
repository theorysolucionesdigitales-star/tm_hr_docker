# 🚀 Guía de Instalación Local (Entorno Aislado / No Producción) - Windows

Esta guía detalla los pasos para instalar y ejecutar este proyecto localmente en tu equipo (Windows con Docker Desktop) **sin afectar ni conectarte al servidor de producción**.

---

### ⚠️ Regla de Oro
**No debes modificar ni conectar las variables de entorno a `https://tailormaderesearch.cl` ni a la IP del VPS (`187.127.12.121`).**  
Todo correrá bajo `localhost`.

---

## 📋 Requisitos Previos
1. Tener **Docker Desktop** instalado y en ejecución en Windows (asegúrate de que WSL2 esté habilitado).
2. Estar posicionado en la raíz del proyecto (`d:\code\tm_hr_docker`).

---

## 🛠️ Paso 1: Configurar Variables del Frontend (Raíz)

Edita o crea el archivo `.env` en la raíz de tu proyecto (`d:\code\tm_hr_docker\.env`) para apuntar a tu Supabase local:

```env
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

---

## 🛠️ Paso 2: Configurar Variables de Supabase Local

Navega a la carpeta `supabase-docker`:
```powershell
cd d:\code\tm_hr_docker\supabase-docker
```

Asegúrate de que en el archivo `d:\code\tm_hr_docker\supabase-docker\.env` las siguientes variables clave de URLs y contraseñas apunten a local:

```env
SUPABASE_PUBLIC_URL=http://localhost:8000
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:3000
ADDITIONAL_REDIRECT_URLS=http://localhost:3000/reset-password
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ENABLE_EMAIL_AUTOCONFIRM=true
```

---

## 🐳 Paso 3: Construir y Levantar los Contenedores Localmente

Desde la carpeta `d:\code\tm_hr_docker\supabase-docker`, ejecuta:

```powershell
docker compose up -d --build
```

Esto descargará las imágenes de Supabase (PostgreSQL, Auth, Storage, Studio) y construirá el contenedor de Nginx con el Frontend React.

Para verificar que todos los contenedores se estén ejecutando:
```powershell
docker ps
```

---

## 🗄️ Paso 4: Inicializar la Base de Datos Local (Esquema y Datos Semilla)

Una vez que Postgres local esté listo (espera unos 20-30 segundos tras ejecutar `docker compose up`), aplica el esquema y los seeders ejecutando en PowerShell:

```powershell
# 1. Aplicar Esquema Consolidado
Get-Content ..\supabase\migrations\20260401000000_consolidated_schema.sql | docker exec -i supabase-db psql -U postgres -d postgres

# 2. Aplicar Seeder Básico (Usuarios y Configuración Base)
Get-Content ..\supabase\seed\01_basic_seed.sql | docker exec -i supabase-db psql -U postgres -d postgres

# 3. (Opcional) Aplicar Datos de Prueba
Get-Content ..\supabase\seed\02_fill_seed.sql | docker exec -i supabase-db psql -U postgres -d postgres
```

---

## 🌐 Paso 5: Acceso al Entorno Local

Una vez levantado todo, puedes acceder en tu navegador a:

| Servicio | URL Local | Credenciales por Defecto |
| :--- | :--- | :--- |
| **Frontend App** | `http://localhost` | Admin: `admin@tailormade.cl` / `Admin2026!` |
| **Supabase Studio** | `http://localhost:8000` | Usuario: `supabase` / Pass: `this_password_is_insecure_and_should_be_updated` |

---

## 🧹 Comandos Útiles de Mantenimiento Local

- **Detener el entorno local:**
  ```powershell
  docker compose down
  ```
- **Reiniciar completamente y borrar la BD local (si quieres empezar desde cero):**
  ```powershell
  docker compose down -v
  Remove-Item -Recurse -Force volumes/db/data, volumes/storage
  docker compose up -d --build
  ```
