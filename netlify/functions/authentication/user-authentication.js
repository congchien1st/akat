import initSupabase  from './init-supabase.js';

async function signIn(email, password) {
    const supabase = initSupabase();
    const { user, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error("Login failed:", error);
    else console.log("User logged in:", user);
}
