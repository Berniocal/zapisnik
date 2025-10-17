// ==== Stav aplikace ==========================================================
const state = {
  pages: [],
  pageIndex: 0,
  tool: 'pen',
  color: '#1f2937',
  size: 3,
  alpha: 1,
  isDrawing: false,
  currentStroke: null,
  zoom: 1,
  panX: 0,
  panY: 0,
};

const bgCanvas = document.getElementById('bg-canvas');
const drawCanvas = document.getElementById('draw-canvas');
const ctx = drawCanvas.getContext('2d');
const bgctx = bgCanvas.getContext('2d');

const bgSelect = document.getElementById('bg-select');
const colorEl = document.getElementById('color');
const sizeEl = document.getElementById('size');
const alphaEl = document.getElementById('alpha');
const textEditor = document.getElementById('text-editor');
const pageInfo = document.getElementById('page-info');

const btnNew = document.getElementById('btn-new-page');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');
const btnExport = document.getElementById('btn-export');
const imgInput = document.getElementById('image-input');

const toolButtons = document.querySelectorAll('.tool');

// ==== Velká stránka přes celou obrazovku ====================================
let PAGE_W = 1200, PAGE_H = 1600; // vnitřní rozlišení pro export
function resizeCanvasToContainer(){
  const box = document.querySelector('.sheet-wrap').getBoundingClientRect();
  bgCanvas.width = drawCanvas.width = Math.floor(box.width);
  bgCanvas.height = drawCanvas.height = Math.floor(box.height);
  drawBackground();
  render();
}
window.addEventListener('resize', resizeCanvasToContainer);

// ==== Model stránky ==========================================================
function newPage(background='plain'){
  state.pages.push({ background, objects:[], history:[], redo:[] });
  state.pageIndex = state.pages.length - 1;
  syncUI();
}
function currentPage(){
  return state.pages[state.pageIndex];
}
function pushHistory(a){ const p=currentPage(); p.history.push(a); p.redo.length=0; }
function undo(){ const p=currentPage(); const a=p.history.pop(); if(!a) return; p.redo.push(a); if(a.kind==='add') p.objects.pop(); render(); }
function redo(){ const p=currentPage(); const a=p.redo.pop(); if(!a) return; p.history.push(a); if(a.kind==='add') p.objects.push(a.object); render(); }

// ==== Pozadí (bílý/linkovaný/čtverečkovaný) ==================================
function setBackground(kind){ currentPage().background = kind; drawBackground(); }
function drawBackground(){
  const kind = currentPage()?.background || 'plain';
  const W = bgCanvas.width, H = bgCanvas.height;
  bgctx.clearRect(0,0,W,H);
  bgctx.fillStyle = '#fff'; bgctx.fillRect(0,0,W,H);

  if(kind==='ruled'){
    bgctx.strokeStyle = '#cfe8ff'; bgctx.lineWidth = 1;
    const step = 48;
    for(let y=120; y<H-60; y+=step){ bgctx.beginPath(); bgctx.moveTo(60,y); bgctx.lineTo(W-60,y); bgctx.stroke(); }
    bgctx.strokeStyle = '#ffb4b4';
    bgctx.beginPath(); bgctx.moveTo(160,60); bgctx.lineTo(160,H-60); bgctx.stroke();
  }
  if(kind==='grid'){
    bgctx.strokeStyle = '#e5f0ff'; bgctx.lineWidth = 1;
    const step = 48;
    for(let y=60; y<H-60; y+=step){ bgctx.beginPath(); bgctx.moveTo(60,y); bgctx.lineTo(W-60,y); bgctx.stroke(); }
    for(let x=60; x<W-60; x+=step){ bgctx.beginPath(); bgctx.moveTo(x,60); bgctx.lineTo(x,H-60); bgctx.stroke(); }
  }
}

// ==== Kreslené objekty =======================================================
function render(){
  const W = drawCanvas.width, H = drawCanvas.height;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,W,H);
  ctx.setTransform(state.zoom,0,0,state.zoom,state.panX,state.panY);
  for(const obj of currentPage().objects){ drawObject(obj); }
}
function drawObject(obj){
  if(obj.type==='stroke'){
    ctx.globalAlpha = obj.alpha; ctx.lineCap = ctx.lineJoin = 'round';
    ctx.strokeStyle = obj.color; ctx.lineWidth = obj.size;
    ctx.globalCompositeOperation = obj.mode || 'source-over';
    ctx.beginPath();
    obj.points.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.stroke();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation='source-over';
  }
  if(obj.type==='text'){
    ctx.globalAlpha = obj.alpha; ctx.fillStyle = obj.color;
    ctx.font = `${obj.size}px system-ui`;
    wrapText(ctx, obj.text, obj.x, obj.y, obj.maxWidth||800, obj.size*1.3);
    ctx.globalAlpha = 1;
  }
  if(obj.type==='image'){
    if(!obj._img){ const im=new Image(); im.src=obj.dataURL; obj._img=im; im.onload=render; }
    if(obj._img?.complete) ctx.drawImage(obj._img, obj.x, obj.y, obj.w, obj.h);
  }
}
f
