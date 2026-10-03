/* Flüstertide — original adventure runtime. No network or dependencies. */
(() => {
  'use strict';
  const Story = window.PirateStory;
  const Art = window.PirateArt;
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
    active = true; selected = null; verb = null; lastScene = state.scene;
    hero = {x:850,y:815,target:850,facing:1};
    $('titleScreen').hidden = true; $('ending').hidden = true;
    document.querySelector('.game-shell').classList.remove('inactive');
    $('stage').focus({preventScroll:true});
    refresh(); save();
    if (state.finished) showEnding();
    else if (!resume) present({lines:Story.intro});
    else present({lines:[{speaker:'Motte',text:'Wo war ich? Ach ja. Eine Insel retten. Ganz normaler Dienstag.'}]});
  }
  function reset() { closeModal(); stored=null; hintTier=0; start(false); }
  function refresh() {
    audio?.setScene(active ? (state.finished ? 'finale' : state.scene) : 'title');
    if (state.scene !== lastScene) {
      speech?.speak(null);
      lastScene = state.scene; hero.x=850; hero.target=850; selected=null;
      $('stage').animate([{opacity:.5},{opacity:1}],{duration:reducedMotion?0:320});
    }
    $('sceneName').textContent = Story.scenes[state.scene].name;
    $('chapterLabel').textContent = typeof Story.chapterTitle==='function' ? Story.chapterTitle(state) : `AKT ${state.chapter}`;
    $('itemCount').textContent=state.inventory.length;
    if (selected && !state.inventory.includes(selected)) selected=null;
    renderHotspots(); renderInventory(); updateActionText();
    document.querySelectorAll('[data-verb]').forEach(b=>{ const isActive = b.dataset.verb===verb; b.classList.toggle('active',isActive);b.setAttribute('aria-pressed',String(isActive)); });
  }
  function updateActionText(target=null) {
    if (!active) return;
    const item = selected ? Story.items[selected] : null;
    const targetName = target?.name;
    $('actionText').textContent = item ? `${item.name} benutzen${targetName ? ` mit ${targetName}` : ' · Ziel oder zweiten Gegenstand auswählen'}` : targetName ? `${verbLabels[verb || defaultVerb(target)]} ${targetName}` : verb ? `${verbLabels[verb]} · Wähle etwas in der Szene.` : Story.objective(state);
    $('inventoryTip').textContent = selected ? 'Zweiten Gegenstand wählen = kombinieren.' : 'Gegenstände lassen sich kombinieren.';
  }
  function defaultVerb(h) { return h.kind==='exit' ? 'walk' : h.kind==='npc' ? 'talk' : 'look'; }
  function renderHotspots() {
    $('hotspots').replaceChildren();
    if (!active || state.finished) return;
    const hs = typeof Story.availableHotspots==='function' ? Story.availableHotspots(state) : Story.scenes[state.scene].hotspots;
    for (const h of hs) {
      const button=document.createElement('button');button.className='hotspot';button.dataset.target=h.id;
      button.style.cssText=`left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%;`;
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
    if (!active || state.finished) return;
    hideLabel();
    const actualVerb=selected?'use':verb || defaultVerb(h);
    const item=selected;
    hero.target=Math.max(145,Math.min(1470,(h.x+h.w/2)*16));hero.facing=hero.target>=hero.x?1:-1;
    selected=null;
    execute(()=>Story.perform(state,actualVerb,h.id,item));
  }
  function execute(fn) {
    try { const result=fn()||{};refresh();save();audio?.effect(result.changed || state.finished ? 'success':'click');present(result); }
    catch (error) { console.error(error);present({lines:[{speaker:'Motte',text:'Das hat nicht geklappt. Versuchen wir es mit etwas anderem.'}]}); }
  }
  function renderInventory() {
    const container=$('inventory');container.replaceChildren();
    if (!state.inventory.length) { const p=document.createElement('p');p.className='empty-inventory';p.textContent='Noch nichts außer großen Plänen.';container.append(p);return; }
    for (const id of state.inventory) {
      const item=Story.items[id];if(!item)continue;
      const b=document.createElement('button');b.className='inventory-item';b.dataset.item=id;b.classList.toggle('selected',selected===id);
      b.setAttribute('aria-label',item.name);b.setAttribute('aria-pressed',String(selected===id));b.title=`${item.name} — ${item.description || 'Zum Benutzen anklicken. Doppelklick zum Ansehen.'}`;
      const c=document.createElement('canvas');c.width=80;c.height=80;c.setAttribute('aria-hidden','true');
      const ic=c.getContext('2d');
      if(typeof Art.drawItem==='function') { try { Art.drawItem(ic,id,80); } catch { drawFallbackItem(ic,item); } }
      else drawFallbackItem(ic,item);
      const label=document.createElement('span');label.textContent=item.name;b.append(c,label);
      b.addEventListener('click',()=>{
        if (verb==='look') { present({lines:[{speaker:'Motte',text:item.description || item.name}]});return; }
        if(selected && selected!==id) { const first=selected;selected=null;execute(()=>Story.combine(state,first,id)); }
        else { selected=selected===id?null:id;verb=null;dismissDialog();refresh();audio?.effect('click'); }
      });
      b.addEventListener('dblclick',()=>{selected=null;refresh();present({lines:[{speaker:'Motte',text:item.description || item.name}]});});
      container.append(b);
    }
  }
  function drawFallbackItem(context,item) { context.fillStyle='#e7bd70';context.font='38px Georgia';context.textAlign='center';context.fillText(item.icon || '✦',40,52); }
  function present(result) {
    speech?.speak(null);
    lines=normalLines(result.lines);pendingChoices=result.choices || [];
    if (!lines.length && !pendingChoices.length) {dismissDialog();if(state.finished)showEnding();return;}
    $('conversation').hidden=false;showNextLine();
  }
  function showNextLine() {
    speech?.speak(null);
    $('choices').replaceChildren();
    if(lines.length) {
      const line=lines.shift();$('speakerName').textContent=line.speaker;$('speakerAvatar').textContent=line.speaker.charAt(0);$('dialogText').textContent=line.text;
      speech?.speak(line);
    }
    if(!lines.length && pendingChoices.length) {
      for(const choice of pendingChoices) {
        const b=document.createElement('button');b.textContent=choice.text;b.dataset.choice=choice.id;
        b.addEventListener('click',()=>{speech?.speak(null);pendingChoices=[];execute(()=>Story.choose(state,choice.id));});$('choices').append(b);
      }
      $('nextLine').hidden=true;
    } else $('nextLine').hidden=false;
  }
  function advanceDialog() {
    if($('conversation').hidden || pendingChoices.length && !lines.length)return;
    if(lines.length)showNextLine();else{dismissDialog();if(state.finished)showEnding();}
  }
  function dismissDialog() {speech?.speak(null);lines=[];pendingChoices=[];$('conversation').hidden=true;}
  function showEnding() {
    dismissDialog();$('ending').hidden=false;
    const finale=normalLines(Story.outro);
    const narrative=finale.filter(l=>l.speaker==='Erzählung');
    $('endingText').textContent=finale.length ? (narrative.length?narrative:finale).map(l=>l.text).join(' ') : 'Krummwasser singt wieder. Der Wind ist zurück. Und Motte Morrow hat endlich eine Geschichte, die ihr niemand glauben wird.';
    renderHotspots();save();
  }
  function setVerb(next) { if(!active || state.finished)return;selected=null;verb=verb===next?null:next;dismissDialog();refresh(); }
  function toggleReveal() {shownHotspots=!shownHotspots;$('hotspots').classList.toggle('reveal',shownHotspots);$('revealBtn').setAttribute('aria-pressed',String(shownHotspots));}
  function openModal(title,kicker='FLÜSTERTIDE') {
    speech?.stop();
    focusBeforeModal=document.activeElement;$('modalTitle').textContent=title;$('modalKicker').textContent=kicker;$('modalContent').replaceChildren();$('modalBackdrop').hidden=false;$('closeModal').focus();return $('modalContent');
  }
  function closeModal() {$('modalBackdrop').hidden=true;focusBeforeModal?.focus();}
  function paragraph(parent,text,className) {const p=document.createElement('p');p.textContent=text;if(className)p.className=className;parent.append(p);return p;}
  function addButton(parent,text,action,cls='secondary') {const b=document.createElement('button');b.textContent=text;b.className=cls;b.addEventListener('click',action);parent.append(b);return b;}
  function openMap() {
    const content=openModal('Die Insel Krummwasser','DEINE SEEKARTE');
    paragraph(content,active?'Wähle einen bekannten Ort. Das Meer hält die entlegenen Wege noch unter Verschluss.':'Deine Reise beginnt am Hafen. Neue Wege öffnen sich im Abenteuer.');
    const grid=document.createElement('div');grid.className='map-grid';content.append(grid);
    Object.entries(Story.scenes).forEach(([id,scene],index)=>{
      const b=document.createElement('button');b.className='map-card';b.dataset.scene=id;b.classList.toggle('current',state.scene===id);
      const can=active && (typeof Story.canVisit!=='function' || Story.canVisit(state,id));b.disabled=!can;
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
    paragraph(content,speech?.getStatus().hasRecordings?'Die Dialoge werden mit ElevenLabs-Stimmen vorgelesen. „Sprache“ schaltet sie unabhängig von der Musik um; ↻ liest die aktuelle Zeile erneut vor. Mit Enter liest du in deinem eigenen Tempo weiter.':'Sprachaufnahmen sind derzeit nicht verfügbar. Mit Enter liest du die Dialoge in deinem eigenen Tempo weiter.');
    [['Aktionen wählen','1 · 2 · 3 · 4'],['Karte / Logbuch / Hinweis','M · J · H'],['Anklickbare Stellen zeigen','Leertaste'],['Dialog weiter','Enter'],['Auswahl / Fenster schließen','Esc']].forEach(([l,r])=>{const row=document.createElement('div');row.className='help-row';const left=document.createElement('span'),right=document.createElement('span');left.textContent=l;right.textContent=r;row.append(left,right);content.append(row);});
  }
  function openSettings() {
    const content=openModal('Unter Deck','DEIN ABENTEUER');
    paragraph(content,'Ein eigener Chiptune-Soundtrack begleitet deine Reise und wechselt mit dem Schauplatz. Deine Reise bleibt auf diesem Gerät; einen Spielstand kannst du als Datei mitnehmen.');
    paragraph(content,speech?.getStatus().hasRecordings?'Die Sprachausgabe nutzt mitgelieferte ElevenLabs-Aufnahmen.':'Sprachaufnahmen sind derzeit nicht verfügbar. Die Dialoge kannst du weiter lesen.');
    const actions=document.createElement('div');actions.className='settings-actions';content.append(actions);
    if(audio)addButton(actions,audio.getStatus().enabled?'Musik ausschalten':'Musik einschalten',()=>{toggleMusic();openSettings();});
    if(speech?.getStatus().hasRecordings)addButton(actions,speech.enabled?'Sprache ausschalten':'Sprache einschalten',()=>{speech.toggle();speech.stop();openSettings();});
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
    const artState=active?state:Story.initialState();
    ctx.clearRect(0,0,1600,900);Art.drawScene(ctx,active?state.scene:'harbor',artState,reducedMotion?0:t/1000);
    if(typeof Art.drawHero==='function')Art.drawHero(ctx,hero.x,hero.y,reducedMotion?0:t/1000,hero.facing,moving && !reducedMotion);
  }
  document.querySelectorAll('[data-verb]').forEach(b=>b.addEventListener('click',()=>setVerb(b.dataset.verb)));
  $('startBtn').addEventListener('click',()=>{if(stored){const c=openModal('Eine frische Brise?','NEUE REISE');paragraph(c,'Es gibt bereits einen gespeicherten Fortschritt. Eine neue Reise ersetzt diesen Spielstand.');addButton(c,'Neu beginnen',reset,'primary');addButton(c,'Reise fortsetzen',()=>{closeModal();start(true);});}else start(false);});
  $('continueBtn').addEventListener('click',()=>start(true));$('continueBtn').hidden=!stored;
  $('speechBtn')?.addEventListener('click',()=>{speech?.toggle();syncSpeechUI();});
  $('repeatLine')?.addEventListener('click',()=>speech?.repeat());
  $('mapBtn').addEventListener('click',openMap);$('journalBtn').addEventListener('click',openJournal);$('hintBtn').addEventListener('click',openHint);$('menuBtn').addEventListener('click',openSettings);$('helpBtn').addEventListener('click',openHelp);$('audioBtn').addEventListener('click',toggleMusic);$('revealBtn').addEventListener('click',toggleReveal);$('nextLine').addEventListener('click',advanceDialog);$('closeModal').addEventListener('click',closeModal);$('endingJournal').addEventListener('click',openJournal);$('replayBtn').addEventListener('click',()=>{const c=openModal('Noch eine Runde?','NEUES ABENTEUER');paragraph(c,'Die abgeschlossene Reise wird durch einen neuen Spielstand ersetzt.');addButton(c,'Segel setzen',reset,'primary');addButton(c,'Zurück',closeModal);});
  $('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});
  $('hotspots').addEventListener('click',e=>{
    if(e.target!==$('hotspots') || !active || state.finished)return;
    if(!$('conversation').hidden && !pendingChoices.length){advanceDialog();return;}
    const bounds=$('stage').getBoundingClientRect();hero.target=Math.max(110,Math.min(1480,(e.clientX-bounds.left)/bounds.width*1600));hero.facing=hero.target>=hero.x?1:-1;selected=null;verb=null;refresh();
  });
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(!$('modalBackdrop').hidden){
      if(e.key==='Escape')closeModal();
      if(e.key==='Tab'){const f=[...$('modalBackdrop').querySelectorAll('button:not(:disabled),input,a[href]')];const first=f[0],last=f[f.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}
      return;
    }
    const key=e.key.toLowerCase();
    if(key==='enter' && !$('conversation').hidden && !e.target.closest('[data-choice],#repeatLine,#speechBtn,#audioBtn')){
      e.preventDefault();advanceDialog();return;
    }
    if(key===' ' && active && e.target.closest('.hotspot')){
      e.preventDefault();toggleReveal();return;
    }
    if(key==='escape'){selected=null;verb=null;dismissDialog();refresh();if(state.finished)showEnding();}
    else if(key==='enter' && !e.target.closest('button,a'))advanceDialog();
    else if(key===' ' && !e.target.closest('button,a')){e.preventDefault();toggleReveal();}
    else if(key==='m')openMap();else if(key==='j')openJournal();else if(key==='h')openHint();
    else if(['1','2','3','4'].includes(key))setVerb(['look','talk','take','use'][Number(key)-1]);
  });
  window.addEventListener('beforeunload',save);
  window.Fluestertide = {
    getState:()=>JSON.parse(JSON.stringify(state)),start:()=>start(false),resume:()=>start(true),
    perform:(v,id,item)=>execute(()=>Story.perform(state,v,id,item)),choose:id=>execute(()=>Story.choose(state,id)),combine:(a,b)=>execute(()=>Story.combine(state,a,b)),version:'1.1.0'
  };
  document.querySelector('.game-shell').classList.add('inactive');refresh();syncSpeechUI();syncMusicUI();requestAnimationFrame(animate);
})();
