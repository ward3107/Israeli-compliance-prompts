(function(){
  'use strict';
  var labels={title:'כותרת הבאנר',body:'ההסבר בבאנר',acceptAll:'כפתור אישור הכול',rejectAll:'כפתור דחיית הכול',customize:'כפתור התאמה אישית',save:'כפתור שמירת העדפות',privacy:'קישור למדיניות הפרטיות'};
  var options={shape:{square:'ישרים',rounded:'מעוגלים',pill:'גלולה'},size:{compact:'קטנים',regular:'רגילים',large:'גדולים'},textSize:{'14':'קטן','16':'רגיל','18':'גדול','20':'גדול מאוד'}};
  var defaults={shape:'rounded',size:'regular',textSize:'16'};
  window.ToolkitStudio=function(container,language,onChange){
    var copies={},current=language(),inputs={},controls={};
    var details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='טקסט הבאנר והכפתורים';details.append(summary);
    var note=document.createElement('p');note.textContent='הטקסט נשמר לשפה שנבחרה בלבד. שדה ריק משתמש בנוסח המקורי. תארו את מה שקורה באתר ושמרו על משמעות ברורה של אישור ודחייה. נוסח מותאם ייכלל בתיק לבדיקה.';details.append(note);
    Object.keys(labels).forEach(function(key){var label=document.createElement('label'),input=document.createElement(key==='body'?'textarea':'input');input.id='copy-'+key;input.maxLength=key==='body'?1000:key==='title'?160:60;input.placeholder='הנוסח המקורי';label.htmlFor=input.id;label.textContent=labels[key];details.append(label,input);inputs[key]=input;input.addEventListener('input',function(){if(!copies[current])copies[current]={};copies[current][key]=input.value;onChange();});});
    var reset=document.createElement('button');reset.type='button';reset.className='text-button';reset.textContent='חזרה לנוסח המקורי בשפה הזאת';reset.addEventListener('click',function(){delete copies[current];loadCopy();onChange();});details.append(reset);container.append(details);
    var group=document.createElement('div');group.className='studio-options';
    Object.keys(options).forEach(function(key){var label=document.createElement('label'),select=document.createElement('select');label.textContent=({shape:'צורת הכפתורים',size:'גודל הכפתורים',textSize:'גודל הטקסט'})[key];select.id='studio-'+key;Object.keys(options[key]).forEach(function(value){var option=document.createElement('option');option.value=value;option.textContent=options[key][value];select.append(option);});select.value=defaults[key];select.addEventListener('change',onChange);label.append(select);group.append(label);controls[key]=select;});container.append(group);
    function loadCopy(){Object.keys(inputs).forEach(function(key){inputs[key].value=(copies[current]||{})[key]||'';});}
    function validate(value){
      if(!value||typeof value!=='object'||!value.copy||typeof value.copy!=='object')throw new Error('Invalid studio');
      Object.keys(options).forEach(function(key){if(!Object.hasOwn(options[key],value[key]))throw new Error('Invalid style');});
      var clean={};Object.keys(value.copy).forEach(function(lang){if(!['he','en','ar','ru'].includes(lang))throw new Error('Invalid language');clean[lang]={};var entry=value.copy[lang];if(!entry||typeof entry!=='object')throw new Error('Invalid copy');Object.keys(entry).forEach(function(key){if(!Object.hasOwn(labels,key)||typeof entry[key]!=='string'||entry[key].length>(key==='body'?1000:key==='title'?160:60))throw new Error('Invalid text');clean[lang][key]=entry[key];});});return clean;
    }
    return {
      syncLanguage:function(){if(current!==language()){current=language();loadCopy();}},
      copy:function(){return JSON.parse(JSON.stringify(copies));},
      state:function(){return {copy:this.copy(),shape:controls.shape.value,size:controls.size.value,textSize:controls.textSize.value};},
      validate:validate,
      restore:function(value){var data=value||Object.assign({copy:{}},defaults);copies=validate(data);Object.keys(options).forEach(function(key){controls[key].value=data[key];});current=language();loadCopy();},
      css:function(){var size=controls.size.value,r=({square:0,rounded:12,pill:999})[controls.shape.value],font=({compact:14,regular:16,large:18})[size],padding=({compact:'8px 12px',regular:'12px 20px',large:'16px 26px'})[size];return '.cc-root .cc-btn{border-radius:'+r+'px;font-size:'+font+'px;padding:'+padding+';min-height:44px;max-width:100%;white-space:normal;overflow-wrap:anywhere}.cc-root .cc-body{font-size:'+controls.textSize.value+'px}.cc-root .cc-title{font-size:'+(Number(controls.textSize.value)+3)+'px}.cc-root .cc-title,.cc-root .cc-body,.cc-root .cc-link{overflow-wrap:anywhere}\n';}
    };
  };
})();
