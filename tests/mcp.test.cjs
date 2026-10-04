const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const server=process.env.WCT_MCP_SERVER||path.resolve('mcp/server.mjs');
const req=(id,method,params)=>({jsonrpc:'2.0',id,method,...(params?{params}:{})});
const init=version=>req(1,'initialize',{protocolVersion:version||'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}});
const ready={jsonrpc:'2.0',method:'notifications/initialized'};
function run(messages,raw=false){
 const input=raw?messages:messages.map(m=>JSON.stringify(m)).join('\n')+'\n';
 const process=spawnSync(global.process.execPath,[server],{input,encoding:'utf8',cwd:os.tmpdir(),timeout:10000,maxBuffer:2*1024*1024});
 assert.equal(process.error,undefined);
 return {...process,messages:process.stdout.trim()?process.stdout.trim().split('\n').map(s=>JSON.parse(s)):[]};
}
function call(name,args){return run([init(),ready,req(2,'tools/call',{name,arguments:args})]).messages.at(-1);}
const args={language:'en',theme:'forest',privacyPolicyUrl:'/privacy',platform:'universal'};
test('stdio handshake negotiates supported and unknown revisions without logging on stdout',()=>{
 for(const version of ['2024-11-05','2025-03-26','2025-06-18','2025-11-25','2099-01-01']){
  const r=run([init(version),ready,req(2,'tools/list'),req(3,'ping')]);assert.equal(r.status,0);assert.equal(r.stderr,'');assert.equal(r.messages.length,3);
  assert.equal(r.messages[0].result.protocolVersion,version.startsWith('2099')?'2025-11-25':version);
  assert.equal(r.messages[1].result.tools.length,4);assert.ok(r.messages[1].result.tools.every(t=>t.annotations.readOnlyHint&&t.inputSchema.additionalProperties===false));assert.deepEqual(r.messages[2].result,{});
 }
});
test('initialization gates operations and duplicate initialization fails',()=>{
 const r=run([req(0,'tools/list'),init(),req(2,'tools/list'),ready,init(),req(4,'unknown'),{jsonrpc:'2.0',method:'notifications/unknown'},req(5,'ping')]);
 assert.equal(r.messages[0].error.code,-32000);assert.equal(r.messages[2].error.code,-32000);assert.equal(r.messages[3].error.code,-32600);assert.equal(r.messages[4].error.code,-32601);assert.equal(r.messages.length,6);
});
test('catalog, templates and jurisdiction packs are available from an unrelated working directory',()=>{
 const catalog=JSON.parse(call('list_templates',{}).result.content[0].text);assert.equal(catalog.templates.length,13);assert.equal(catalog.themes.length,12);
 for(const {id} of catalog.templates){const r=call('get_template',{id});assert.equal(r.result.isError,false);assert.ok(JSON.parse(r.result.content[0].text).source.length>100);}
 const pack=JSON.parse(call('get_jurisdiction',{code:'il'}).result.content[0].text);assert.match(pack.source,/needs_legal_review: true/);
});
test('tool inputs cannot select arbitrary paths, prototype keys or extra parameters',()=>{
 for(const value of ['../../package.json','__proto__','constructor','/etc/passwd'])assert.equal(call('get_template',{id:value}).result.isError,true);
 for(const value of [[],null,{id:'cookie-banner',path:'/etc/passwd'},{id:22},{}])assert.equal(call('get_template',value).result.isError,true);
 assert.equal(call('not-a-tool',{}).error.code,-32602);
 assert.equal(call('prepare_banner',{...args,command:'touch /tmp/no'}).result.isError,true);
});
test('malformed frames and batches return bounded errors, later valid requests still work',()=>{
 const r=run('not json\n[]\n'+JSON.stringify(init())+'\n'+JSON.stringify(ready)+'\n'+JSON.stringify(req(4,'ping'))+'\n',true);
 assert.equal(r.status,0);assert.equal(r.messages[0].error.code,-32700);assert.equal(r.messages[1].error.code,-32600);assert.deepEqual(r.messages.at(-1).result,{});
 assert.equal(run('{',true).messages[0].error.code,-32700);
 assert.equal(run(Buffer.from([0xff,10]),true).messages[0].error.code,-32700);
 assert.equal(run([req(null,'ping')]).messages[0].error.code,-32600);
});
test('oversized newline-free input terminates without echoing input',()=>{
 const r=run('secret-'+ 'x'.repeat(65536),true);assert.equal(r.status,1);assert.equal(r.stdout,'');assert.doesNotMatch(r.stderr,/secret-/);
});
test('unsafe policy URLs and invalid design choices fail closed',()=>{
 for(const url of ['javascript:alert(1)','//evil.example','/\\evil.example','https://u:p@example.com','https://example.com/ bad','/privacy\n','/x<script>'])assert.equal(call('prepare_banner',{...args,privacyPolicyUrl:url}).result.isError,true);
 for(const update of [{language:'__proto__'},{theme:'constructor'},{platform:'../../'}])assert.equal(call('prepare_banner',{...args,...update}).result.isError,true);
});
test('universal output contains safe shared installer and canonical files, with opt-in defaults',()=>{
 const prepared=JSON.parse(call('prepare_banner',args).result.content[0].text),files=prepared.files;
 assert.deepEqual(Object.keys(files).sort(),['START-HERE.txt','LICENSE','cookie-consent.js','cookie-consent.css','theme.css','install.js','preview.html','embed.html.txt'].sort());
 assert.match(files['install.js'],/"region": "auto"/);assert.match(files['embed.html.txt'],/\/web-compliance\/install.js/);assert.match(files['cookie-consent.js'],/CookieConsent/);
 let config;const button={setAttribute(){},addEventListener(){}};
 vm.runInNewContext(files['install.js'],{window:{},CookieConsent:{init(value){config=value;}},document:{getElementById(){return button;}}});
 assert.equal(config.language,'en');assert.equal(config.privacyPolicyUrl,'/privacy');assert.equal(config.region,'auto');assert.equal(config.ukFirstPartyAnalyticsExempt,false);assert.equal(button.textContent,'Cookie preferences');
 assert.ok(Object.keys(files).every(n=>!n.includes('..')&&!n.startsWith('/')));
});
test('WordPress package includes only bundled plugin files and preserves RTL preview',()=>{
 const files=JSON.parse(call('prepare_banner',{...args,language:'he',platform:'wordpress'}).result.content[0].text).files;
 assert.ok(Object.keys(files).every(n=>n.startsWith('web-compliance/')));assert.match(files['web-compliance/web-compliance.php'],/Plugin Name:/);assert.match(files['web-compliance/preview.html'],/dir="rtl"/);assert.ok(!Object.keys(files).some(n=>/project|review-summary/.test(n)));
});
test('installer serializes user text as data and cannot end a script element',()=>{
 const kit=require('../docs/site/install-kit.js');const code=kit.script({language:'en',privacyPolicyUrl:'/privacy',brandColor:'#145f78',textOverrides:{en:{title:'</script><script>alert(1)</script>'}}});assert.doesNotMatch(code,/<script|<\/script/);
 assert.throws(()=>kit.script({language:'constructor',privacyPolicyUrl:'/privacy',brandColor:'#145f78'}));
});
