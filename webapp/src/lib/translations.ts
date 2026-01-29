export type Language = 'es' | 'en';

export const translations = {
    es: {
        // Navbar
        nav: {
            home: 'Inicio',
            events: 'Eventos',
            promoters: 'Promotoras',
            about: 'Nosotros',
            login: 'Ingresar',
            profile: 'Mi Perfil',
            purchases: 'Mis Compras',
            admin: 'Panel Admin',
            promoter: 'Panel Promotora',
            logout: 'Cerrar Sesión',
        },
        // Footer
        footer: {
            description: 'La mejor plataforma para ver peleas en vivo. Acceso exclusivo a los eventos más emocionantes del deporte.',
            company: 'Compañía',
            legal: 'Legal',
            support: 'Soporte',
            newsletter: {
                title: 'Suscríbete a nuestro newsletter',
                description: 'Recibe notificaciones sobre próximos eventos y ofertas especiales.',
                placeholder: 'tu@email.com',
                success: '¡Gracias por suscribirte!',
            },
            rights: 'Todos los derechos reservados.',
            secure_payments: 'Pagos seguros con',
        },
        // General UI
        common: {
            loading: 'Cargando...',
            error: 'Ocurrió un error',
            close: 'Cerrar',
            save: 'Guardar',
        },
        // Home
        home: {
            welcome: 'Hola',
            subtitle: 'Bienvenido de nuevo a tu centro de combate.',
            featured: 'Destacado',
            watch_now: 'VER AHORA',
            view_details: 'VER DETALLES',
            upcoming_events: 'Próximos Eventos',
            view_all: 'Ver todos',
            settings: 'Configuración',
        }
    },
    en: {
        // Navbar
        nav: {
            home: 'Home',
            events: 'Events',
            promoters: 'Promoters',
            about: 'About Us',
            login: 'Login',
            profile: 'My Profile',
            purchases: 'My Purchases',
            admin: 'Admin Panel',
            promoter: 'Promoter Panel',
            logout: 'Logout',
        },
        // Footer
        footer: {
            description: 'The best platform to watch live fights. Exclusive access to the most exciting sports events.',
            company: 'Company',
            legal: 'Legal',
            support: 'Support',
            newsletter: {
                title: 'Subscribe to our newsletter',
                description: 'Receive notifications about upcoming events and special offers.',
                placeholder: 'you@email.com',
                success: 'Thank you for subscribing!',
            },
            rights: 'All rights reserved.',
            secure_payments: 'Secure payments with',
        },
        // General UI
        common: {
            loading: 'Loading...',
            error: 'An error occurred',
            close: 'Close',
            save: 'Save',
        },
        // Home
        home: {
            welcome: 'Hello',
            subtitle: 'Welcome back to your fight center.',
            featured: 'Featured',
            watch_now: 'WATCH NOW',
            view_details: 'VIEW DETAILS',
            upcoming_events: 'Upcoming Events',
            view_all: 'View all',
            settings: 'Settings',
        }
    }
};


export type TranslationKey = keyof typeof translations.es;
