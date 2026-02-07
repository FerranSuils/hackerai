# 🚀 Despliegue HackerAI en Ubuntu Plesk

Guía para desplegar el frontend de HackerAI en un servidor Ubuntu con Plesk usando Docker Compose.

**URL de producción:** `https://hacerkai.devsuils.com`

---

## Requisitos previos

- Ubuntu 20.04+ con Plesk Obsidian
- Docker y Docker Compose instalados
- Dominio `hacerkai.devsuils.com` apuntando al servidor
- Certificado SSL configurado en Plesk (Let's Encrypt)

### Instalar Docker (si no está instalado)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

---

## 1. Clonar el repositorio

```bash
cd /var/www/vhosts/devsuils.com
git clone <tu-repo-url> hackerai
cd hackerai
```

## 2. Configurar variables de entorno

```bash
cp .env.production.example .env.production
nano .env.production
```

Rellena **todas** las variables obligatorias:

| Variable | Descripción |
|----------|-------------|
| `WORKOS_API_KEY` | API key de WorkOS (producción) |
| `WORKOS_CLIENT_ID` | Client ID de WorkOS |
| `WORKOS_COOKIE_PASSWORD` | Secret para cookies (32+ chars) |
| `NEXT_PUBLIC_CONVEX_URL` | URL de tu deployment Convex |
| `CONVEX_DEPLOYMENT` | Nombre del deployment Convex |
| `OPENROUTER_API_KEY` | API key de OpenRouter |
| `E2B_API_KEY` | API key de E2B |

> ⚠️ **IMPORTANTE:** Asegúrate de que `NEXT_PUBLIC_WORKOS_REDIRECT_URI` sea `https://hacerkai.devsuils.com/callback`
> y `NEXT_PUBLIC_BASE_URL` sea `https://hacerkai.devsuils.com`

## 3. Construir e iniciar

```bash
docker compose up -d --build
```

Verificar que el contenedor está corriendo:

```bash
docker compose ps
docker compose logs -f frontend
```

El frontend estará escuchando en `127.0.0.1:3000`.

## 4. Configurar Proxy Reverso en Plesk

### Opción A: Docker Proxy Rules (recomendado)

1. En Plesk, ve a **Domains** → `hacerkai.devsuils.com`
2. Ve a **Apache & nginx Settings**
3. En la sección **Additional nginx directives**, añade:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;

    # Necesario para Server-Sent Events (streaming de AI)
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
}
```

4. Haz clic en **OK/Apply**

### Opción B: Plesk Docker Extension

Si tienes la extensión Docker de Plesk:

1. Ve a **Extensions** → **Docker**
2. Selecciona el contenedor `hackerai-frontend`
3. Configura proxy mapping al dominio `hacerkai.devsuils.com`

## 5. Configurar SSL en Plesk

1. Ve a **Domains** → `hacerkai.devsuils.com`
2. Ve a **SSL/TLS Certificates**
3. Haz clic en **Install** bajo **Let's Encrypt**
4. Marca ✅ "Redirect from http to https"
5. Haz clic en **Get it Free**

---

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f frontend

# Reiniciar el contenedor
docker compose restart frontend

# Reconstruir tras cambios en el código
docker compose up -d --build --force-recreate

# Parar todo
docker compose down

# Ver uso de recursos
docker stats hackerai-frontend

# Limpiar imágenes sin usar
docker system prune -f
```

## Actualizar la aplicación

```bash
cd /var/www/vhosts/devsuils.com/hackerai
git pull origin main
docker compose up -d --build --force-recreate
```

## Troubleshooting

### El contenedor no arranca
```bash
docker compose logs frontend
```

### Error 502 Bad Gateway en Plesk
- Verificar que el contenedor está corriendo: `docker compose ps`
- Verificar que el puerto 3000 está escuchando: `curl http://127.0.0.1:3000`
- Revisar los logs de nginx de Plesk: `tail -f /var/log/nginx/error.log`

### Problemas de memoria
Si el servidor tiene poca RAM, ajusta los límites en `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
```

### Variables de entorno no se aplican
Las variables `NEXT_PUBLIC_*` se inyectan en **build time**. Si cambias alguna, debes reconstruir:
```bash
docker compose up -d --build --force-recreate --no-cache
```
