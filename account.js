import {core,safeReturn} from './core-client.js';
const $=id=>document.getElementById(id);
const panels=['login','request','member','mfa','admin'];
const returnTo=safeReturn(new URLSearchParams(location.search).get('returnTo'));
let factorId=null, directory=null, auditCursor=null, refreshing=false;
function notice(message,error=false){$('notice').textContent=message;$('notice').className=error?'error':'';}
function show(...ids){panels.forEach(id=>$(id).hidden=!ids.includes(id));}
function option(value,label){const el=document.createElement('option');el.value=value;el.textContent=label;return el;}
function row(parent,title,detail){const el=document.createElement('div');el.className='audit-row';const strong=document.createElement('strong');strong.textContent=title;const small=document.createElement('small');small.textContent=detail;el.append(strong,small);parent.append(el);}
async function action(button,work){button.disabled=true;try{await work();}catch(e){notice(e.message||'Something went wrong. Please try again.',true);}finally{button.disabled=false;}}
async function rpc(name,args){const {data,error}=await core.rpc(name,args);if(error)throw error;return data;}

async function refresh(){
  if(refreshing)return;
  refreshing=true;
  try{
    const {data,error}=await core.auth.getUser();
    if(error && error.name!=='AuthSessionMissingError')throw error;
    $('signout').hidden=!data?.user;
    if(!data?.user){show('login');notice('One account for the Forge suite.');return;}
    const context=await rpc('forge_account_context');
    notice('Signed in as '+data.user.email);
    if(context.is_owner){
      $('member-summary').textContent='Your workspace access remains available. The owner console requires additional verification.';
      $('continue').href=returnTo;
      if(context.admin_unlocked){show('member','admin');await loadDirectory();await loadAudit(true);}
      else{
        show('member','mfa');
        const {data:factors,error:factorError}=await core.auth.mfa.listFactors();
        if(factorError)throw factorError;
        factorId=factors.totp.find(f=>f.status==='verified')?.id||null;
        $('enroll').hidden=Boolean(factorId);$('mfa-form').hidden=!factorId;
      }
    }else if(context.memberships.length || context.has_portal_access){
      show('member');
      $('member-summary').textContent=context.memberships.map(m=>m.organization_name+' · '+m.role).join(', ')||'Your customer portal access is ready.';
      $('continue').href=context.memberships.length?returnTo:'https://portal.forgehub.dev';
    }else{
      show('request');
      $('request-form').hidden=Boolean(context.request);
      $('request-state').textContent=context.request
        ? (context.request.status==='pending'?'Your request is waiting for the Forge owner to approve workspace access.':'Your access request has been reviewed. Contact the Forge owner for help.')
        : 'Your email is verified. Tell the owner which company you work with.';
    }
  }catch(e){show('login');notice(e.message,true);}
  finally{refreshing=false;}
}

$('login-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  void action(form.querySelector('button'),async()=>{
    const {error}=await core.auth.signInWithOtp({email:form.elements.email.value.trim(),options:{
      shouldCreateUser:form.elements.register.checked,emailRedirectTo:location.origin+'/account.html?returnTo='+encodeURIComponent(new URL(returnTo,location.origin).href)
    }});
    if(error)throw error;
    notice('Check your email for the secure Forge sign-in link. Open it to continue.');
  });
});
$('request-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  void action(form.querySelector('button'),async()=>{
    await rpc('forge_request_access',{p_display_name:form.elements.name.value.trim(),p_company_name:form.elements.company.value.trim()});
    await refresh();
  });
});
$('refresh-request').onclick=()=>void refresh();
$('signout').onclick=()=>void action($('signout'),async()=>{
  const {error}=await core.auth.signOut();if(error)throw error;
  directory=null;factorId=null;$('qr').removeAttribute('src');$('qr').hidden=true;await refresh();
});
$('enroll').onclick=()=>void action($('enroll'),async()=>{
  const {data,error}=await core.auth.mfa.enroll({factorType:'totp',friendlyName:'Forge owner '+new Date().toISOString().slice(0,16)});
  if(error)throw error;
  factorId=data.id;$('qr').src=data.totp.qr_code;$('qr').hidden=false;$('mfa-form').hidden=false;$('enroll').hidden=true;
  notice('Scan the QR code with your authenticator, then enter its six-digit code.');
});
$('mfa-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  void action(form.querySelector('button'),async()=>{
    if(!factorId)throw new Error('Set up your authenticator first.');
    const {error}=await core.auth.mfa.challengeAndVerify({factorId,code:form.elements.code.value.trim()});
    if(error)throw error;
    form.reset();$('qr').removeAttribute('src');$('qr').hidden=true;await refresh();
  });
});

