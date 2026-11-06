const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
test('attention hides production without removing existing task and delivery activity',()=>{
 const elements={};const document={getElementById:id=>elements[id] ||= {addEventListener(){}}};
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/m,'').split('async function boot()')[0];
 const context={document,Date};vm.createContext(context);vm.runInContext(script,context);
 vm.runInContext("renderAttention({tasks:[{title:'Follow up',status:'open'}],pos:[],dels:[],mfg:[{title:'Hidden production',status:'open',due_date:'2000-01-01'}]})",context);
 assert.match(elements.attentionList.innerHTML,/Follow up/);assert.doesNotMatch(elements.attentionList.innerHTML,/Hidden production/);
});
test('Home cards mirror navigation with expandable child pages and existing Analytics',()=>{
 assert.deepEqual([...html.matchAll(/data-module="([^"]+)"/g)].map(m=>m[1]),['home','crm','scope','delivery','todo','hermes','admin','settings']);
 assert.match(html,/<h3 id="analytics">Analytics<\/h3>/);
 assert.match(html,/id="adminModule"[^>]*hidden/);
 assert.match(html,/<details><summary>Settings pages<\/summary>[\s\S]*?Customer Portal/);
 assert.match(html,/class="stat hidden"><div class="stathead"><span>Production/);
 assert.match(html,/href="https:\/\/scope.forgehub.dev\/"[^>]*>Estimating/);
 for(const id of ['statProjects','statQuotes','statPOs','statDeliveries','statMfg','statTasks','recentProjects','attentionList']) assert.match(html,new RegExp('id="'+id+'"'));
});
