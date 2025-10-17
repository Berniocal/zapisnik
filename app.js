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
function wrapText(context, text, x, y, maxWidth, lineHeight){
  const words = text.split(/\s+/); let line='';
  for(let n=0;n<words.length;n++){
    const test = line + words[n] + ' '; const w = context.measureText(test).width;
    if(w > maxWidth && n>0){ context.fillText(line, x, y); line = words[n] + ' '; y += lineHeight; }
    else line = test;
  }
  context.fillText(line, x, y);
}

// ==== Vstupy / nástroje ======================================================
toolButtons.forEach(b => b.addEventListener('click', ()=>{
  state.tool = b.dataset.tool;
  if(state.tool==='image') imgInput.click();
}));
colorEl.oninput = ()=> state.color = colorEl.value;
sizeEl.oninput  = ()=> state.size  = +sizeEl.value;
alphaEl.oninput = ()=> state.alpha = +alphaEl.value;

bgSelect.onchange = ()=> setBackground(bgSelect.value);
btnNew.onclick = ()=> newPage(currentPage()?.background || 'plain');
btnPrev.onclick = ()=> { if(state.pageIndex>0){ state.pageIndex--; syncUI(); } };
btnNext.onclick = ()=> { if(state.pageIndex<state.pages.length-1){ state.pageIndex++; syncUI(); } };
btnUndo.onclick = ()=> undo();
btnRedo.onclick = ()=> redo();
btnClear.onclick = ()=> { currentPage().objects.length=0; pushHistory({kind:'add',object:null}); render(); };

btnSave.onclick = ()=>{
  const data = JSON.stringify(state.pages.map(p=>({ background:p.background, objects:p.objects.map(o=>{const c={...o}; delete c._img; return c;}) })));
  localStorage.setItem('notebook-v1', data);
  alert('Sešit uložen do prohlížeče.');
};
btnLoad.onclick = ()=>{
  const data = localStorage.getItem('notebook-v1');
  if(!data) return alert('Nenalezen žádný uložený sešit.');
  const pages = JSON.parse(data);
  state.pages = pages.map(p=>({...p, history:[], redo:[]}));
  state.pageIndex = 0;
  syncUI();
};
btnExport.onclick = async ()=>{
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation:'portrait', unit:'pt', format:[PAGE_W,PAGE_H]});
  for(let i=0;i<state.pages.length;i++){
    state.pageIndex = i; syncUI(false);
    const dataURL = exportPageDataURL();
    if(i>0) pdf.addPage([PAGE_W,PAGE_H],'portrait');
    pdf.addImage(dataURL,'PNG',0,0,PAGE_W,PAGE_H);
  }
  pdf.save('zapisnik.pdf');
};

imgInput.onchange = (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const dataURL = reader.result;
    const img = new Image(); img.src = dataURL;
    img.onload = ()=>{
      const scale = Math.min(800/img.width, 800/img.height, 1);
      const w = img.width*scale, h = img.height*scale;
      const obj = {type:'image', x:200, y:200, w, h, dataURL, _img:img};
      currentPage().objects.push(obj); pushHistory({kind:'add',object:obj}); render();
    };
  };
  reader.readAsDataURL(file);
  e.target.value='';
};

// ==== Myš/pero ===============================================================
let pointerId = null;
function toCanvasCoords(clientX, clientY){
  const r = drawCanvas.getBoundingClientRect();
  return { x:(clientX - r.left - state.panX)/state.zoom, y:(clientY - r.top - state.panY)/state.zoom };
}
function startStroke(p){
  const mode = state.tool==='eraser' ? 'destination-out' : 'source-over';
  const alpha = state.tool==='marker' ? Math.min(state.alpha, 0.35) : state.alpha;
  const size = state.tool==='marker' ? Math.max(state.size, 12) : state.size;
  state.currentStroke = {type:'stroke', color:state.color, size, alpha, mode, points:[p]};
  currentPage().objects.push(state.currentStroke);
  pushHistory({kind:'add', object:state.currentStroke});
}
function extendStroke(p){ state.currentStroke.points.push(p); render(); }
function endStroke(){ state.currentStroke = null; }

drawCanvas.addEventListener('pointerdown', (e)=>{
  drawCanvas.setPointerCapture(e.pointerId); pointerId = e.pointerId;
  const p = toCanvasCoords(e.clientX, e.clientY);
  if(state.tool==='text'){ openTextEditor(p.x,p.y); return; }
  if(state.tool==='select'){ /* (zatím jen přesun text/obrázku později) */ return; }
  state.isDrawing = true; startStroke(p);
});
drawCanvas.addEventListener('pointermove', (e)=>{
  if(pointerId!==e.pointerId) return;
  const p = toCanvasCoords(e.clientX, e.clientY);
  if(!state.isDrawing || !state.currentStroke) return;
  extendStroke(p);
});
drawCanvas.addEventListener('pointerup', (e)=>{
  if(pointerId!==e.pointerId) return;
  drawCanvas.releasePointerCapture(e.pointerId); pointerId = null;
  if(state.isDrawing){ endStroke(); state.isDrawing=false; }
});

document.addEventListener('keydown', (e)=>{
  if((e.ctrlKey||e.metaKey) && e.key==='z'){ e.preventDefault(); undo(); }
  if((e.ctrlKey||e.metaKey) && (e.key==='y' || (e.shiftKey && e.key==='Z'))){ e.preventDefault(); redo(); }
});

// ==== Textový editor =========================================================
function openTextEditor(x,y){
  textEditor.style.left = `${x}px`;
  textEditor.style.top  = `${y}px`;
  textEditor.style.display = 'block';
  textEditor.value = '';
  textEditor.focus();
  textEditor.onblur = ()=>{
    const text = textEditor.value.trim();
    textEditor.style.display='none';
    if(text){
      const obj = {type:'text', x, y, text, color:state.color, size: Math.max(14, state.size*4), alpha:state.alpha, maxWidth: 900};
      currentPage().objects.push(obj); pushHistory({kind:'add', object:obj}); render();
    }
  };
}

function exportPageDataURL(){
  const tmp = document.createElement('canvas'); tmp.width = PAGE_W; tmp.height = PAGE_H;
  const tctx = tmp.getContext('2d');
  // přepočet z aktuálního poměru na exportní rozlišení
  tctx.drawImage(bgCanvas, 0,0, bgCanvas.width, bgCanvas.height, 0,0, PAGE_W, PAGE_H);
  tctx.drawImage(drawCanvas,0,0, drawCanvas.width,drawCanvas.height, 0,0, PAGE_W, PAGE_H);
  return tmp.toDataURL('image/png');
}

// ==== UI sync ================================================================
function syncUI(redrawBg=true){
  if(state.pages.length===0) newPage('plain');
  const page = currentPage();
  bgSelect.value = page.background;
  if(redrawBg) drawBackground();
  render();
  pageInfo.textContent = `Stránka ${state.pageIndex+1} / ${state.pages.length}`;
}
newPage('plain');
resizeCanvasToContainer();
syncUI();
