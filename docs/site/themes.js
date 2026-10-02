(function () {
  'use strict';
  var presets = {
    ocean:{name:'כחול ים',colors:['#145f78','#ffffff','#183348'],radius:12,font:'inherit'},
    forest:{name:'ירוק יער',colors:['#216348','#f5fff8','#183d2e'],radius:16,font:'inherit'},
    night:{name:'לילה',colors:['#90c8ff','#152435','#f1f6fa'],radius:12,font:'system'},
    graphite:{name:'גרפיט',colors:['#252525','#ffffff','#202020'],radius:0,font:'system'},
    plum:{name:'שזיף',colors:['#702f63','#fff7fd','#382031'],radius:24,font:'inherit'},
    coral:{name:'אלמוג',colors:['#a63236','#fff8f6','#452122'],radius:20,font:'inherit'},
    cobalt:{name:'קובלט',colors:['#204acb','#f4f7ff','#17284b'],radius:4,font:'system'},
    olive:{name:'זית',colors:['#4c601d','#fafcf2','#2d381b'],radius:8,font:'serif'},
    espresso:{name:'אספרסו',colors:['#784827','#fffaf4','#3f2b20'],radius:4,font:'serif'},
    lavender:{name:'לבנדר',colors:['#60429b','#faf7ff','#352747'],radius:28,font:'inherit'},
    midnight:{name:'חצות סגול',colors:['#d9b9ff','#261b36','#f7efff'],radius:20,font:'system'},
    slate:{name:'כסוף',colors:['#354d65','#eef3f7','#213243'],radius:0,font:'inherit'}
  };
  function gallery(container,attribute,onSelect) {
    container.replaceChildren();
    Object.keys(presets).forEach(function(key){
      var preset=presets[key],button=document.createElement('button'),swatches=document.createElement('span');
      button.type='button';button.setAttribute(attribute,key);button.setAttribute('aria-pressed',String(key==='ocean'));
      button.style.setProperty('--sample-brand',preset.colors[0]);button.style.setProperty('--sample-bg',preset.colors[1]);button.style.setProperty('--sample-fg',preset.colors[2]);button.style.setProperty('--sample-radius',Math.min(preset.radius,18)+'px');
      var sample=document.createElement('span');sample.className='theme-sample';sample.setAttribute('aria-hidden','true');
      sample.innerHTML='<span class="sample-banner"><span class="sample-heading">הפרטיות שלכם.</span><span class="sample-line"></span><span class="sample-line short"></span><span class="sample-actions"><i></i><i></i></span></span>';
      swatches.className='theme-swatches';swatches.setAttribute('aria-hidden','true');
      preset.colors.forEach(function(color){var dot=document.createElement('i');dot.style.backgroundColor=color;swatches.append(dot);});
      var caption=document.createElement('span');caption.className='theme-caption';caption.append(document.createTextNode(preset.name),swatches);button.append(sample,caption);
      button.addEventListener('click',function(){container.querySelectorAll('button').forEach(function(el){el.setAttribute('aria-pressed',String(el===button));});onSelect(key,preset);});
      container.append(button);
    });
  }
  window.ToolkitThemes={presets:presets,gallery:gallery,fonts:{inherit:'inherit',system:'system-ui, Tahoma, Arial, sans-serif',serif:'Georgia, serif'}};
})();
