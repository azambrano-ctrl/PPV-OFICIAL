/**
 * migrate-supabase-to-r2.ts
 *
 * Migra todos los archivos de Supabase Storage → Cloudflare R2
 * y actualiza las URLs en la base de datos.
 *
 * Uso:
 *   npx ts-node src/scripts/migrate-supabase-to-r2.ts
 *
 * Variables de entorno necesarias (agregar al .env):
 *   SUPABASE_PROJECT_ID=iwomwolzxtrzjulesnjb
 *   SUPABASE_SERVICE_KEY=<service_role key del proyecto de storage>
 *   R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID=<r2 access key>
 *   R2_SECRET_ACCESS_KEY=<r2 secret key>
 *   R2_BUCKET_NAME=<nombre del bucket R2>
 *   R2_PUBLIC_URL=https://<tu-dominio-r2>.r2.dev  (o dominio custom)
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'iwomwolzxtrzjulesnjb';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_STORAGE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1`;
const SUPABASE_BUCKET = 'uploads';

const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

// Columnas de imágenes a actualizar (tabla → columnas)
const IMAGE_COLUMNS: Record<string, string[]> = {
    events: ['thumbnail_url', 'banner_url', 'trailer_url'],
    fighters: ['profile_image_url', 'banner_image_url'],
    news_posts: ['thumbnail_url', 'banner_url'],
    promoters: ['logo_url', 'banner_url'],
    recordings: ['file_url'],
    settings: [
        'site_logo',
        'login_background_url',
        'sponsor_image',
        'about_history_image_1',
        'about_history_image_2',
        'about_history_image_3',
    ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isSupabaseUrl(url: string | null): boolean {
    return !!url && url.includes(`${SUPABASE_PROJECT_ID}.supabase.co`);
}

function extractFilePathFromUrl(url: string): string {
    // https://iwomwolzxtrzjulesnjb.supabase.co/storage/v1/object/public/uploads/FILENAME
    const marker = `/object/public/${SUPABASE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return '';
    return url.substring(idx + marker.length);
}

function buildR2Url(filePath: string): string {
    return `${R2_PUBLIC_URL}/${filePath}`;
}

// ─── R2 Client ───────────────────────────────────────────────────────────────
const r2 = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

async function fileExistsInR2(key: string): Promise<boolean> {
    try {
        await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
    }));
}

// ─── Supabase list files ──────────────────────────────────────────────────────
async function listSupabaseFiles(prefix = ''): Promise<string[]> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (SUPABASE_SERVICE_KEY) headers['Authorization'] = `Bearer ${SUPABASE_SERVICE_KEY}`;

    const res = await axios.post(
        `${SUPABASE_STORAGE_URL}/object/list/${SUPABASE_BUCKET}`,
        { prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } },
        { headers }
    );

    const files: string[] = [];
    for (const item of res.data) {
        if (item.id) {
            // It's a file
            files.push(prefix ? `${prefix}/${item.name}` : item.name);
        } else {
            // It's a folder — recurse
            const subPath = prefix ? `${prefix}/${item.name}` : item.name;
            const subFiles = await listSupabaseFiles(subPath);
            files.push(...subFiles);
        }
    }
    return files;
}

// ─── Download from Supabase ───────────────────────────────────────────────────
async function downloadFromSupabase(filePath: string): Promise<{ buffer: Buffer; contentType: string }> {
    const headers: Record<string, string> = {};
    if (SUPABASE_SERVICE_KEY) headers['Authorization'] = `Bearer ${SUPABASE_SERVICE_KEY}`;

    const url = `${SUPABASE_STORAGE_URL}/object/${SUPABASE_BUCKET}/${filePath}`;
    const res = await axios.get(url, { responseType: 'arraybuffer', headers });
    return {
        buffer: Buffer.from(res.data),
        contentType: res.headers['content-type'] || 'application/octet-stream',
    };
}

// ─── Main migration ───────────────────────────────────────────────────────────
async function migrate() {
    // Validate config
    const missing = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']
        .filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error(`\n❌ Faltan variables de entorno: ${missing.join(', ')}`);
        console.error('   Agrega estas variables a .env (local) y a Render Dashboard (producción)\n');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    console.log('\n🚀 Iniciando migración Supabase Storage → Cloudflare R2\n');
    console.log(`   Supabase bucket : ${SUPABASE_BUCKET} (${SUPABASE_PROJECT_ID})`);
    console.log(`   R2 bucket       : ${R2_BUCKET}`);
    console.log(`   R2 public URL   : ${R2_PUBLIC_URL}\n`);

    // 1. Collect all Supabase URLs from the database
    console.log('📋 Buscando URLs de Supabase en la base de datos...');
    const urlMap = new Map<string, string>(); // supabase_url → r2_url

    for (const [table, columns] of Object.entries(IMAGE_COLUMNS)) {
        const cols = columns.join(', ');
        try {
            const { rows } = await pool.query(`SELECT ${cols} FROM ${table}`);
            for (const row of rows) {
                for (const col of columns) {
                    const val: string | null = row[col];
                    if (!val) continue;

                    // Handle JSON arrays (e.g. about_slider_images)
                    if (val.startsWith('[')) {
                        try {
                            const arr: string[] = JSON.parse(val);
                            for (const u of arr) {
                                if (isSupabaseUrl(u)) {
                                    const fp = extractFilePathFromUrl(u);
                                    if (fp) urlMap.set(u, buildR2Url(fp));
                                }
                            }
                        } catch { /* not valid JSON */ }
                    } else if (isSupabaseUrl(val)) {
                        const fp = extractFilePathFromUrl(val);
                        if (fp) urlMap.set(val, buildR2Url(fp));
                    }
                }
            }
        } catch (e: any) {
            console.warn(`   ⚠️  Tabla ${table}: ${e.message}`);
        }
    }

    console.log(`   Encontradas ${urlMap.size} URLs de Supabase en la BD\n`);

    // 2. Download & upload each file
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const [supabaseUrl, r2Url] of urlMap.entries()) {
        const filePath = extractFilePathFromUrl(supabaseUrl);
        const r2Key = filePath;

        process.stdout.write(`   📦 ${filePath.substring(0, 60)}... `);

        try {
            // Skip if already in R2
            if (await fileExistsInR2(r2Key)) {
                console.log('✅ ya existe');
                skipped++;
                continue;
            }

            const { buffer, contentType } = await downloadFromSupabase(filePath);
            await uploadToR2(r2Key, buffer, contentType);
            console.log(`✅ subido (${(buffer.length / 1024).toFixed(0)} KB)`);
            migrated++;
        } catch (e: any) {
            console.log(`❌ error: ${e.message}`);
            errors++;
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n📊 Archivos: ${migrated} subidos, ${skipped} ya existían, ${errors} errores\n`);

    // 3. Update URLs in the database
    if (migrated + skipped > 0) {
        console.log('🔄 Actualizando URLs en la base de datos...');
        let updated = 0;

        for (const [table, columns] of Object.entries(IMAGE_COLUMNS)) {
            for (const col of columns) {
                try {
                    // Handle JSON array columns
                    if (col === 'about_slider_images') {
                        const { rows } = await pool.query(`SELECT id, ${col} FROM ${table} WHERE ${col} IS NOT NULL`);
                        for (const row of rows) {
                            try {
                                const arr: string[] = JSON.parse(row[col]);
                                const newArr = arr.map(u => urlMap.get(u) || u);
                                if (JSON.stringify(arr) !== JSON.stringify(newArr)) {
                                    await pool.query(`UPDATE ${table} SET ${col} = $1 WHERE id = $2`, [JSON.stringify(newArr), row.id]);
                                    updated++;
                                }
                            } catch { /* skip */ }
                        }
                        continue;
                    }

                    // Regular URL columns — update all Supabase URLs in one pass
                    const { rowCount } = await pool.query(`
                        UPDATE ${table}
                        SET ${col} = REPLACE(${col}, $1, $2)
                        WHERE ${col} LIKE $3
                    `, [
                        `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${SUPABASE_BUCKET}/`,
                        `${R2_PUBLIC_URL}/`,
                        `%${SUPABASE_PROJECT_ID}.supabase.co%`,
                    ]);
                    if ((rowCount ?? 0) > 0) {
                        console.log(`   ✅ ${table}.${col}: ${rowCount} filas actualizadas`);
                        updated += rowCount ?? 0;
                    }
                } catch (e: any) {
                    console.warn(`   ⚠️  ${table}.${col}: ${e.message}`);
                }
            }
        }

        console.log(`\n✅ Total: ${updated} valores actualizados en la BD`);
    }

    await pool.end();
    console.log('\n🎉 Migración completada.\n');
    console.log('⚠️  PRÓXIMO PASO: Asegúrate de que R2_PUBLIC_URL está configurado en Render');
    console.log('   para que las nuevas subidas también vayan a R2.\n');
}

migrate().catch(err => {
    console.error('\n💥 Error fatal:', err.message);
    process.exit(1);
});
