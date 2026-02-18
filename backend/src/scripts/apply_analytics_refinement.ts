import { query } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function applyAnalyticsRefinement() {
    try {
        console.log('🚀 Iniciando refinamiento de seguridad en Analytics...');

        const migrationPath = path.join(__dirname, '../../migrations', '030_refine_analytics_rls.sql');

        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ No se encontró el archivo de migración en: ${migrationPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('⏳ Aplicando validación de Integridad Referencial en Políticas RLS...');
        await query(sql);

        console.log('✅ Política de analítica refinada correctamente.');
        console.log('🔒 Ahora solo se permiten registros vinculados a eventos válidos.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al aplicar el refinamiento:', error);
        process.exit(1);
    }
}

applyAnalyticsRefinement();
