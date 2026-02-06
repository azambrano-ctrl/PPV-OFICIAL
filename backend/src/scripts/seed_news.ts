import { query } from '../config/database';

const adminId = 'e5a029b5-6f6a-4d2f-9f5f-8d1219e49e6e';

const newsItems = [
    {
        title: 'Calendario TFL 2026: Nueve eventos confirmados para un año histórico',
        slug: 'tfl-calendario-2026-nueve-eventos-mma-ecuador',
        content: 'La promotora Troncal Fight League (TFL) ha sacudido el panorama del MMA nacional al anunciar su ambicioso calendario para el 2026. Con un total de nueve eventos programados a lo largo del año, la organización busca consolidar su presencia en diversas ciudades del país. Estos eventos no solo prometen careos de alto nivel, sino que también servirán como plataforma para que los guerreros locales acumulen la experiencia necesaria para el salto internacional. El primero de estos nueve encuentros se llevará a cabo a finales de febrero en La Troncal.',
        excerpt: 'TFL anuncia un calendario sin precedentes con 9 eventos confirmados para 2026, reafirmando su rol clave en el desarrollo del MMA en Ecuador.',
        category: 'Nacional',
        status: 'published',
        is_featured: true,
        thumbnail_url: 'https://cdn.millions.co/stream/83ef170d-609f-4f51-9e25-6c23ebb2e9a9-1723045236730.png'
    },
    {
        title: 'Chito Vera regresa al octágono: Duelo confirmado contra David Martínez en CDMX',
        slug: 'chito-vera-david-martinez-ufc-mexico-2026',
        content: 'El máximo referente del MMA ecuatoriano, Marlon "Chito" Vera, tiene fecha de retorno. El próximo 28 de febrero de 2026, Vera se enfrentará al emergente mexicano David Martínez en el UFC Fight Night que se llevará a cabo en la Arena CDMX. Tras un 2025 de aprendizaje, el manabita busca consolidar su posición en el top 10 y enfilarse nuevamente hacia una oportunidad por el título. Martínez, conocido como "Black Spartan", llega con una racha de victorias que promete un choque de estilos explosivo en la altura de la capital mexicana.',
        excerpt: 'Marlon "Chito" Vera se enfrentará a David Martínez el 28 de febrero en Ciudad de México, un combate clave para las aspiraciones del ecuatoriano en el peso gallo.',
        category: 'UFC',
        status: 'published',
        is_featured: true,
        thumbnail_url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2000&auto=format&fit=crop'
    },
    {
        title: 'Michael Morales alcanza el Top 3 mundial: El ascenso imparable del guerrero de Pasaje',
        slug: 'michael-morales-top-3-ufc-peso-welter',
        content: 'Michael Morales sigue haciendo historia para el deporte ecuatoriano. A partir de febrero de 2026, el peleador orense ha sido escalado al puesto número 3 del ranking oficial de peso wélter de la UFC. Con un récord invicto de 19-0, Morales se posiciona como el contendiente más peligroso de la división. Se rumorea que su próximo desafío podría ser contra Jack Della Maddalena, en lo que muchos especialistas consideran una "eliminatoria por el título". El mundo del MMA tiene los ojos puestos en el talento y la potencia del joven de 26 años.',
        excerpt: 'El ecuatoriano Michael Morales ya es el tercer mejor peleador de peso wélter del mundo en la UFC, manteniendo su invicto histórico de 19-0.',
        category: 'UFC',
        status: 'published',
        is_featured: true,
        thumbnail_url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop'
    },
    {
        title: 'MMA en Ecuador: Arena Fight Pass se consolida como la plataforma líder para el combate',
        slug: 'arena-fight-pass-ecuador-lider-mma-local',
        content: 'Arena Fight Pass no solo es la plataforma de mayor crecimiento en Ecuador, sino que se ha convertido en el destino natural para los fanáticos que buscan seguir a los peleadores que aspiran a llegar a las ligas internacionales. Con eventos de alta producción y una tecnología de streaming de nivel profesional, Arena Fight Pass ofrece la ventana ideal para que los prospectos nacionales muestren su talento al mundo. En este 2026, la plataforma planea expandir sus fronteras transmitiendo más eventos exclusivos y contenido tras bastidores que antes no estaba disponible.',
        excerpt: 'Arena Fight Pass reafirma su compromiso de elevar el nivel de la difusión del MMA en Ecuador, sirviendo de puente directo para los fanáticos y talentos nacionales.',
        category: 'Arena FP',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://cdn.millions.co/media-post/jorge-yepez-mma-image-1723626197406-0.png'
    },
    {
        title: 'Análisis UFC 325: Los resultados que cambiaron el panorama divisionario',
        slug: 'analisis-resultados-ufc-325-enero-2026',
        content: 'El evento UFC 325 celebrado el pasado 31 de enero dejó sorpresas mayúsculas en las divisiones de peso ligero y pluma. Con nocauts espectaculares y sumisiones técnicas, la cartelera cumplió con las expectativas de los fans. En la pelea estelar, vimos una defensa de título dominante que solidifica un nuevo legado. Para los fans en Ecuador, el evento fue seguido masivamente vía streaming, demostrando que la cultura del PPV y las artes marciales mixtas está más viva que nunca en el país.',
        excerpt: 'Un repaso detallado por lo mejor del UFC 325, evento que marcó el inicio de un año cargado de acción en el octágono.',
        category: 'Resultados',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1511886929837-3e117449bc94?q=80&w=1974&auto=format&fit=crop'
    },
    {
        title: 'Arena Fight Pass: Confirmada la Noche de Campeones con Transmisión Global',
        slug: 'arena-fight-pass-noche-campeones-marzo-2026',
        content: 'La espera terminó. Arena Fight Pass anuncia oficialmente su evento estelar para el mes de marzo. La cartelera contará con peleas de alto nivel y el regreso de veteranos muy queridos por la afición. Los boletos y el acceso PPV estarán disponibles próximamente a través de nuestra plataforma oficial. Prepárate para una noche de adrenalina pura donde el honor y el cinturón estarán en juego, todo desde la comodidad de tu hogar.',
        excerpt: 'Vuelve la acción a la pantalla con una cartelera explosiva que definirá a los nuevos monarcas del combate regional.',
        category: 'Arena FP',
        status: 'published',
        is_featured: true,
        thumbnail_url: 'https://cdn.millions.co/video-edit-request/247e1e14-d38d-4ed8-b970-b5fa3f93d3c0-0.jpg'
    },
    {
        title: 'UFC México Preview: ¿Qué esperar del choque Vera vs Martínez?',
        slug: 'ufc-mexico-2026-preview-chito-vera-david-martinez-analisis',
        content: 'La Arena CDMX retumbará este 28 de febrero con el enfrentamiento entre Marlon Vera y David Martínez. Vera goza de la experiencia necesaria en combates de cinco asaltos y una resistencia cardiovascular envidiable, mientras que Martínez, peleando en su casa, cuenta con el factor sorpresa y una velocidad de manos notable. El análisis técnico sugiere que quien controle la distancia en los primeros minutos tendrá la ventaja psicológica en este combate vital para el ranking gallo.',
        excerpt: 'Análisis profundo previo a la gran batalla de "Chito" Vera en México: fortalezas, debilidades y predicciones.',
        category: 'UFC',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2000&auto=format&fit=crop'
    },
    {
        title: 'Resultados Arena FP Open: Nuevos talentos emergen en la Sierra Norte',
        slug: 'resultados-arena-fp-open-sierra-norte-nuevos-talentos-mma',
        content: 'La reciente parada del Open Regional en la región norte del país superó todas las expectativas. Descubrimos jóvenes con una base de lucha impresionante y un striking muy pulido para su edad. Varios de estos competidores han recibido apoyo para integrarse a los campamentos principales y escalar hacia las carteleras estelares. El MMA descentralizado está rindiendo frutos y el futuro del deporte en Ecuador luce brillante y diverso.',
        excerpt: 'Resumen de lo vivido en la eliminatoria regional: la cantera del MMA ecuatoriano demuestra que tiene piezas de sobra para exportar.',
        category: 'Resultados',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://cdn.millions.co/athlete/29a08485-fa45-45e1-8b01-8994c2e55d77-1722535665450.jpg'
    }
];

async function seedNews() {
    try {
        console.log('🌱 Seeding 15 news articles...');

        for (const post of newsItems) {
            await query(
                `INSERT INTO news_posts (
                    title, slug, content, excerpt, category, thumbnail_url, banner_url,
                    author_id, status, is_featured, meta_title, meta_description
                ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (slug) DO NOTHING`,
                [
                    post.title,
                    post.slug,
                    post.content,
                    post.excerpt,
                    post.category,
                    post.thumbnail_url,
                    adminId,
                    post.status,
                    post.is_featured,
                    post.title,
                    post.excerpt
                ]
            );
            console.log(`✅ Seeded: ${post.title}`);
        }

        console.log('🚀 Seeding completed successfully!');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error seeding news:', error.message);
        process.exit(1);
    }
}

seedNews();
