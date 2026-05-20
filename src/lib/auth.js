import { supabase, supabaseEnabled } from './supabase.js';

const RESIDENT_USERNAMES = Array.from({ length: 10 }, (_, i) => `daire${i + 1}`);

export function usernameToEmail(username) {
  const trimmed = username.trim();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@modigrid.app`;
}

export function persistAuth(role, username) {
  localStorage.setItem(
    'auth',
    JSON.stringify({ role, username, loginAt: Date.now() })
  );
}

function resolveLocalAuth(username, password, roleTab) {
  const user = username.trim();
  const pass = password;

  const isAdmin = user === 'admin' && pass === 'modigrid2024';
  const isResident = RESIDENT_USERNAMES.includes(user) && pass === '1234';

  if (roleTab === 'admin' && isAdmin) {
    return { role: 'admin', username: 'admin', path: '/admin' };
  }
  if (roleTab === 'resident' && isResident) {
    return { role: 'resident', username: user, path: '/resident' };
  }
  if (isAdmin) return { role: 'admin', username: 'admin', path: '/admin' };
  if (isResident) return { role: 'resident', username: user, path: '/resident' };
  return null;
}

export async function resolveAuth(username, password, roleTab) {
  if (!supabaseEnabled) {
    return resolveLocalAuth(username, password, roleTab);
  }

  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) return null;

  const path = profile.role === 'admin' ? '/admin' : '/resident';
  return { role: profile.role, username: profile.username, path };
}

export async function signOut() {
  if (supabaseEnabled) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('auth');
}
