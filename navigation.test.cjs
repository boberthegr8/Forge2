const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/forge-nav.js','utf8');
function mount(origin='https://app.forgehub.dev',pathname='/',hash='',context=null){
 const calls=[];let authChange;
 const loadCore=async()=>{calls.push('import');return {core:{rpc:async()=>{calls.push('rpc');return context instanceof Error ? {error:context} : {data:context}},auth:{onAuthStateChange(fn){authChange=fn;}}}}};
 const elements=new Map([['adminModule',{hidden:true}]]),listeners={};
 const classes=()=>{const values=new Set();return {add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v),toggle(v){if(values.has(v)){values.delete(v);return false}values.add(v);return true}}};
 const document={body:{appendChild(e){elements.set(e.id,e)}},head:{appendChild(e){elements.set(e.id,e)}},documentElement:{classList:classes()},getElementById:id=>elements.get(id),createElement:()=>({attributes:{},events:{},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,v){this.events[k]=v},querySelectorAll(){return []},classList:classes()}),addEventListener(){}};
 const window={addEventListener:(name,fn)=>listeners[name]=fn}; window.top=window.self=window;
 const location={origin,pathname,hash};
 vm.runInNewContext(source.replace("import('./core-client.js')",'loadCore()'),{window,document,location,URL,console,loadCore,setTimeout});
 return {elements,window,location,listeners,calls,auth:event=>authChange(event),setContext:value=>{context=value},html:()=>elements.get('forge-nav').innerHTML};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('owner Admin is fail closed and core imports never cross app origins',async()=>{
 const owner=mount(undefined,'/','',{is_owner:true});
 assert.doesNotMatch(owner.html(),/data-main="admin"/);
 await settle();
 assert.deepEqual([...owner.html().matchAll(/data-main="([^"]+)"/g)].map(m=>m[1]),['home','crm','scope','delivery','todo','hermes','admin','settings']);
 for(const context of [null,{is_owner:false},{is_owner:'true'},new Error('offline')]){
  const app=mount(undefined,'/','',context);await settle();assert.doesNotMatch(app.html(),/data-main="admin"/);
 }
 const crm=mount('https://crm.forgehub.dev','/','',{is_owner:true});await settle();assert.deepEqual(crm.calls,[]);assert.doesNotMatch(crm.html(),/data-main="admin"/);
});
test('owner card follows context and signout clears owner UI immediately',async()=>{
 const app=mount(undefined,'/','',{is_owner:true});await settle();
 assert.equal(app.elements.get('adminModule').hidden,false);
 app.auth('SIGNED_OUT');assert.doesNotMatch(app.html(),/data-main="admin"/);assert.equal(app.elements.get('adminModule').hidden,true);
});
test('mobile menu exposes state and closes on Escape and navigation',()=>{
 const app=mount();const button=app.elements.get('forge-nav-toggle');
 assert.equal(button.attributes['aria-expanded'],'false');assert.equal(button.attributes['aria-controls'],'forge-nav');
 button.onclick();assert.equal(button.attributes['aria-expanded'],'true');
 app.listeners.keydown({key:'Escape'});assert.equal(button.attributes['aria-expanded'],'false');
 button.onclick();app.elements.get('forge-nav').events.click({target:{closest:()=>({})}});assert.equal(button.attributes['aria-expanded'],'false');
 assert.match(app.elements.get('forge-nav-style').textContent,/\.fn-children/);
});
test('active destinations follow hub paths and CRM hashes with expanded parents',()=>{
 for(const [origin,path,hash,id] of [
  ['https://app.forgehub.dev','/','#analytics','analytics'],
  ['https://app.forgehub.dev','/account.html','','settings'],
  ['https://crm.forgehub.dev','/','#/','crm'],
  ['https://crm.forgehub.dev','/','#/quotes','crm-quotes'],
  ['https://frame.forgehub.dev','/','','frame']]){
  const app=mount(origin,path,hash);assert.match(app.html(),new RegExp('class="fn-item active" data-id="'+id+'"'));
  assert.match(app.html(),new RegExp('data-id="'+id+'"[^>]*aria-current="page"'));
  if(['analytics','crm-quotes','frame'].includes(id)) assert.match(app.html(),/<details open>/);
 }
 const app=mount('https://crm.forgehub.dev');app.location.hash='#/purchasing';app.listeners.hashchange();
 assert.match(app.html(),/class="fn-item active" data-id="purchasing"/);assert.match(app.html(),/<details open>/);
});
test('main navigation consolidates destinations and retains nested tool routes',()=>{
 const app=mount(); const html=app.html();
 assert.deepEqual([...html.matchAll(/data-main="([^"]+)"/g)].map(m=>m[1]),['home','crm','scope','delivery','todo','hermes','settings']);
 for(const id of ['analytics','crm-contacts','crm-quotes','crm-projects','purchasing','reader','quote','frame','portal']) assert.match(html,new RegExp('data-id="'+id+'"'));
 assert.match(html,/data-id="scope" href="https:\/\/scope\.forgehub\.dev\/"/);
 assert.match(html,/<details/); assert.doesNotMatch(html,/Manufacturing|>Owner</);
 assert.match(html,/Customer Portal/); assert.match(html,/>Estimating</);
});
