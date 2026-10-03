/* Fluestertide: local touch, keyboard and standard/Xbox gamepad navigation. */
(function (root) {
  'use strict';
  const BUTTONS = Object.freeze({0:'activate',1:'cancel',2:'map',3:'inventory',4:'previousInventory',5:'nextInventory',6:'previousVerb',7:'nextVerb',9:'menu'});
  const DIRECTIONS = Object.freeze({12:'up',13:'down',14:'left',15:'right'});
  const FOCUSABLE = 'button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const pressed = button => !!button && (button.pressed === true || Number(button.value) > .55);
  function padMapping(pad) {
    if (!pad || pad.connected === false) return null;
    if (pad.mapping === 'standard') return 'standard';
    return /xbox|xinput|microsoft.*controller|045e[- :]/i.test(String(pad.id || '')) ? 'xbox-id' : 'unsupported';
  }
  function createInputTracker(options={}) {
    const deadzone=options.deadzone ?? .42, delay=options.delay ?? 380, interval=options.interval ?? 130;
    let ready=false,previous={},direction=null,directionAt=0,lastDirectionAt=0,lastScrollAt=-Infinity;
    function reset(){ready=false;previous={};direction=null;directionAt=0;lastDirectionAt=0;lastScrollAt=-Infinity;}
    function update(pad,now) {
      if (!pad || pad.connected === false || padMapping(pad) === 'unsupported') { reset(); return []; }
      const buttons=pad.buttons || [],axes=pad.axes || [],current={},actions=[];
      for(const index of Object.keys(BUTTONS))current[index]=pressed(buttons[index]);
      let nextDirection=null;
      for(const index of Object.keys(DIRECTIONS))if(pressed(buttons[index])){nextDirection=DIRECTIONS[index];break;}
      const x=Number(axes[0])||0,y=Number(axes[1])||0;
      if(!nextDirection && Math.max(Math.abs(x),Math.abs(y))>deadzone)nextDirection=Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');
      // A held button on connect/reconnect/visibility return must not fire.
      if(!ready){ready=true;previous=current;direction=nextDirection;directionAt=lastDirectionAt=now;lastScrollAt=now;return [];}
      for(const index of Object.keys(BUTTONS))if(current[index] && !previous[index])actions.push({type:'press',action:BUTTONS[index]});
      previous=current;
      if(nextDirection!==direction){direction=nextDirection;directionAt=lastDirectionAt=now;if(direction)actions.push({type:'move',direction});}
      else if(direction && now-directionAt>=delay && now-lastDirectionAt>=interval){lastDirectionAt=now;actions.push({type:'move',direction});}
      const sx=Number(axes[2])||0,sy=Number(axes[3])||0;
      if(Math.max(Math.abs(sx),Math.abs(sy))>deadzone && now-lastScrollAt>=70){lastScrollAt=now;actions.push({type:'scroll',x:Math.abs(sx)>deadzone?clamp(sx,-1,1):0,y:Math.abs(sy)>deadzone?clamp(sy,-1,1):0});}
      return actions;
    }
    return {update,reset};
  }
  function chooseDirectional(current,candidates,direction) {
    if(!current || !candidates.length)return candidates[0] || null;
    const horizontal=direction==='left'||direction==='right',sign=direction==='left'||direction==='up'?-1:1;
    const center=r=>({x:(r.left+r.right)/2,y:(r.top+r.bottom)/2});
    const origin=center(current.rect),forward=[];
    for(const candidate of candidates){
      if(candidate.element===current.element)continue;
      const point=center(candidate.rect),along=(horizontal?point.x-origin.x:point.y-origin.y)*sign,cross=Math.abs(horizontal?point.y-origin.y:point.x-origin.x);
      if(along<=3)continue;
      const overlap=horizontal?Math.min(current.rect.bottom,candidate.rect.bottom)-Math.max(current.rect.top,candidate.rect.top):Math.min(current.rect.right,candidate.rect.right)-Math.max(current.rect.left,candidate.rect.left);
      forward.push({candidate,score:along+cross*2.5+(overlap<0?60:0)});
    }
    if(forward.length){forward.sort((a,b)=>a.score-b.score);return forward[0].candidate;}
    // Wrap to the opposite edge while retaining the closest row/column.
    const others=candidates.filter(v=>v.element!==current.element);if(!others.length)return current;
    const points=others.map(candidate=>({candidate,point:center(candidate.rect)}));
    const edge=Math[sign>0?'min':'max'](...points.map(v=>horizontal?v.point.x:v.point.y));
    points.sort((a,b)=>{
      const score=v=>Math.abs(horizontal?v.point.y-origin.y:v.point.x-origin.x)*2.5+Math.abs((horizontal?v.point.x:v.point.y)-edge);
      return score(a)-score(b);
    });
    return points[0].candidate;
  }
  function initialize(options={}) {
    const doc=root.document;if(!doc)throw new Error('Controller navigation needs a browser document.');
    const nav=root.navigator || {},tracker=createInputTracker(options);
    let destroyed=false,windowFocused=true,frame=null,padIndex=null,padIdentity='',primeNext=true,scopeBefore=null,pendingScope=null,marked=null,lastStatus='',status={connected:false,supported:false,id:'',mapping:'none',mode:'pointer',apiAvailable:typeof nav.getGamepads==='function'};
    const keyTimes=new Map(),bookmarks=new WeakMap();
    function publish(){const json=JSON.stringify(status);if(json===lastStatus)return;lastStatus=json;options.onStatus?.({...status});}
    function pageFocused(){return !doc.hidden && windowFocused && (typeof doc.hasFocus!=='function' || doc.hasFocus());}
    function setMode(mode){status.mode=mode;if(mode==='pointer'||mode==='touch'){marked?.classList.remove('controller-focus');marked=null;}publish();}
    function visible(el){return !!el && !el.disabled && el.getAttribute('aria-disabled')!=='true' && !el.closest('[hidden],[inert],[aria-hidden="true"]') && el.getClientRects().length>0 && root.getComputedStyle(el).visibility!=='hidden';}
    function defaultScope(){
      for(const id of ['modalBackdrop','titleScreen','ending','conversation']){const el=doc.getElementById(id);if(el && visible(el))return el;}
      return doc.querySelector('.app') || doc.body;
    }
    function scope(){return options.getScope?.() || defaultScope();}
    function candidates(container){if(!container)return [];return [...container.querySelectorAll(FOCUSABLE)].filter(el=>visible(el)&&!el.closest('[data-controls-ui]')).map(element=>({element,rect:element.getBoundingClientRect()}));}
    function token(el){if(el.id)return 'id:'+el.id;for(const key of ['target','item','choice','verb','postcard','scene','touchTarget','touchVerb','pocketItem','itemInfo','bandNote','photoFilter','discovery'])if(el.dataset[key])return key+':'+el.dataset[key];return null;}
    function remember(container,el){const key=el&&token(el);if(container && key && key!=='id:closeModal')bookmarks.set(container,key);}
    function mark(el){if(marked!==el)marked?.classList.remove('controller-focus');marked=el;el?.classList.add('controller-focus');if(el)remember(scope(),el);}
    function focus(el){if(!el)return false;el.focus({preventScroll:true});el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});mark(el);return true;}
    function preferred(container,list){
      const remembered=bookmarks.get(container),existing=remembered&&list.find(v=>token(v.element)===remembered);if(existing)return existing.element;
      const requested=options.preferredFocus?.(container,list.map(v=>v.element));
      if(requested && list.some(v=>v.element===requested))return requested;
      return list.find(v=>v.element.matches('[data-choice],#nextLine,#endingExplore,#continueBtn,#startBtn,.hotspot'))?.element || list[0]?.element || null;
    }
    function current(container,list){
      const existing=list.find(v=>v.element===doc.activeElement);if(existing){mark(existing.element);return existing;}
      const el=preferred(container,list);focus(el);return list.find(v=>v.element===el) || null;
    }
    function refresh(){
      if(destroyed)return {...status};const container=scope();
      if(status.mode==='gamepad'||status.mode==='keyboard'){
        const list=candidates(container);
        // openModal focuses its close button before filling content. Preserve the
        // prior target bookmark until the rebuilt targets are available.
        if(list.length===1 && list[0].element.id==='closeModal'){pendingScope=container;focus(list[0].element);}
        else if(pendingScope===container || container!==scopeBefore || !list.some(v=>v.element===doc.activeElement)){pendingScope=null;focus(preferred(container,list));}
        else mark(doc.activeElement);
      }
      scopeBefore=container;return {...status};
    }
    function adjustRange(el,sign){
      const min=Number.isFinite(Number(el.min))&&el.min!==''?Number(el.min):0,max=Number.isFinite(Number(el.max))&&el.max!==''?Number(el.max):100;
      const step=Number(el.step)>0?Number(el.step):1,old=Number(el.value)||0,value=clamp(Math.round((old+sign*step)*1e6)/1e6,min,max);
      if(value!==old){el.value=String(value);el.dispatchEvent(new root.Event('input',{bubbles:true}));el.dispatchEvent(new root.Event('change',{bubbles:true}));}
      mark(el);return true;
    }
    function move(direction,source='touch'){
      if(destroyed || (source==='gamepad' && !pageFocused()) || !['left','right','up','down'].includes(direction))return false;
      setMode(source);const container=scope(),list=candidates(container),from=current(container,list);scopeBefore=container;
      if(!from)return false;
      if(from.element.matches('input[type="range"]') && (direction==='left'||direction==='right'))return adjustRange(from.element,direction==='left'?-1:1);
      return focus(chooseDirectional(from,list,direction)?.element);
    }
    function cycleInventory(delta){
      if(options.cycleInventory){options.cycleInventory(delta);return;}
      const list=[...doc.querySelectorAll('#inventory button:not(:disabled)')].filter(visible);if(!list.length)return;
      const index=list.indexOf(doc.activeElement);focus(list[(index+delta+list.length)%list.length]);
    }
    function press(action,source='touch'){
      if(destroyed || (source==='gamepad' && !pageFocused()))return false;setMode(source);
      if(['up','down','left','right'].includes(action))return move(action,source);
      if(action==='activate'){
        const container=scope(),list=candidates(container),from=current(container,list);if(!from)return false;
        if(from.element.matches('input,textarea,select'))return false;
        if(options.activate)options.activate(from.element);else from.element.click();
      }else if(action==='cancel'){
        if(options.cancel)options.cancel();else{const close=doc.getElementById('closeModal');if(close && visible(close))close.click();}
      }else if(action==='menu')options.openMenu?.();
      else if(action==='map')options.openMap?.();
      else if(action==='inventory')options.focusInventory?.();
      else if(action==='previousInventory'||action==='nextInventory')cycleInventory(action==='previousInventory'?-1:1);
      else if(action==='previousVerb'||action==='nextVerb')options.cycleVerb?.(action==='previousVerb'?-1:1);
      else return false;
      refresh();return true;
    }
    function scroll(x,y){
      const container=scope();let el=doc.activeElement;
      while(el && container?.contains(el)){
        if((Math.abs(y)>.01 && el.scrollHeight>el.clientHeight+2)||(Math.abs(x)>.01 && el.scrollWidth>el.clientWidth+2)){el.scrollBy({left:x*24,top:y*24,behavior:'auto'});return;}
        el=el.parentElement;
      }
      const target=container?.querySelector('.modal') || container;
      if(target && (target.scrollHeight>target.clientHeight+2 || target.scrollWidth>target.clientWidth+2))target.scrollBy({left:x*24,top:y*24,behavior:'auto'});
      else if(container?.matches('.app,body'))root.scrollBy({left:x*24,top:y*24,behavior:'auto'});
    }
    function getPads(){try{return status.apiAvailable?Array.from(nav.getGamepads() || []).filter(p=>p&&p.connected!==false):[];}catch{return [];}}
    function cancelFrame(){if(frame!==null)root.cancelAnimationFrame(frame);frame=null;}
    function setPad(pad){
      const mapping=padMapping(pad),identity=pad?`${pad.index}:${pad.id}:${mapping}`:'';
      if(identity!==padIdentity){tracker.reset();primeNext=true;padIdentity=identity;}
      if(primeNext && pad && mapping!=='unsupported' && pageFocused()){tracker.update(pad,root.performance.now());primeNext=false;}
      padIndex=pad?.index ?? null;status.connected=!!pad;status.supported=!!pad && mapping!=='unsupported';status.id=pad?.id || '';status.mapping=mapping || 'none';publish();
    }
    function scan(){
      if(destroyed)return;const pads=getPads(),supported=pads.filter(p=>padMapping(p)!=='unsupported');
      const pad=supported.find(p=>p.index===padIndex) || supported[0] || pads[0] || null;setPad(pad);
      if(pageFocused() && status.supported && frame===null)frame=root.requestAnimationFrame(poll);else if(!pageFocused() || !status.supported)cancelFrame();
    }
    function poll(now){
      frame=null;if(destroyed || !pageFocused()){tracker.reset();primeNext=true;return;}
      const pads=getPads(),pad=pads.find(p=>p.index===padIndex && padMapping(p)!=='unsupported');
      if(!pad){scan();if(!status.connected)setMode('pointer');return;}
      for(const action of tracker.update(pad,now)){
        if(destroyed || !pageFocused())break;
        if(action.type==='move')move(action.direction,'gamepad');
        else if(action.type==='press')press(action.action,'gamepad');
        else{setMode('gamepad');scroll(action.x,action.y);}
      }
      if(!destroyed && pageFocused())frame=root.requestAnimationFrame(poll);
    }
    function connected(){scan();}
    function disconnected(){tracker.reset();primeNext=true;cancelFrame();scan();if(!status.supported)setMode('pointer');}
    function pause(){cancelFrame();tracker.reset();primeNext=true;keyTimes.clear();}
    function visibility(){pause();if(pageFocused())scan();}
    function blur(){windowFocused=false;pause();}
    function focusWindow(){windowFocused=true;pause();if(pageFocused())scan();}
    function pointer(event){setMode(event.pointerType==='touch'?'touch':'pointer');scan();}
    function keydown(event){
      if(event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey)return;
      const tag=event.target?.tagName,range=event.target?.matches?.('input[type="range"]');
      if((/INPUT|TEXTAREA|SELECT/.test(tag)||event.target?.isContentEditable) && !range)return;
      const moves={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'},direction=moves[event.key];
      if(!direction && event.key!=='Enter' && event.key!=='Escape')return;
      event.preventDefault();scan();
      const now=root.performance.now(),previous=keyTimes.get(event.key) ?? -Infinity;
      if(event.repeat && (!direction || now-previous<130))return;
      keyTimes.set(event.key,now);
      if(direction)move(direction,'keyboard');else press(event.key==='Enter'?'activate':'cancel','keyboard');
    }
    function keyup(event){keyTimes.delete(event.key);}
    doc.addEventListener('keydown',keydown,true);doc.addEventListener('keyup',keyup,true);doc.addEventListener('pointerdown',pointer,true);doc.addEventListener('visibilitychange',visibility);
    root.addEventListener('gamepadconnected',connected);root.addEventListener('gamepaddisconnected',disconnected);
    root.addEventListener('blur',blur);root.addEventListener('focus',focusWindow);
    scan();
    return {
      move,press,refresh,getStatus:()=>({...status}),
      destroy(){if(destroyed)return;destroyed=true;cancelFrame();tracker.reset();marked?.classList.remove('controller-focus');doc.removeEventListener('keydown',keydown,true);doc.removeEventListener('keyup',keyup,true);doc.removeEventListener('pointerdown',pointer,true);doc.removeEventListener('visibilitychange',visibility);root.removeEventListener('gamepadconnected',connected);root.removeEventListener('gamepaddisconnected',disconnected);root.removeEventListener('blur',blur);root.removeEventListener('focus',focusWindow);status={...status,connected:false,supported:false,id:'',mapping:'none',mode:'pointer'};publish();}
    };
  }
  if(root)root.FluestertideControls={initialize};
  if(typeof module!=='undefined'&&module.exports)module.exports={initialize,createInputTracker,chooseDirectional,padMapping};
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:this);
