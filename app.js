

---


## 3) `app.js`
```js
// Jednoduchý model dokumentu
const state = {
pages: [], // pole stránek; každá stránka = { background:'plain|ruled|grid', objects:[...layers], history:[], redo:[] }
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


// Typy objektů: stroke | text | image


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


// Inicializace plátna (A4 @ 96 DPI ~ 794x1123, ale zvolíme 1200x1600 pro kvalitu)
const W = 1200, H = 1600;
[bgCanvas.width, bgCanvas.height] = [W, H];
[drawCanvas.width, drawCanvas.height] = [W, H];


function newPage(background='plain'){
const page = {background, objects:[], history:[], redo:[]};
state.pages.push(page);
state.pageIndex = state.pages.length-1;
syncUI();
}


function currentPage(){
return state.pages[state.pageIndex];
syncUI();
