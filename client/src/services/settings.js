import { supabase } from '../lib/supabaseClient';

export async function fetchUserSettings() {
  const { data, error } = await supabase.rpc('get_user_settings');
  if (error) throw error;
  // returns single row or null; standardize shape
  const row = Array.isArray(data) ? data[0] : data;
  return row || { prompt: '', has_api_key: false, hasApiKey: false, has_groq_key: false, hasGroqKey: false };
}

export async function upsertUserSettings({ prompt, apiKey, groqApiKey }) {
  const { error } = await supabase.rpc('set_user_settings', {
    p_prompt: prompt ?? '',
    p_api_key: apiKey ?? null,
    p_groq_api_key: groqApiKey ?? null,
  });
  if (error) throw error;
  // re-fetch to reflect latest has_api_key
  return fetchUserSettings();
}
