# Backend API - PPV Streaming

Backend API para el sistema de streaming PPV construido con Node.js, Express, TypeScript y PostgreSQL.

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Instalación

1. **Instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
- Database URL (PostgreSQL o Supabase)
- JWT secrets
- Stripe keys
- PayPal credentials
- Email configuration

3. **Inicializar base de datos:**

```bash
# Ejecutar migraciones
psql -U postgres -d ppv_streaming -f migrations/001_initial_schema.sql

# Insertar datos de prueba (opcional)
psql -U postgres -d ppv_streaming -f migrations/002_seed_data.sql
```

4. **Iniciar servidor de desarrollo:**

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración (DB, logger)
│   ├── middleware/      # Middleware (auth, validation, errors)
│   ├── routes/          # Rutas de API
│   ├── services/        # Lógica de negocio
│   └── server.ts        # Punto de entrada
├── migrations/          # Migraciones SQL
├── tests/               # Tests
└── package.json
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión
- `POST /refresh` - Refrescar access token
- `GET /me` - Obtener perfil actual
- `PUT /profile` - Actualizar perfil
- `POST /change-password` - Cambiar contraseña
- `GET /purchases` - Historial de compras

### Events (`/api/events`)

- `GET /` - Listar eventos (con filtros)
- `GET /:id` - Obtener evento por ID
- `POST /` - Crear evento (admin)
- `PUT /:id` - Actualizar evento (admin)
- `DELETE /:id` - Eliminar evento (admin)
- `GET /:id/stats` - Estadísticas de evento (admin)
- `GET /:id/access` - Verificar acceso a evento
- `PATCH /:id/status` - Actualizar estado (admin)

### Payments (`/api/payments`)

- `POST /create` - Crear payment intent/order
- `POST /paypal/capture` - Capturar orden PayPal
- `POST /webhooks/stripe` - Webhook de Stripe
- `POST /webhooks/paypal` - Webhook de PayPal
- `POST /refund/:purchaseId` - Crear reembolso (admin)

### Streaming (`/api/streaming`)

- `GET /:id/token` - Obtener token de stream
- `GET /:id/url` - Obtener URL de stream
- `POST /:id/revoke` - Revocar tokens (admin)

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación:

```bash
# Incluir en headers
Authorization: Bearer <access_token>
```

Los tokens expiran en 15 minutos. Usa el refresh token para obtener uno nuevo.

## 💳 Integración de Pagos

### Stripe

1. Crear cuenta en https://stripe.com
2. Obtener API keys del dashboard
3. Configurar webhook endpoint: `https://tu-dominio.com/api/payments/webhooks/stripe`
4. Agregar eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

### PayPal

1. Crear app en https://developer.paypal.com
2. Obtener Client ID y Secret
3. Configurar webhook endpoint: `https://tu-dominio.com/api/payments/webhooks/paypal`
4. Agregar eventos: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

## 💬 Chat en Tiempo Real

El backend incluye Socket.io para chat en vivo durante eventos:

```javascript
// Cliente se conecta con token JWT
const socket = io('http://localhost:5000', {
  auth: { token: accessToken }
});

// Unirse a sala de evento
socket.emit('join_event', eventId);

// Enviar mensaje
socket.emit('send_message', { eventId, message: 'Hola!' });

// Recibir mensajes
socket.on('new_message', (data) => {
  console.log(data);
});
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📦 Build para Producción

```bash
# Compilar TypeScript
npm run build

# Iniciar en producción
npm start
```

## 🔧 Scripts Disponibles

- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm start` - Iniciar producción
- `npm test` - Ejecutar tests
- `npm run lint` - Linter
- `npm run format` - Formatear código
- `npm run migrate` - Ejecutar migraciones

## 🌍 Variables de Entorno

Ver `.env.example` para lista completa. Las más importantes:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ppv_streaming
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
```

## 📝 Logs

Los logs se guardan en:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

## 🚨 Manejo de Errores

Todos los errores se capturan y devuelven en formato JSON:

```json
{
  "success": false,
  "message": "Error message"
}
```

En desarrollo, también se incluye el stack trace.

## 🔒 Seguridad

- ✅ Helmet.js para headers de seguridad
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Validación de inputs con Zod
- ✅ Prepared statements (SQL injection protection)
- ✅ Password hashing con bcrypt
- ✅ JWT con expiración

## 📚 Documentación Adicional

Ver carpeta `docs/` para:
- Arquitectura detallada
- Guía de deployment
- Ejemplos de uso de API
