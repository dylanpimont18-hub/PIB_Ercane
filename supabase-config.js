// Clés publiques Supabase (le SDK JS et la clé "anon" sont conçus pour être exposés
// côté client — la sécurité réelle vient des règles RLS définies dans Supabase).
// Remplacez les deux valeurs ci-dessous par celles de votre projet
// (Dashboard Supabase > Project Settings > API).
const SUPABASE_URL = 'https://bxeooiynucuclnkpqtmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZW9vaXludWN1Y2xua3BxdG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4OTgzMjksImV4cCI6MjA5ODQ3NDMyOX0.SxfBpG_JVfvEXi7HQ3y3XXiN5nibg8Q0GjMdeiJiBHE';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
