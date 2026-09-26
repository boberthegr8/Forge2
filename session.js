import {core,appOrigins} from './core-client.js';
let parentOrigin='', nonce='', pending=Promise.resolve();
async function publish() {
  if (!parentOrigin) return;
  let session=null, error=null;
  try {
    const result=await core.auth.getSession();
    if(result.error) throw result.error;
    if(result.data.session){
      const verified=await core.auth.getUser();
      if(verified.error) throw verified.error;
      const context=await core.rpc('forge_account_context');
      if(context.error) throw context.error;
      if(!context.data.memberships.length && !context.data.has_portal_access && !context.data.is_owner)
        throw new Error('Your account is awaiting workspace approval.');
      session={access_token:result.data.session.access_token,refresh_token:result.data.session.refresh_token,user:{id:verified.data.user.id}};
    }
  } catch(e) { error=e.message; }
  window.parent.postMessage({type:'forge-session',nonce,session,error},parentOrigin);
}
window.addEventListener('message',event=>{
  if(window.parent===window || event.source!==window.parent || !appOrigins.includes(event.origin)) return;
  if(event.data?.type==='forge-connect' && typeof event.data.nonce==='string' && event.data.nonce.length<100){
    parentOrigin=event.origin; nonce=event.data.nonce;
    pending=pending.then(publish).catch(()=>{});
  } else if(event.data?.type==='forge-signout' && event.origin===parentOrigin && event.data.nonce===nonce){
    pending=pending.then(async()=>{
      const {error}=await core.auth.signOut();
      if(error) { window.parent.postMessage({type:'forge-session',nonce,error:'Sign out failed. Please try from Forge Home.',session:null},parentOrigin);return; }
      await publish();
    }).catch(()=>{});
  }
});
core.auth.onAuthStateChange(()=>{setTimeout(()=>{pending=pending.then(publish).catch(()=>{});},0);});
