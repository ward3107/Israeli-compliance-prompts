const {chromium,firefox,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),site=path.join(root,'generated/site'),out=path.join(root,'test-results');
const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const server=http.createServer((req,res)=>{
 const file=path.resolve(site,new URL(req.url,'http://localhost').pathname.slice(1)||'start.html');
 if(!file.startsWith(site+path.sep)){res.writeHead(404);res.end();return;}
 let fd;
 try {
  fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  if(!fs.fstatSync(fd).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(fd));
 }catch{res.writeHead(404);res.end();}finally{if(fd!==undefined)fs.closeSync(fd);}
});
async function download(page,id,name){const wait=page.waitForEvent('download');await page.locator('#'+id).click();const item=await wait;const target=path.join(out,name);await item.saveAs(target);return target;}
async function main(){
 fs.mkdirSync(out,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 try{for(const [name,engine] of Object.entries({chromium,firefox,webkit}).filter(([name])=>!process.env.WCT_BROWSERS||process.env.WCT_BROWSERS.split(",").includes(name))){
  const browser=await engine.launch();try{
   const page=await browser.newPage({viewport:{width:1320,height:900}}),errors=[],unexpected=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('blob:'))unexpected.push(r.url());});
   await page.goto(base+'/start.html');await page.waitForFunction(()=>!document.getElementById('next').disabled);
   assert.equal(await page.locator('#back').isVisible(),false);assert.equal(await page.locator('#platform').inputValue(),'unknown');
   await page.locator('#next').click();assert.equal(await page.locator('[data-step="0"]').isVisible(),true);
   await page.locator('#platform').selectOption('wordpress');await page.locator('#site-url').fill('https://example.com');await page.locator('#business-name').fill('Example <script>alert(1)</script>');await page.locator('#contact-email').fill('private-contact@example.com');
   await page.locator('#next').click();assert.equal(await page.locator('#answer-tracking').inputValue(),'unknown');
   await page.locator('#privacy-url').fill('javascript:alert(1)');await page.locator('#next').click();assert.equal(await page.locator('[data-step="1"]').isVisible(),true);
   await page.locator('#privacy-url').fill('');await page.locator('#next').click();
   assert.equal(await page.locator('[data-theme]').count(),12);
   for(const button of await page.locator('[data-theme]').all()){
    await button.click();assert.match(await page.locator('#contrast').innerText(),/ניגודיות הטקסט תקינה/);
    assert.equal(await button.getAttribute('aria-pressed'),'true');
   }
   await page.getByText('התאמה אישית של העיצוב',{exact:true}).click();
   await page.locator('#background').fill('#ffffff');await page.locator('#foreground').fill('#ffffff');
   await page.locator('#next').click();assert.equal(await page.locator('[data-step="2"]').isVisible(),true);
   await page.locator('[data-theme=night]').click();await page.locator('#placement').selectOption('corner');
   await page.getByText('טקסט הבאנר והכפתורים',{exact:true}).click();
   await page.locator('#copy-title').fill('<img src=x onerror=alert(1)>');
   const frame=page.frameLocator('#guided-preview');
   await frame.getByRole('heading',{name:'<img src=x onerror=alert(1)>',exact:true}).waitFor();assert.equal(await frame.locator('.cc-title img').count(),0);
   await page.locator('#copy-title').fill('הבחירה שלכם בפרטיות');await page.locator('#copy-acceptAll').fill('מאשר את כל העוגיות');
   await page.locator('#studio-shape').selectOption('pill');await page.locator('#studio-size').selectOption('large');await page.locator('#studio-textSize').selectOption('18');
   await frame.getByRole('button',{name:'מאשר את כל העוגיות',exact:true}).waitFor();
   assert.equal(await frame.locator('[data-cc=accept]').evaluate(el=>getComputedStyle(el).borderRadius),'999px');
   await page.locator('#theme-gallery').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'guided-'+name+'-designs.png'),fullPage:false});
   await page.frameLocator('#guided-preview').getByRole('button',{name:'דחיית הכול',exact:true}).waitFor();
   await page.locator('#next').click();assert.equal(await page.locator('#download-install').isEnabled(),false);
   assert.equal(await page.locator('#next').isVisible(),false);
   assert.match(await page.locator('#summary').innerText(),/6 שאלות/);
   await page.locator('#fix-details').click();assert.equal(await page.locator('[data-step="1"]').isVisible(),true);assert.equal(await page.locator('#privacy-url').evaluate(el=>el===document.activeElement),true);await page.locator('#next').click();await page.locator('#next').click();
   const legal=await download(page,'download-review','guided-'+name+'-legal.zip');
   execFileSync('python',['-c','import sys,zipfile,json;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;p=json.loads(z.read("project.json"));assert p["answers"]["tracking"]=="unknown";s=z.read("review-summary.html").decode();assert "<script>alert(1)</script>" not in s;assert "&lt;script&gt;" in s;assert "sources/il.json" in z.namelist();assert "No lawyer" in z.read("STATUS.txt").decode()',legal]);
   const saved=await download(page,'save-project','guided-'+name+'-project.json');
   const savedData=JSON.parse(fs.readFileSync(saved,'utf8'));assert.equal(savedData.studio.copy.he.acceptAll,'מאשר את כל העוגיות');assert.equal(savedData.studio.shape,'pill');assert.equal(savedData.values.background,'#152435');assert.equal(savedData.values.radius,'12');
   delete savedData.studio;
   ['background','foreground','radius','font'].forEach(key=>delete savedData.values[key]);fs.writeFileSync(saved,JSON.stringify(savedData));
   await page.locator('#back').click();await page.locator('#back').click();await page.locator('#privacy-url').fill('https://example.com/privacy');await page.locator('#next').click();await page.locator('#next').click();
   assert.equal(await page.locator('#download-install').isEnabled(),true);
   const plugin=await download(page,'download-install','guided-'+name+'-wordpress.zip');
   execFileSync('python',['-c','import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;assert "web-compliance/web-compliance.php" in z.namelist();assert b"Plugin Name:" in z.read("web-compliance/web-compliance.php");assert not any("project.json" in n or "review-summary" in n for n in z.namelist());assert all(b"private-contact@example.com" not in z.read(n) for n in z.namelist());assert b"compliance:consent" in z.read("web-compliance/install.js")',plugin]);
   await page.screenshot({path:path.join(out,'guided-'+name+'-delivery.png'),fullPage:true});
   await page.reload();await page.waitForFunction(()=>!document.getElementById('next').disabled);await page.locator('#resume-details summary').click();await page.locator('#resume-project').setInputFiles(saved);
   await page.getByText('הפרויקט נטען. אפשר לבדוק ולעדכן את הפרטים.').waitFor();assert.equal(await page.locator('#business-name').inputValue(),'Example <script>alert(1)</script>');assert.equal(await page.locator('#background').inputValue(),'#152435');
   await page.locator('#next').click();await page.locator('#market').selectOption('unknown');await page.locator('#next').click();await page.locator('#next').click();assert.equal(await page.locator('#download-install').isEnabled(),false);
   await page.locator('#resume-project').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"web-compliance-project","version":1,"theme":"__proto__"}')});
   await page.getByText(/הקובץ אינו פרויקט תקין/).waitFor();
   await page.reload();await page.waitForFunction(()=>!document.getElementById('next').disabled);await page.evaluate(axe);
   const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));assert.deepEqual(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
   await page.setViewportSize({width:360,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'guided-'+name+'-mobile.png'),fullPage:true});
   assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);console.log(name+': guided flow, unknowns, safe links, legal ZIP, WordPress ZIP, private data separation, resume validation, accessibility and mobile passed');
  }finally{await browser.close();}
 }}finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
