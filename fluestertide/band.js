(function (root) {
  'use strict';

  const notes = Object.freeze({
    wood: Object.freeze({id:'wood',label:'Holzklopf',symbol:'▥',clue:'Ein kurzer Klopfer auf Adas Hafenbrett.'}),
    glass: Object.freeze({id:'glass',label:'Glaspling',symbol:'◇',clue:'Ein helles Pling am Rand eines leeren Grogbechers.'}),
    shell: Object.freeze({id:'shell',label:'Muschelton',symbol:'◉',clue:'Ein weicher Ton aus einer großen Hafenmuschel.'}),
    bell: Object.freeze({id:'bell',label:'Glockenton',symbol:'♧',clue:'Ein runder Ton von Adas kleiner Messingglocke.'})
  });
  const rounds = Object.freeze([
    {id:'dock',title:'Der Steg zählt mit',notes:['wood','glass','wood'],clue:'Holzklopf → Glaspling → Holzklopf.',
      lines:[{speaker:'Ada',text:'Ich spiele vor, du spielst nach. Das Brett hat schon zugesagt.'}]},
    {id:'tide',title:'Die Muschel antwortet',notes:['shell','wood','glass','shell'],clue:'Muschelton → Holzklopf → Glaspling → Muschelton.',
      lines:[{speaker:'Ada',text:'Die Muschel darf anfangen und aufhören. Sie zahlt schließlich Miete im Meer.'}]},
    {id:'harbor',title:'Ein ganzer Hafen im Takt',notes:['bell','shell','glass','wood','bell'],clue:'Glockenton → Muschelton → Glaspling → Holzklopf → Glockenton.',
      lines:[{speaker:'Ada',text:'Zum Schluss: Glocke, Muschel, Glas, Holz, Glocke. Kein Vorsingen nötig. Die Möbel übernehmen das.'}]}
  ].map(pattern => Object.freeze({...pattern,notes:Object.freeze(pattern.notes),lines:Object.freeze(pattern.lines.map(Object.freeze))})));

  function validState(state) { return !!state && typeof state==='object' && !Array.isArray(state); }
  function flagsOf(state) {
    const flags=validState(state)&&Object.hasOwn(state,'flags')?state.flags:null;
    return flags && typeof flags==='object' && !Array.isArray(flags)?flags:{};
  }
  function status(state) {
    const flags=flagsOf(state),saved=Object.hasOwn(flags,'harborBandRound')?flags.harborBandRound:0;
    const completed=Object.hasOwn(flags,'harborBandComplete') && flags.harborBandComplete===true;
    const round=completed?rounds.length:Number.isInteger(saved)&&saved>=0&&saved<=rounds.length?saved:0;
    return {round,total:rounds.length,complete:round===rounds.length,completedRounds:round};
  }
  function pattern(state) {
    const current=status(state);
    if(current.complete)return null;
    const source=rounds[current.round];
    return {id:source.id,round:current.round+1,total:rounds.length,title:source.title,notes:[...source.notes],clue:source.clue,lines:source.lines.map(line=>({...line}))};
  }
  function progress(state) {
    const current=status(state);
    return {count:current.completedRounds,total:current.total,complete:current.complete,rank:current.complete?'Die Kleine Hafenband':current.round?'Hafentakt-Lehrling':'Noch ohne Taktvertrag'};
  }
  function reply(state,ok,reason,lines) {
    const current=status(state);
    return {ok,reason,round:current.round,complete:current.complete,lines};
  }
  function canWrite(object,key) {
    let owner=object;
    while(owner){
      const descriptor=Object.getOwnPropertyDescriptor(owner,key);
      if(descriptor)return Object.hasOwn(descriptor,'value') && descriptor.writable && (owner===object || Object.isExtensible(object));
      owner=Object.getPrototypeOf(owner);
    }
    return Object.isExtensible(object);
  }
  function submit(state,input) {
    if(!validState(state) || !Array.isArray(input) || input.length>5 || Array.from(input).some(id=>typeof id!=='string' || !Object.hasOwn(notes,id))) {
      return reply(state,false,'invalid',[{speaker:'Ada',text:'Vier Instrumente haben wir. Den Rest müsstest du erst anschleppen.'}]);
    }
    const current=status(state);
    if(current.complete)return reply(state,false,'complete',[{speaker:'Ada',text:'Die Band steht! Spiel ruhig weiter. Ab jetzt sind sogar Soli mit dem Brett erlaubt.'}]);
    const expected=rounds[current.round].notes;
    if(input.some((id,index)=>id!==expected[index])) {
      return reply(state,false,'wrong',[{speaker:'Ada',text:'Fast eine neue Stilrichtung. Hör oder lies meine Folge noch einmal; wir haben alle Zeit der Gezeiten.'}]);
    }
    if(input.length<expected.length)return reply(state,false,'partial',[{speaker:'Motte',text:'Da fehlen noch ein paar Töne. Das Brett sieht schon erwartungsvoll aus.'}]);

    // Preflight both fields before committing so read-only saves cannot partially
    // advance. Accessor properties are rejected rather than invoking side effects.
    const replaceFlags=!Object.hasOwn(state,'flags') || !state.flags || typeof state.flags!=='object' || Array.isArray(state.flags);
    const flags=replaceFlags?{}:state.flags,complete=current.round+1===rounds.length;
    if(replaceFlags&&!canWrite(state,'flags') || !canWrite(flags,'harborBandRound') || complete&&!canWrite(flags,'harborBandComplete')) {
      return reply(state,false,'invalid',[{speaker:'Ada',text:'Dieser Notenzettel lässt sich gerade nicht beschreiben. Mit einem frischen Spielstand spielen wir weiter.'}]);
    }
    // Only these two optional flags change. No inventory, quest or ending writes.
    if(replaceFlags)state.flags=flags;
    flags.harborBandRound=current.round+1;
    if(complete)flags.harborBandComplete=true;
    return reply(state,true,'correct',complete?[
      {speaker:'Ada',text:'Drei Folgen, vier Instrumente, keine beschädigten Gäste. Willkommen in der Kleinen Hafenband!'},
      {speaker:'Motte',text:'Endlich eine Karriere, für die ich meine Beute nicht verkaufen muss.'}
    ]:[{speaker:'Ada',text:current.round===0?'Genau! Das Brett verlangt bereits einen Anteil am Trinkgeld.':'So klingt der Hafen. Eine letzte Folge, dann drucken wir die imaginären Plakate.'}]);
  }

  const api=Object.freeze({notes,status,pattern,submit,progress});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.FluestertideBand=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:this);
