import { query } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function applySearchPathFix() {
    try {
        console.log('🚀 Iniciando corrección de Search Path Mutable...');

        const migrationPath = path.join(__dirname, '../../migrations', '029_fix_function_search_path.sql');

        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ No se encontró el archivo de migración en: ${migrationPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('⏳ Ejecutando comandos SQL...');
        await query(sql);

        console.log('✅ Search Path corregido con éxito en la función update_updated_at_column.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al aplicar la corrección:', error);
        process.exit(1);
    }
}

applySearchPathFix();
