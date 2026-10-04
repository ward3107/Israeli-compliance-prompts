(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, theme = 'ocean';
  var names = {'cookie-banner':'באנר עוגיות','privacy-policy':'מדיניות פרטיות','terms-of-use':'תנאי שימוש','refund-policy':'ביטולים והחזרים','accessibility-baseline':'בסיס נגישות לאתר','accessibility-widget':'הגדרות נגישות','accessibility-statement':'הצהרת נגישות','client-onboarding':'שאלון קליטת לקוח','data-subject-rights':'זכויות בנושא מידע אישי','disclaimer':'הבהרות ואחריות','ecommerce-checkout':'תהליך רכישה','email-marketing':'דיוור שיווקי','freelancer-contract':'חוזה פרילנס'};
  function preview() {
    var preset = ToolkitThemes.presets[theme], language = $('preview-language').value;
    // All interpolated CSS comes from the shipped, fixed preset catalog.
    var colors = preset.colors, light = ['night','midnight'].includes(theme);
    var css = '.cc-root{--cc-brand:'+colors[0]+';--cc-bg:'+colors[1]+';--cc-fg:'+colors[2]+';--cc-muted:'+colors[2]+';--cc-border:'+colors[2]+';--cc-radius:'+preset.radius+'px;font-family:'+ToolkitThemes.fonts[preset.font]+'}.cc-root .cc-btn-primary{color:'+(light?'#000':'#fff')+'}.cc-root a{color:'+colors[2]+'}';
    $('explore-preview').contentWindow.postMessage({type:'compliance-preview',config:{region:'auto',language:language,brandColor:colors[0]},css:css,name:'העסק לדוגמה'},location.protocol==='file:'?'*':location.origin);
    var params = new URLSearchParams({theme:theme,language:language});
    $('start-link').href = 'start.html?'+params;
    params.set('platform','wordpress');$('wordpress-link').href = 'start.html?'+params;
    params.set('platform','other');$('other-link').href = 'start.html?'+params;
  }
  Object.keys(ToolkitThemes.presets).forEach(function(key){var option=document.createElement('option');option.value=key;option.textContent=ToolkitThemes.presets[key].name;$('quick-theme').append(option);});
  ToolkitThemes.gallery($('explore-themes'),'data-explore-theme',function(key){theme=key;$('quick-theme').value=key;preview();});
  $('quick-theme').addEventListener('change',function(){theme=this.value;document.querySelectorAll('[data-explore-theme]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.exploreTheme===theme));});preview();});
  $('preview-language').addEventListener('change',preview);$('reopen').addEventListener('click',preview);
  ['wide','narrow'].forEach(function(id){$(id).addEventListener('click',function(){
    $('explore-preview').classList.toggle('mobile',id==='narrow');
    ['wide','narrow'].forEach(function(key){$(key).setAttribute('aria-pressed',String(id===key));});
  });});
  window.addEventListener('message',function(event){
    if(!(location.protocol==='file:'?event.origin==='null'||event.origin==='file://':event.origin===location.origin)||event.source!==$('explore-preview').contentWindow||!event.data)return;
    if(event.data.type==='compliance-preview-ready')preview();
    if(event.data.type==='compliance-preview-choice'&&typeof event.data.analytics==='boolean'&&typeof event.data.marketing==='boolean')$('try-status').textContent='כך הבחירה נשמרת: מדידה '+(event.data.analytics?'מותרת':'כבויה')+' · פרסום '+(event.data.marketing?'מותר':'כבוי')+'. כאן לא נטענים כלי מעקב.';
  });
  function detail(container,title,note,source,rtl){
    var details=document.createElement('details'),summary=document.createElement('summary'),small=document.createElement('small'),pre=document.createElement('pre');
    summary.append(document.createTextNode(title));small.textContent=note;summary.append(small);pre.textContent=source;pre.dir=rtl?'rtl':'ltr';pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label',title);details.append(summary,pre);container.append(details);
  }
  var sample=ToolkitDocuments.build({values:{market:'il','business-name':'עסק לדוגמה — נתונים בדיוניים','site-url':'https://example.com','contact-email':'example@example.com','privacy-url':'/privacy'},answers:{sales:'unknown',accounts:'unknown',forms:'unknown',tracking:'unknown',sensitive:'unknown'}},{});
  Object.keys(sample.documents).forEach(function(key){detail($('document-examples'),ToolkitDocuments.titles[key],'טיוטה בעברית · ישראל בלבד · נדרשת השלמה וביקורת',sample.documents[key],true);});
  ToolkitSource.load().then(function(data){
    data.catalog.forEach(function(item){
      var kind=item.id==='cookie-banner'?'רכיב מוכן + פרומפט':(['privacy-policy','terms-of-use','refund-policy'].includes(item.id)?'מחולל טיוטה + פרומפט':'פרומפט ליישום');
      var scope=item.scope==='il'?'ישראל בלבד':item.scope==='il+eu'?'שילוב ישראל והאיחוד האירופי':'הקשר מכל חבילות המדינה';
      detail($('catalog-items'),names[item.id]||item.id,kind+' · '+scope,data.files['skills/web-compliance/templates/'+item.id+'.md'],false);
    });$('catalog-status').textContent='';
  }).catch(function(){$('catalog-status').textContent='התבניות לא נטענו. רעננו את העמוד או פתחו את המאגר ב־GitHub.';});
  if(location.protocol==='file:'){$('offline-download').hidden=true;$('offline-status').textContent='אתם בסטודיו המקומי. אפשר להכין חבילות בלי אינטרנט; קישורי מקורות חיצוניים דורשים חיבור.';}
  preview();
})();
