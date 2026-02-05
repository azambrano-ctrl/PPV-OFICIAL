import { query } from '../config/database';

const adminId = 'e5a029b5-6f6a-4d2f-9f5f-8d1219e49e6e';

const newsItems = [
    {
        title: 'Chito Vera regresa al octágono: Duelo confirmado contra David Martínez en CDMX',
        slug: 'chito-vera-david-martinez-ufc-mexico-2026',
        content: 'El máximo referente del MMA ecuatoriano, Marlon "Chito" Vera, tiene fecha de retorno. El próximo 28 de febrero de 2026, Vera se enfrentará al emergente mexicano David Martínez en el UFC Fight Night que se llevará a cabo en la Arena CDMX. Tras un 2025 de aprendizaje, el manabita busca consolidar su posición en el top 10 y enfilarse nuevamente hacia una oportunidad por el título. Martínez, conocido como "Black Spartan", llega con una racha de victorias que promete un choque de estilos explosivo en la altura de la capital mexicana.',
        excerpt: 'Marlon "Chito" Vera se enfrentará a David Martínez el 28 de febrero en Ciudad de México, un combate clave para las aspiraciones del ecuatoriano en el peso gallo.',
        category: 'UFC',
        status: 'published',
        is_featured: true,
        thumbnail_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image_xl/s3/2024-03/030924-UFC-299-Chito-Vera-Hero.jpg?itok=3v_9V_eJ'
    },
    {
        title: 'Michael Morales alcanza el Top 3 mundial: El ascenso imparable del guerrero de Pasaje',
        slug: 'michael-morales-top-3-ufc-peso-welter',
        content: 'Michael Morales sigue haciendo historia para el deporte ecuatoriano. A partir de febrero de 2026, el peleador orense ha sido escalado al puesto número 3 del ranking oficial de peso wélter de la UFC. Con un récord invicto de 19-0, Morales se posiciona como el contendiente más peligroso de la división. Se rumorea que su próximo desafío podría ser contra Jack Della Maddalena, en lo que muchos especialistas consideran una "eliminatoria por el título". El mundo del MMA tiene los ojos puestos en el talento y la potencia del joven de 26 años.',
        excerpt: 'El ecuatoriano Michael Morales ya es el tercer mejor peleador de peso wélter del mundo en la UFC, manteniendo su invicto histórico de 19-0.',
        category: 'UFC',
        status: 'published',
        is_featured: true,
        thumbnail_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image_xl/s3/2024-08/100424-UFC-307-Morales-Hero.jpg?itok=yTzRzV9_'
    },
    {
        title: 'MMA en Ecuador: TFL se consolida como el semillero oficial para la UFC',
        slug: 'tfl-ecuador-semillero-ufc-mma-local',
        content: 'La Tournament Fighting League (TFL) no solo es la liga de mayor crecimiento en Ecuador, sino que se ha convertido en el camino natural para los peleadores que aspiran a llegar a las ligas internacionales. Con eventos de alta producción y un arbitraje de nivel profesional, la TFL ofrece la plataforma ideal para que los prospectos nacionales ganen experiencia real bajo las reglas unificadas de MMA. En este 2026, la liga planea expandir sus fronteras con el "TFL Open", buscando talentos en provincias que antes no tenían acceso a la competición profesional.',
        excerpt: 'La liga TFL reafirma su compromiso de elevar el nivel del MMA en Ecuador, sirviendo de puente directo para los futuros talentos continentales.',
        category: 'TFL',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://tfl-latam.com/wp-content/uploads/2023/07/TFL-1.jpg'
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
        title: 'Guía de Reglas: ¿Cómo puntúan los jueces las peleas de MMA?',
        slug: 'guia-reglas-puntuacion-mma-jueces-10-9',
        content: 'Entender el sistema de puntuación de 10 puntos obligatorios es fundamental para cualquier fan de las MMA. Los jueces evalúan el golpeo efectivo, el grappling dominante, la agresividad y el control del octágono. Un asalto 10-9 es lo estándar para una victoria clara, mientras que un 10-8 denota una dominación total. Esta guía técnica explica por qué a veces las decisiones de los jueces pueden ser polémicas y qué criterios deben prevalecer según las últimas actualizaciones de las reglas unificadas.',
        excerpt: 'Aprende cómo funciona el arbitraje en las MMA para disfrutar mejor de los eventos de la TFL y la UFC.',
        category: 'Educación',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.oracle.com/content/dam/oracle-www/content-images/content/fighting-rules.jpg'
    },
    {
        title: 'Gimnasios Recomendados: Dónde empezar a entrenar MMA en Guayaquil y Quito',
        slug: 'mejores-gimnasios-mma-ecuador-guayaquil-quito',
        content: 'El auge de Chito Vera y Michael Morales ha despertado el interés de miles de jóvenes ecuatorianos por las artes marciales. Desde academias de renombre en Guayaquil especializadas en Muay Thai y BJJ, hasta centros de alto rendimiento en Quito, Ecuador cuenta con infraestructuras de primer nivel. Es importante buscar instructores certificados y ambientes que prioricen la seguridad del alumno. Aquí te presentamos una lista de los Dojos donde se están forjando los futuros campeones de la TFL.',
        excerpt: 'Si buscas dar tus primeros pasos en el octágono, te mostramos los mejores lugares para entrenar MMA profesionalmente en Ecuador.',
        category: 'Local',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Nutrición para Peleadores: El secreto del corte de peso seguro',
        slug: 'nutricion-mma-corte-peso-saludable-tfl',
        content: 'El peso es el primer rival de cualquier peleador. En la TFL promovemos cortes de peso responsables bajo supervisión médica. Una dieta rica en macro y micronutrientes, junto con una hidratación estratégica, permite que el atleta llegue al pesaje oficial sin comprometer su salud ni su rendimiento en la jaula. En este artículo, expertos en nutrición deportiva comparten consejos sobre qué comer durante el campamento de entrenamiento y cómo recuperar energías después de la báscula.',
        excerpt: 'Descubre cómo los profesionales manejan su alimentación para dar el peso exacto y mantener la potencia máxima.',
        category: 'Salud',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2071&auto=format&fit=crop'
    },
    {
        title: 'TFL 14: Confirmada la Noche de Campeones en Guayaquil',
        slug: 'tfl-14-noche-campeones-guayaquil-marzo-2026',
        content: 'La espera terminó. La liga TFL anuncia oficialmente su evento número 14 para el mes de marzo en la ciudad de Guayaquil. La cartelera contará con dos peleas por el título y el regreso de veteranos muy queridos por la afición. Los boletos y el acceso PPV estarán disponibles próximamente a través de nuestra plataforma oficial. Prepárate para una noche de adrenalina pura donde el honor y el cinturón estarán en juego.',
        excerpt: 'Vuelve la mayor liga de MMA del país con una cartelera explosiva que definirá a los nuevos monarcas de la jaula local.',
        category: 'TFL',
        status: 'published',
        is_featured: true,
        thumbnail_url: 'https://tfl-latam.com/wp-content/uploads/2023/07/TFL-2.jpg'
    },
    {
        title: 'La Historia de Michael Morales: De Pasaje a la Cima del Mundo',
        slug: 'biografia-michael-morales-ecuador-ufc',
        content: 'Michael Morales no llegó a la UFC por casualidad. Su historia nace en los cantones de El Oro, donde bajo la guía de sus padres (ambos con trayectoria en deportes de combate) comenzó a forjar su disciplina. Desde sus peleas en eventos regionales en Ecuador hasta su debut soñado en el Dana White\'s Contender Series, este artículo recorre el sacrificio y la humildad que lo han llevado a estar hoy entre los cinco mejores del planeta. Un ejemplo de perseverancia para toda la juventud ecuatoriana.',
        excerpt: 'Un viaje inspirador por la vida de Michael Morales, el peleador invicto que está redefiniendo el MMA latinoamericano.',
        category: 'Perfiles',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1517438476312-10d79c67750d?q=80&w=2034&auto=format&fit=crop'
    },
    {
        title: 'MMA Femenil en Ascenso: Las guerreras que dominan la jaula en Ecuador',
        slug: 'mma-femenino-ecuador-tfl-estrellas-ascendentes',
        content: 'El talento femenino en las artes marciales mixtas de Ecuador está viviendo su mejor momento. Peleadoras técnicas con un corazón inmenso están protagonizando las carteleras de la TFL y ganando espacios en ligas internacionales. Analizamos el crecimiento de las divisiones de peso paja y mosca, y cómo el apoyo de los gimnasios locales ha permitido que más mujeres vean en el MMA un camino profesional viable y respetado.',
        excerpt: 'El poder femenino llega con fuerza al octágono: conoce a las peleadoras que están rompiendo esquemas en el país.',
        category: 'Local',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1518608453480-106ea46f414e?q=80&w=1964&auto=format&fit=crop'
    },
    {
        title: 'Jason Parillo y el Team Vera: El equipo detrás del éxito de "Chito"',
        slug: 'jason-parillo-team-vera-entrenamiento-chito',
        content: 'Nadie llega a la cima solo. Marlon Vera ha encontrado en el RVCA Training Center de California y en su entrenador Jason Parillo, la fórmula perfecta para pulir su boxeo y su estrategia. Este reportaje detalla cómo trascurre un día de campamento de Chito, la importancia de su equipo de recuperación y cómo la mentalidad de campeón se cultiva en cada sesión de sparring. No es solo pelear, es ajedrez humano al más alto nivel.',
        excerpt: 'Entramos al campamento de entrenamiento de Marlon Vera para descubrir cómo se prepara el máximo exponente del MMA nacional.',
        category: 'Perfiles',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'Previas del Mes: Combates imperdibles en el calendario TFL 2026',
        slug: 'previas-combates-mma-tfl-marzo-abril-2026',
        content: 'El 2026 arrancó con todo y los próximos meses prometen no dar respiro. En la liga TFL, estamos monitoreando de cerca el choque de pesos pesados que podría definir al próximo contendiente número uno. Además, la división bantamweight está al rojo vivo con la llegada de talentos internacionales. Mantente conectado a nuestra sección de noticias para no perderte ni un solo detalle de los careos y pesajes oficiales que publicamos semanalmente.',
        excerpt: 'Prepara tu agenda: estos son los enfrentamientos que todo fan de las MMA en Ecuador debe seguir de cerca.',
        category: 'Resultados',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1517438322307-e67111335cb3?q=80&w=2040&auto=format&fit=crop'
    },
    {
        title: 'Tutorial: Cómo comprar y ver eventos en PPV Oficial',
        slug: 'tutorial-compra-acceso-ppv-oficial-eventos-envivo',
        content: 'Disfrutar de la TFL y los mejores eventos de MMA es más fácil que nunca. En nuestra plataforma, puedes registrarte en segundos y adquirir tu acceso digital mediante Stripe o PayPal. Una vez realizada la compra, tendrás acceso inmediato al streaming en alta definición, chat en vivo y reacciones animadas. Este tutorial paso a paso te guía desde el registro hasta la visualización en tu Smart TV o dispositivo móvil, asegurando que no te pierdas ni un golpe.',
        excerpt: 'Guía rápida para usuarios nuevos: accede a la mejor experiencia del streaming de combate en un par de clics.',
        category: 'Educación',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2070&auto=format&fit=crop'
    },
    {
        title: 'UFC México Preview: ¿Qué esperar del choque Vera vs Martínez?',
        slug: 'ufc-mexico-2026-preview-chito-vera-david-martinez-analisis',
        content: 'La Arena CDMX retumbará este 28 de febrero con el enfrentamiento entre Marlon Vera y David Martínez. Vera goza de la experiencia necesaria en combates de cinco asaltos y una resistencia cardiovascular envidiable, mientras que Martínez, peleando en su casa, cuenta con el factor sorpresa y una velocidad de manos notable. El análisis técnico sugiere que quien controle la distancia en los primeros minutos tendrá la ventaja psicológica en este combate vital para el ranking gallo.',
        excerpt: 'Análisis profundo previo a la gran batalla de "Chito" Vera en México: fortalezas, debilidades y predicciones.',
        category: 'UFC',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://dmxg5wxfqgb4u.cloudfront.net/styles/background_image_xl/s3/2024-03/030924-UFC-299-Vera-vs-O-Malley-Hero.jpg?itok=5z_z_z'
    },
    {
        title: 'Resultados TFL Open: Nuevos talentos emergen en la Sierra Norte',
        slug: 'resultados-tfl-open-sierra-norte-nuevos-talentos-mma',
        content: 'La reciente parada del TFL Open en la región norte del país superó todas las expectativas. Descubrimos jóvenes con una base de lucha impresionante y un striking muy pulido para su edad. Varios de estos competidores han recibido contratos de formación para integrarse a los campamentos principales y escalar hacia la cartelera estelar de la TFL. El MMA descentralizado está rindiendo frutos y el futuro del deporte en Ecuador luce brillante y diverso.',
        excerpt: 'Resumen de lo vivido en la eliminatoria regional: la cantera del MMA ecuatoriano demuestra que tiene piezas de sobra para exportar.',
        category: 'Resultados',
        status: 'published',
        is_featured: false,
        thumbnail_url: 'https://images.unsplash.com/photo-1511871182292-9c9457b7849e?q=80&w=2070&auto=format&fit=crop'
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
