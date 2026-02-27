import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qjyxojiyvmywyittkmix.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqeXhvaml5dm15d3lpdHRrbWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAzMzQsImV4cCI6MjA4NzcyNjMzNH0.bI6R8Ie8SjUb8-ESK4sUYvTklUQwwaBY_klmdkrA-cU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
