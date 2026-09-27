import {core} from './core-client.js';
const parent=document.getElementById('admin');
const section=document.createElement('section');section.className='panel';
section.innerHTML=`<h2>AI access</h2><p>Controls shared Scope AI. Your personal owner key is never used for other users.</p>
<form id="ai-policy"><label>Shared AI mode<select name="mode"><option value="free">Free only</option><option value="business">Business funded</option><option value="disabled">AI disabled</option></select></label>
<label>Requests per user per day<input name="user" type="number" min="1" max="100" required></label>
<label>Total requests per day<input name="total" type="number" min="1" max="1000" required></label>
<label>Total requests per month<input name="month" type="number" min="1" max="10000" required></label>
<button class="primary">Save AI controls</button></form><p id="ai-policy-status" role="status"></p>
<p class="muted">Free mode requires a separate Gemini project with billing disabled. Business mode requires its own business credential. Neither mode falls back to your personal key. Limits count submitted AI calls, including provider failures; one estimate may use several calls. Limits reset at midnight UTC. Business request limits are not a dollar budget.</p>`;
parent.prepend(section);
const form=section.querySelector('form'),status=section.querySelector('[role=status]');
async function load(){if(parent.hidden)return;const {data,error}=await core.rpc('forge_ai_settings');if(error){status.textContent=error.message;return;}form.elements.mode.value=data.mode;form.elements.user.value=data.per_user_daily;form.elements.total.value=data.total_daily;form.elements.month.value=data.monthly_requests;status.textContent='Saved mode: '+data.mode+'. Provider credentials are configured separately.';}
form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{const {error}=await core.rpc('forge_ai_set_policy',{p_mode:form.elements.mode.value,p_user:Number(form.elements.user.value),p_total:Number(form.elements.total.value),p_month:Number(form.elements.month.value)});if(error)throw error;status.textContent='AI controls saved.';}catch(error){status.textContent=error.message;}finally{button.disabled=false;}};
new MutationObserver(()=>void load()).observe(parent,{attributes:true,attributeFilter:['hidden']});void load();

