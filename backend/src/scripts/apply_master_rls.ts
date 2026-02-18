import { query } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function applyMasterRLS() {
    try {
        console.log('🚀 Iniciando aplicación de Seguridad RLS Global...');

        const migrationPath = path.join(__dirname, '../../migrations', '028_global_rls_fix.sql');

        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ No se encontró el archivo de migración en: ${migrationPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('⏳ Ejecutando comandos SQL...');
        await query(sql);

        console.log('✅ Seguridad RLS Global aplicada con éxito en todas las tablas.');
        console.log('🔒 El sistema ahora está protegido contra accesos públicos no autorizados.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al aplicar la seguridad:', error);
        process.exit(1);
    }
}

applyMasterRLS();
