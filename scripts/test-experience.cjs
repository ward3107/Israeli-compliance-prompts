// Exercise the actual hosted and double-clickable distributions without a CDN.
const {chromium,firefox,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{execFileSync}=require('node:child_process');
const site=path.resolve('generated/site'),out=path.resolve('test-results/experience');
const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const server=http.createServer((req,res)=>{
  const file=path.resolve(site,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');
  if(!file.startsWith(site+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.zip':'application/zip'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
});
async function main(){
  fs.mkdirSync(out,{recursive:true});
  execFileSync('python',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',path.join(site,'web-compliance-studio.zip'),path.join(out,'studio')]);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  try{for(const [name,engine] of Object.entries({chromium,firefox,webkit}).filter(([name])=>!process.env.WCT_BROWSERS||process.env.WCT_BROWSERS.split(",").includes(name))){
    const browser=await engine.launch();try{for(const offline of [false,true]){
      const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
      const page=await context.newPage(),errors=[],remote=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(/^https?:/.test(r.url())&&(offline||!r.url().startsWith(base)))remote.push(r.url());});
      if(offline)await context.route(/^https?:/,route=>route.abort());
      await page.goto(offline?pathToFileURL(path.join(out,'studio/START-HERE.html')).href:base+'/explore.html');
      await page.waitForFunction(()=>document.querySelectorAll('#catalog-items details').length===13);
      assert.equal(await page.locator('#document-examples details').count(),3);
      assert.equal(await page.locator('input').count(),0,'Discovery must not require business details');
      await page.locator('[data-explore-theme=forest]').click();await page.locator('#preview-language').selectOption('en');
      const frame=page.frameLocator('#explore-preview');await frame.getByRole('button',{name:'Reject all',exact:true}).waitFor();
      await frame.getByRole('button',{name:'Reject all',exact:true}).click();await page.locator('#reopen').click();
      await frame.getByRole('button',{name:'Customize',exact:true}).waitFor();
      await page.locator('#narrow').click();assert.ok(await page.locator('#explore-preview').evaluate(el=>el.getBoundingClientRect().width)<=360);
      await page.locator('#catalog-items details').first().locator('summary').click();
      assert.ok((await page.locator('#catalog-items pre').first().textContent()).length>100);
      await page.evaluate(axe);
      const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
      assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
      await page.setViewportSize({width:360,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:path.join(out,`${name}-${offline?'offline':'online'}.png`),fullPage:true});
      // DOM-injected inline code must actually be blocked, not just documented.
      const blocked=await page.evaluate(()=>{const s=document.createElement('script');s.textContent='window.__unexpectedScriptRan=true';document.body.append(s);return window.__unexpectedScriptRan!==true;});assert.equal(blocked,true);
      await page.locator('#other-link').click();await page.waitForFunction(()=>!document.getElementById('next').disabled);
      assert.equal(await page.locator('#platform').inputValue(),'other');assert.equal(await page.locator('#accent').inputValue(),'#216348');assert.equal(await page.locator('#output-language').inputValue(),'en');
      await page.locator('#site-url').fill('https://example.com');await page.locator('#business-name').fill('Portable example');await page.locator('#contact-email').fill('private@example.com');await page.locator('#next').click();
      await page.locator('#market').selectOption('us-ca');await page.locator('#privacy-url').fill('/privacy');await page.locator('#next').click();await page.locator('#next').click();
      const waiting=page.waitForEvent('download');await page.locator('#download-install').click();const download=await waiting;
      const dest=path.join(out,`${name}-${offline?'offline':'online'}.zip`);await download.saveAs(dest);
      const extracted=dest+'.files';
      execFileSync('python',['-c','import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;assert "embed.html.txt" in z.namelist();assert "preview.html" in z.namelist();assert b\'"region": "auto"\' in z.read("install.js");assert all(b"private@example.com" not in z.read(n) for n in z.namelist());z.extractall(sys.argv[2])',dest,extracted]);
      await page.goto(pathToFileURL(path.join(extracted,'preview.html')).href);
      await page.getByRole('button',{name:'Reject all',exact:true}).click();await page.locator('#wct-preferences').click();
      await page.getByRole('button',{name:'Reject all',exact:true}).waitFor();
      assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);await context.close();
      console.log(`${name} ${offline?'offline':'online'}: complete catalog, preview, design transfer, CSP, a11y, mobile and universal package passed`);
    }}finally{await browser.close();}
  }}finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
