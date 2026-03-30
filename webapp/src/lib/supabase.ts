import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iwomwolzxtrzjulesnjb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b213b2x6eHRyemp1bGVzbmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcxMzE1NjMsImV4cCI6MjAyMjcxNTU2M30.z6F5t-lW9yA_8m--7i3W--z234c9c7_4Y0fGZ9b3n6Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
