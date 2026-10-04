// Verify the actual downloaded archive, extracted widget, scopes and accessibility.
const {chromium,firefox,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'), site=path.join(root,'generated/site'), out=path.join(root,'test-results');
const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const directory=url.pathname.startsWith('/package/')?out:site;
  const relative=url.pathname.startsWith('/package/')?url.pathname.slice(9):url.pathname.slice(1);
  const file=path.resolve(directory,relative||'builder.html');
  if(!file.startsWith(directory+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
  res.writeHead(200,{'Content-Type':(types[path.extname(file)]||'text/plain')+'; charset=utf-8'});res.end(fs.readFileSync(file));
});
async function main(){
  fs.mkdirSync(out,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    for(const [name,engine] of Object.entries({chromium,firefox,webkit}).filter(([name])=>!process.env.WCT_BROWSERS||process.env.WCT_BROWSERS.split(",").includes(name))){
      const browser=await engine.launch();
      try{
        const page=await browser.newPage({viewport:{width:1360,height:900}}), errors=[];
        page.on('pageerror',err=>errors.push(err.message));
        await page.goto(base+'/builder.html');await page.locator('#download').waitFor({state:'visible'});
        await page.waitForFunction(()=>!document.getElementById('download').disabled);
        await page.locator('#business').fill('Example <company>');await page.locator('#website').fill('https://example.com');await page.locator('#email').fill('privacy@example.com');
        for(const input of await page.locator('[data-fact]').all()){
          if(await input.evaluate(el=>el.tagName)==='SELECT')await input.selectOption('NO');else await input.fill('not using GTM');
        }
        await page.locator('[data-preset=night]').click();await page.locator('#position').selectOption('corner');await page.locator('#radius').fill('20');
        const frame=page.frameLocator('#preview');await frame.locator('.cc-root').waitFor();
        assert.equal(await frame.locator('.cc-root').evaluate(el=>getComputedStyle(el).getPropertyValue('--cc-bg').trim()),'#152435');
        await frame.getByRole('button',{name:'דחיית הכול',exact:true}).click();
        assert.equal(await page.evaluate(()=>localStorage.getItem('cc_consent_v1')),null,'preview must not change real demo consent');
        assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('cc_customizer_preview'))).marketing,false);
        await page.locator('#reopen').click();await frame.locator('.cc-root').waitFor();
        await page.locator('#language').selectOption('ar');await frame.getByRole('button',{name:'رفض الكل',exact:true}).waitFor();
        await page.locator('#region').selectOption('eu');assert.equal(await page.locator('#artifact-privacy-policy').isEnabled(),false);
        assert.equal(await page.locator('#artifact-privacy-policy').isChecked(),false);
        await page.locator('#region').selectOption('il+eu');assert.equal(await page.locator('#artifact-data-subject-rights').isEnabled(),true);
        await page.locator('#region').selectOption('us-ca');await page.locator('#language').selectOption('en');
        await page.locator('#review').check();
        await page.locator('#foreground').fill('#152435');await page.locator('#download').click();
        assert.match(await page.locator('#result').innerText(),/ניגודיות/);
        await page.locator('[data-preset=night]').click();
        await page.locator('#privacy').fill('javascript:alert(1)');await page.locator('#download').click();
        assert.match(await page.locator('#result').innerText(),/קישור הפרטיות/);await page.locator('#privacy').fill('/privacy');
        await page.screenshot({path:path.join(out,'builder-'+name+'-desktop.png'),fullPage:false});
        const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();
        const download=await downloadPromise.catch(async error=>{console.error(name, await page.evaluate(()=>({status:document.getElementById('result').textContent,invalid:Array.from(document.querySelectorAll(':invalid')).map(el=>({id:el.id,value:el.value,message:el.validationMessage}))})),errors);throw error;});
        const archive=path.join(out,'builder-'+name+'.zip'), extracted=path.join(out,'builder-'+name);await download.saveAs(archive);
        execFileSync('python',['-c',[
          'import json,sys,zipfile,pathlib',
          'z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None',
          'p=json.loads(z.read("project-profile.json")); assert p["jurisdictions"]==["us-ca"]; assert p["variables"]["BUSINESS_NAME"]=="Example <company>"',
          'm=json.loads(z.read("manifest.json")); assert m["markets"]==["us","us-ca"]',
          'assert json.loads(z.read("consent-config.json"))["region"]=="auto"',
          'assert "[MISSING:" not in z.read("drafts/cookie-banner.md").decode()',
          'assert "California" in z.read("drafts/cookie-banner.md").decode()',
          'assert "toolkit/skills/web-compliance/templates/privacy-policy.md" in z.namelist()',
          'assert "toolkit/LICENSE" in z.namelist()',
          'z.extractall(sys.argv[2])'
        ].join('\n'),archive,extracted],{stdio:'pipe'});
        execFileSync('python',[path.join(extracted,'toolkit/scripts/generate.py'),'--profile',path.join(extracted,'project-profile.json'),'--artifact','cookie-banner','--output',path.join(extracted,'regenerated.md')],{stdio:'pipe'});
        await page.goto(base+'/package/builder-'+name+'/demo.html');await page.getByRole('button',{name:'Reject all',exact:true}).click();
        await page.getByRole('button',{name:'Cookie preferences',exact:true}).click();
        assert.equal(await page.locator('.cc-root').evaluate(el=>getComputedStyle(el).getPropertyValue('--cc-bg').trim()),'#152435');
        await page.goto(base+'/builder.html');await page.waitForFunction(()=>!document.getElementById('download').disabled);
        if(name==='chromium'){
          for(const checkbox of await page.locator('[data-artifact]:enabled').all())await checkbox.check();
          await page.locator('#business').fill('Synthetic business');await page.locator('#website').fill('https://example.com');await page.locator('#email').fill('privacy@example.com');
          for(const input of await page.locator('[data-fact]').all()){
            if(await input.evaluate(el=>el.tagName)==='SELECT')await input.selectOption('NO');else await input.fill('Synthetic fact for testing');
          }
          await page.locator('#review').check();const pending=page.waitForEvent('download');await page.locator('#download').click();const all=await pending;
          const allPath=path.join(out,'builder-all.zip'),allDir=path.join(out,'builder-all');await all.saveAs(allPath);
          execFileSync('python',['-c','import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;assert len([n for n in z.namelist() if n.startswith("drafts/")])==12;z.extractall(sys.argv[2])',allPath,allDir]);
          for(const artifact of JSON.parse(fs.readFileSync(path.join(allDir,'manifest.json'),'utf8')).artifacts){
            execFileSync('python',[path.join(allDir,'toolkit/scripts/generate.py'),'--profile',path.join(allDir,'project-profile.json'),'--artifact',artifact,'--output',path.join(allDir,artifact+'.md')],{stdio:'pipe'});
          }
          await page.goto(base+'/builder.html');await page.waitForFunction(()=>!document.getElementById('download').disabled);
        }
        await page.evaluate(axe);
        const audit=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
        assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],'builder accessibility');
        await page.setViewportSize({width:360,height:740});await page.locator('#mobile').click();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile horizontal overflow');
        await page.screenshot({path:path.join(out,'builder-'+name+'-mobile.png'),fullPage:true});
        assert.deepEqual(errors,[]);console.log(name+': download CRC, extracted runtime, profile regeneration, scope gates, preview isolation, RTL, accessibility and mobile passed');
      }finally{await browser.close();}
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
