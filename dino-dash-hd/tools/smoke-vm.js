const fs=require('fs');
const path=require('path');
const vm=require('vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
if(/ghostBtn|drawGhost|ghostOn|palGhost/.test(html))throw new Error('Phantom mode code is still present');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
if(!match)throw new Error('Inline game script missing');

const gradient={addColorStop(){}};
const contexts=[];
function context2d(){
  const state={__depth:0,__minDepth:0};contexts.push(state);
  return new Proxy(state, {
    get(target,key){
      if(key==='save')return()=>{target.__depth++;};
      if(key==='restore')return()=>{target.__depth--;target.__minDepth=Math.min(target.__minDepth,target.__depth);};
      if(key==='createLinearGradient'||key==='createRadialGradient')return()=>gradient;
      if(key==='measureText')return text=>({width:String(text).length*8});
      if(key==='canvas')return{width:1254,height:1254};
      if(!(key in target))target[key]=()=>{};
      return target[key];
    },
    set(target,key,value){target[key]=value;return true;}
  });
}

const elements=new Map();
function element(tag='div'){
  const children=[];
  return{
    tagName:tag.toUpperCase(),style:{},dataset:{},children,
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    appendChild(child){children.push(child);return child;},
    removeChild(){children.shift();},remove(){},blur(){},closest(){return null;},
    addEventListener(){},setAttribute(){},
    getContext(){return context2d();}
  };
}

class MockImage{
  constructor(){this.naturalWidth=1254;this.naturalHeight=1254;this.width=1254;this.height=1254;this._src='';}
  set src(value){this._src=value;}
  get src(){return this._src;}
  addEventListener(type,listener){if(type==='load')listener();}
}
class MockAudio{
  constructor(){this.loop=false;this.preload='';this.volume=1;this.currentTime=0;}
  play(){return Promise.resolve();}
  pause(){}
}

const document={
  body:element('body'),hidden:false,fonts:{load(){return Promise.resolve();}},
  getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},
  createElement(tag){return element(tag);},
  querySelectorAll(){return[];},addEventListener(){},
};
const localStorage={getItem(key){return key==='dd_bgm'||key==='dd_sfx'?'0':null;},setItem(){}};
const testConsole={log:console.log,warn:console.warn,error(){}};
const sandbox={
  console:testConsole,document,localStorage,Image:MockImage,Audio:MockAudio,
  CanvasRenderingContext2D:function(){},matchMedia(){return{matches:false};},
  innerWidth:1440,innerHeight:900,devicePixelRatio:2,navigator:{hardwareConcurrency:8,vibrate(){}},
  performance:{now(){return 0;}},requestAnimationFrame(){},addEventListener(){},
  setTimeout(){},clearTimeout(){},setInterval(){return 1;},clearInterval(){},Math,Date,JSON,
};
sandbox.window=sandbox;
vm.createContext(sandbox);
new vm.Script(match[1],{filename:'index-inline.js'}).runInContext(sandbox);
vm.runInContext(`
  S.state='running';D.y=GROUND;D.air=false;D.dead=false;
  for(let i=0;i<240;i++){update(1/60);draw();}
  palSkin=Object.assign({},SKINS[1],{glow:true});draw();
  S.cave.t=1;draw();S.cave.t=-1;S.aeth.t=1;draw();
  if(!TILE_CACHE.ready)throw new Error('Tile cache did not initialize');
  if(!DECOR_CACHE.ready)throw new Error('Decor cache did not initialize');
  if(!ASSETS.spriteReady)throw new Error('Sprite atlas did not initialize');
  if(PERF.dpr>DPR_CAP)throw new Error('DPR performance cap was exceeded');
  enterSafeMode(new Error('forced smoke-test failure'));draw();
  if(PERF.tier!=='safe')throw new Error('Safe mode did not activate');
`,sandbox);
if(contexts.some(c=>c.__minDepth<0||c.__depth!==0))throw new Error('Unbalanced canvas save/restore stack');
console.log('VM smoke test passed: boot, 240 frames, no phantom mode, DPR cap, caches, biome renders and safe-mode recovery');
