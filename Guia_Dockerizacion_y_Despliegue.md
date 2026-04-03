# 🚀 Guía de Dockerización y Despliegue: React (Vite) + Supabase + Nginx

Esta guía explica paso a paso cómo dockerizar tu aplicación (Frontend en React/Vite y Backend con Supabase autohospedado) y desplegarla en un VPS de Hostinger.

## 📋 Arquitectura de Contenedores

Tendremos los siguientes servicios principales:
1. **Frontend (Nginx)**: Contenedor ligero que alojará los archivos de producción generados por Vite e implementará el enrutamiento para nuestra Single Page Application (SPA).
2. **Supabase Stack**: Múltiples contenedores oficiales de Supabase orquestados por Docker Compose (Gateway API, PostgreSQL, GoTrue/Auth, Storage, Realtime, etc.).

---

## Paso 1: Dockerizar el Frontend (React + Vite)

Debemos crear un `Dockerfile` en el directorio principal de tu frontend. Utiliza un modelo *multi-stage build* (compilación en múltiples etapas) para compilar en Node.js y, al final, usar un contenedor muy ligero de **Nginx** para despachar los archivos.

### 1.1 Crear el `Dockerfile`
En la raíz de tu proyecto React (donde vive tu `package.json`), crea el archivo vacio llamado `Dockerfile` e inserta este código:

```dockerfile
# Etapa 1: Construcción (Build)
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Definir argumentos para que Vite las incruste en la web estática
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Copiar el código y compilar la aplicación
COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copiamos la configuración personalizada de Nginx
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# Copiamos la build de la etapa anterior al directorio publico de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 1.2 Configurar el enrutamiento del SPA en Nginx
Crea una carpeta en esa misma raíz llamada `nginx` y dentro de ella, un archivo `default.conf`. Esto es **obligatorio** en React/Vite para que el usuario pueda usar enlaces (rutas) de forma directa sin tener errores "404 Not Found" del servidor.

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        # La línea mágica: si el archivo/directorio no existe, redirige el tráfico a index.html
        try_files $uri $uri/ /index.html;
    }

    # Optimización: Caché a largo plazo para los estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## Paso 2: Configurar Supabase Auto-hospedado (Self-Hosted)

Supabase no es un archivo monolítico; es una combinación de excelentes software de código abierto.

1. En la consola (en la raíz de tu proyecto, donde probablemente ya tienes una carpeta `supabase` creada por el entorno de desarrollo), clonaremos el repositorio en un directorio temporal para extraer únicamente su configuración en Docker y evitar conflictos con la carpeta existente:
   ```bash
   # Clonar en un directorio temporal (supabase-src)
   git clone --depth 1 https://github.com/supabase/supabase.git supabase-src
   cp -r supabase-src/docker ./supabase-docker
   rm -rf supabase-src
   ```
2. Entramos a la nueva carpeta y preparamos las variables de entorno:
   ```bash
   cd supabase-docker
   cp .env.example .env
   ```

### 2.1 Variables Críticas
Abre el nuevo archivo `.env`. Debes reemplazar obligatoriamente lo siguiente:
- `POSTGRES_PASSWORD`: Escribe una base de datos segura.
- `JWT_SECRET`: Crea un texto muy complicado (32 a más caracteres).
- `ANON_KEY` y `SERVICE_ROLE_KEY`: Ya que supabase funciona con Tokens seguros, te pedirá generar un par JWT basados en tu `JWT_SECRET`. Puedes ir a [https://jwt.io/](https://jwt.io/) con el algoritmo `HS256` seleccionado, pegar tu secreto (`JWT_SECRET`) en la firma en la parte de abajo, y para generar cada llave usar los siguientes payloads respectivamente:
  - Para generar tu **`ANON_KEY`** usa el payload: `{ "role": "anon" }`
  - Para generar tu **`SERVICE_ROLE_KEY`** usa el payload: `{ "role": "service_role" }`

### 2.2 Configuración de Correos (Registro de Usuarios)
Por defecto, el contenedor de Autenticación de Supabase intentará enviar un correo de confirmación al crear un usuario. Si no dispones de un servidor SMTP configurado, probar esto en tu frontend fallará con un error "HTTP 500: Error sending confirmation email".
- **Para Desarrollo o Modo Administrador Creador (Sin correos)**: Asegúrate de setear en tu archivo `.env` la variable `ENABLE_EMAIL_AUTOCONFIRM=true`. Los usuarios se aprobarán automáticamente de forma instantánea.
- **Para Producción con Correos Reales**: Si usarás envío de confirmaciones o recuperación de contraseñas, usa el mismo `.env` local o remoto y edita las variables `SMTP_HOST`, `SMTP_USER`, `SMTP_PORT` y `SMTP_PASS` con las credenciales de tu proveedor transaccional (ej. Resend, Sendgrid, AWS SES).

---

## Paso 3: Unificación Global con Docker Compose

Para que Front y Backend convivan armoniosamente, la vía recomendada es agrupar al Frontend en el ecosistema existente de Supabase.

Abre el archivo `supabase-docker/docker-compose.yml`, ve hasta el final del extenso documento y, **asegurándote de estar dentro de la lista de `services:`** (antes de que diga `volumes:` al final), agrega tu Frontend con la indentación correcta (dos espacios hacia adentro):

```yaml
  # ... (Aquí están todos los contenedores de supabase previos) ...
  
  frontend:
    build: 
      context: .. # Se ubica una carpeta atrás, en la raíz del proyecto
      dockerfile: Dockerfile
      args:
        # ¡Importante! Al ser React/Vite estático, debe pasarse bajo 'args' 
        # (al compilar) y NO bajo 'environment' (durante la ejecución de Nginx).
        - VITE_SUPABASE_URL=http://<IP_DE_TU_VPS>:8000
        - VITE_SUPABASE_ANON_KEY=${ANON_KEY}
        - VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
    container_name: hr_frontend
    ports:
      - "80:80" # Tu frontend operará en el VPS en el puerto HTTP estándar (80)
    restart: always
