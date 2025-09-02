import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  supabaseJwtAlg: process.env.SUPABASE_JWT_ALG || 'RS256', // HS256 or RS256
  // Optional pricing (USD) per 1K output tokens for rough cost estimates
  priceGeminiOutPer1K: Number(process.env.PRICE_GEMINI_OUT_PER_1K || 0),
  priceGroqOutPer1K: Number(process.env.PRICE_GROQ_OUT_PER_1K || 0),
};
