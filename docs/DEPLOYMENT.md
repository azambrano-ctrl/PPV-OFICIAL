# 🚀 Guía de Deployment - Sistema PPV Streaming

Esta guía cubre el deployment completo del sistema en producción.

## 📋 Prerrequisitos

- Servidor VPS (DigitalOcean, Vultr, AWS EC2, etc.)
- Mínimo 4GB RAM, 2 CPU cores
- Ubuntu 20.04 o superior
- Dominio configurado (ej: tupeleas.com)
- Cuentas: Stripe, PayPal, Supabase (o PostgreSQL)

## 🔧 Opción 1: VPS On-Demand (Recomendado para eventos ocasionales)

### Paso 1: Preparar Servidor

```bash
# Conectar al servidor
ssh root@tu-servidor-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y nodejs npm nginx postgresql docker.io docker-compose git
```

### Paso 2: Configurar Base de Datos

**Opción A: PostgreSQL Local**

```bash
# Crear base de datos
sudo -u postgres psql
CREATE DATABASE ppv_streaming;
CREATE USER ppv_user WITH PASSWORD 'tu-password-seguro';
GRANT ALL PRIVILEGES ON DATABASE ppv_streaming TO ppv_user;
\q
```

**Opción B: Supabase (Recomendado)**

1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Copiar DATABASE_URL del dashboard

### Paso 3: Clonar y Configurar Proyecto

```bash
# Clonar repositorio
cd /var/www
git clone https://github.com/tu-usuario/ppv-streaming.git
cd ppv-streaming

# Configurar backend
cd backend
cp .env.example .env
nano .env  # Editar con tus credenciales
npm install
npm run build

# Ejecutar migraciones
psql -U ppv_user -d ppv_streaming -f migrations/001_initial_schema.sql
```

### Paso 4: Configurar Nginx-RTMP

```bash
# Iniciar servicios de streaming
cd ../streaming
docker-compose up -d

# Verificar que está corriendo
docker ps
```

### Paso 5: Configurar Nginx como Reverse Proxy

```bash
# Crear configuración de Nginx
nano /etc/nginx/sites-available/ppv-streaming
```

Contenido:

```nginx
server {
    listen 80;
    server_name api.tupeleas.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name tupeleas.com www.tupeleas.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar configuración
ln -s /etc/nginx/sites-available/ppv-streaming /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Paso 6: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificados
certbot --nginx -d tupeleas.com -d www.tupeleas.com -d api.tupeleas.com
```

### Paso 7: Configurar PM2 para Backend

```bash
# Instalar PM2
npm install -g pm2

# Iniciar backend
cd /var/www/ppv-streaming/backend
pm2 start dist/server.js --name ppv-api

# Configurar autostart
pm2 startup
pm2 save
```

### Paso 8: Deploy Frontend Web

```bash
cd /var/www/ppv-streaming/webapp
cp .env.local.example .env.local
nano .env.local  # Configurar variables

npm install
npm run build

# Iniciar con PM2
pm2 start npm --name ppv-web -- start
pm2 save
```

---

## ☁️ Opción 2: Serverless (Costo mínimo sin eventos)

### Backend en Vercel/Railway

1. **Crear cuenta en Vercel**
   - Ir a https://vercel.com
   - Conectar repositorio de GitHub

2. **Configurar variables de entorno**
   - Agregar todas las variables de `.env.example`
   - DATABASE_URL de Supabase
   - Stripe y PayPal keys

3. **Deploy automático**
   - Vercel detecta Next.js/Node.js
   - Deploy automático en cada push

### Frontend en Vercel

1. **Nuevo proyecto en Vercel**
   - Seleccionar carpeta `webapp`
   - Framework: Next.js
   - Configurar variables de entorno

2. **Deploy**
   - Click en Deploy
   - Dominio personalizado en Settings

### Streaming en VPS On-Demand

1. **Crear Droplet en DigitalOcean**
   - Solo cuando hay evento
   - $0.06/hora = ~$0.50 por evento de 8 horas

2. **Script de inicio rápido:**

