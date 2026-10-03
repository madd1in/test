(function (root) {
  'use strict';
  const cards = Object.freeze([
    {id:'harbor',title:'Amtlich angeschwemmt',author:'Flint, Abteilung Gezeiten',x:1180,y:805,text:'An das Hafenamt: Meine Fähre fährt wieder pünktlich. Leider weiß niemand, wann pünktlich ist. Bitte schicken Sie eine Uhr. Eine schwimmende wäre praktisch.'},
    {id:'tavern',title:'Die Hausordnung des Aals',author:'Ada Anker',x:910,y:755,text:'Liebe Gäste! Wer seinen Grog anschweigt, bekommt ihn trotzdem berechnet. Wer den Aal duzt, übernimmt die Verantwortung. Wer diese Flasche findet, bringt sie bitte gespült zurück.'},
    {id:'bazaar',title:'Eine sehr diskrete Mango',author:'Pippa, Dichterin und Papagei',x:535,y:745,text:'KRA! Suche Mango mit Charakter, ohne Vorstrafen und mit wenig Kern. Biete einen erstklassigen Reim. Vertrauliche Bewerbungen bitte direkt in meinen Schnabel.'},
    {id:'lighthouse',title:'Liebes Licht',author:'Jona Docht',x:335,y:785,text:'Du machst die ganze Nacht Überstunden und verlangst nie mehr Öl. Falls du kündigen möchtest, gib mir bitte zwei Wochen Nebelvorwarnung. Mit leuchtenden Grüßen, Jona.'},
    {id:'lagoon',title:'Meer für die Hosentasche',author:'Sela Seetang',x:290,y:730,text:'Eine Muschel ist ein winziges Meer mit ausgezeichnetem Gehäuse. Bitte nicht ans Ohr halten, wenn gerade Ebbe ist. Sonst hört man nur die Buchhaltung der Fische.'},
    {id:'wreck',title:'Inventur nach dem Untergang',author:'Balthasar Brack',x:1240,y:780,text:'Noch an Bord: drei Fässer, eine Glocke und ein überraschend hartnäckiger Kapitän. Fehlend: das Schiff. Wer es findet, möge bitte von außen anklopfen. Von innen erschrecke ich mich.'},
    {id:'vault',title:'Beschwerde Nummer sieben',author:'Kapitän Stillwasser',x:515,y:770,text:'Sehr geehrte Ruhe, unser Zusammenleben wird durch Piraten, Glocken und eine unverschämte junge Frau gestört. Ich wünsche ein Zimmer ohne Meerblick. Das Meer hört ohnehin nie zu.'}
  ].map(Object.freeze));
  const byScene = Object.freeze(Object.fromEntries(cards.map(card=>[card.id,card])));
  const bonus = 'An mein zukünftiges Ich: Wenn du endlich ein eigenes Schiff hast, bau einen Briefkasten an den Mast. Ein Abenteuer ist erst vollständig, wenn jemand davon erfährt. Und bestell keine sieben Mangos beim selben Papagei. — Mira „Motte“ Morrow';
  const found = (state,id) => !!state?.flags?.['postcard_'+id];
  function progress(state) {
    const count=cards.filter(card=>found(state,card.id)).length;
    return {count,total:cards.length,complete:count===cards.length,rank:count===7?'Schrecken der Briefkästen':count>=5?'Meisterin der Flaschenpost':count>=3?'Postpiratin':count>=1?'Flaschenfinderin':'Briefkastenkadettin'};
  }
  function hotspot(state) {
    const card=byScene[state?.scene];
    if(!card || found(state,card.id))return null;
    return {id:'postcard_'+card.id,name:'Eine versteckte Flaschenpost',kind:'postcard',card,x:(card.x-48)/16,y:(card.y-54)/9,w:6,h:12};
  }
  function collect(state,id) {
    const card=byScene[id];
    if(!card || state?.scene!==id || !state.flags || found(state,id))return {changed:false,card:null,progress:progress(state)};
    state.flags['postcard_'+id]=true;
    if(Array.isArray(state.journal))state.journal.push('Flaschenpost gefunden: „'+card.title+'“ von '+card.author+'.');
    return {changed:true,card,progress:progress(state)};
  }
  const api={cards,byScene,bonus,found,progress,hotspot,collect};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.FluestertideExtras=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:this);
