const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path');
async function main(){const browser=await chromium.launch();try{
 const context=await browser.newContext(),page=await context.newPage(),base='http://127.0.0.1:8766';
 await page.goto(base+'/wp-login.php');await page.locator('#user_login').fill('qa-admin');await page.locator('#user_pass').fill('local-qa-admin-only-123!');await page.locator('#wp-submit').click();await page.waitForURL(/wp-admin/);
 await page.goto(base+'/wp-admin/plugin-install.php?tab=upload');await page.locator('#pluginzip').setInputFiles(path.resolve('test-results/guided-chromium-wordpress.zip'));await page.locator('#install-plugin-submit').click();
 await page.getByRole('link',{name:'Activate Plugin',exact:true}).click();
 await page.goto(base+'/');await page.getByRole('button',{name:'דחיית הכול',exact:true}).click();await page.getByRole('button',{name:'הגדרות עוגיות',exact:true}).click();await page.getByRole('button',{name:'דחיית הכול',exact:true}).waitFor();
 const style=await page.locator('.cc-root').evaluate(el=>getComputedStyle(el).getPropertyValue('--cc-bg').trim());assert.equal(style,'#152435');
 await page.screenshot({path:'test-results/wordpress-live.png',fullPage:false});
 await page.goto(base+'/wp-admin/options-general.php?page=wct-setup');assert.ok(await page.getByRole('link',{name:'בדיקה עם עורך דין',exact:true}).isVisible());
 await page.locator('input[type=checkbox][name=wct_banner_enabled]').uncheck();await page.getByRole('button',{name:'שמירת ההגדרה',exact:true}).click();
 await page.goto(base+'/');assert.equal(await page.locator('#wct-preferences').count(),0);assert.equal(await page.locator('script[src*="web-compliance/"]').count(),0);
 const anonymous=await browser.newPage();await anonymous.goto(base+'/wp-admin/options-general.php?page=wct-setup');assert.match(anonymous.url(),/wp-login.php/);
 console.log('WordPress: uploaded generated ZIP, activated, rendered chosen theme, reopened preferences, lawyer link, disabled all plugin assets, anonymous admin access blocked');
 }finally{await browser.close();}}
main().catch(error=>{console.error(error);process.exitCode=1;});
