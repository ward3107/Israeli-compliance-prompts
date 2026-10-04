(function(){
  'use strict';
  var $=function(id){return document.getElementById(id);},config='',filename='.mcp.json';
  function invalidate(){config='';$('config-result').hidden=true;$('config-status').textContent='';}
  $('mcp-path').addEventListener('input',invalidate);$('mcp-client').addEventListener('change',invalidate);
  $('connection-form').addEventListener('submit',function(event){
    event.preventDefault();invalidate();
    var path=$('mcp-path').value.trim();
    if(!/^(?:\/(?!\/)|[a-zA-Z]:[\\/])/.test(path)||!/[\\/]mcp[\\/]server\.mjs$/.test(path)||/[\u0000-\u001f\u007f]/.test(path)||path.length>1000){$('config-status').textContent='הדביקו נתיב מלא שמסתיים ב־mcp/server.mjs (או mcp\\server.mjs ב־Windows).';$('mcp-path').focus();return;}
    var client=$('mcp-client').value,legacy=client==='vscode-legacy',entry={type:'stdio',command:'node',args:[path]},value={};
    value[legacy?'servers':'mcpServers']={'web-compliance':entry};config=JSON.stringify(value,null,2)+'\n';filename=legacy?'mcp.json':'.mcp.json';
    $('config-output').textContent=config;
    $('config-instructions').textContent=legacy?'ב־VS Code, הוסיפו את ההגדרה לקובץ .vscode/mcp.json בפרויקט. לחצו Start מעל השרת.':client==='generic'?'זה מבנה נפוץ. התאימו את מיקום הקובץ והמבנה לפי תיעוד התוכנה שלכם; command ו־args הם ערכי החיבור.':'הוסיפו את ההגדרה לקובץ .mcp.json בתיקיית הפרויקט שלכם. פתחו מחדש את הפרויקט ואשרו את החיבור אם התוכנה מבקשת.';
    $('config-result').hidden=false;$('config-status').textContent='ההגדרה מוכנה. עכשיו מוסיפים אותה לתוכנה שלכם.';
  });
  async function copy(text,status,output){
    try{if(!navigator.clipboard)throw new Error();await navigator.clipboard.writeText(text);status.textContent='הועתק. אפשר להדביק בתוכנה שלכם.';}
    catch(e){var range=document.createRange();range.selectNodeContents(output);var selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='סימנו את הטקסט. העתיקו אותו ידנית מתפריט הדפדפן או עם Ctrl/Cmd+C.';}
  }
  $('copy-config').addEventListener('click',function(){if(config)copy(config,$('config-status'),$('config-output'));});
  $('copy-prompt').addEventListener('click',function(){copy($('starter-prompt').textContent,$('prompt-status'),$('starter-prompt'));});
  $('download-config').addEventListener('click',function(){
    if(!config)return;var url=URL.createObjectURL(new Blob([config],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},30000);
  });
  if(location.protocol==='file:'){$('mcp-download').href='https://ward3107.github.io/web-compliance-prompts/web-compliance-mcp.zip';$('mcp-offline-hint').textContent='להורדת חבילת MCP נדרש חיבור לאינטרנט. אחרי ההורדה השרת עצמו עובד מקומית, בלי פניות רשת.';}
})();
