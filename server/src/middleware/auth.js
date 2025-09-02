import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabase = null;
function getSupabase() {
  if (!config.supabaseUrl) throw new Error('SUPABASE_URL not configured');
  if (!config.supabaseAnonKey) throw new Error('SUPABASE_ANON_KEY not configured');
  if (!supabase) {
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: false } });
  }
  return supabase;
}

export async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ')
      ? auth.slice(7)
      : (typeof req.query.token === 'string' ? req.query.token : '');
    if (!token) return res.status(401).json({ error: 'missing_token' });

    const sb = getSupabase();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user?.id) {
      const msg = error?.message || 'invalid_token';
      // eslint-disable-next-line no-console
      console.warn('Auth error:', msg);
      return res.status(401).json({ error: 'unauthorized', message: msg });
    }
    req.userId = data.user.id;
    req.tokenRaw = token;
    return next();
  } catch (e) {
    const msg = e?.message || 'unauthorized';
    // eslint-disable-next-line no-console
    console.warn('Auth error:', msg);
    return res.status(401).json({ error: 'unauthorized', message: msg });
  }
}
