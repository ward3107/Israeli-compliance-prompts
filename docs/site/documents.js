(function(){
 'use strict';
 window.ToolkitDocumentStudio=function(container,getProject,save){
  var engine=ToolkitDocuments,inputs={},editors={},documents={},snapshot=null;
  container.innerHTML='<h3>טיוטות המסמכים של העסק</h3><p>מדיניות פרטיות, תנאי שימוש וביטולים והחזרים, בעברית ולשוק הישראלי בלבד. המסמכים נוצרים מהתשובות שלכם בדפדפן ואינם נשלחים לשרת.</p><p id="document-scope" role="status"></p><details id="document-details"><summary>השלמת פרטים למסמכים</summary><p>אין צורך לנחש. אפשר להשאיר שדה ריק והוא יסומן להשלמה. כתבו עובדות שקיימות בפועל; אם נושא אינו רלוונטי, הסבירו מדוע. אל תזינו פרטי לקוחות או מידע רגיש.</p><div id="document-fields"></div></details><div class="document-actions"><button type="button" class="button secondary" id="generate-documents">יצירת טיוטות מהתשובות</button><button type="button" class="text-button" id="export-documents" disabled>הורדת המסמכים לבדיקה</button></div><p id="document-status" role="status" aria-live="polite"></p><div id="document-editors"></div><details id="document-checklist"><summary>מה עדיין צריך להשלים ולבדוק?</summary><ul id="document-missing"></ul><p>רשימה זו נגזרת מהשאלון; עריכת המסמך אינה מאמתת את העובדות או מסירה את הצורך בביקורת.</p><a href="legal-review.html">הכנת המסירה לעורך דין</a></details>';
  var $=function(id){return container.querySelector('#'+id);};
  Object.keys(engine.fields).forEach(function(key){var label=document.createElement('label'),input=document.createElement('textarea');input.id='doc-'+key;input.maxLength=1000;input.rows=3;label.htmlFor=input.id;label.textContent=engine.fields[key];input.addEventListener('input',refresh);$('document-fields').append(label,input);inputs[key]=input;});
  function details(){var out={};Object.keys(inputs).forEach(function(k){out[k]=inputs[k].value;});return out;}
  function current(){return engine.facts(getProject(),details());}
  function allowed(){return getProject().values.market==='il';}
  function stale(){return !!snapshot&&JSON.stringify(snapshot)!==JSON.stringify(current());}
  function sourceProject(){return {values:{market:snapshot.market,'business-name':snapshot.business,'site-url':snapshot.website,'contact-email':snapshot.email,'privacy-url':snapshot.privacy},answers:snapshot.answers};}
  function checklist(){
   $('document-missing').replaceChildren();if(!snapshot)return;
   var built=engine.build(sourceProject(),snapshot.details);built.missing.concat(built.review).forEach(function(text){var li=document.createElement('li');li.textContent=text;$('document-missing').append(li);});
  }
  function refresh(){
   var ok=allowed(),old=stale();$('document-scope').textContent=ok?'שפת המסמכים היא עברית, ללא קשר לשפת הבאנר. זו טיוטה לא מאושרת; מילוי כל השדות אינו אישור משפטי.':'המחולל תומך כרגע בישראל בלבד. המסמכים אינם נכללים בהורדה עבור השוק שנבחר. טיוטות קודמות נשמרות בפרויקט להמשך עבודה.';
   Object.keys(editors).forEach(function(k){editors[k].disabled=!ok||old;});
   $('generate-documents').disabled=!ok;$('export-documents').disabled=!ok||!snapshot||old;
   $('document-status').textContent=!snapshot?'אפשר ליצור טיוטות גם עם פרטים חסרים.':old?'פרטי העסק השתנו מאז יצירת הטיוטות. העריכות נשמרו; צרו מחדש לפני הורדת המסמכים. התיק לעורך דין יכלול אזהרה על חוסר העדכניות.':'הטיוטות זמינות לעריכה ולהורדה לבדיקה. הן יצורפו גם לתיק לעורך הדין.';
  }
  function render(){
   $('document-editors').replaceChildren();editors={};
   Object.keys(documents).forEach(function(key){var section=document.createElement('details'),summary=document.createElement('summary'),label=document.createElement('label'),input=document.createElement('textarea'),preview=document.createElement('button');summary.textContent=engine.titles[key];input.id='draft-'+key;input.maxLength=10000;input.rows=16;input.value=documents[key];label.htmlFor=input.id;label.textContent='עריכת '+engine.titles[key]+' — טקסט רגיל';input.addEventListener('input',function(){documents[key]=input.value;});preview.type='button';preview.className='text-button';preview.textContent='הורדת תצוגה להדפסה / PDF';preview.addEventListener('click',function(){if(!allowed()||stale())return;save(new Blob([engine.html(engine.titles[key],documents[key])],{type:'text/html;charset=utf-8'}),key+'-DRAFT.html');});section.append(summary,label,input,preview);$('document-editors').append(section);editors[key]=preview;
   });checklist();refresh();
  }
  function validate(value){
   if(!value||typeof value!=='object'||!value.details||!value.documents)throw new Error('Invalid drafts');
   function cleanDetails(raw){var out={};Object.keys(engine.fields).forEach(function(k){var v=raw[k]===undefined?'':raw[k];if(typeof v!=='string'||v.length>1000)throw new Error('Invalid facts');out[k]=v;});return out;}
   var clean={details:cleanDetails(value.details),documents:{},snapshot:null};
   Object.keys(value.documents).forEach(function(k){if(!Object.hasOwn(engine.titles,k)||typeof value.documents[k]!=='string'||value.documents[k].length>20000)throw new Error('Invalid document');clean.documents[k]=value.documents[k];});
   if(value.snapshot){var s=value.snapshot;if(s.market!=='il'||!s.answers||!s.details)throw new Error('Invalid snapshot');clean.snapshot={market:'il'};['business','website','email','privacy'].forEach(function(k){if(typeof s[k]!=='string'||s[k].length>2000)throw new Error('Invalid identity');clean.snapshot[k]=s[k];});clean.snapshot.answers={};['sales','accounts','forms','tracking','sensitive'].forEach(function(k){if(!['yes','no','unknown'].includes(s.answers[k]))throw new Error('Invalid answer');clean.snapshot.answers[k]=s.answers[k];});clean.snapshot.details=cleanDetails(s.details);}
   if(Object.keys(clean.documents).length&&!clean.snapshot)throw new Error('Missing snapshot');return clean;
  }
  function files(forReview){
   var result={};if(!snapshot||!allowed()||(!forReview&&stale()))return result;
   var built=engine.build(sourceProject(),snapshot.details);
   Object.keys(documents).forEach(function(k){result['documents/'+k+'-DRAFT.html']=engine.html(engine.titles[k],documents[k]);result['documents/'+k+'-DRAFT.txt']='טיוטה לא מאושרת — לבדיקה משפטית בלבד.\n\n'+documents[k];});
   result['documents/review-manifest.json']=JSON.stringify({schema:1,generatorVersion:engine.version,language:'he',jurisdiction:'il',reviewStatus:'unreviewed',stale:stale(),sourceFacts:snapshot,currentFacts:current(),missing:built.missing,reviewTopics:built.review,sources:engine.sources,editedTextMayDifferFromAnswers:true},null,2);
   result['documents/READ-FIRST.txt']='טיוטות בלבד. אין אישור משפטי. בדקו את כל השדות והטקסט גם אחרי עריכה ידנית. '+(stale()?'הפרטים השתנו מאז יצירת המסמכים: נדרשת התאמה מחדש. ':'')+'קובצי HTML נפתחים בדפדפן וניתנים להדפסה או שמירה כ-PDF. קובצי TXT מיועדים לעריכה. המסמכים אינם מתפרסמים באתר ואינם מוכיחים שהבאנר או כלי המעקב הותקנו. המסמכים והפרטים עשויים להכיל מידע פרטי; בחרו למי להעבירם.';return result;
  }
  $('generate-documents').addEventListener('click',function(){if(!allowed())return;if(snapshot&&!window.confirm('יצירה מחדש תחליף את העריכות במסמכים לפי התשובות הנוכחיות. להמשיך?'))return;var built=engine.build(getProject(),details());documents=built.documents;snapshot=built.facts;render();});
  $('export-documents').addEventListener('click',function(){var out=files(false);if(Object.keys(out).length)save(ToolkitZip(out),'documents-for-legal-review.zip');});
  return {state:function(){return {details:details(),documents:Object.assign({},documents),snapshot:snapshot};},validate:validate,restore:function(value){var clean=value===undefined?{details:{},documents:{},snapshot:null}:validate(value);Object.keys(inputs).forEach(function(k){inputs[k].value=clean.details[k]||'';});documents=clean.documents;snapshot=clean.snapshot;render();},refresh:function(){refresh();Object.keys(editors).forEach(function(k){editors[k].disabled=!allowed()||stale();});},files:files};
 };
})();
