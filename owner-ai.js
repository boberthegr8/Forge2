import {core} from './core-client.js';
const parent=document.getElementById('admin');
const section=document.createElement('section');section.className='panel';
section.innerHTML=`<h2>My AI connection</h2><p>Connect your personal Gemini account once. Scope will use it automatically when you sign in as the Forge owner. Usage is billed to your Gemini account. Other users cannot use this connection.</p><p data-status role="status">Checking your connection…</p><form><label>Personal Gemini API key<input name="key" type="password" autocomplete="off" required minlength="20" maxlength="256" placeholder="Paste your Gemini key"></label><button class="primary">Save my AI connection</button></form><p class="muted">Your key is stored encrypted on the server and is never sent back to the browser. You can replace it here. Shared AI settings below apply to other users.</p>`;
parent.prepend(section);
const form=section.querySelector('form'),status=section.querySelector('[data-status]');
async function invoke(body){const {data,error}=await core.functions.invoke('forge-owner-ai',{body});if(error){let message='Could not connect to your AI settings.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}if(data?.error)throw new Error(data.error);return data;}
async function load(){if(parent.hidden){form.reset();status.textContent='Unlock the owner console to manage your AI connection.';return;}try{const data=await invoke({action:'status'});status.textContent=data.configured?'Your personal AI connection is saved. Scope selects it automatically for your owner account.':'One-time setup: enter your Gemini key below to connect your owner account.';}catch(e){status.textContent=e.message;}}
form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;try{await invoke({action:'save',key:form.elements.key.value.trim()});form.reset();status.textContent='Your AI connection is saved. Open Scope to use your personal AI.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};
new MutationObserver(()=>void load()).observe(parent,{attributes:true,attributeFilter:['hidden']});void load();