async function loadDirectory(){
  directory=await rpc('forge_admin_directory');
  const users=new Map(directory.users.map(u=>[u.id,u.email]));
  const orgs=new Map(directory.organizations.map(o=>[o.id,o.name]));
  const form=$('access-form');
  form.elements.user.replaceChildren(option('','Choose a verified user'),...directory.users.filter(u=>u.confirmed).map(u=>option(u.id,u.email)));
  form.elements.organization.replaceChildren(option('','Choose a workspace'),...directory.organizations.map(o=>option(o.id,o.name)));
  const selected=$('audit-org').value;
  $('audit-org').replaceChildren(option('','All workspaces'),...directory.organizations.map(o=>option(o.id,o.name)));
  $('audit-org').value=selected;
  $('directory-summary').textContent=directory.users.length+' recent accounts · '+directory.requests.length+' pending requests. Platform ownership cannot be granted here.';
  $('requests').replaceChildren();$('memberships').replaceChildren();
  for(const request of directory.requests)row($('requests'),request.display_name+' · '+request.company_name,users.get(request.user_id)||request.user_id);
  if(!directory.requests.length)row($('requests'),'No pending requests','New verified users appear here after requesting access.');
  for(const m of directory.memberships)row($('memberships'),users.get(m.user_id)||m.user_id,(orgs.get(m.organization_id)||m.organization_id)+' · '+m.role+' · '+m.status);
}
$('access-form').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;
  void action(form.querySelector('button'),async()=>{
    await rpc('forge_set_membership',{p_user_id:form.elements.user.value,p_organization_id:form.elements.organization.value,p_role:form.elements.role.value,p_status:form.elements.status.value});
    await loadDirectory();await loadAudit(true);notice('Workspace access updated and recorded in activity.');
  });
});
async function loadAudit(reset){
  if(reset){auditCursor=null;$('audit').replaceChildren();}
  let query=core.from('forge_audit_log').select('id,occurred_at,actor_user_id,organization_id,entity_type,entity_id,action,changed_fields').order('id',{ascending:false}).limit(100);
  if(auditCursor!==null)query=query.lt('id',auditCursor);
  if($('audit-org').value)query=query.eq('organization_id',$('audit-org').value);
  const {data,error}=await query;if(error)throw error;
  const users=new Map(directory.users.map(u=>[u.id,u.email]));
  for(const item of data)row($('audit'),item.entity_type.replaceAll('_',' ')+' · '+item.action,
    new Date(item.occurred_at).toLocaleString()+' · '+(users.get(item.actor_user_id)||item.actor_user_id||'System')+
    (item.changed_fields.length?' · Fields: '+item.changed_fields.join(', '):'')+(item.entity_id?' · '+item.entity_id:''));
  if(!data.length&&reset)row($('audit'),'No activity yet','New database changes will appear here.');
  auditCursor=data.at(-1)?.id??auditCursor;$('more-audit').hidden=data.length<100;
}
$('refresh-audit').onclick=()=>void action($('refresh-audit'),()=>loadAudit(true));
$('more-audit').onclick=()=>void action($('more-audit'),()=>loadAudit(false));
$('audit-org').onchange=()=>void action($('refresh-audit'),()=>loadAudit(true));
core.auth.onAuthStateChange(event=>{if(['SIGNED_IN','SIGNED_OUT','MFA_CHALLENGE_VERIFIED'].includes(event))setTimeout(()=>void refresh(),0);});
void refresh();
