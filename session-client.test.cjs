const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(origin='https://crm.forgehub.dev') {
  const listeners={}, timers=new Map(), calls=[], redirects=[], posted=[];
  let timerId=0, reloads=0;
  const frame={contentWindow:{postMessage:m=>posted.push(m)},addEventListener(){}};
  const client={auth:{setSession:async s=>{calls.push(s);return {error:null};},signOut:async()=>({error:null})}};
  const window={addEventListener:(type,handler)=>listeners[type]=handler};
  vm.runInNewContext(fs.readFileSync(__dirname+'/suite-client.js','utf8'),{
    window,document:{createElement:()=>frame,body:{appendChild(){}}},
    location:{origin,href:origin+'/',replace:x=>redirects.push(x),reload:()=>reloads++},
    crypto:{randomUUID:()=> 'test-nonce'},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)
  });
  const send=(overrides={})=>listeners.message({origin:'https://app.forgehub.dev',source:frame.contentWindow,
    data:{type:'forge-session',nonce:'test-nonce',session:{access_token:'a',refresh_token:'r',user:{id:'u'}}},...overrides});
  return {api:window.ForgeSuite,client,send,calls,redirects,posted,get reloads(){return reloads;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('only the expected hub, iframe and nonce can supply a session',async()=>{
  const f=fixture(), connected=f.api.connect(f.client);
  f.send({origin:'https://evil.example'});f.send({source:{}});f.send({data:{type:'forge-session',nonce:'wrong'}});
  await settle();assert.equal(f.calls.length,0);
  f.send();assert.equal(await connected,f.client);assert.equal(f.calls.length,1);
  f.send();await settle();assert.equal(f.calls.length,1);
  assert.equal(f.api.auth.persistSession,false);assert.equal(f.api.auth.autoRefreshToken,false);
});
test('signout waits for the hub acknowledgement before redirecting',async()=>{
  const f=fixture(),connected=f.api.connect(f.client);f.send();await connected;
  const out=f.client.auth.signOut();await settle();assert.equal(f.redirects.length,0);assert.equal(f.posted[0].type,'forge-signout');
  f.send({data:{type:'forge-session',nonce:'test-nonce',session:null}});
  assert.equal((await out).error,null);await settle();assert.equal(f.redirects.length,1);
});
test('changing account reloads app state',async()=>{
  const f=fixture(),connected=f.api.connect(f.client);f.send();await connected;
  f.send({data:{type:'forge-session',nonce:'test-nonce',session:{access_token:'b',refresh_token:'r2',user:{id:'other'}}}});
  await settle();assert.equal(f.reloads,1);assert.equal(f.calls.length,1);
});
test('preview origins keep their independent sign-in',async()=>{
  const f=fixture('https://preview.vercel.app');assert.equal(f.api.managed,false);assert.equal(await f.api.connect(f.client),f.client);
});

