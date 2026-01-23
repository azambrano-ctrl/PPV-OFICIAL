# 🥊 Sistema PPV de Streaming para Peleas

Plataforma completa de Pay-Per-View para transmitir peleas en vivo con monetización integrada. Incluye aplicación web, apps móviles (PWA), y panel administrativo.

## 🏗️ Arquitectura

**Optimizada para eventos ocasionales** - Paga solo cuando transmites:
- **Sin eventos**: ~$5-10/mes
- **Con evento**: ~$20-30 por evento
- **Escalable**: Soporta 200-500 espectadores simultáneos

### Stack Tecnológico

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (Supabase/PlanetScale)
- JWT Authentication
- Stripe + PayPal integration
- Socket.io para chat en vivo

**Frontend Web:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Video.js (HLS player)
- Zustand (state management)

**Mobile:**
- React Native + TypeScript
- React Navigation
- react-native-video
- Stripe React Native SDK

**Streaming:**
- Nginx-RTMP (on-demand VPS)
- HLS transcoding
- BunnyCDN distribution
- Token-based protection

## 📁 Estructura del Proyecto

```
ppv-streaming/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── routes/      # Endpoints REST
│   │   ├── models/      # Modelos de BD
│   │   ├── services/    # Lógica de negocio
│   │   ├── middleware/  # Auth, validation, etc.
│   │   └── config/      # Configuración
│   ├── migrations/      # Migraciones de BD
│   └── tests/           # Tests unitarios
│
├── webapp/              # Aplicación web Next.js
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # Componentes React
│   │   ├── lib/         # Utilidades
│   │   └── styles/      # CSS/Tailwind
│   └── public/          # Assets estáticos
│
├── mobile/              # App React Native
│   ├── src/
│   │   ├── screens/     # Pantallas
│   │   ├── components/  # Componentes
│   │   ├── navigation/  # React Navigation
│   │   └── services/    # API client
│   └── android/ios/     # Configuración nativa
│
├── streaming/           # Infraestructura de streaming
│   ├── nginx.conf       # Configuración Nginx-RTMP
│   ├── docker-compose.yml
│   └── scripts/         # Scripts de deployment
│
└── docs/                # Documentación
    ├── API.md           # Documentación de API
    ├── DEPLOYMENT.md    # Guía de deployment
    └── ENCODER_SETUP.md # Configuración de encoder
```

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+ y npm
- PostgreSQL 14+
- Docker (opcional, para desarrollo local)
- Cuenta Stripe (modo test)
- Cuenta PayPal Developer

### Instalación

1. **Clonar y configurar variables de entorno:**

```bash
cd ppv-streaming

# Backend
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install

# Web
cd ../webapp
cp .env.local.example .env.local
# Editar .env.local
npm install

# Mobile
cd ../mobile
npm install
```

2. **Inicializar base de datos:**

```bash
cd backend
npm run migrate
npm run seed  # Datos de prueba
```

3. **Iniciar servicios de desarrollo:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Web
cd webapp
npm run dev

# Terminal 3 - Mobile
cd mobile
npm start
```

4. **Acceder a la aplicación:**
- Web: http://localhost:3000
- API: http://localhost:5000
- Mobile: Escanear QR con Expo Go

## 📺 Configuración del Encoder

Para transmitir tus peleas, configura tu encoder (OBS Studio, vMix, etc.):

**RTMP URL:** `rtmp://tu-servidor.com/live`  
**Stream Key:** `[generado en panel admin]`

Ver guía completa en [docs/ENCODER_SETUP.md](docs/ENCODER_SETUP.md)

## 💳 Configuración de Pagos

### Stripe

1. Crear cuenta en https://stripe.com
2. Obtener API keys (modo test)
3. Configurar webhook endpoint: `https://tu-dominio.com/api/webhooks/stripe`
4. Agregar keys en `.env`

### PayPal

1. Crear cuenta en https://developer.paypal.com
2. Crear app en sandbox
3. Obtener Client ID y Secret
4. Configurar webhook endpoint: `https://tu-dominio.com/api/webhooks/paypal`
5. Agregar credenciales en `.env`

## 🔐 Seguridad

- ✅ JWT con refresh tokens
- ✅ Rate limiting en endpoints
- ✅ Validación de inputs (Zod)
- ✅ Sanitización SQL (prepared statements)
- ✅ CORS configurado
- ✅ Helmet.js para headers de seguridad
- ✅ Streams protegidos con tokens firmados

## 📱 Progressive Web App (PWA)

La aplicación web funciona como app nativa en móviles:
- ✅ Instalable en iOS/Android
- ✅ Funciona offline (caché de eventos)
- ✅ Notificaciones push
- ✅ Icono en home screen

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd webapp
npm test

# E2E tests
npm run test:e2e
```

## 📦 Deployment

Ver guía completa en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Opción 1: VPS (Recomendado para eventos ocasionales)

- DigitalOcean/Vultr: $40/mes
- Activar solo cuando hay eventos
- Guía de deployment automatizado incluida

### Opción 2: Serverless (Costo mínimo sin eventos)

- Backend: Vercel/Railway
- Base de datos: Supabase/PlanetScale
- Streaming: VPS on-demand

## 💰 Estimación de Costos

**Configuración económica (eventos ocasionales):**

| Servicio | Sin eventos | Con evento |
|----------|-------------|------------|
| Base de datos (Supabase) | $0-10/mes | $0-10/mes |
| Backend (Vercel) | $0 | $0 |
| Web hosting (Vercel) | $0 | $0 |
| VPS streaming (8h) | $0 | ~$0.50 |
| CDN (300 viewers) | $0 | ~$20 |
| Dominio | ~$1/mes | ~$1/mes |
| **TOTAL** | **~$5-10/mes** | **~$25-35/evento** |

**Ingresos por evento (ejemplo):**
- Precio: $10/espectador
- 200 espectadores = $2,000
- Comisiones Stripe (3%): -$60
- Costos infraestructura: -$30
- **Ganancia neta: ~$1,910** 🎉

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev          # Iniciar en modo desarrollo
npm run build        # Build para producción
npm run start        # Iniciar producción

# Base de datos
npm run migrate      # Ejecutar migraciones
npm run migrate:down # Revertir última migración
npm run seed         # Poblar con datos de prueba

# Testing
npm test             # Tests unitarios
npm run test:watch   # Tests en modo watch
npm run test:e2e     # Tests end-to-end

# Deployment
npm run deploy       # Deploy a producción
```

## 📖 Documentación

- [API Documentation](docs/API.md) - Endpoints y ejemplos
- [Deployment Guide](docs/DEPLOYMENT.md) - Guía de deployment
- [Encoder Setup](docs/ENCODER_SETUP.md) - Configurar OBS/vMix
- [Architecture](docs/ARCHITECTURE.md) - Diagramas y decisiones técnicas

## 🤝 Soporte

Para problemas o preguntas, consulta la documentación o crea un issue.

## 📄 Licencia

Propietario - Todos los derechos reservados
