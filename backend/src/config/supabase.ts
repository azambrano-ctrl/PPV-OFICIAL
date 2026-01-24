import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend uploads

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found. File uploads to Supabase will fail.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
        persistSession: false, // No session needed for backend
    }
});

export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'uploads';
