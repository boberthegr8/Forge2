import {core,safeReturn} from './core-client.js';
// Owner-only sign-in for the whole Forge Suite. One password, one shared session cookie on .forgehub.dev.
// Other-user email sign-up / access requests are parked on /admin.html for later.
const OWNER_EMAIL='rob.flagg1234@gmail.com';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const returnTo=safeReturn(params.get('returnTo'));
function go(){location.replace(returnTo);}
function notice(msg,error=false){$('notice').textContent=msg;$('notice').className=error?'error':'';}
function showForm(){$('checking').hidden=true;$('login').hidden=false;$('password').focus();}

async function boot(){
  if(params.get('signout')==='1'){
    await core.auth.signOut().catch(()=>{});
    history.replaceState(null,'','/account.html');
    showForm();notice('Signed out of every Forge app.');return;
  }
  const {data}=await core.auth.getSession();
  if(data?.session){go();return;}   // already signed in -> straight through, no "You're ready" stop
  showForm();
}
$('login').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('go');btn.disabled=true;notice('');
  try{
    const {error}=await core.auth.signInWithPassword({email:OWNER_EMAIL,password:$('password').value});
    if(error)throw error;
    go();
  }catch(err){
    notice(/invalid/i.test(err.message||'')?'Wrong password.':(err.message||'Sign in failed.'),true);
    $('password').select();
  }finally{btn.disabled=false;}
});
boot().catch(e=>{showForm();notice(e.message,true);});
