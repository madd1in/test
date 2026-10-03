/* Flüstertide — original adventure runtime. No network or dependencies. */
(() => {
  'use strict';
  const Story = window.PirateStory;
  const Art = window.PirateArt;
  const Extras = window.FluestertideExtras;
  const Band = window.FluestertideBand;
  const speech = window.FluestertideSpeech;
  const audio = window.FluestertideMusic;
  audio?.initialize();
  const $ = id => document.getElementById(id);
  if (!Story || !Art) {
    $('actionText').textContent = 'Die Spieldateien fehlen. Bitte den vollständigen Ordner öffnen.';
    return;
  }
  const SAVE_KEY = 'fluestertide.save.v1';
  const canvas = $('world'), ctx = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = Story.initialState(), active = false, verb = null, selected = null;
  let shownHotspots = false, lines = [], pendingChoices = [], hintTier = 0, hintObjective = '';
  let focusBeforeModal = null, lastScene = state.scene, lastFrame = 0, saveAvailable = false;
  let exploring = false, recentItems = new Set(), toastTimer = null, bannerTimer = null, freshTimer = null, stepAt = 0, dialogTotal = 0, dialogIndex = 0;
  const INPUT_PREF_KEY='fluestertide.controls.v1',touchMedia=matchMedia('(max-width:700px), (pointer:coarse)');
  let controls=null,inputStatus={mode:'pointer',connected:false},touchPreference='auto';
  let bandAttempt=[],bandSequence=[],bandNotation=false,bandFeedback='';
  let photoFilter='original',photoHero=true,photoQuote=0,photoSequence=0,photoBlob=null;
  try{const preference=JSON.parse(localStorage.getItem(INPUT_PREF_KEY));if(['auto','on','off'].includes(preference?.touch))touchPreference=preference.touch;}catch{}
  let hero = { x: 870, y: 815, target: 870, facing: 1 };
  let stored = readSave();
  const verbLabels = { look:'Ansehen', talk:'Reden mit', take:'Nehmen', use:'Benutzen', walk:'Gehen zu' };

  function validateState(candidate) {
    if (!candidate || typeof candidate !== 'object' || !Story.scenes[candidate.scene]) throw new Error('Unbekannter Spielstand.');
    if (!Array.isArray(candidate.inventory) || candidate.inventory.some(id => !Object.prototype.hasOwnProperty.call(Story.items, id))) throw new Error('Ungültiges Inventar.');
    if (!candidate.flags || typeof candidate.flags !== 'object' || Array.isArray(candidate.flags)) throw new Error('Ungültiger Fortschritt.');
    if (!Array.isArray(candidate.journal) || candidate.journal.length > 1000) throw new Error('Ungültiges Logbuch.');
    if (JSON.stringify(candidate).length > 200000) throw new Error('Spielstand ist zu groß.');
    return { ...Story.initialState(), ...candidate, inventory:[...new Set(candidate.inventory)], flags:{...candidate.flags}, journal:[...candidate.journal] };
  }
  function readSave() {
    try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const data = JSON.parse(raw); return validateState(data.state || data); }
    catch { return null; }
  }
  function save() {
    if (!active) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({version:1, savedAt:new Date().toISOString(),state}));
      saveAvailable = true; $('saveStatus').textContent = '◇ Lokal gespeichert';
    } catch { saveAvailable = false; $('saveStatus').textContent = '◇ Export im Menü möglich'; }
  }
  function normalLines(input) {
    if (!input) return [];
    return (Array.isArray(input) ? input : [input]).map(l => typeof l === 'string' ? {speaker:'Motte',text:l} : {speaker:l.speaker || 'Motte',text:l.text || ''});
  }
  function start(resume = false) {
    unlockMusic();
    speech?.speak(null);
    state = resume && stored ? validateState(stored) : Story.initialState();
    exploring = !!(state.finished && state.flags.exploreAfterFinale);
    active = true; selected = null; verb = null; lastScene = state.scene;
    hero = {x:850,y:815,target:850,facing:1};
    $('titleScreen').hidden = true; $('ending').hidden = true;
    document.querySelector('.game-shell').classList.remove('inactive');
    $('stage').focus({preventScroll:true});
    refresh(); save();showSceneBanner();
    if (state.finished && !exploring) showEnding();
    else if (!resume) present({lines:Story.intro});
    else present({lines:[{speaker:'Motte',text:'Wo war ich? Ach ja. Eine Insel retten. Ganz normaler Dienstag.'}]});
  }
  function reset() { closeModal(); stored=null; hintTier=0; start(false); }
  function refresh() {
    audio?.setWorldState?.(state);
    audio?.setScene(active ? (state.finished && !exploring ? 'finale' : state.scene) : 'title');
    if (state.scene !== lastScene) {
      speech?.speak(null);
      lastScene = state.scene; hero.x=850; hero.target=850; selected=null;
      $('stage').animate([{opacity:.5},{opacity:1}],{duration:reducedMotion?0:320});
      showSceneBanner();
    }
    $('sceneName').textContent = Story.scenes[state.scene].name;
    $('chapterLabel').textContent = typeof Story.chapterTitle==='function' ? Story.chapterTitle(state) : `AKT ${state.chapter}`;
    $('itemCount').textContent=state.inventory.length;
    if($('albumCount'))$('albumCount').textContent=`Flaschenpost · ${Extras?.progress(state).count || 0}/7`;
    if($('discoveriesBtn'))$('discoveriesBtn').hidden=!active;
    if (selected && !state.inventory.includes(selected)) selected=null;
    renderHotspots(); renderInventory(); updateActionText();updateTouchControls();
    document.querySelectorAll('[data-verb]').forEach(b=>{ const isActive = b.dataset.verb===verb; b.classList.toggle('active',isActive);b.setAttribute('aria-pressed',String(isActive)); });
    controls?.refresh();
  }
  function updateActionText(target=null) {
    if (!active) return;
    const item = selected ? Story.items[selected] : null;
    const targetName = target?.name;
    $('actionText').textContent = item ? `${item.name} benutzen${targetName ? ` mit ${targetName}` : ' · Ziel oder zweiten Gegenstand auswählen'}` : targetName ? `${verbLabels[verb || defaultVerb(target)]} ${targetName}` : verb ? `${verbLabels[verb]} · Wähle etwas in der Szene.` : Story.objective(state);
    $('inventoryTip').textContent = selected ? 'Zweiten Gegenstand wählen = kombinieren.' : 'Gegenstände lassen sich kombinieren.';
  }
  function defaultVerb(h) { return h.kind==='postcard' ? 'take' : h.kind==='exit' ? 'walk' : h.kind==='npc' ? 'talk' : h.kind==='music' ? 'use' : 'look'; }
  function sceneHotspots(){
    if(!active || state.finished&&!exploring)return [];
    const hotspots=[...(typeof Story.availableHotspots==='function'?Story.availableHotspots(state):Story.scenes[state.scene].hotspots)];
    const letter=Extras?.hotspot(state);if(letter)hotspots.push(letter);
    if(Band && state.scene==='tavern')hotspots.push({id:'harbor_band',name:'Adas kleine Hafenband',kind:'music',x:17.5,y:62.1,w:3.9,h:18.3});
    return hotspots;
  }
  function renderHotspots() {
    $('hotspots').replaceChildren();
    if (!active || state.finished && !exploring) return;
    const hs = sceneHotspots();
    for (const h of hs) {
      const button=document.createElement('button');button.className='hotspot';button.dataset.target=h.id;
      if(h.kind==='postcard')button.classList.add('postcard-hotspot');
      button.style.cssText=`left:${h.x+h.w/2}%;top:${h.y+h.h/2}%;width:${h.w}%;height:${h.h}%;transform:translate(-50%,-50%);`;
      button.setAttribute('aria-label',h.name);button.title=h.name;
      const marker=document.createElement('i');marker.className='marker';marker.setAttribute('aria-hidden','true');button.append(marker);
      const label=document.createElement('span');label.className='sr-only';label.textContent=h.name;button.append(label);
      button.addEventListener('pointerenter',()=>showLabel(h));button.addEventListener('focus',()=>showLabel(h));
      button.addEventListener('pointerleave',hideLabel);button.addEventListener('blur',hideLabel);
      button.addEventListener('click',e=>{e.stopPropagation(); interact(h);});
      $('hotspots').append(button);
    }
    $('hotspots').classList.toggle('reveal',shownHotspots);
  }
  function showLabel(h) {
    const label=$('hoverLabel');label.textContent=selected?`${Story.items[selected].name} → ${h.name}`:h.name;
    label.style.left=Math.min(88,Math.max(12,h.x+h.w/2))+'%';label.style.top=Math.max(9,h.y-1)+'%';label.style.opacity='1';updateActionText(h);
  }
  function hideLabel() { $('hoverLabel').style.opacity='0';updateActionText(); }
  function interact(h) {
    if (!active || state.finished && !exploring) return;
    hideLabel();
    const actualVerb=selected?'use':verb || defaultVerb(h);
    const item=selected;
    if(h.kind==='music'){selected=null;verb=null;dismissDialog();refresh();openBand();return;}
    hero.target=Math.max(145,Math.min(1470,(h.x+h.w/2)*16));hero.facing=hero.target>=hero.x?1:-1;
    selected=null;
    if(h.kind==='postcard'){
      if(actualVerb==='take')collectPostcard(h.card.id);
      else if(actualVerb==='look')openLetter(h.card,false);
      else{const p=openModal('Eine gut verschlossene Flasche','FLASCHENPOST');paragraph(p,'Die Flaschenpost wartet darauf, mitgenommen zu werden. Wähle „Nehmen“ oder klicke sie ohne ausgewählte Aktion an.');}
      return;
    }
    execute(()=>Story.perform(state,actualVerb,h.id,item),{verb:actualVerb,id:h.id});
  }
  function execute(fn,action={}) {
    try {
      const previous=state.inventory.slice(),scene=state.scene,finished=state.finished,progressBefore=JSON.stringify([state.flags,state.chapter,state.finished]);
      const result=fn()||{}, gained=state.inventory.filter(id=>!previous.includes(id));
      const changed=result.changed || progressBefore!==JSON.stringify([state.flags,state.chapter,state.finished]);
      recentItems=new Set(gained);refresh();save();
      if(action.id?.startsWith('tone_'))audio?.playTone?.(action.id.slice(5));
      else audio?.effect(scene!==state.scene?'travel':gained.length?(action.verb==='combine'?'combine':'pickup'):!finished&&state.finished?'success':changed?'success':['use','combine','take'].includes(action.verb)?'error':'click');
      if(gained.length){
        showToast(`Neu in deinen Taschen: ${gained.map(id=>Story.items[id].name).join(', ')}`);
        clearTimeout(freshTimer);freshTimer=setTimeout(()=>{recentItems.clear();document.querySelectorAll('.inventory-item.fresh').forEach(b=>b.classList.remove('fresh'));},2400);
      }
      present(result);
    }
    catch (error) { console.error(error);present({lines:[{speaker:'Motte',text:'Das hat nicht geklappt. Versuchen wir es mit etwas anderem.'}]}); }
  }
  function renderInventory() {
    const container=$('inventory');container.replaceChildren();
    if (!state.inventory.length) { const p=document.createElement('p');p.className='empty-inventory';p.textContent='Noch nichts außer großen Plänen.';container.append(p);return; }
    for (const id of state.inventory) {
      const item=Story.items[id];if(!item)continue;
      const b=document.createElement('button');b.className='inventory-item';b.dataset.item=id;b.classList.toggle('selected',selected===id);b.classList.toggle('fresh',recentItems.has(id));
      b.setAttribute('aria-label',item.name);b.setAttribute('aria-pressed',String(selected===id));b.title=`${item.name} — ${item.description || 'Zum Benutzen anklicken. Doppelklick zum Ansehen.'}`;
      const c=document.createElement('canvas');c.width=80;c.height=80;c.setAttribute('aria-hidden','true');
      const ic=c.getContext('2d');
      if(typeof Art.drawItem==='function') { try { Art.drawItem(ic,id,80); } catch { drawFallbackItem(ic,item); } }
      else drawFallbackItem(ic,item);
      const label=document.createElement('span');label.textContent=item.name;b.append(c,label);
      b.addEventListener('click',()=>selectInventoryItem(id));
      b.addEventListener('dblclick',()=>{selected=null;refresh();present({lines:[{speaker:'Motte',text:item.description || item.name}]});});
      container.append(b);
    }
  }
  function selectInventoryItem(id,fromPocket=false){
    if(!active || state.finished&&!exploring || !state.inventory.includes(id))return;
    const item=Story.items[id];
    if(!fromPocket && verb==='look'){present({lines:[{speaker:'Motte',text:item.description || item.name}]});return;}
    if(fromPocket)closeModal();
    if(selected && selected!==id){const first=selected;selected=null;execute(()=>Story.combine(state,first,id),{verb:'combine'});}
    else{selected=selected===id?null:id;verb=null;dismissDialog();refresh();if(selected)focusSceneTarget();audio?.effect('click');if(fromPocket&&selected)showToast(`${item.name} ausgewählt · Wähle ein Ziel oder einen zweiten Gegenstand.`);}
  }
  function drawFallbackItem(context,item) { context.fillStyle='#e7bd70';context.font='38px Georgia';context.textAlign='center';context.fillText(item.icon || '✦',40,52); }
  function present(result) {
    speech?.speak(null);
    lines=normalLines(result.lines);pendingChoices=result.choices || [];
    dialogTotal=lines.length;dialogIndex=0;
    if (!lines.length && !pendingChoices.length) {dismissDialog();if(state.finished&&!exploring)showEnding();return;}
    $('conversation').hidden=false;showNextLine();
  }
  function showNextLine() {
    speech?.speak(null);
    $('choices').replaceChildren();
    if(lines.length) {
      const line=lines.shift();$('speakerName').textContent=line.speaker;$('dialogText').textContent=line.text;
      dialogIndex++;$('dialogProgress').textContent=dialogTotal>1?`${dialogIndex} / ${dialogTotal}`:'';
      const portrait=$('speakerAvatar'),pc=portrait.getContext('2d');
      if(typeof Art.drawPortrait==='function')Art.drawPortrait(pc,line.speaker,portrait.width);
      else{pc.clearRect(0,0,96,96);pc.fillStyle='#e7bd70';pc.font='48px Georgia';pc.textAlign='center';pc.fillText(line.speaker.charAt(0),48,64);}
      speech?.speak(line);
    }
    if(!lines.length && pendingChoices.length) {
      for(const choice of pendingChoices) {
        const b=document.createElement('button');b.textContent=choice.text;b.dataset.choice=choice.id;
        b.addEventListener('click',()=>{speech?.speak(null);pendingChoices=[];execute(()=>Story.choose(state,choice.id),{verb:'choice',id:choice.id});});$('choices').append(b);
      }
      $('nextLine').hidden=true;
    } else $('nextLine').hidden=false;
    updateTouchControls();controls?.refresh();
  }
  function advanceDialog() {
    if($('conversation').hidden || pendingChoices.length && !lines.length)return;
    if(lines.length)showNextLine();else{dismissDialog();if(state.finished&&!exploring)showEnding();}
  }
  function dismissDialog() {speech?.speak(null);lines=[];pendingChoices=[];$('conversation').hidden=true;updateTouchControls();controls?.refresh();}
  function showEnding() {
    exploring=false;state.flags.exploreAfterFinale=false;audio?.setScene('finale');
    dismissDialog();$('ending').hidden=false;
    const finale=normalLines(Story.outro);
    const narrative=finale.filter(l=>l.speaker==='Erzählung');
    $('endingText').textContent=finale.length ? (narrative.length?narrative:finale).map(l=>l.text).join(' ') : 'Krummwasser singt wieder. Der Wind ist zurück. Und Motte Morrow hat endlich eine Geschichte, die ihr niemand glauben wird.';
    renderHotspots();save();updateTouchControls();controls?.refresh();
  }
  function setVerb(next) { if(!active || state.finished&&!exploring)return;const targetId=document.activeElement?.dataset.target;selected=null;verb=verb===next?null:next;dismissDialog();refresh();focusSceneTarget(targetId); }
  function toggleReveal() {shownHotspots=!shownHotspots;$('hotspots').classList.toggle('reveal',shownHotspots);$('revealBtn').setAttribute('aria-pressed',String(shownHotspots));}
  function openModal(title,kicker='FLÜSTERTIDE') {
    speech?.stop();
    audio?.stopBandSequence?.();releasePhoto();
    if($('modalBackdrop').hidden)focusBeforeModal=document.activeElement;$('modalTitle').textContent=title;$('modalKicker').textContent=kicker;$('modalContent').replaceChildren();$('modalBackdrop').hidden=false;$('closeModal').focus();controls?.refresh();return $('modalContent');
  }
  function closeModal() {audio?.stopBandSequence?.();releasePhoto();$('modalBackdrop').hidden=true;(focusBeforeModal?.isConnected && focusBeforeModal.getClientRects().length?focusBeforeModal:active?$('stage'):$('startBtn')).focus({preventScroll:true});controls?.refresh();}
  function paragraph(parent,text,className) {const p=document.createElement('p');p.textContent=text;if(className)p.className=className;parent.append(p);return p;}
  function addButton(parent,text,action,cls='secondary') {const b=document.createElement('button');b.textContent=text;b.className=cls;b.addEventListener('click',action);parent.append(b);return b;}
  function updateTouchControls(){
    const enabled=touchPreference==='on'||touchPreference==='auto'&&touchMedia.matches;
    document.body.classList.toggle('touch-mode',enabled);
    if($('touchControls'))$('touchControls').hidden=!enabled||!active||state.finished&&!exploring;
    if($('touchSelection'))$('touchSelection').textContent=selected?`${Story.items[selected].name} → Ziel wählen`:verb?`${verbLabels[verb]} → Ziel wählen`:'Tippe ein Ziel an oder öffne die Liste.';
    const next=$('touchNextBtn');if(next){next.disabled=$('conversation').hidden;next.textContent=pendingChoices.length&&!lines.length?'Antwort':'Weiter';next.setAttribute('aria-label',pendingChoices.length&&!lines.length?'Dialogantwort auswählen':'Dialog weiter');}
  }
  function focusDialogue(){
    if($('conversation').hidden)return;
    if(pendingChoices.length&&!lines.length){$('choices').querySelector('button')?.focus();$('conversation').scrollIntoView({block:'nearest'});}
    else advanceDialog();
  }
  function openTargets(){
    const content=openModal('Was hast du vor?','ZIELE IN '+Story.scenes[state.scene].name.toUpperCase());
    if(!active || state.finished&&!exploring){paragraph(content,'Setze die Segel oder erkunde nach dem Finale die Insel weiter.');return;}
    paragraph(content,selected?`Benutzen: ${Story.items[selected].name}. Wähle das Ziel.`:'Wähle eine Aktion und dann ein Ziel. Ohne ausgewählte Aktion werden Figuren angesprochen und Ausgänge betreten.','target-instruction');
    const actions=document.createElement('div');actions.className='touch-verb-picker';actions.setAttribute('role','group');actions.setAttribute('aria-label','Aktion für ein Ziel');
    for(const id of ['look','talk','take','use']){const button=addButton(actions,verbLabels[id],()=>{if(id==='use'&&selected)verb=null;else{selected=null;verb=id;}dismissDialog();refresh();openTargets();},'touch-verb');button.dataset.touchVerb=id;button.setAttribute('aria-pressed',String(verb===id&&!selected||id==='use'&&!!selected));}
    const automatic=addButton(actions,'Automatisch',()=>{selected=null;verb=null;dismissDialog();refresh();openTargets();},'touch-verb');automatic.dataset.touchVerb='auto';automatic.setAttribute('aria-pressed',String(!verb&&!selected));
    content.append(actions);
    const list=document.createElement('div');list.className='target-list';
    for(const h of sceneHotspots()){
      const button=document.createElement('button');button.className='target-row';button.dataset.touchTarget=h.id;
      const icon=document.createElement('span');icon.className='target-icon';icon.setAttribute('aria-hidden','true');icon.textContent=h.kind==='exit'?'↗':h.kind==='npc'?'☷':h.kind==='postcard'?'♧':'◉';
      const copy=document.createElement('span'),name=document.createElement('b'),action=document.createElement('small');name.textContent=h.name;action.textContent=selected?`${Story.items[selected].name} benutzen`:verbLabels[verb||defaultVerb(h)];copy.append(name,action);button.append(icon,copy);
      button.addEventListener('click',()=>{closeModal();interact(h);});list.append(button);
    }
    content.append(list);addButton(content,'Tasche öffnen',openPocket);controls?.refresh();
  }
  function openPocket(){
    const content=openModal('Deine Taschen','WÄHLEN, ANSEHEN ODER KOMBINIEREN');
    if(!active || state.finished&&!exploring){paragraph(content,'Deine Taschen warten auf das nächste Abenteuer.');return;}
    paragraph(content,selected?`${Story.items[selected].name} ist ausgewählt. Wähle einen zweiten Gegenstand zum Kombinieren oder ein Ziel in der Szene.`:'Wähle einen Gegenstand und danach ein Ziel. Für eine Kombination öffnest du die Tasche erneut und wählst einen zweiten Gegenstand.');
    if(!state.inventory.length){paragraph(content,'Noch nichts außer großen Plänen.');addButton(content,'Ziele in der Szene',openTargets);return;}
    const grid=document.createElement('div');grid.className='pocket-grid';
    for(const id of state.inventory){
      const item=Story.items[id],row=document.createElement('div');row.className='pocket-card';
      const button=document.createElement('button');button.className='pocket-item';button.dataset.pocketItem=id;button.setAttribute('aria-pressed',String(selected===id));
      const picture=document.createElement('canvas');picture.width=80;picture.height=80;picture.setAttribute('aria-hidden','true');Art.drawItem(picture.getContext('2d'),id,80);
      const name=document.createElement('b');name.textContent=item.name;button.append(picture,name);button.addEventListener('click',()=>selectInventoryItem(id,true));row.append(button);
      const info=addButton(row,'Ansehen',()=>openItemInfo(id),'item-info');info.dataset.itemInfo=id;info.setAttribute('aria-label',`${item.name} ansehen`);grid.append(row);
    }
    content.append(grid);addButton(content,'Ziele in der Szene',openTargets);controls?.refresh();
  }
  function openItemInfo(id){
    const item=Story.items[id];if(!item)return;
    const content=openModal(item.name,'GEGENSTAND ANSEHEN');paragraph(content,item.description||item.name);
    addButton(content,'Zum Benutzen auswählen',()=>{selected=null;selectInventoryItem(id,true);},'primary');addButton(content,'Zurück zur Tasche',openPocket);
  }
  function cancelInput(){
    if(!$('modalBackdrop').hidden){closeModal();return;}
    if(!$('conversation').hidden){dismissDialog();refresh();if(state.finished&&!exploring)showEnding();return;}
    selected=null;verb=null;refresh();if(state.finished&&!exploring)showEnding();
  }
  function focusSceneTarget(targetId){
    if(!['gamepad','keyboard'].includes(inputStatus.mode) || !active || !$('modalBackdrop').hidden || !$('conversation').hidden)return;
    const targets=[...$('hotspots').querySelectorAll('.hotspot')],target=targets.find(element=>element.dataset.target===targetId)||targets[0];
    target?.focus({preventScroll:true});controls?.refresh();
  }
  function cycleInventory(delta){
    if(!active || state.finished&&!exploring || !state.inventory.length || !$('modalBackdrop').hidden)return;
    const targetId=document.activeElement?.dataset.target;
    const index=state.inventory.indexOf(selected),length=state.inventory.length;
    const next=index<0?(delta<0?length-1:0):(index+delta+length)%length;selected=state.inventory[next];
    verb=null;dismissDialog();refresh();focusSceneTarget(targetId);showToast(`${Story.items[selected].name} ausgewählt`);
  }
  function cycleVerb(delta){
    if(!active || state.finished&&!exploring || !$('modalBackdrop').hidden)return;
    const verbs=['look','talk','take','use'],index=verbs.indexOf(verb);
    setVerb(verbs[index<0?(delta<0?verbs.length-1:0):(index+delta+verbs.length)%verbs.length]);
  }
  function inputScope(){
    if(!$('modalBackdrop').hidden)return document.querySelector('.modal');
    if(!$('titleScreen').hidden)return $('titleScreen');
    if(!$('ending').hidden)return $('ending');
    if(!$('conversation').hidden)return $('conversation');
    return document.querySelector('.app');
  }
  function preferredInputFocus(scope,candidates){
    const selector=scope===$('titleScreen')?(stored?'#continueBtn':'#startBtn'):scope===$('ending')?'#endingExplore':scope===$('conversation')?'[data-choice],#nextLine:not([hidden])':scope.classList.contains('modal')?'.primary,.map-card:not(:disabled),.target-row,.pocket-item,.band-pad,.discovery-card,[data-photo-filter]':'.hotspot';
    return candidates.find(element=>element.matches(selector))||candidates[0];
  }
  function onInputStatus(info){
    inputStatus=info;document.body.classList.toggle('controller-mode',info.mode==='gamepad'&&info.supported);document.body.classList.toggle('focus-controls',info.mode==='gamepad'||info.mode==='keyboard');
    const hints=$('controllerHints');if(hints){hints.hidden=!info.connected;hints.textContent=info.supported?'Stick / Steuerkreuz: Ziel · A: Aktion · B: Zurück · X: Karte · Y: Tasche · LB/RB: Gegenstand · LT/RT: Aktion · ☰: Menü':'Controller erkannt. Dieses Tastenlayout wird nicht unterstützt. Maus, Touch oder Tastatur funktionieren weiter.';}
  }
  function openControlsHelp(){
    const content=openModal('Mit Daumen und Steuerkreuz','DEINE STEUERUNG');
    paragraph(content,'Mobil: „Ziele“ zeigt große Tasten für alle Figuren, Dinge und Ausgänge. Wähle eine Aktion und dann ein Ziel. „Tasche“ wählt Gegenstände, zeigt Beschreibungen und kombiniert zwei Dinge. „Weiter“ führt den Dialog fort.');
    [['Ziel auswählen','Stick / Steuerkreuz'],['Aktion / Dialog weiter','A'],['Fenster oder Auswahl schließen','B'],['Karte / Tasche','X / Y'],['Gegenstand wählen','LB / RB'],['Ansehen / Reden / Nehmen / Benutzen','LT / RT'],['Einstellungen','Menü-Taste'],['Lange Fenster scrollen','Rechter Stick']].forEach(([left,right])=>{const row=document.createElement('div');row.className='help-row';const label=document.createElement('span'),key=document.createElement('span');label.textContent=left;key.textContent=right;row.append(label,key);content.append(row);});
    paragraph(content,'Xbox Edge: Seite öffnen, Menü-Taste gedrückt halten und „Spielsteuerung verwenden“ / „Use game controls“ wählen, wenn der Controller noch den Browser steuert. Danach eine Taste drücken. Die Seite muss im Vordergrund sein.');
    paragraph(content,inputStatus.connected?(inputStatus.supported?'Controller erkannt und bereit.':'Controller erkannt, aber das Tastenlayout ist unbekannt.'):'Noch kein Controller erkannt. Drücke eine Taste am verbundenen Controller.');
    paragraph(content,'Tastatur: Pfeiltasten wählen das Ziel, Enter bestätigt und Escape geht zurück. Falls der Browser den Ton zunächst blockiert, bestätige einmal eine Schaltfläche mit dem Browser-Zeiger oder per Touch.');
  }
  function showToast(text) {
    const toast=$('rewardToast');if(!toast)return;
    clearTimeout(toastTimer);toast.textContent=text;toast.hidden=false;
    toastTimer=setTimeout(()=>{toast.hidden=true;},2800);
  }
  function showSceneBanner() {
    const banner=$('sceneBanner');if(!banner || !active)return;
    clearTimeout(bannerTimer);banner.replaceChildren();
    const name=document.createElement('b'),subtitle=document.createElement('span');
    name.textContent=Story.scenes[state.scene].name;subtitle.textContent=state.finished?'Die Insel ist frei. Zeit für kleine Entdeckungen.':Story.scenes[state.scene].subtitle;
    banner.append(name,subtitle);banner.classList.add('shown');
    bannerTimer=setTimeout(()=>banner.classList.remove('shown'),2200);
  }
  function postcardPicture(parent,card) {
    const picture=document.createElement('canvas');picture.width=640;picture.height=360;picture.className='postcard-picture';picture.setAttribute('aria-hidden','true');
    const painter=picture.getContext('2d');painter.scale(.4,.4);Art.drawScene(painter,card.id,{...state,scene:card.id},0);parent.append(picture);
  }
  function openLetter(card,discovered=true) {
    if(!card)return;
    const content=openModal(card.title,discovered?'FLASCHENPOST AUS KRUMMWASSER':'EIN BRIEF AUF SEE');
    postcardPicture(content,card);
    paragraph(content,card.author,'letter-author');paragraph(content,card.text,'letter-text');
    if(!Extras.found(state,card.id) && active && state.scene===card.id)addButton(content,'Flaschenpost mitnehmen',()=>collectPostcard(card.id),'primary');
    if(Extras.progress(state).complete)paragraph(content,'Alle sieben Briefe sind gefunden. Im Album wartet Mottes Bonusbrief.','album-complete-note');
    addButton(content,'Zum Flaschenpost-Album',openAlbum);
  }
  function collectPostcard(id) {
    if(!active || state.finished&&!exploring || !Extras)return false;
    const result=Extras.collect(state,id);if(!result.changed)return false;
    selected=null;verb=null;dismissDialog();refresh();save();audio?.effect('discovery');
    showToast(`Flaschenpost entdeckt · ${result.progress.count} / 7`);openLetter(result.card);return true;
  }
  function openAlbum() {
    if(!Extras)return;
    const progress=Extras.progress(state),content=openModal('Mottes Flaschenpost-Album','SIEBEN BRIEFE, EIN MEER');
    paragraph(content,`${progress.count} von 7 Briefen gefunden · ${progress.rank}`,'album-rank');
    paragraph(content,'Halte in jedem Schauplatz nach einer kleinen glitzernden Flasche Ausschau. Die Briefe erzählen die andere Hälfte von Krummwasser.');
    const meter=document.createElement('div');meter.className='album-meter';meter.setAttribute('role','progressbar');meter.setAttribute('aria-label','Gefundene Flaschenpost');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','7');meter.setAttribute('aria-valuenow',String(progress.count));
    const fill=document.createElement('i');fill.style.width=`${progress.count/7*100}%`;meter.append(fill);content.append(meter);
    const grid=document.createElement('div');grid.className='postcard-grid';
    for(const card of Extras.cards){
      const found=Extras.found(state,card.id),button=document.createElement('button');button.className='postcard-card';button.dataset.postcard=card.id;button.disabled=!found;
      if(found)postcardPicture(button,card);else{const seal=document.createElement('span');seal.className='postcard-seal';seal.textContent='♧';button.append(seal);}
      const label=document.createElement('b');label.textContent=found?card.title:'Noch auf See';button.append(label);
      const author=document.createElement('small');author.textContent=found?card.author:'Eine Flasche wartet auf dich.';button.append(author);
      button.addEventListener('click',()=>openLetter(card));grid.append(button);
    }
    content.append(grid);
    if(progress.complete){const bonus=document.createElement('section');bonus.className='bonus-letter';paragraph(bonus,'Mottes Brief an die Zukunft','bonus-title');paragraph(bonus,Extras.bonus,'letter-text');content.append(bonus);}
  }
  function exploreIsland() {
    if(!state.finished)return;
    exploring=true;state.flags.exploreAfterFinale=true;$('ending').hidden=true;dismissDialog();refresh();save();
    showToast('Krummwasser ist frei. Zeit für kleine Entdeckungen.');
  }
  function openDiscoveries(){
    const content=openModal('Die kleinen Abenteuer','ABSEITS DER GROSSEN SEEKARTE');
    paragraph(content,'Man rettet eine Insel. Und dann entdeckt man, wofür sich die Mühe gelohnt hat. Diese Ausflüge kannst du jederzeit unterbrechen.');
    const grid=document.createElement('div');grid.className='discovery-grid';
    const entries=[['♧','Flaschenpost',`${Extras?.progress(state).count||0} / 7 Briefe · Mottes Bonusbrief wartet.`,openAlbum],['♫','Kleine Hafenband',Band?.status(state).complete?'Ein Orchester aus Dingen. Jetzt darfst du improvisieren.':`${Band?.status(state).round||0} / 3 Stücke · Holz, Glas, Muschel und Glocke.`,()=>{bandAttempt=[];bandFeedback='';openBand();}],['⌖','Deine Reise-Postkarte','Halte diesen Ort fest. Mit Motte, Farblook und einem Gruß für zu Hause.',openPhoto]];
    for(const [symbol,title,copy,action] of entries){const button=document.createElement('button');button.className='discovery-card';button.dataset.discovery=['album','band','photo'][grid.children.length];const icon=document.createElement('span');icon.className='discovery-symbol';icon.setAttribute('aria-hidden','true');icon.textContent=symbol;const name=document.createElement('b');name.textContent=title;const detail=document.createElement('small');detail.textContent=copy;button.append(icon,name,detail);button.addEventListener('click',action);grid.append(button);}
    content.append(grid);controls?.refresh();
  }
  function bandIcon(id){
    const shapes={wood:'<rect x="7" y="10" width="10" height="28" rx="2" fill="#ae815a"/><rect x="20" y="7" width="10" height="34" rx="2" fill="#dbac77"/><rect x="33" y="12" width="8" height="25" rx="2" fill="#84634a"/><path d="M9 18h6m7 7h6m7-6h4" stroke="#5f473b" stroke-width="2"/>',glass:'<path d="M19 7h10v11c0 5 9 5 9 12v9c0 5-28 5-28 0v-9c0-7 9-7 9-12Z" fill="#5bada6" stroke="#a8ded0" stroke-width="2"/><path d="M14 30h20v8H14Z" fill="#e9d0a0"/><path d="M16 25v13" stroke="#c7eee0" stroke-width="2"/>',shell:'<path d="M24 42 6 24C-1 4 44-2 44 24L27 42Z" fill="#e9b8a7" stroke="#f4d6b6" stroke-width="2"/><path d="M24 40 13 14m11 26V9m0 31 13-27" stroke="#a87881" stroke-width="2"/>',bell:'<path d="M21 9c-10 3-8 18-14 23 6 8 28 8 34 0-6-5-4-20-14-23Z" fill="#e6be74" stroke="#f9dca0" stroke-width="2"/><path d="M13 28q11 6 22 0" fill="none" stroke="#9b7745" stroke-width="2"/><circle cx="24" cy="38" r="4" fill="#a27c4b"/><path d="M20 7h8" stroke="#c19350" stroke-width="4"/>'};
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 48 48');icon.setAttribute('aria-hidden','true');icon.innerHTML=shapes[id]||'';return icon;
  }
  function openBand(){
    if(!Band)return;
    const info=Band.status(state),pattern=Band.pattern(state),content=openModal(info.complete?'Ein Hafen voller Musik':'Adas kleine Hafenband',info.complete?'DIE INSEL HAT EIN NEUES ORCHESTER':`STÜCK ${info.round+1} VON ${info.total} · OHNE ZEITDRUCK`);
    if(!active || state.finished&&!exploring){paragraph(content,active?'Erkunde die Insel nach dem Finale weiter, um mit der Hafenband zu spielen.':'Setze die Segel. Ada hat vier erstaunlich musikalische Dinge für dich.');if(active)addButton(content,'Die Insel weiter erkunden',()=>{closeModal();exploreIsland();openBand();},'primary');return;}
    const introduction=document.createElement('div');introduction.className='band-introduction';const portrait=document.createElement('canvas');portrait.width=96;portrait.height=96;portrait.setAttribute('aria-hidden','true');Art.drawPortrait?.(portrait.getContext('2d'),'Ada',96);const copy=document.createElement('div');paragraph(copy,info.complete?'Ada: „Das ist ein Orchester. Die Versicherung nennt es trotzdem Inventar.“':pattern?.lines?.map(line=>`${line.speaker}: ${line.text}`).join(' ')||'Ada: „Die besten Instrumente stehen schon auf dem Tisch.“');paragraph(copy,info.complete?'Spiele frei oder höre unser kleines Hafenkonzert. Dein Erfolg bleibt im Spielstand.':'Höre und sieh die Folge an, oder öffne den Notenzettel. Spiele sie mit den vier Dingen nach und prüfe deine Antwort. Dein Tempo zählt.','band-help');introduction.append(portrait,copy);content.append(introduction);
    const meter=document.createElement('div');meter.className='band-rounds';meter.setAttribute('aria-label',`${info.round} von ${info.total} Stücken gelernt`);for(let index=0;index<info.total;index++){const mark=document.createElement('span');mark.classList.toggle('learned',index<info.round);mark.textContent=index<info.round?'✓':String(index+1);meter.append(mark);}content.append(meter);
    const score=document.createElement('section');score.className='band-score';const title=document.createElement('h3');title.textContent=pattern?.title||'Die Ballade von der klappernden Insel';score.append(title);
    const reference=document.createElement('ol');reference.id='bandReference';reference.className='band-reference';const referenceNotes=pattern?.notes||['wood','glass','shell','bell','shell','glass','wood','bell'];for(const [index,id] of referenceNotes.entries()){const item=document.createElement('li');item.dataset.referenceIndex=String(index);item.dataset.note=id;item.append(bandIcon(id));const label=document.createElement('span');label.textContent=Band.notes[id].label;item.append(label);reference.append(item);}score.append(reference);content.append(score);
    const referenceActions=document.createElement('div');referenceActions.className='band-actions';const listen=addButton(referenceActions,info.complete?'Hafenkonzert hören':'Hören & ansehen',()=>{unlockMusic();bandSequence=[...referenceNotes];if(!audio?.playBandSequence?.(bandSequence,{beat:.46})){bandNotation=true;bandFeedback='Der Notenzettel ist da. Du kannst auch ohne Ton spielen.';}syncBandUI();},'secondary');listen.id='bandListen';if(!info.complete){const notation=addButton(referenceActions,'Notenzettel',()=>{bandNotation=!bandNotation;syncBandUI();});notation.id='bandNotation';notation.setAttribute('aria-pressed',String(bandNotation));}content.append(referenceActions);
    const pads=document.createElement('div');pads.className='band-pads';pads.setAttribute('role','group');pads.setAttribute('aria-label','Vier Instrumente');for(const note of Object.values(Band.notes)){const button=document.createElement('button');button.className='band-pad';button.dataset.bandNote=note.id;button.append(bandIcon(note.id));const label=document.createElement('b');label.textContent=note.label;const hint=document.createElement('small');hint.textContent=note.clue;button.append(label,hint);button.addEventListener('click',()=>{unlockMusic();audio?.playBandNote?.(note.id);if(!info.complete&&bandAttempt.length<referenceNotes.length){bandAttempt.push(note.id);bandFeedback='';}syncBandUI();});pads.append(button);}content.append(pads);
    if(!info.complete){const attempt=document.createElement('div');attempt.id='bandAttempt';attempt.className='band-attempt';attempt.setAttribute('aria-label','Deine Antwort');content.append(attempt);const answerActions=document.createElement('div');answerActions.className='band-actions';const submit=addButton(answerActions,'Das ist meine Antwort',()=>{audio?.stopBandSequence?.();const result=Band.submit(state,bandAttempt);bandFeedback=result.lines?.map(line=>`${line.speaker}: ${line.text}`).join(' ')||'Versuche die Folge noch einmal.';if(result.reason==='correct'){state.journal.push(`Hafenband: „${pattern.title}“ gelernt.${result.complete?' Krummwasser hat ein kleines Orchester.':''}`);bandAttempt=[];refresh();save();audio?.effect('success');showToast(result.complete?'Krummwassers Hafenband spielt!':'Ein neues Stück für die Hafenband.');openBand();}else syncBandUI();},'primary');submit.id='bandSubmit';const undo=addButton(answerActions,'Letzten Ton zurück',()=>{bandAttempt.pop();bandFeedback='';syncBandUI();});undo.id='bandUndo';const clear=addButton(answerActions,'Neu anfangen',()=>{bandAttempt=[];bandFeedback='';syncBandUI();});clear.id='bandClear';content.append(answerActions);}
    const feedback=paragraph(content,bandFeedback,'band-feedback');feedback.id='bandFeedback';feedback.setAttribute('role','status');const playback=paragraph(content,'','band-playback');playback.id='bandPlayback';playback.setAttribute('role','status');addButton(content,'Zu den kleinen Abenteuern',openDiscoveries);syncBandUI();controls?.refresh();
  }
  function syncBandUI(){
    const reference=$('bandReference');if(!reference)return;
    const info=audio?.getStatus(),complete=Band?.status(state).complete,playing=!!info?.bandPlaying;reference.classList.toggle('notes-hidden',!complete&&!bandNotation&&!playing);
    reference.querySelectorAll('li').forEach((element,index)=>element.classList.toggle('sounding',playing&&index===info.bandStep));
    document.querySelectorAll('[data-band-note]').forEach(button=>button.classList.toggle('sounding',playing&&button.dataset.bandNote===bandSequence[info.bandStep]));
    if($('bandNotation')){$('bandNotation').setAttribute('aria-pressed',String(bandNotation));$('bandNotation').textContent=bandNotation?'Notenzettel verbergen':'Notenzettel zeigen';}
    if($('bandAttempt')){const attempt=$('bandAttempt');attempt.replaceChildren();const pattern=Band.pattern(state);for(let index=0;index<(pattern?.notes.length||0);index++){const token=document.createElement('span');const id=bandAttempt[index];token.textContent=id?`${index+1}. ${Band.notes[id].label}`:`${index+1}. …`;token.classList.toggle('filled',!!id);attempt.append(token);}if($('bandSubmit'))$('bandSubmit').disabled=bandAttempt.length!==pattern?.notes.length;if($('bandUndo'))$('bandUndo').disabled=!bandAttempt.length;if($('bandClear'))$('bandClear').disabled=!bandAttempt.length;}
    if($('bandFeedback'))$('bandFeedback').textContent=bandFeedback;
    if($('bandPlayback'))$('bandPlayback').textContent=playing&&bandSequence[info.bandStep]?`Jetzt: ${Band.notes[bandSequence[info.bandStep]].label}`:info?.soundEnabled===false||info?.soundVolume===0?'Geräusche sind aus. Der Notenzettel funktioniert trotzdem.':'';
  }
  function releasePhoto(){photoSequence++;photoBlob=null;}
  function openPhoto(){
    const content=openModal('Ein Gruß aus Krummwasser','DEINE EIGENE REISE-POSTKARTE');if(!active){paragraph(content,'Setze die Segel und finde einen Ort für deine erste Postkarte.');return;}
    paragraph(content,'Halte den aktuellen Schauplatz fest. Wähle einen Farblook, Motte im Bild und einen Gruß. Das Bild wird als PNG auf deinem Gerät gespeichert.');
    const preview=document.createElement('canvas');preview.id='photoPreview';preview.width=1600;preview.height=1080;preview.className='photo-preview';preview.setAttribute('aria-label',`Reise-Postkarte: ${Story.scenes[state.scene].name}`);content.append(preview);
    const filters=document.createElement('div');filters.className='photo-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Farblook');for(const [id,label] of [['original','Original'],['moon','Mondlicht'],['parchment','Alte Seekarte']]){const button=addButton(filters,label,()=>{photoFilter=id;updatePhoto();});button.dataset.photoFilter=id;}content.append(filters);
    const actions=document.createElement('div');actions.className='photo-actions';const heroToggle=addButton(actions,'Motte im Bild',()=>{photoHero=!photoHero;updatePhoto();});heroToggle.id='photoHero';const quote=addButton(actions,'Anderer Gruß',()=>{photoQuote=(photoQuote+1)%3;updatePhoto();});quote.id='photoQuote';const download=addButton(actions,'Postkarte als PNG speichern',()=>{if(!photoBlob)return;const url=URL.createObjectURL(photoBlob),link=document.createElement('a');link.href=url;link.download=`fluestertide-${state.scene}-${photoFilter}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);},'primary');download.id='photoDownload';download.disabled=true;actions.append(download);content.append(actions);
    const status=paragraph(content,'','photo-status');status.id='photoStatus';status.setAttribute('role','status');addButton(content,'Zu den kleinen Abenteuern',openDiscoveries);updatePhoto();controls?.refresh();
  }
  function updatePhoto(){
    const preview=$('photoPreview');if(!preview)return;const painter=preview.getContext('2d'),token=++photoSequence;photoBlob=null;if($('photoDownload'))$('photoDownload').disabled=true;
    const parchment=photoFilter==='parchment',ink=photoFilter==='moon'?'#e7d6b0':'#3b514d';painter.clearRect(0,0,1600,1080);painter.fillStyle=photoFilter==='moon'?'#17323b':parchment?'#d8bf8f':'#e7d5ae';painter.fillRect(0,0,1600,1080);
    painter.save();painter.translate(40,40);painter.scale(.95,.95);painter.filter=parchment?'sepia(.55) saturate(.7) contrast(1.06)':photoFilter==='moon'?'saturate(.65) hue-rotate(9deg) contrast(1.1)':'none';Art.drawScene(painter,state.scene,state,0,{motion:false});if(photoHero)Art.drawHero(painter,hero.x,hero.y,0,hero.facing,false);painter.restore();
    painter.strokeStyle=parchment?'#9e8054':'#749d94';painter.lineWidth=4;painter.strokeRect(40,40,1520,855);painter.fillStyle=ink;painter.font='bold 38px Georgia,serif';painter.fillText(Story.scenes[state.scene].name,55,958);painter.font='25px Georgia,serif';painter.fillText(['Hier hat sogar der Wind eine Geschichte.','Grüße aus Krummwasser. Die Taschen sind noch immer zu klein.','War kurz die Insel retten. Bin gleich zurück.'][photoQuote],55,1007);painter.font='13px Arial,sans-serif';painter.fillText('FLÜSTERTIDE  /  MOTTE MORROWS REISEPOST',55,1050);
    painter.save();painter.translate(1450,993);painter.rotate(-.14);painter.strokeStyle=ink;painter.lineWidth=3;painter.beginPath();painter.arc(0,0,42,0,Math.PI*2);painter.stroke();painter.beginPath();painter.moveTo(0,-30);painter.lineTo(10,10);painter.lineTo(-30,0);painter.closePath();painter.fillStyle=ink;painter.fill();painter.font='11px Georgia,serif';painter.textAlign='center';painter.fillText('KRUMMWASSER',0,62);painter.restore();
    document.querySelectorAll('[data-photo-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.photoFilter===photoFilter)));if($('photoHero'))$('photoHero').setAttribute('aria-pressed',String(photoHero));if($('photoStatus'))$('photoStatus').textContent='Deine Postkarte wird vorbereitet …';
    preview.toBlob(blob=>{if(token!==photoSequence||!preview.isConnected)return;photoBlob=blob;if($('photoDownload'))$('photoDownload').disabled=!blob;if($('photoStatus'))$('photoStatus').textContent=blob?'1600 × 1080 · PNG · bereit zum Speichern':'Das Bild konnte nicht vorbereitet werden.';},'image/png');
  }
  function openMap() {
    const content=openModal('Die Insel Krummwasser','DEINE SEEKARTE');
    paragraph(content,state.finished?'Krummwasser ist gerettet. Alle Wege sind offen — wähle einen Ort für deine nächste kleine Entdeckung.':active?'Wähle einen bekannten Ort. Das Meer hält die entlegenen Wege noch unter Verschluss.':'Deine Reise beginnt am Hafen. Neue Wege öffnen sich im Abenteuer.');
    const grid=document.createElement('div');grid.className='map-grid';content.append(grid);
    Object.entries(Story.scenes).forEach(([id,scene],index)=>{
      const b=document.createElement('button');b.className='map-card';b.dataset.scene=id;b.classList.toggle('current',state.scene===id);
      const can=active && (typeof Story.canVisit!=='function' || Story.canVisit(state,id));b.disabled=!can;
      if(can){const picture=document.createElement('canvas');picture.width=480;picture.height=270;picture.className='map-picture';picture.setAttribute('aria-hidden','true');const painter=picture.getContext('2d');painter.scale(.3,.3);Art.drawScene(painter,id,{...state,scene:id},0,{motion:false});b.append(picture);}
      const n=document.createElement('span');n.textContent=`0${index+1} / ${state.scene===id && active?'DU BIST HIER':can?'BEKANNTES FAHRWASSER':'NOCH VERBORGEN'}`;
      const name=document.createElement('b');name.textContent=scene.name;
      const sub=document.createElement('span');sub.textContent=scene.subtitle || '';
      b.append(n,name,sub);b.addEventListener('click',()=>{closeModal();selected=null;verb=null;execute(()=>Story.perform(state,'walk',id));});grid.append(b);
    });
  }
  function openJournal() {
    const content=openModal('Mottes Logbuch','GEDANKEN, GERÜCHTE & GROSSE PLÄNE');
    const objective=document.createElement('div');objective.className='journal-objective';
    const label=document.createElement('span');label.textContent=state.finished?'DIE REISE IST VOLLENDET':'DEIN NÄCHSTES ZIEL';objective.append(label);
    paragraph(objective,active?Story.objective(state):'Setze die Segel und finde heraus, warum Krummwasser schweigt.');content.append(objective);
    const entries=document.createElement('ul');entries.className='journal-entries';
    for(const entry of state.journal) {const li=document.createElement('li');li.textContent=typeof entry==='string'?entry:(entry.text || entry.description || entry.title || JSON.stringify(entry));entries.append(li);}
    if(!state.journal.length) paragraph(content,'Noch sind die Seiten leer. Die besten Geschichten beginnen mit leeren Taschen.');else content.append(entries);
    if(active)addButton(content,'Die kleinen Abenteuer',openDiscoveries);
  }
  function openHint() {
    if(!active) {const c=openModal('Eine kleine Starthilfe','DER WIND FLÜSTERT');paragraph(c,'Klicke auf „Segel setzen“. Danach kannst du hier Hinweise für das aktuelle Rätsel lesen.');return;}
    const objective=Story.objective(state);if(objective!==hintObjective){hintTier=0;hintObjective=objective;}
    const content=openModal('Der Wind flüstert …',`HINWEIS ${hintTier+1} VON 3`);
    paragraph(content,Story.hint(state,hintTier+1),'hint-text');
    if(hintTier<2)addButton(content,'Etwas deutlicher, bitte',()=>{hintTier++;openHint();});
    addButton(content,'Ich versuche es',closeModal,'primary');
  }
  function openHelp() {
    const content=openModal('Ein guter Anfang','SO SPIELST DU');
    paragraph(content,'Klicke Figuren an, um zu reden, und Ausgänge, um weiterzugehen. Für Gegenstände wählst du unten eine Aktion. Klicke neben eine Figur, um Motte laufen zu lassen.');
    paragraph(content,'Ein Gegenstand in deinen Taschen wird durch Anklicken ausgewählt. Klicke dann auf ein Ziel in der Szene — oder auf einen zweiten Gegenstand, um beide zu kombinieren. „Ansehen“ erklärt auch Inventargegenstände.');
    paragraph(content,'Dein Fortschritt wird automatisch in diesem Browser gespeichert. Karte, Logbuch und gestufte Hinweise helfen dir weiter. Es gibt keine Zeitlimits, Tode oder verlorenen Chancen.');
    paragraph(content,'In jedem Schauplatz versteckt sich eine Flaschenpost. Sammle alle sieben für Mottes Bonusbrief. Das Album öffnest du unten oder mit A. Nach dem Finale kannst du die gerettete Insel weiter erkunden.');
    paragraph(content,'Die kleinen Abenteuer öffnen Adas Hafenband und den Fotomodus. Drei Notenfolgen lassen sich ohne Zeitlimit nachspielen; der Notenzettel hilft auch ohne Ton. Deine eigene Reise-Postkarte kannst du als PNG speichern.');
    addButton(content,'Touch- und Controller-Steuerung',openControlsHelp);
    paragraph(content,speech?.getStatus().hasRecordings?'Die Dialoge werden mit ElevenLabs-Stimmen vorgelesen. „Sprache“ schaltet sie unabhängig von der Musik um; ↻ liest die aktuelle Zeile erneut vor. Mit Enter liest du in deinem eigenen Tempo weiter.':'Sprachaufnahmen sind derzeit nicht verfügbar. Mit Enter liest du die Dialoge in deinem eigenen Tempo weiter.');
    [['Aktionen wählen','1 · 2 · 3 · 4'],['Karte / Logbuch / Hinweis','M · J · H'],['Flaschenpost-Album','A'],['Anklickbare Stellen zeigen','Leertaste'],['Dialog weiter','Enter'],['Auswahl / Fenster schließen','Esc']].forEach(([l,r])=>{const row=document.createElement('div');row.className='help-row';const left=document.createElement('span'),right=document.createElement('span');left.textContent=l;right.textContent=r;row.append(left,right);content.append(row);});
  }
  function openSettings() {
    const content=openModal('Unter Deck','DEIN ABENTEUER');
    paragraph(content,'Ein eigener Chiptune-Soundtrack begleitet deine Reise und wechselt mit dem Schauplatz. Deine Reise bleibt auf diesem Gerät; einen Spielstand kannst du als Datei mitnehmen.');
    paragraph(content,speech?.getStatus().hasRecordings?'Die Sprachausgabe nutzt mitgelieferte ElevenLabs-Aufnahmen.':'Sprachaufnahmen sind derzeit nicht verfügbar. Die Dialoge kannst du weiter lesen.');
    const actions=document.createElement('div');actions.className='settings-actions';content.append(actions);
    if(audio)addButton(actions,audio.getStatus().enabled?'Musik ausschalten':'Musik einschalten',()=>{toggleMusic();openSettings();});
    if(speech?.getStatus().hasRecordings)addButton(actions,speech.enabled?'Sprache ausschalten':'Sprache einschalten',()=>{speech.toggle();speech.stop();openSettings();});
    if(audio?.setSoundEnabled)addButton(actions,audio.getStatus().soundEnabled?'Geräusche ausschalten':'Geräusche einschalten',()=>{audio.setSoundEnabled(!audio.getStatus().soundEnabled);if(audio.getStatus().soundEnabled)unlockMusic();openSettings();});
    if(state.finished && exploring)addButton(actions,'Finale ansehen',()=>{closeModal();showEnding();});
    if(active)addButton(actions,'Die kleinen Abenteuer',openDiscoveries);
    addButton(actions,'Touch- und Controller-Steuerung',openControlsHelp);
    const touchLabels={auto:'automatisch',on:'an',off:'aus'};
    addButton(actions,`Touch-Leiste: ${touchLabels[touchPreference]}`,()=>{touchPreference=['auto','on','off'][(['auto','on','off'].indexOf(touchPreference)+1)%3];try{localStorage.setItem(INPUT_PREF_KEY,JSON.stringify({touch:touchPreference}));}catch{}updateTouchControls();openSettings();});
    addButton(actions,'Spielstand exportieren',exportSave);
    addButton(actions,'Spielstand importieren',importSave);
    addButton(actions,'Neues Abenteuer',()=>{
      const c=openModal('Noch einmal Segel setzen?','NEUES ABENTEUER');paragraph(c,'Der automatische Spielstand wird durch eine neue Reise ersetzt. Du kannst ihn vorher im Menü exportieren.');addButton(c,'Neue Reise beginnen',reset,'primary');addButton(c,'Zurück',openSettings);
    });
    if(audio){
      const info=audio.getStatus(), sound=document.createElement('section');sound.className='sound-settings';
      const track=document.createElement('p');track.className='music-track';
      const caption=document.createElement('span');caption.textContent='DEIN SOUNDTRACK';
      const title=document.createElement('b');title.id='musicTrackName';title.textContent=info.title;
      track.append(caption,title);sound.append(track);
      const row=document.createElement('div');row.className='music-volume-row';
      const label=document.createElement('label');label.htmlFor='musicVolume';label.textContent='Musiklautstärke';
      const output=document.createElement('output');output.id='musicVolumeValue';output.htmlFor='musicVolume';output.textContent=`${Math.round(info.volume*100)} %`;
      row.append(label,output);sound.append(row);
      const range=document.createElement('input');range.id='musicVolume';range.type='range';range.min='0';range.max='100';range.step='1';range.value=String(Math.round(info.volume*100));
      range.addEventListener('input',()=>audio.setVolume(Number(range.value)/100));sound.append(range);content.append(sound);
      if(Number.isFinite(info.soundVolume)){
        const soundRow=document.createElement('div');soundRow.className='music-volume-row sound-volume-row';
        const soundLabel=document.createElement('label');soundLabel.htmlFor='soundVolume';soundLabel.textContent='Atmosphäre & Geräusche';
        const soundOutput=document.createElement('output');soundOutput.id='soundVolumeValue';soundOutput.htmlFor='soundVolume';soundOutput.textContent=`${Math.round(info.soundVolume*100)} %`;soundRow.append(soundLabel,soundOutput);sound.append(soundRow);
        const soundRange=document.createElement('input');soundRange.id='soundVolume';soundRange.type='range';soundRange.min='0';soundRange.max='100';soundRange.value=String(Math.round(info.soundVolume*100));soundRange.addEventListener('input',()=>audio.setSoundVolume(Number(soundRange.value)/100));sound.append(soundRange);
      }
    }
  }
  function exportSave() {
    const blob=new Blob([JSON.stringify({version:1,savedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='fluestertide-spielstand.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function importSave() {
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.addEventListener('change',async()=>{
      try {const file=input.files[0];if(!file)return;if(file.size>200000)throw new Error('Die Datei ist zu groß.');const data=JSON.parse(await file.text());stored=validateState(data.state || data);closeModal();start(true);}
      catch(error){const c=openModal('Spielstand nicht geladen','IMPORT');paragraph(c,error.message);addButton(c,'Zurück',openSettings);}
    });input.click();
  }

  function unlockMusic() {
    const pending=audio?.unlock();
    if(pending?.catch)pending.catch(()=>syncMusicUI());
  }
  function toggleMusic() {
    if(!audio)return;
    audio.toggle();
    if(audio.getStatus().enabled)unlockMusic();
    syncMusicUI();
  }
  function syncMusicUI() {
    const info=audio?.getStatus(),button=$('audioBtn');
    if(button){
      button.disabled=!audio;button.setAttribute('aria-pressed',String(!!info?.enabled));
      button.querySelector('.button-label').textContent=info?.enabled?'Musik an':'Musik aus';
      const action=info?.enabled?'Musik ausschalten':'Musik einschalten';
      button.title=action;button.setAttribute('aria-label',action);
    }
    const range=$('musicVolume'),output=$('musicVolumeValue'),track=$('musicTrackName');
    if(range && info)range.value=String(Math.round(info.volume*100));
    if(output && info)output.textContent=`${Math.round(info.volume*100)} %`;
    if(track && info)track.textContent=info.title;
    const soundRange=$('soundVolume'),soundOutput=$('soundVolumeValue');
    if(soundRange && Number.isFinite(info?.soundVolume))soundRange.value=String(Math.round(info.soundVolume*100));
    if(soundOutput && Number.isFinite(info?.soundVolume))soundOutput.textContent=`${Math.round(info.soundVolume*100)} %`;
    syncBandUI();
  }
  window.addEventListener('fluestertide:music',syncMusicUI);
  function syncSpeechUI() {
    const info=speech?.getStatus(), button=$('speechBtn'), repeat=$('repeatLine');
    if(button){
      button.disabled=!info?.hasRecordings;button.setAttribute('aria-pressed',String(!!info?.hasRecordings && !!info?.enabled));
      const label=!info?.hasRecordings?'Sprache':info?.enabled?'Sprache an':'Sprache aus', action=!info?.hasRecordings?'Noch keine Sprachaufnahmen verfügbar':info?.enabled?'Sprache ausschalten':'Sprache einschalten';
      button.querySelector('.button-label').textContent=label;button.title=action;button.setAttribute('aria-label',action);
    }
    if(repeat){repeat.hidden=!info?.available || !info.enabled || $('conversation').hidden;repeat.disabled=!info?.available || !info.enabled;}
    audio?.duck(!!info?.playing);
  }
  window.addEventListener('fluestertide:speech',syncSpeechUI);
  function animate(t) {
    requestAnimationFrame(animate);if(document.hidden || t-lastFrame<33)return;
    const dt=Math.min(.08,(t-lastFrame)/1000);lastFrame=t;
    const moving=Math.abs(hero.x-hero.target)>3;
    if(moving)hero.x+=(hero.target-hero.x)*Math.min(1,dt*6);
    if(moving && active && $('modalBackdrop').hidden && t-stepAt>420){audio?.effect('step');stepAt=t;}
    const artState=active?state:Story.initialState();
    ctx.clearRect(0,0,1600,900);Art.drawScene(ctx,active?state.scene:'harbor',artState,reducedMotion?0:t/1000,{motion:!reducedMotion});
    if(typeof Art.drawHero==='function')Art.drawHero(ctx,hero.x,hero.y,reducedMotion?0:t/1000,hero.facing,moving && !reducedMotion);
  }
  document.querySelectorAll('[data-verb]').forEach(b=>b.addEventListener('click',()=>setVerb(b.dataset.verb)));
  $('startBtn').addEventListener('click',()=>{if(stored){const c=openModal('Eine frische Brise?','NEUE REISE');paragraph(c,'Es gibt bereits einen gespeicherten Fortschritt. Eine neue Reise ersetzt diesen Spielstand.');addButton(c,'Neu beginnen',reset,'primary');addButton(c,'Reise fortsetzen',()=>{closeModal();start(true);});}else start(false);});
  $('continueBtn').addEventListener('click',()=>start(true));$('continueBtn').hidden=!stored;
  $('speechBtn')?.addEventListener('click',()=>{speech?.toggle();syncSpeechUI();});
  $('repeatLine')?.addEventListener('click',()=>speech?.repeat());
  $('albumBtn')?.addEventListener('click',openAlbum);$('endingExplore')?.addEventListener('click',exploreIsland);
  $('discoveriesBtn')?.addEventListener('click',openDiscoveries);
  $('touchTargetsBtn')?.addEventListener('click',openTargets);$('touchInventoryBtn')?.addEventListener('click',openPocket);$('touchMapBtn')?.addEventListener('click',openMap);$('touchNextBtn')?.addEventListener('click',focusDialogue);$('touchMenuBtn')?.addEventListener('click',openSettings);
  touchMedia.addEventListener('change',updateTouchControls);
  document.addEventListener('pointerdown',()=>{if(active)unlockMusic();},{passive:true});
  $('mapBtn').addEventListener('click',openMap);$('journalBtn').addEventListener('click',openJournal);$('hintBtn').addEventListener('click',openHint);$('menuBtn').addEventListener('click',openSettings);$('helpBtn').addEventListener('click',openHelp);$('audioBtn').addEventListener('click',toggleMusic);$('revealBtn').addEventListener('click',toggleReveal);$('nextLine').addEventListener('click',advanceDialog);$('closeModal').addEventListener('click',closeModal);$('endingJournal').addEventListener('click',openJournal);$('replayBtn').addEventListener('click',()=>{const c=openModal('Noch eine Runde?','NEUES ABENTEUER');paragraph(c,'Die abgeschlossene Reise wird durch einen neuen Spielstand ersetzt.');addButton(c,'Segel setzen',reset,'primary');addButton(c,'Zurück',closeModal);});
  $('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});
  $('hotspots').addEventListener('click',e=>{
    if(e.target!==$('hotspots') || !active || state.finished&&!exploring)return;
    if(!$('conversation').hidden && !pendingChoices.length){advanceDialog();return;}
    const bounds=$('stage').getBoundingClientRect();hero.target=Math.max(110,Math.min(1480,(e.clientX-bounds.left)/bounds.width*1600));hero.facing=hero.target>=hero.x?1:-1;selected=null;verb=null;refresh();
  });
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey)return;
    if(!$('modalBackdrop').hidden){
      if(e.key==='Escape')closeModal();
      if(e.key==='Tab'){const f=[...$('modalBackdrop').querySelectorAll('button:not(:disabled),input,a[href]')];const first=f[0],last=f[f.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}
      return;
    }
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    const key=e.key.toLowerCase();
    if(key==='enter' && !$('conversation').hidden && !e.target.closest('[data-choice],#repeatLine,#speechBtn,#audioBtn')){
      e.preventDefault();advanceDialog();return;
    }
    if(key===' ' && active && e.target.closest('.hotspot')){
      e.preventDefault();toggleReveal();return;
    }
    if(key==='escape'){selected=null;verb=null;dismissDialog();refresh();if(state.finished&&!exploring)showEnding();}
    else if(key==='enter' && !e.target.closest('button,a'))advanceDialog();
    else if(key===' ' && !e.target.closest('button,a')){e.preventDefault();toggleReveal();}
    else if(key==='m')openMap();else if(key==='j')openJournal();else if(key==='h')openHint();else if(key==='a')openAlbum();
    else if(['1','2','3','4'].includes(key))setVerb(['look','talk','take','use'][Number(key)-1]);
  });
  window.addEventListener('beforeunload',save);
  window.Fluestertide = {
    getState:()=>JSON.parse(JSON.stringify(state)),start:()=>start(false),resume:()=>start(true),
    perform:(v,id,item)=>id==='harbor_band'?openBand():id?.startsWith('postcard_')?(v==='take'?collectPostcard(id.slice(9)):openLetter(Extras?.byScene[id.slice(9)],false)):execute(()=>Story.perform(state,v,id,item),{verb:v,id}),choose:id=>execute(()=>Story.choose(state,id),{verb:'choice',id}),combine:(a,b)=>execute(()=>Story.combine(state,a,b),{verb:'combine'}),getAlbum:()=>Extras?.progress(state),getBand:()=>Band?.status(state),explore:exploreIsland,getControlsStatus:()=>controls?.getStatus(),getTouchMode:()=>touchPreference,version:'1.4.0'
  };
  controls=window.FluestertideControls?.initialize({getScope:inputScope,preferredFocus:preferredInputFocus,activate:element=>{unlockMusic();element.click();},cancel:cancelInput,openMap,openMenu:openSettings,focusInventory:openPocket,cycleInventory,cycleVerb,onStatus:onInputStatus});
  document.querySelector('.game-shell').classList.add('inactive');refresh();syncSpeechUI();syncMusicUI();requestAnimationFrame(animate);
})();
