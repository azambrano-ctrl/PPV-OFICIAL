# PPV Streaming - Frontend Web

Aplicación web Next.js 14 para el sistema de streaming PPV.

## 🚀 Quick Start

### Instalación

```bash
npm install
```

### Configurar Variables de Entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Build para Producción

```bash
npm run build
npm start
```

## 📁 Estructura

```
webapp/
├── src/
│   ├── app/              # Pages (App Router)
│   │   ├── page.tsx      # Homepage ✅
│   │   ├── layout.tsx    # Root layout ✅
│   │   └── globals.css   # Global styles ✅
│   ├── components/       # React components
│   │   ├── Navbar.tsx    # Navigation ✅
│   │   └── Footer.tsx    # Footer ✅
│   └── lib/              # Utilities
│       ├── api.ts        # API client ✅
│       ├── store.ts      # Zustand stores ✅
│       ├── socket.ts     # Socket.io client ✅
│       └── utils.ts      # Helper functions ✅
├── public/               # Static assets
├── package.json
└── tailwind.config.ts
```

## ✅ Completado

- ✅ Configuración de Next.js 14
- ✅ TailwindCSS con tema personalizado
- ✅ API Client con refresh token
- ✅ State management (Zustand)
- ✅ Socket.io para chat
- ✅ Homepage con hero section
- ✅ Navbar responsive
- ✅ Footer completo

## 🚧 Pendiente

- [ ] Páginas de autenticación
- [ ] Catálogo de eventos
- [ ] Detalle de evento
- [ ] Reproductor de video
- [ ] Chat en vivo
- [ ] Panel de usuario
- [ ] Panel administrativo

## 🎨 Diseño

El diseño utiliza:
- Colores: Dark theme con acentos rojos (primary)
- Fuentes: Inter (sans) y Outfit (display)
- Animaciones: Framer Motion y CSS animations
- Componentes: Botones, cards, badges, inputs personalizados

## 📦 Dependencias Principales

- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Axios
- Zustand
- Socket.io-client
- Video.js
- Stripe.js
- React Hook Form
- Zod

## 🔗 API Endpoints

El frontend se conecta a:
- `http://localhost:5000/api` - Backend API
- `http://localhost:5000` - Socket.io WebSocket

Ver `src/lib/api.ts` para todos los endpoints disponibles.

## 📝 Notas

- El proyecto usa App Router de Next.js 14
- TypeScript estricto habilitado
- Componentes client-side marcados con 'use client'
- State management con Zustand (más ligero que Redux)
- Toast notifications con react-hot-toast