```

Al levantar este Docker Compose global vas a poder testear **TODO** tanto Front como Back con un solo comando.

---

## Paso 4: Despliegue en VPS (Hostinger)

El entorno VPS (Virtual Private Server) es distinto a tu máquina local. Vamos a desplegar.

### 4.1 Preparar el Servidor Virtual
Abre tu consola/terminal local y accede por SSH a tu VPS de Hostinger. Te pedirán la contraseña de tu base control panel:
```bash
ssh root@<IP_DEL_VPS>
```

#### Instalar requisitos (Útil para VPS Ubuntu de Hostinger):
Hostinger generalmente ofrece Ubuntu 22.04 o 24.04 llanos. Debes instalar Docker:
```bash
# Actualizar el sistema e instalar prerequisitos
sudo apt update && sudo apt upgrade -y
sudo apt install ca-certificates curl gnupg lsb-release git -y

# Mágico script de instalación automática de Docker Oficial (Incluye Docker Compose)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 4.2 Clonar y Ejecutar
1. Descarga el código de tu proyecto dentro del VPS. Lo ideal sería clonar tu repositorio git dentro del espacio de opt `/opt`.
   ```bash
   cd /opt
   #git clone https://github.com/usuario/mi-repo-hr.git proyecto
   git clone https://github.com/theorysolucionesdigitales-star/tm_hr_docker.git proyecto
   cd proyecto/supabase-docker
   ```

2. **Crear y Transferir el Archivo `.env`**: Como el archivo `.env` está protegido por Git (`.gitignore`), el VPS no lo descargará automáticamente.
   - Ejecuta: `cp .env.example .env && nano .env`
   - Vacía el archivo en la consola y pega o transcribe íntegramente tu `.env` validado localmente para transferir tus contraseñas fuertes.
   - Antes de guardar, modifica la sección URLs (`SUPABASE_PUBLIC_URL` y `API_EXTERNAL_URL`), cambiando *localhost* por la **IP pública real de Hostinger** para que el Frontend y Backend conozcan su ubicación.
   - *(En `nano`: Guarda con `Ctrl + O`, entra, y sal con `Ctrl + X`)*.
   
   > *💡 Nota:* El motor Docker reconstruirá automáticamente la aplicación frontend usando la IP remota que indiques, ya que insertará la variable de forma dinámica.

3. Es tiempo de despertar los recursos en el VPS:
   ```bash
   # Descargamos imágenes y construimos el Frontend
   docker compose build
   
   # Levantamos en modo "Background / Detached"
   docker compose up -d
   ```

Con esto ya puedes acceder a `http://<IP_DE_VPS>` y observar ¡tu Frontend operando conectado al Supabase embebido!
Ahora lee la seccion de migraciones y seeders del README.md para implementar las tablas y seeders.

---

## 💻 Notas Vitales y Contextos OS (Linux vs Windows)

### 🔴 Notas para Desarrolladores en Windows (Localmente)
- **El Motor**: Si tu máquina local es Windows, **no instales Docker de la consola**. Debes instalar exclusivamente [Docker Desktop](https://www.docker.com/products/docker-desktop/).
- **WSL 2 es Mándatorio**: En la configuración de *Docker Desktop*, cerciórate de estar usando el motor avanzado de WSL2 (Windows Subsystem for Linux) y no Hyper-V clásico. Es hasta 10 veces más veloz con Node y PostgreSQL.
- **Formato Line Endings (CRLF vs LF)**: Windows genera saltos de línea visualmente extraños (*CRLF*) y Linux emplea (*LF*). Esto es peligroso para los archivos `.sh` o de Nginx (ejemplo: `default.conf`). Si Docker falla levantando tu Nginx, asegúrate en tu Visual Studio Code de que el archivo `nginx/default.conf` tiene como separador de línea **LF** en la esquina inferior derecha del programa.

### 🟠 Notas para el entorno en Ubuntu (VPS de Producción)
- **Seguridad en Puertos**: Por precaución, los puertos podrían estar cerrados. Si intentas entrar a las horas y está caído, es el cortafuegos. Abre los puertos:
  ```bash
  sudo ufw allow 80/tcp   # Servidor Web Front-end (http por defecto)
  sudo ufw allow 8000/tcp # API Kong de Supabase
  sudo ufw allow 5432/tcp # PostgreSQL Puro (Si te conectas vía DBeaver/PgAdmin, opcional)
  sudo ufw reload
  ```
- **Práctica Recomendada al Usuario**: Utilizarás al usuario `root` habitualmente en Hostinger. Procura en una etapa futura crear tu propio sub-usuario agregándolo al grupo Docker para minimizar daños: `sudo usermod -aG docker tuusuario`.

### 🛡 Próximos pasos recomendados:
Una vez funcionando tu VPS sin certificado, el paso final de un DevOps para producción real es añadir **Cloudflare** gratuito encima o implementar un Proxy Reverso (Como **Nginx Proxy Manager** en otro contenedor) para obtener dominios amigables `https://miapp.com` gestionando el Let's Encrypt / SSL del tráfico automáticamente sin que debas modificar el ambiente que hemos logrado montar hoy.
