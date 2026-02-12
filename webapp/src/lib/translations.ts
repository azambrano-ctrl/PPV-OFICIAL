export type Language = 'es' | 'en';

export const translations = {
    es: {
        // Navbar
        nav: {
            home: 'Inicio',
            events: 'Eventos',
            promoters: 'Promotoras',
            news: 'Noticias',
            about: 'Nosotros',
            login: 'Ingresar',
            profile: 'Mi Perfil',
            purchases: 'Mis Compras',
            admin: 'Panel Admin',
            promoter: 'Panel Promotora',
            logout: 'Cerrar Sesión',
        },
        roles: {
            admin: 'Administrador',
            promoter: 'Promotora',
            user: 'Usuario',
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
        // Watch
        watch: {
            buy_access: 'COMPRAR ACCESO',
            access_denied: 'Acceso Denegado',
            access_denied_desc: 'No tienes permiso para ver este evento. Asegúrate de haber iniciado sesión con la cuenta correcta.',
            preparing: 'Preparando tu asiento...',
            verifying: 'Verificando acceso y conectando con el servidor.',
            back_to_events: 'Volver a Eventos',
            back_to_home: 'Volver al Inicio',
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
        },
        // About
        about: {
            official: 'PPV Streaming Oficial',
            hero_description: 'La plataforma definitiva para descubrir, apoyar y vivir la pasión de las artes marciales mixtas en Ecuador.',
            mission_title: 'Nuestra Misión',
            mission_text: 'Somos la plataforma líder en Ecuador para la difusión de deportes de contacto, proporcionando una experiencia de streaming de primer nivel para fanáticos y atletas por igual.',
            history_title: 'Nuestra Historia',
            history_text: 'Arena Fight Pass nació al ver la necesidad de los deportistas que no tenían una plataforma propia donde mostrarse. Fuimos creados con el objetivo firme de apoyar el talento local y nacional, brindando ese espacio profesional que los guerreros ecuatorianos merecen para conectar con su público.',
            location_title: 'Nuestra Ubicación',
            location_text: 'Aunque nuestra plataforma es digital y llega a todo el mundo, nuestras raíces están en La Troncal, Ecuador. Operar desde el corazón de nuestro país nos permite entender y fortalecer el deporte desde su base.',
            active_users: 'Usuarios Activos',
            live_events: 'Eventos en Vivo',
            highlight_title: 'Vive la intensidad de cada golpe, en tiempo real.',
            define_title: 'Lo Que Nos Define',
            define_subtitle: 'Más que una plataforma de streaming, somos el hogar del MMA ecuatoriano.',
            values: {
                energy_title: 'Energía Pura',
                energy_desc: 'Capturamos la adrenalina del octágono. Transmisiones fluidas y de alta definición.',
                global_title: 'Proyección Global',
                global_desc: 'El talento ecuatoriano no tiene fronteras. Nuestra tecnología conecta con el mundo.',
                excellence_title: 'Excelencia',
                excellence_desc: 'Comprometidos con elevar el estándar de los eventos deportivos.',
            },
            cta_title: '¿Listo para la Acción?',
            cta_description: 'Únete hoy y sé parte de la revolución del deporte de combate en Latinoamérica.',
            register_now: 'Registrarse Ahora',
            view_upcoming: 'Ver Próximos Eventos',
        },
        // Promoters
        promoters: {
            title_part1: 'Nuestras',
            title_part2: 'Promotoras',
            description: 'Descubre las organizaciones que hacen posible el crecimiento del MMA en Ecuador y Latinoamérica.',
            search_placeholder: 'Buscar promotora por nombre...',
            loading: 'Cargando directorio...',
            default_desc: 'Esta promotora es parte de la red de Arena Fight Pass, llevando el deporte al siguiente nivel.',
            view_profile: 'Ver Perfil',
            not_found: 'No se encontraron promotoras',
            not_found_desc: 'Intenta buscar con otro nombre o vuelve más tarde.',
            join_title: '¿Quieres ser parte de nuestra red?',
            join_desc: 'Únete a Arena Fight Pass y lleva tus eventos de MMA a una audiencia global con la mejor tecnología de streaming.',
            register_button: 'Registrar mi Promotora',
        },
        // Landing Page (Guest)
        landing: {
            hero: {
                title_part1: 'VIVE LOS',
                title_part2: 'DEPORTES DE COMBATE',
                subtitle: 'Como nunca antes',
                view_events: 'VER EVENTOS',
                register: 'REGÍSTRATE AQUÍ',
                live_now: 'EN VIVO AHORA',
                free_pass: 'PASE LIBRE',
                from: 'Desde',
            },
            sections: {
                upcoming_title: 'Próximos Eventos',
                upcoming_subtitle: 'NO TE LO PIERDAS',
                view_all: 'VER TODO',
                view_all_mobile: 'VER TODOS LOS EVENTOS',
            },
            features: {
                quality_title: 'CALIDAD 4K',
                quality_desc: 'Transmisión en ultra alta definición con tecnología adaptativa para una experiencia sin interrupciones',
                secure_title: '100% SEGURO',
                secure_desc: 'Pagos protegidos con encriptación bancaria. Stripe y PayPal certificados',
                community_title: 'COMUNIDAD GLOBAL',
                community_desc: 'Chat en vivo con miles de fanáticos. Comparte la emoción en tiempo real',
            },
            cta: {
                title_part1: '¿LISTO PARA LA',
                title_part2: 'ACCIÓN?',
                subtitle: 'Únete a la comunidad más grande de fanáticos del combate. No te pierdas ni un solo momento.',
                explore: 'EXPLORAR EVENTOS',
            }
        },
        // Login Page
        login: {
            title_line1: 'INGRESA AL',
            title_line2: 'OCTÁGONO',
            welcome: 'Bienvenido',
            email_placeholder: 'CORREO ELECTRÓNICO',
            password_placeholder: 'CONTRASEÑA',
            submit: 'INGRESAR',
            loading: 'CARGANDO...',
            forgot_password: '¿Olvidaste tu contraseña?',
            social_divider: 'Acceso Social',
            no_account: '¿No tienes una cuenta?',
            register: 'Regístrate',
            register_promoter: 'REGÍSTRATE COMO PROMOTORA',
            welcome_back: '¡Bienvenido de vuelta!',
            login_error: 'Error al iniciar sesión',
        }
    },
    en: {
        // Navbar
        nav: {
            home: 'Home',
            events: 'Events',
            promoters: 'Promoters',
            news: 'News',
            about: 'About Us',
            login: 'Login',
            profile: 'My Profile',
            purchases: 'My Purchases',
            admin: 'Admin Panel',
            promoter: 'Promoter Panel',
            logout: 'Logout',
        },
        roles: {
            admin: 'Administrator',
            promoter: 'Promoter',
            user: 'User',
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
        // Watch
        watch: {
            buy_access: 'BUY ACCESS',
            access_denied: 'Access Denied',
            access_denied_desc: 'You do not have permission to view this event. Please make sure you are logged in with the correct account.',
            preparing: 'Preparing your seat...',
            verifying: 'Verifying access and connecting to the server.',
            back_to_events: 'Back to Events',
            back_to_home: 'Back to Home',
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
        },
        // About
        about: {
            official: 'Official PPV Streaming',
            hero_description: 'The ultimate platform to discover, support, and live the passion of mixed martial arts in Ecuador.',
            mission_title: 'Our Mission',
            mission_text: 'We are the leading platform in Ecuador for the broadcast of combat sports, providing a top-level streaming experience for fans and athletes alike.',
            history_title: 'Our History',
            history_text: 'Arena Fight Pass was born out of seeing the need for athletes who had no platform of their own to showcase themselves. We were created with the firm goal of supporting local and national talent, providing that professional space that Ecuadorian warriors deserve to connect with their audience.',
            location_title: 'Our Location',
            location_text: 'Although our platform is digital and reaches everyone, our roots are in La Troncal, Ecuador. Operating from the heart of our country allows us to understand and strengthen the sport from its base.',
            active_users: 'Active Users',
            live_events: 'Live Events',
            highlight_title: 'Experience the intensity of every strike, in real time.',
            define_title: 'What Defines Us',
            define_subtitle: 'More than a streaming platform, we are the home of Ecuadorian MMA.',
            values: {
                energy_title: 'Pure Energy',
                energy_desc: 'We capture the adrenaline of the octagon. Smooth and high-definition broadcasts.',
                global_title: 'Global Projection',
                global_desc: 'Ecuadorian talent has no borders. Our technology connects with the world.',
                excellence_title: 'Excellence',
                excellence_desc: 'Committed to raising the standard of sporting events.',
            },
            cta_title: 'Ready for Action?',
            cta_description: 'Join today and be part of the combat sports revolution in Latin America.',
            register_now: 'Register Now',
            view_upcoming: 'View Upcoming Events',
        },
        // Promoters
        promoters: {
            title_part1: 'Our',
            title_part2: 'Promoters',
            description: 'Discover the organizations that make the growth of MMA possible in Ecuador and Latin America.',
            search_placeholder: 'Search promoter by name...',
            loading: 'Loading directory...',
            default_desc: 'This promoter is part of the Arena Fight Pass network, taking the sport to the next level.',
            view_profile: 'View Profile',
            not_found: 'No promoters found',
            not_found_desc: 'Try searching with another name or come back later.',
            join_title: 'Want to be part of our network?',
            join_desc: 'Join Arena Fight Pass and take your MMA events to a global audience with the best streaming technology.',
            register_button: 'Register my Promoter',
        },
        // Landing Page (Guest)
        landing: {
            hero: {
                title_part1: 'EXPERIENCE',
                title_part2: 'COMBAT SPORTS',
                subtitle: 'Like never before',
                view_events: 'SEE EVENTS',
                register: 'REGISTER HERE',
                live_now: 'LIVE NOW',
                free_pass: 'FREE PASS',
                from: 'From',
            },
            sections: {
                upcoming_title: 'Upcoming Events',
                upcoming_subtitle: "DON'T MISS IT",
                view_all: 'SEE ALL',
                view_all_mobile: 'VIEW ALL EVENTS',
            },
            features: {
                quality_title: '4K QUALITY',
                quality_desc: 'Ultra high definition streaming with adaptive technology for a seamless experience',
                secure_title: '100% SECURE',
                secure_desc: 'Payments protected with bank-grade encryption. Stripe and PayPal certified',
                community_title: 'GLOBAL COMMUNITY',
                community_desc: 'Live chat with thousands of fans. Share the excitement in real time',
            },
            cta: {
                title_part1: 'READY FOR',
                title_part2: 'ACTION?',
                subtitle: 'Join the largest community of fight fans. Don\'t miss a single moment.',
                explore: 'EXPLORE EVENTS',
            }
        },
        // Login Page
        login: {
            title_line1: 'ENTER THE',
            title_line2: 'OCTAGON',
            welcome: 'Welcome',
            email_placeholder: 'EMAIL ADDRESS',
            password_placeholder: 'PASSWORD',
            submit: 'LOG IN',
            loading: 'LOADING...',
            forgot_password: 'Forgot your password?',
            social_divider: 'Social Login',
            no_account: 'Don\'t have an account?',
            register: 'Sign Up',
            register_promoter: 'REGISTER AS PROMOTER',
            welcome_back: 'Welcome back!',
            login_error: 'Login failed',
        }
    }
};




export type TranslationKey = keyof typeof translations.es;
