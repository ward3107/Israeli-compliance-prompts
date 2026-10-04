#!/usr/bin/env node
/** Local stdio MCP: bundled content in, text results out. No network or writes. */
import {readFileSync, realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve, sep} from 'node:path';
import {createRequire} from 'node:module';
import {once} from 'node:events';

const root=realpathSync(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const require=createRequire(import.meta.url);
const kit=require('../docs/site/install-kit.js');
const themes=require('../docs/site/themes.js');
const versions=['2025-11-25','2025-06-18','2025-03-26','2024-11-05'];
const MAX_MESSAGE=64*1024, MAX_OUTPUT=512*1024;
const templates=['accessibility-baseline','accessibility-statement','accessibility-widget','client-onboarding','cookie-banner','data-subject-rights','disclaimer','ecommerce-checkout','email-marketing','freelancer-contract','privacy-policy','refund-policy','terms-of-use'];
const packs=['il','eu','uk','us','us-ca','ca'];
const allMarkets=['accessibility-baseline','accessibility-widget','cookie-banner'];
const scope=id=>allMarkets.includes(id)?'all shipped packs':id==='data-subject-rights'?'il+eu':'il';
const publicNames=[...templates.map(id=>'skills/web-compliance/templates/'+id+'.md'),...packs.map(id=>'skills/web-compliance/jurisdictions/'+id+'.yaml'),'widgets/cookie-consent/cookie-consent.js','widgets/cookie-consent/cookie-consent.css','integrations/wordpress/web-compliance.php','LICENSE'];
// Only these fixed, bundled files can be read. Tool parameters never become paths.
const bundled=Object.fromEntries(publicNames.map(name=>{
  const path=realpathSync(resolve(root,name));
  if(!path.startsWith(root+sep))throw new Error('Bundled file escapes package');
  const text=readFileSync(path,'utf8');
  if(Buffer.byteLength(text)>256*1024)throw new Error('Bundled file is too large');
  return [name,text];
}));
const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const schema=(properties={},required=[])=>({type:'object',properties,required,additionalProperties:false});
const choice=values=>({type:'string',enum:values});
const tools=[
  {name:'list_templates',description:'List the 13 bundled draft templates, legal scope, country packs and design choices. Start here. Content is unreviewed; no scan or legal certification.',inputSchema:schema()},
  {name:'get_template',description:'Read one bundled implementation prompt. Placeholders are facts to ask the user for; do not invent facts or expand its legal scope.',inputSchema:schema({id:choice(templates)},['id'])},
  {name:'get_jurisdiction',description:'Read a bundled jurisdiction YAML source pack, including review status and source links. It may be stale; verify sources before legal use.',inputSchema:schema({code:choice(packs)},['code'])},
  {name:'prepare_banner',description:'Return cookie-banner installation files as text for human review. Does not write, install or publish anything. Uses conservative opt-in everywhere. Trackers need separate integration and testing.',inputSchema:schema({language:choice(['he','ar','en','ru']),theme:choice(Object.keys(themes.presets)),privacyPolicyUrl:{type:'string',minLength:1,maxLength:500,description:'Existing policy page: /privacy or an http(s) URL without credentials.'},platform:choice(['universal','wordpress'])},['language','theme','privacyPolicyUrl','platform'])}
].map(tool=>({...tool,annotations}));
function object(value){return !!value&&typeof value==='object'&&!Array.isArray(value);}
function argumentsFor(tool,args){
  if(!object(args))return false;
  const s=tool.inputSchema;
  if(Object.keys(args).some(key=>!Object.hasOwn(s.properties,key))||s.required.some(key=>!Object.hasOwn(args,key)))return false;
  return Object.entries(args).every(([key,value])=>{const prop=s.properties[key];return typeof value==='string'&&(!prop.enum||prop.enum.includes(value))&&(!prop.maxLength||value.length<=prop.maxLength)&&(!prop.minLength||value.length>=prop.minLength);});
}
function themeCss(id){
  const preset=themes.presets[id],[brand,bg,fg]=preset.colors;
  const text=['night','midnight'].includes(id)?'#000':'#fff';
  return '.cc-root{--cc-brand:'+brand+';--cc-bg:'+bg+';--cc-fg:'+fg+';--cc-muted:'+fg+';--cc-border:'+fg+';--cc-radius:'+preset.radius+'px;font-family:'+themes.fonts[preset.font]+'}.cc-root .cc-btn-primary{color:'+text+'}.cc-root a{color:'+fg+'}.wct-preferences{position:fixed;inset-inline-end:16px;bottom:16px;z-index:2147482000;min-height:44px;padding:10px 16px;background:'+bg+';color:'+fg+';border:2px solid '+fg+';border-radius:8px;cursor:pointer;font:inherit}.wct-preferences:focus-visible{outline:3px solid '+fg+';outline-offset:3px}\n';
}
function result(value,isError=false){return {content:[{type:'text',text:typeof value==='string'?value:JSON.stringify(value,null,2)}],isError};}
function call(tool,args){
  if(!argumentsFor(tool,args))return result('Invalid arguments. Use only the fields and values in the tool schema.',true);
  if(tool.name==='list_templates')return result({templates:templates.map(id=>({id,scope:scope(id)})),jurisdictions:packs,themes:Object.keys(themes.presets),next:'Ask what the user wants, identify applicable jurisdictions, then read the relevant template and jurisdiction packs. For a banner, ask language, theme, platform and the real privacy-policy URL before prepare_banner. Do not guess business facts. Tools return content only; review proposed site edits with the user.',reviewStatus:'All legal packs are unreviewed. No production scan is performed.'});
  if(tool.name==='get_template')return result({id:args.id,scope:scope(args.id),reviewStatus:'draft; legal review required',source:bundled['skills/web-compliance/templates/'+args.id+'.md']});
  if(tool.name==='get_jurisdiction')return result({code:args.code,format:'yaml',reviewStatus:'unreviewed; verify source currency',source:bundled['skills/web-compliance/jurisdictions/'+args.code+'.yaml']});
  if(!kit.validPolicy(args.privacyPolicyUrl))return result('Use an existing privacy-policy path such as /privacy or an http(s) URL without credentials, spaces or backslashes.',true);
  const prefix=args.platform==='wordpress'?'web-compliance/':'', files={};
  for(const name of ['cookie-consent.js','cookie-consent.css'])files[prefix+name]=bundled['widgets/cookie-consent/'+name];
  files[prefix+'theme.css']=themeCss(args.theme);
  files[prefix+'install.js']=kit.script({language:args.language,privacyPolicyUrl:args.privacyPolicyUrl,brandColor:themes.presets[args.theme].colors[0]});
  files[prefix+'preview.html']=kit.preview(args.language);
  files[prefix+'LICENSE']=bundled.LICENSE;
  if(prefix)files[prefix+'web-compliance.php']=bundled['integrations/wordpress/web-compliance.php'];
  else files['embed.html.txt']=kit.snippet();
  const instructions=(prefix?'Zip the web-compliance directory. Upload it in WordPress: Plugins > Add New > Upload Plugin, then install and activate. Open Settings > Web Compliance.':'Upload only cookie-consent.js, cookie-consent.css, theme.css and install.js to /web-compliance/. Insert embed.html.txt into the page layout once. Adjust paths for a different directory. Frameworks need browser-only loading and lifecycle review.')+'\nOpen preview.html locally before installation. Verify the actual privacy-policy page. Connect tracker start/stop to compliance:consent and block tracking before consent and after withdrawal. Test reject, accept, preferences, reload, keyboard and mobile. No automatic tracker blocking, production scan or legal approval is included. Review all proposed file changes before applying them. To remove: deactivate the WordPress plugin, or remove the snippet and four runtime files.\n';
  files[prefix+'START-HERE.txt']=instructions;
  return result({status:'Prepared as text only; no files written or installed',platform:args.platform,instructions,files});
}
function error(id,code,message){return {jsonrpc:'2.0',id,error:{code,message}};}
let initialized=false,ready=false;
function handle(message){
  if(!object(message)||message.jsonrpc!=='2.0'||typeof message.method!=='string'||message.method.length>120||('id' in message&&!(typeof message.id==='string'&&message.id.length<=128||Number.isSafeInteger(message.id)))||('params' in message&&!object(message.params)))return error(null,-32600,'Invalid Request');
  // Notifications never elicit responses, including unknown notifications.
  if(!Object.hasOwn(message,'id')){if(message.method==='notifications/initialized'&&initialized)ready=true;return null;}
  const {id,method}=message,params=message.params||{};
  if(method==='ping')return {jsonrpc:'2.0',id,result:{}};
  if(method==='initialize'){
    if(initialized)return error(id,-32600,'Already initialized');
    if(typeof params.protocolVersion!=='string'||params.protocolVersion.length>40||!object(params.capabilities)||!object(params.clientInfo)||typeof params.clientInfo.name!=='string'||typeof params.clientInfo.version!=='string')return error(id,-32602,'Invalid initialize parameters');
    initialized=true;
    return {jsonrpc:'2.0',id,result:{protocolVersion:versions.includes(params.protocolVersion)?params.protocolVersion:versions[0],capabilities:{tools:{listChanged:false}},serverInfo:{name:'web-compliance',version:'2.7.0'},instructions:'Local, read-only toolkit. Start with list_templates. Legal material is draft and unreviewed. Never claim to have scanned, installed or approved a site. prepare_banner returns files as text; the coding client must review changes with the user before applying them.'}};
  }
  if(!ready)return error(id,-32000,'Initialize and send notifications/initialized first');
  if(method==='tools/list'){
    if(params.cursor!==undefined)return error(id,-32602,'This server has one page; omit cursor');
    return {jsonrpc:'2.0',id,result:{tools}};
  }
  if(method==='tools/call'){
    const tool=tools.find(tool=>tool.name===params.name);
    if(!tool)return error(id,-32602,'Unknown tool');
    return {jsonrpc:'2.0',id,result:call(tool,params.arguments===undefined?{}:params.arguments)};
  }
  return error(id,-32601,'Method not found');
}
async function write(message){
  if(!message)return;
  const line=JSON.stringify(message)+'\n';
  if(Buffer.byteLength(line)>MAX_OUTPUT)throw new Error('Output limit exceeded');
  if(!process.stdout.write(line))await once(process.stdout,'drain');
}
async function main(){
  let buffer=Buffer.alloc(0);
  for await(const chunk of process.stdin){
    // Process each line sequentially and respect stdout backpressure. Bound even
    // a partial line (readline would retain an unlimited, newline-free input).
    let offset=0;
    while(offset<chunk.length){
      const newline=chunk.indexOf(10,offset),end=newline<0?chunk.length:newline;
      if(buffer.length+end-offset>MAX_MESSAGE)throw new Error('Input limit exceeded');
      buffer=Buffer.concat([buffer,chunk.subarray(offset,end)]);
      if(newline<0)break;
      let request;
      try{request=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer));}
      catch{await write(error(null,-32700,'Parse error'));buffer=Buffer.alloc(0);offset=end+1;continue;}
      await write(handle(request));buffer=Buffer.alloc(0);offset=end+1;
    }
  }
  if(buffer.length)await write(error(null,-32700,'Truncated message: expected newline'));
}
try{await main();}catch{process.stderr.write('Web Compliance MCP stopped: input/output limit or transport error.\n');process.exitCode=1;process.stdin.destroy();}
