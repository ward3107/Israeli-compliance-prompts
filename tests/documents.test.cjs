const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../docs/site/documents-engine.js');
const project={values:{market:'il','business-name':'Example','site-url':'https://example.com','contact-email':'owner@example.com','privacy-url':'/privacy'},answers:{sales:'unknown',tracking:'unknown',accounts:'unknown',forms:'unknown',sensitive:'unknown'}};
test('incomplete facts generate three marked drafts without invented operational promises',()=>{
 const result=engine.build(project,{});assert.equal(Object.keys(result.documents).length,3);assert.ok(result.missing.length>10);assert.equal(result.reviewStatus,'unreviewed');
 const text=Object.values(result.documents).join('\n');assert.match(text,/להשלמה/);assert.doesNotMatch(text,/72 שעות|14 ימי עסקים|Privacy Shield|24 חודשים|75,000/);assert.ok(result.sources.every(s=>s.url.startsWith('https://www.gov.il/')));
});
test('no sales omits refunds while unknown sales retains unresolved refund draft',()=>{
 assert.equal(engine.build({...project,answers:{...project.answers,sales:'no'}},{}).documents.refunds,undefined);
 assert.ok(engine.build(project,{}).documents.refunds);
});
test('combined or unsupported jurisdictions cannot produce Israeli documents',()=>{
 for(const market of ['eu','il+eu','unknown','us'])assert.throws(()=>engine.build({...project,values:{...project.values,market}},{}),/Israel-only/);
});
test('fact snapshot is independent and HTML output renders supplied markup as text',()=>{
 const details={owner:'<script>alert(1)</script>',address:'Example address'};const built=engine.build(project,details);details.owner='Changed';assert.equal(built.facts.details.owner,'<script>alert(1)</script>');
 const html=engine.html('Draft',built.documents.privacy);assert.doesNotMatch(html,/<script\b/i);assert.match(html,/&lt;script&gt;/);assert.match(html,/טיוטה לא מאושרת/);
 for(const attack of ['<ScRiPt src=x>alert(1)</ScRiPt >','<script\n>alert(1)</script>','<img src=x onerror=alert(1)>']) {
  const exported=engine.html('Draft',attack);assert.doesNotMatch(exported,/<(?:script|img)\b/i);assert.ok(exported.includes('&lt;'));
 }
});
test('maximum form inputs fit editor and project limits',()=>{
 const details=Object.fromEntries(Object.keys(engine.fields).map(k=>[k,'א'.repeat(1000)]));const result=engine.build(project,details);
 for(const text of Object.values(result.documents))assert.ok(text.length<20000);
 assert.ok(Buffer.byteLength(JSON.stringify({details,documents:result.documents,snapshot:result.facts}))<600000);
});
