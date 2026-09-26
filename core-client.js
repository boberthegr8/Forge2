import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';
export const core = createClient('https://uyqanhwurngoupmvzxrh.supabase.co',
  'sb_publishable_SquKrj848EoO9NHZknVkSA_k8CKD7WQ', {
    auth: {persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},
    global:{headers:{'x-forge-module':'home'}}
  });
export const appOrigins = ['https://app.forgehub.dev','https://crm.forgehub.dev',
  'https://scope.forgehub.dev','https://reader.forgehub.dev','https://quote.forgehub.dev',
  'https://manufacturing.forgehub.dev','https://portal.forgehub.dev'];
export function safeReturn(value) {
  try {
    const url=new URL(value);
    return appOrigins.includes(url.origin) && !url.username && !url.password ? url.href : '/';
  } catch { return '/'; }
}