```bash
#!/bin/bash
# quick-start-streaming.sh

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clonar config
git clone https://github.com/tu-usuario/ppv-streaming.git
cd ppv-streaming/streaming

# Iniciar Nginx-RTMP
docker-compose up -d

echo "Streaming server ready!"
echo "RTMP URL: rtmp://$(curl -s ifconfig.me)/live"
```

3. **Destruir servidor después del evento**
   - Guardar grabaciones en S3/Spaces
   - Eliminar Droplet

---

## 🔐 Configuración de Webhooks

### Stripe

1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.tupeleas.com/api/payments/webhooks/stripe`
3. Eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copiar Webhook Secret a `.env`

### PayPal

1. Developer Dashboard → Webhooks
2. Add webhook: `https://api.tupeleas.com/api/payments/webhooks/paypal`
3. Eventos:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
4. Guardar

---

## 📊 Monitoreo

### Logs del Backend

```bash
# Ver logs en tiempo real
pm2 logs ppv-api

# Logs de Nginx-RTMP
docker logs ppv-streaming-nginx -f
```

### Métricas

```bash
# Estado de PM2
pm2 status

# Uso de recursos
pm2 monit

# Estadísticas de Nginx-RTMP
curl http://localhost:8080/stat
```

---

## 🔄 Actualizaciones

```bash
# Actualizar código
cd /var/www/ppv-streaming
git pull

# Backend
cd backend
npm install
npm run build
pm2 restart ppv-api

# Frontend
cd ../webapp
npm install
npm run build
pm2 restart ppv-web
```

---

## 💰 Estimación de Costos

### Configuración Económica

| Servicio | Costo Mensual | Costo por Evento |
|----------|---------------|------------------|
| Supabase (DB) | $0 (plan gratuito) | $0 |
| Vercel (Backend + Web) | $0 (plan gratuito) | $0 |
| VPS Streaming (on-demand) | $0 | ~$0.50 (8 horas) |
| BunnyCDN | $0 | ~$15-25 (300 viewers) |
| Dominio | ~$12/año | ~$1/mes |
| **TOTAL SIN EVENTOS** | **~$1/mes** | - |
| **TOTAL CON EVENTO** | - | **~$20-30** |

### Configuración VPS Permanente

| Servicio | Costo Mensual |
|----------|---------------|
| VPS 4GB (DigitalOcean) | $24/mes |
| Supabase | $0 |
| BunnyCDN | ~$10-20/evento |
| Dominio | ~$1/mes |
| **TOTAL** | **~$25-45/mes** |

---

## ✅ Checklist de Deployment

- [ ] Servidor configurado y actualizado
- [ ] Base de datos creada y migrada
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado y corriendo
- [ ] Frontend desplegado y corriendo
- [ ] Nginx-RTMP configurado
- [ ] SSL/HTTPS configurado
- [ ] Webhooks de Stripe configurados
- [ ] Webhooks de PayPal configurados
- [ ] Dominio apuntando correctamente
- [ ] Test de registro de usuario
- [ ] Test de creación de evento
- [ ] Test de pago (modo sandbox)
- [ ] Test de streaming con OBS
- [ ] Test de reproducción en web
- [ ] Monitoreo configurado

---

## 🆘 Troubleshooting

### Backend no inicia

```bash
# Ver logs
pm2 logs ppv-api --lines 100

# Verificar variables de entorno
cd /var/www/ppv-streaming/backend
cat .env

# Verificar conexión a DB
psql $DATABASE_URL -c "SELECT 1"
```

### Streaming no funciona

```bash
# Verificar Nginx-RTMP
docker ps
docker logs ppv-streaming-nginx

# Verificar puerto 1935
netstat -tulpn | grep 1935

# Test de RTMP
ffmpeg -re -i test.mp4 -c copy -f flv rtmp://localhost/live/test
```

### Pagos no procesan

1. Verificar keys de Stripe/PayPal en `.env`
2. Verificar webhooks configurados
3. Ver logs de webhooks en dashboard
4. Verificar que URL de webhook sea HTTPS

---

## 📞 Soporte

Para problemas de deployment:
1. Revisar logs
2. Verificar configuración
3. Consultar documentación oficial
4. Crear issue en GitHub

**¡Deployment exitoso! 🎉**
