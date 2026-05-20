import { supabase, supabaseEnabled } from './supabase.js';

const RESIDENT_USERNAMES = Array.from({ length: 10 }, (_, i) => `daire${i + 1}`);
const LOCAL_USERS_KEY = 'modigrid_registered_users';
const RESERVED_USERNAMES = new Set(['admin', ...RESIDENT_USERNAMES]);

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUser(username, password, role) {
  const users = getRegisteredUsers();
  if (users.some((u) => u.username === username)) {
    return { error: 'Bu kullanıcı adı zaten kayıtlı' };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { error: 'Bu kullanıcı adı rezerve edilmiş' };
  }
  users.push({ username, password, role });
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  return { ok: true };
}

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

function authFromRole(role, username) {
  const path = role === 'admin' ? '/admin' : '/resident';
  return { role, username, path };
}

function resolveLocalAuth(username, password, roleTab) {
  const user = username.trim();
  const pass = password;

  const registered = getRegisteredUsers().find(
    (u) => u.username === user && u.password === pass
  );
  if (registered) {
    return authFromRole(registered.role, user);
  }

  const isAdmin = user === 'admin' && pass === 'modigrid2024';
  const isResident = RESIDENT_USERNAMES.includes(user) && pass === '1234';

  if (roleTab === 'admin' && isAdmin) {
    return authFromRole('admin', 'admin');
  }
  if (roleTab === 'resident' && isResident) {
    return authFromRole('resident', user);
  }
  if (isAdmin) return authFromRole('admin', 'admin');
  if (isResident) return authFromRole('resident', user);
  return null;
}

function signUpLocal(username, password, roleTab) {
  if (username.length < 3) {
    return { error: 'Kullanıcı adı en az 3 karakter olmalı' };
  }
  if (password.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalı' };
  }
  const saved = saveRegisteredUser(username, password, roleTab);
  if (saved.error) return saved;
  return { ok: true, auth: authFromRole(roleTab, username) };
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

export async function signUp(username, password, roleTab) {
  const user = username.trim();
  if (!user || user.length < 3) {
    return { error: 'Kullanıcı adı en az 3 karakter olmalı' };
  }
  if (!password || password.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalı' };
  }

  if (!supabaseEnabled) {
    return signUpLocal(user, password, roleTab);
  }

  const email = usernameToEmail(user);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: user, role: roleTab },
    },
  });

  if (error) {
    const msg = error.message?.toLowerCase().includes('already')
      ? 'Bu kullanıcı adı veya e-posta zaten kayıtlı'
      : error.message || 'Kayıt başarısız';
    return { error: msg };
  }

  if (data.session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', data.session.user.id)
      .single();

    const role = profile?.role ?? roleTab;
    const uname = profile?.username ?? user;
    return { ok: true, auth: authFromRole(role, uname) };
  }

  return {
    ok: true,
    message: 'Kayıt tamamlandı. Şimdi giriş yapabilirsiniz.',
  };
}

export async function signOut() {
  if (supabaseEnabled) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('auth');
}
