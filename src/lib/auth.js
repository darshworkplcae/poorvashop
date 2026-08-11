/**
 * POORVA SHOP — Auth Library
 * Custom username/password authentication using Supabase as the DB.
 * Passwords are SHA-256 hashed (using Web Crypto API — no library needed).
 */

import supabase from './supabase';

const SESSION_KEY = 'poorva_session';

// ── Password hashing (SHA-256 via Web Crypto) ─────────────────────────────
export async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Login ──────────────────────────────────────────────────────────────────
export async function login(username, password) {
  const hash = await hashPassword(password);

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('username', username.trim().toLowerCase())
    .eq('password_hash', hash)
    .eq('active', true)
    .single();

  if (error || !data) {
    throw new Error('Wrong username or password');
  }

  // Update last_login timestamp
  await supabase
    .from('employees')
    .update({ last_login: new Date().toISOString() })
    .eq('id', data.id);

  // Store session in localStorage (without password_hash!)
  const session = {
    id:       data.id,
    name:     data.name,
    username: data.username,
    role:     data.role,
    avatar:   data.avatar,
    loginAt:  new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Log the login activity
  await logActivity(session, 'LOGIN', 'Logged in to POORVA SHOP');

  return session;
}

// ── Logout ─────────────────────────────────────────────────────────────────
export async function logout() {
  const session = getSession();
  if (session) {
    await logActivity(session, 'LOGOUT', 'Logged out of POORVA SHOP');
  }
  localStorage.removeItem(SESSION_KEY);
}

// ── Get current session ───────────────────────────────────────────────────
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function isAdmin() {
  return getSession()?.role === 'admin';
}

// ── Activity logging ──────────────────────────────────────────────────────
export async function logActivity(session, action, details = '', page = '', amount = null) {
  if (!session) return;
  try {
    await supabase.from('activity_logs').insert({
      employee_id:   session.id,
      employee_name: session.name,
      action,
      details,
      page:   page || window.location.pathname,
      amount: amount || null,
    });
  } catch (e) {
    // Never crash the app just because of logging
    console.warn('Activity log failed:', e);
  }
}

// ── Error logging ─────────────────────────────────────────────────────────
export async function logError(error, pageUrl = '') {
  const session = getSession();
  try {
    await supabase.from('error_logs').insert({
      employee_id:   session?.id   || null,
      employee_name: session?.name || 'Unknown',
      error_message: error?.message || String(error),
      error_type:    error?.name   || 'Error',
      page_url:      pageUrl || window.location.href,
      stack_trace:   error?.stack?.slice(0, 1000) || '',
      resolved:      false,
    });
  } catch (e) {
    console.warn('Error log failed:', e);
  }
}

// ── Employee management (admin only) ──────────────────────────────────────
export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, username, role, phone, avatar, join_date, active, last_login, created_at')
    .order('id');
  if (error) throw error;
  return data || [];
}

export async function createEmployee({ name, username, password, role, phone, avatar }) {
  const hash = await hashPassword(password);
  const { error } = await supabase.from('employees').insert({
    name, username: username.trim().toLowerCase(),
    password_hash: hash, role, phone, avatar: avatar || '🧑',
  });
  if (error) throw error;
}

export async function updateEmployee(id, updates) {
  if (updates.password) {
    updates.password_hash = await hashPassword(updates.password);
    delete updates.password;
  }
  const { error } = await supabase.from('employees').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteEmployee(id) {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}

export async function getActivityLogs({ employeeId = null, limit = 100 } = {}) {
  let q = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (employeeId) q = q.eq('employee_id', employeeId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getErrorLogs(limit = 100) {
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function markErrorResolved(id) {
  await supabase.from('error_logs').update({ resolved: true }).eq('id', id);
}

export async function getEmployeeStats() {
  // Get bills per employee from activity_logs
  const { data } = await supabase
    .from('activity_logs')
    .select('employee_id, employee_name, action, amount')
    .eq('action', 'CREATE_BILL');

  const stats = {};
  for (const row of (data || [])) {
    if (!stats[row.employee_id]) {
      stats[row.employee_id] = { name: row.employee_name, bills: 0, total: 0 };
    }
    stats[row.employee_id].bills++;
    stats[row.employee_id].total += parseFloat(row.amount || 0);
  }
  return stats;
}
