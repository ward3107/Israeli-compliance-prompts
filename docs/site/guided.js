(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var step = 0, toolkit, studio, theme = 'ocean';
  var themes = ToolkitThemes.presets;
  var questions = {sales:'אפשר לקנות מוצרים או שירותים באתר?',accounts:'לקוחות יכולים לפתוח חשבון?',forms:'יש טפסים לאיסוף פרטים?',tracking:'משתמשים בכלי מדידה או פרסום?',sensitive:'נאסף מידע רפואי, מידע על ילדים או מידע רגיש אחר?'};
  var answers = {yes:'כן',no:'לא',unknown:'לא יודע/ת'};
  var marketNames = {il:'ישראל',eu:'האיחוד האירופי','il+eu':'ישראל והאיחוד האירופי',uk:'בריטניה','us-ca':'קליפורניה',us:'ארה״ב — שכבה פדרלית בלבד',ca:'קנדה',unknown:'מדינות אחרות / לא ידוע'};
  var fields = ['site-url','business-name','contact-email','platform','market','output-language','privacy-url','accent','placement','background','foreground','radius','font'];
  function escape(value) { return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function json(value) { return JSON.stringify(value,null,2); }
  function httpUrl(value) { try { var url = new URL(value); return ['https:','http:'].includes(url.protocol) && !url.username && !url.password; } catch(e) { return false; } }
  function privacyUrl(value) {
    if (!value) return true;
    if (/[\\\s<>]/.test(value)) return false;
    return /^\/(?!\/)/.test(value) || httpUrl(value);
  }
  function project() {
    var values = {}; fields.forEach(function(id){values[id]=$(id).value.trim();});
    var response = {}; Object.keys(questions).forEach(function(key){response[key]=$('answer-'+key).value;});
    return {format:'web-compliance-project',version:1,theme:theme,values:values,answers:response,studio:studio.state()};
  }
  function config() {
    // A client's markets are not a visitor's verified location. Start opt-in everywhere.
    return {textOverrides:studio?studio.copy():{},region:'auto',language:$('output-language').value,privacyPolicyUrl:$('privacy-url').value.trim(),brandColor:$('accent').value,ukFirstPartyAnalyticsExempt:false};
  }
  function luminance(hex) { var rgb=hex.slice(1).match(/../g).map(function(x){var v=parseInt(x,16)/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; }
  function css() {
    var color=$('accent').value,bg=$('background').value,fg=$('foreground').value,r=Number($('radius').value),light=luminance(color),buttonText=(1.05/(light+.05))>=((light+.05)/.05)?'#fff':'#000';
    var result='.cc-root{--cc-brand:'+color+';--cc-bg:'+bg+';--cc-fg:'+fg+';--cc-muted:'+fg+';--cc-border:'+fg+';--cc-radius:'+r+'px;font-family:'+ToolkitThemes.fonts[$('font').value]+'}.cc-root .cc-btn-primary{color:'+buttonText+'}.cc-root a{color:'+fg+'}.cc-root button,.cc-root input{font-family:inherit}.cc-root :focus-visible{outline-color:'+fg+'}\n';
    if($('placement').value==='top') result+='.cc-root{top:0;bottom:auto}.cc-root .cc-banner{border-bottom:1px solid var(--cc-border);border-radius:0 0 '+r+'px '+r+'px}\n';
    if($('placement').value==='corner') result+='.cc-root{left:auto;right:16px;bottom:16px;width:min(440px,calc(100% - 32px));max-height:calc(100dvh - 32px)}.cc-root .cc-banner{border-bottom:1px solid var(--cc-border);border-radius:'+r+'px}\n';
    result+='.cc-root .cc-btn{border-radius:'+Math.min(r,16)+'px}\n';
    return result+(studio?studio.css():'')+'.wct-preferences{position:fixed;inset-inline-end:16px;bottom:16px;z-index:2147482000;min-height:44px;padding:10px 16px;background:'+bg+';color:'+fg+';border:2px solid '+fg+';border-radius:8px;cursor:pointer;font:inherit}.wct-preferences:focus-visible{outline:3px solid '+fg+';outline-offset:3px}\n';
  }
  function contrast() {var a=luminance($('background').value),b=luminance($('foreground').value);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
  function preview() {if(studio)studio.syncLanguage();$('radius-value').textContent=$('radius').value;$('contrast').textContent=(contrast()>=4.5?'ניגודיות הטקסט תקינה: ':'בחרו צבעים מנוגדים יותר: ')+contrast().toFixed(2)+' / 4.5'; $('guided-preview').contentWindow.postMessage({type:'compliance-preview',config:config(),css:css(),name:$('business-name').value},location.origin); }
  function valid(current) {
    var controls=document.querySelector('[data-step="'+current+'"]').querySelectorAll('input,select');
    for(var el of controls){ if(!el.checkValidity()){el.reportValidity();return false;} }
    if(current===0 && !httpUrl($('site-url').value.trim())) { $('form-error').textContent='הזינו כתובת אתר שמתחילה ב־https:// או http://, ללא פרטי כניסה.';$('site-url').focus();return false; }
    if(current===1 && !privacyUrl($('privacy-url').value.trim())) { $('form-error').textContent='הקישור למדיניות צריך להיות כתובת http/https או נתיב כמו /privacy.';$('privacy-url').focus();return false; }
    if(current===2 && contrast()<4.5){$('form-error').textContent='בחרו רקע וטקסט מנוגדים יותר לפני הכנת החבילה (לפחות 4.5).';return false;}
    return true;
  }
  function show(next) {
    step=next;document.querySelectorAll('[data-step]').forEach(function(el){el.hidden=Number(el.dataset.step)!==step;});
    document.querySelectorAll('.progress li').forEach(function(el,i){if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('back').hidden=step===0;$('next').hidden=step===3;$('next').textContent=step===2?'הכנת החבילה':'ממשיכים';$('form-error').textContent='';
    if(step===2)preview();if(step===3)summary();$('step-'+step).focus();
  }
  function openQuestions() {
    var list=[];Object.keys(questions).forEach(function(key){if($('answer-'+key).value==='unknown')list.push(questions[key]);});
    if(!$('privacy-url').value.trim())list.push('אין עדיין קישור למדיניות פרטיות. נדרשים הכנה ובדיקה לפני התקנה.');
    if($('market').value==='unknown')list.push('צריך לברר לאילו מדינות העסק פונה ואילו דינים רלוונטיים.');
    if($('platform').value==='unknown')list.push('צריך לזהות את מערכת האתר כדי לבחור דרך התקנה.');
    return list;
  }
  function topics() {
    var items=['פרטיות, עוגיות ונגישות'];
    if($('answer-sales').value!=='no')items.push('תנאי רכישה, ביטולים והחזרים');
    if($('answer-accounts').value!=='no')items.push('חשבונות משתמשים, הרשאות ושמירת מידע');
    if($('answer-forms').value!=='no')items.push('איסוף פרטים בטפסים והודעות למשתמשים');
    if($('answer-tracking').value!=='no')items.push('כלי מעקב, ספקים והסכמה');
    if($('answer-sensitive').value!=='no')items.push('בדיקה פרטנית של מידע רגיש או מידע על ילדים');
    return items;
  }
  function summary() {
    $('summary').replaceChildren();var name=document.createElement('p');name.textContent=$('business-name').value+' · '+marketNames[$('market').value];$('summary').append(name);
    var open=openQuestions();var info=document.createElement('p');info.textContent=open.length?open.length+' שאלות פתוחות ייכללו בתיק לבדיקה.':'התשובות הוזנו. עדיין נדרשות בדיקות באתר ובדיקה משפטית.';$('summary').append(info);
    var wp=$('platform').value==='wordpress';
    $('installation-text').textContent=wp?'הקובץ הוא תוסף WordPress שמציג את הבאנר בעיצוב שבחרתם.':'החבילה כוללת באנר מעוצב והוראות למי שמטפל באתר. עדיין אין התקנה אוטומטית למערכת שבחרתם.';
    $('download-install').textContent=wp?'הורדת תוסף WordPress':'הורדת חבילה למתקין';
    var blocked=!$('privacy-url').value.trim() || $('market').value==='unknown';
    $('download-install').disabled=blocked || !toolkit;
    $('installation-blocker').textContent=blocked?'אפשר כבר להוריד תיק לעורך דין. להורדת ההתקנה, חזרו לשאלון והשלימו את מדינות היעד ואת הקישור למדיניות הפרטיות.':'';
    $('install-steps').replaceChildren();
    (wp?['ב־WordPress פתחו: תוספים ← תוסף חדש ← העלאת תוסף.','בחרו את קובץ ה־ZIP שהורדתם, התקינו והפעילו.','פתחו: הגדרות ← Web Compliance ופעלו לפי רשימת הבדיקות.']:['הורידו את החבילה ושלחו למי שמטפל באתר.','בקשו להתקין לפי START-HERE.html ולבדוק את כלי המעקב.']).forEach(function(text){var li=document.createElement('li');li.textContent=text;$('install-steps').append(li);});
  }
  function save(blob,name) { var url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000); }
  function page(title,body) { return '<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;padding:20px;line-height:1.8;color:#183348}h1{line-height:1.3}li{margin:8px 0}table{border-collapse:collapse;width:100%}td,th{padding:12px;border:1px solid #9aaab5;text-align:right;overflow-wrap:anywhere}@media print{body{margin:0}}</style><body><h1>'+escape(title)+'</h1>'+body+'</body></html>'; }
  function reviewReport() {
    var p=project();return page('תיק הכנה לבדיקה משפטית',
      '<h2>נוסח הבאנר שהלקוח ערך</h2><p>שדות שלא נערכו משתמשים בנוסח המקורי של הטולקיט. יש לבדוק התאמה לפעילות האתר ומשמעות הכפתורים.</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+escape(json(studio.copy()))+'</pre><p>הוכן בתאריך '+new Date().toISOString().slice(0,10)+'. זהו סיכום תשובות הלקוח, לא חוות דעת או אישור משפטי. ניתן להדפיס או לשמור כ־PDF מתפריט הדפדפן.</p><h2>העסק והאתר</h2><table><tr><th>עסק</th><td>'+escape(p.values['business-name'])+'</td></tr><tr><th>אתר</th><td>'+escape(p.values['site-url'])+'</td></tr><tr><th>אימייל לפניות</th><td>'+escape(p.values['contact-email'])+'</td></tr><tr><th>קהלי יעד</th><td>'+escape(marketNames[p.values.market])+'</td></tr></table><h2>תשובות הלקוח</h2><table>'+Object.keys(questions).map(function(key){return '<tr><th>'+escape(questions[key])+'</th><td>'+escape(answers[p.answers[key]])+'</td></tr>';}).join('')+'</table><h2>שאלות להשלמה</h2><ul>'+openQuestions().map(function(q){return '<li>'+escape(q)+'</li>';}).join('')+'</ul><h2>נושאים מוצעים לבדיקה</h2><ul>'+topics().map(function(q){return '<li>'+escape(q)+'</li>';}).join('')+'</ul><p>האתר לא נסרק ולא נבדק אוטומטית. התוסף אינו מנהל את כלי המעקב הקיימים. יש להשוות את התשובות להתנהגות האמיתית באתר.</p><h2>תיעוד הביקורת המקצועית</h2><p>למילוי על ידי עורך הדין: שם ומדינות רלוונטיות; תאריך; גרסאות שנבדקו; היקף, הנחות והחרגות; ליקויים ותיקונים; מסמכים או חוות דעת שנמסרו. כל חבילות המקורות בטולקיט ממתינות לביקורת משפטית ואין לראות בהן רשימה מלאה של הדין החל.</p><p>אין כיום עורך דין שותף או מחיר מוסכם. הלקוח בוחר למי להעביר את התיק. לא נשלח מידע על ידי הטולקיט.</p>');
  }
  function instructions(wp) {
    return page('התקנה ובדיקה באתר', '<p>עבור '+escape($('business-name').value)+' — '+escape($('site-url').value)+'</p>'+ (wp?'<ol><li>העלו את ZIP התוסף דרך תוספים ← תוסף חדש ← העלאת תוסף.</li><li>התקינו והפעילו. כנסו להגדרות ← Web Compliance.</li><li>להסרה, השביתו ומחקו את התוסף. הוא אינו יוצר דפי מדיניות.</li></ol>':'<ol><li>העלו את cookie-consent.css, theme.css, cookie-consent.js ו-install.js לאתר.</li><li>טענו את שני קובצי העיצוב לפי הסדר הזה, ואז את שני הסקריפטים לאחר תוכן העמוד.</li><li>הוסיפו כפתור עם id="wct-preferences" לפתיחת ההעדפות.</li></ol>')+'<h2>רשימת בדיקות למתקין</h2><ul><li>בחלון פרטי, בדקו קבלה, דחייה, שינוי העדפות וטעינה חוזרת.</li><li>ודאו שקישור מדיניות הפרטיות קיים ומתאים לעסק.</li><li>בדקו מקלדת, נייד וכיוון הכתיבה.</li><li>חברו את כלי המעקב לאירוע compliance:consent ובדקו ברשת שהם חסומים לפני הסכמה ולאחר ביטולה. אין חסימה אוטומטית של קוד מתוספים אחרים.</li><li>הבאנר מתחיל ב־opt-in לכל המבקרים. בחירת מדינות בשאלון אינה זיהוי מיקום המבקר.</li></ul><h2>בדיקה משפטית</h2><p>פנו לעורך דין מתאים ובקשו בדיקת המסמכים וההתנהגות הרלוונטית באתר. אין כאן אישור משפטי.</p><a href="https://ward3107.github.io/web-compliance-prompts/legal-review.html">מידע על הכנת תיק לעורך דין</a>');
  }
  function installCode() {
    var labels={he:'הגדרות עוגיות',ar:'إعدادات ملفات الارتباط',en:'Cookie preferences',ru:'Настройки файлов cookie'};
    return '(function(){"use strict";CookieConsent.init(Object.assign('+json(config()).replace(/</g,'\\u003c')+', {onChange:function(consent){window.dispatchEvent(new CustomEvent("compliance:consent",{detail:consent}));}}));var button=document.getElementById("wct-preferences");if(button){button.textContent='+JSON.stringify(labels[$('output-language').value])+';button.setAttribute("aria-label",button.textContent);button.addEventListener("click",function(){CookieConsent.show();});}})();\n';
  }
  function installation() {
    if(!toolkit || contrast()<4.5 || !$('privacy-url').value.trim() || $('market').value==='unknown')return;
    var wp=$('platform').value==='wordpress',prefix=wp?'web-compliance/':'',files={};
    ['cookie-consent.js','cookie-consent.css'].forEach(function(name){files[prefix+name]=toolkit.files['widgets/cookie-consent/'+name];});
    files[prefix+'theme.css']=css();files[prefix+'install.js']=installCode();files[prefix+'LICENSE']=toolkit.files.LICENSE;
    if(wp)files[prefix+'web-compliance.php']=toolkit.files['integrations/wordpress/web-compliance.php'];
    files[prefix+'START-HERE.html']=instructions(wp);
    save(ToolkitZip(files),wp?'web-compliance-wordpress.zip':'web-compliance-install.zip');$('download-status').textContent='הקובץ הוכן להורדה. התקנה ובדיקה באתר עדיין נדרשות.';
  }
  function reviewDownload() {
    var files={'review-summary.html':reviewReport(),'project.json':json(project()),'STATUS.txt':'DRAFT FOR LEGAL REVIEW. No lawyer has reviewed or signed this project. No production scan or integration test has been performed.'};
    if(toolkit && $('market').value!=='unknown') {
      var codes=$('market').value.split('+');if(codes.includes('us-ca'))codes.unshift('us');
      codes.forEach(function(code){files['sources/'+code+'.json']=json(toolkit.packs[code]);});
    }
    save(ToolkitZip(files),'legal-review-package.zip');$('download-status').textContent='התיק הוכן להורדה. פתחו review-summary.html והעבירו לעורך דין לבחירתכם. דבר לא נשלח אוטומטית.';
  }
  async function resume(event) {
    var file=event.target.files[0];if(!file)return;
    try {
      if(file.size>100000)throw new Error();var value=JSON.parse(await file.text());
      if(value.format!=='web-compliance-project'||value.version!==1||!Object.hasOwn(themes,value.theme)||!value.values||!value.answers)throw new Error();
      if(value.studio!==undefined)studio.validate(value.studio);
      var defaults={background:themes[value.theme].colors[1],foreground:themes[value.theme].colors[2],radius:String(themes[value.theme].radius),font:themes[value.theme].font};
      Object.keys(defaults).forEach(function(key){if(value.values[key]===undefined)value.values[key]=defaults[key];});
      fields.forEach(function(id){var text=value.values[id];if(typeof text!=='string'||text.length>2000)throw new Error();var el=$(id);if(el.tagName==='SELECT'&&!Array.from(el.options).some(function(opt){return opt.value===text;}))throw new Error();});
      if(!/^#[0-9a-f]{6}$/i.test(value.values.accent)||!httpUrl(value.values['site-url'])||!privacyUrl(value.values['privacy-url']))throw new Error();
      if(!/^#[0-9a-f]{6}$/i.test(value.values.background)||!/^#[0-9a-f]{6}$/i.test(value.values.foreground)||!/^([0-9]|1[0-9]|2[0-8])$/.test(value.values.radius))throw new Error();
      Object.keys(questions).forEach(function(key){if(!Object.hasOwn(answers,value.answers[key]))throw new Error();});
      fields.forEach(function(id){$(id).value=value.values[id];});Object.keys(questions).forEach(function(key){$('answer-'+key).value=value.answers[key];});theme=value.theme;studio.restore(value.studio);markTheme();show(0);$('load-status').textContent='הפרויקט נטען. אפשר לבדוק ולעדכן את הפרטים.';
    } catch(error) {$('load-status').textContent='הקובץ אינו פרויקט תקין מהמערכת. בחרו קובץ JSON ששמרתם כאן (עד 100KB).';}
    event.target.value='';
  }
  function markTheme(){document.querySelectorAll('[data-theme]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.theme===theme));});}
  Object.keys(questions).forEach(function(key){var label=document.createElement('label'),select=document.createElement('select');select.id='answer-'+key;label.htmlFor=select.id;label.textContent=questions[key];Object.keys(answers).forEach(function(answer){var option=document.createElement('option');option.value=answer;option.textContent=answers[answer];select.append(option);});select.value='unknown';$('business-questions').append(label,select);});
  studio=ToolkitStudio($('copy-studio'),function(){return $('output-language').value;},preview);
  $('output-language').addEventListener('change',function(){studio.syncLanguage();});
  $('setup').addEventListener('submit',function(event){event.preventDefault();if(step<3 && toolkit && valid(step))show(step+1);});
  $('next').addEventListener('click',function(){if(valid(step))show(step+1);});$('back').addEventListener('click',function(){show(step-1);});
  $('setup').addEventListener('input',function(){if(step===2)preview();$('download-status').textContent='';});
  $('setup').addEventListener('change',function(){if(step===2)preview();});
  ToolkitThemes.gallery($('theme-gallery'),'data-theme',function(key,preset){theme=key;['accent','background','foreground'].forEach(function(id,i){$(id).value=preset.colors[i];});$('radius').value=preset.radius;$('font').value=preset.font;preview();});
  $('preview-again').addEventListener('click',preview);
  $('download-install').addEventListener('click',installation);$('download-review').addEventListener('click',reviewDownload);
  $('download-handoff').addEventListener('click',function(){save(new Blob([instructions($('platform').value==='wordpress')],{type:'text/html;charset=utf-8'}),'installation-handoff.html');});
  $('save-project').addEventListener('click',function(){save(new Blob([json(project())],{type:'application/json'}),'web-compliance-project.json');});$('resume-project').addEventListener('change',resume);
  window.addEventListener('message',function(event){if(event.origin===location.origin && event.source===$('guided-preview').contentWindow && event.data && event.data.type==='compliance-preview-ready')preview();});
  fetch('toolkit.json').then(function(response){if(!response.ok)throw new Error();return response.json();}).then(function(data){if(!data.files['integrations/wordpress/web-compliance.php'])throw new Error();toolkit=data;$('next').disabled=false;$('load-status').textContent='מוכנים להתחיל. הפרטים אינם נשלחים לשרת.';}).catch(function(){$('load-status').textContent='קובצי ההתקנה לא נטענו. בדקו את החיבור ורעננו את העמוד.';});
})();
