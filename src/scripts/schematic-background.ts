/** One document-sized circuit, laid out on resize. Native page scrolling moves it. */
const sheet = document.getElementById('schematic-background')!;
const main = document.getElementById('main-content')!;
let previous = '', pending = 0;
let imageUrls: string[] = [];
function layout() {
  pending = 0;
  const width = document.documentElement.clientWidth;
  const height = Math.ceil(document.body.offsetHeight);
  const key = `${width}:${height}`;
  if (previous === key || !width || !height) return;
  previous = key;
  const w = Math.max(760, width), h = height * w / width;
  const left = 28, right = w - 28, middle = w * .5;
  const wires: string[] = [], symbols: string[] = [], labels: string[] = [];
  // These uninterrupted rails join the entire document, including section boundaries.
  wires.push(`M${left} 105V${h - 48}H${right}V105`, `M${left + 20} 105V${h - 68}H${right - 20}V105`, `M${middle} 120V${h - 90}`);
  const names = ['POWER CONDITIONING', 'MOTOR CONTROL', 'POSITION FEEDBACK', 'SIGNAL FILTER', 'TOOL INTERFACE', 'COMMUNICATION'];
  const rows: {min:number;max:number;wires:string[];symbols:string[];labels:string[]}[] = [];
  let index = 0;
  for (let y = 170; y < h - 180; y += 420) {
    const wi=wires.length, si=symbols.length, li=labels.length;
    const isLeft = index % 2 === 0;
    const x = isLeft ? w * .13 : w * .67;
    const boxWidth = Math.min(158, w * .2), rail = isLeft ? left : right;
    const exit = isLeft ? x + boxWidth : x;
    const enter = isLeft ? x : x + boxWidth;
    symbols.push(`<rect x="${x}" y="${y}" width="${boxWidth}" height="112" rx="2"/>`);
    wires.push(`M${rail} ${y - 44}H${enter}V${y + 22}`, `M${exit} ${y + 28}H${middle}V${y + 202}`);
    for (let pin = 0; pin < 5; pin++) {
      const py = y + 54 + pin * 20, bend = (exit + middle) / 2 + pin * 13;
      wires.push(`M${exit} ${py}H${bend}V${y + 200 + pin * 24}H${middle}`);
    }
    // A complementary amplifier branch fills the other half of each sheet row.
    const ax = isLeft ? w * .72 : w * .21, ay = y + 110;
    symbols.push(`<path d="M${ax} ${ay}v72l62-36Z"/><path d="M${ax + 10} ${ay + 20}h10m-5-5v10m-5 25h10"/>`);
    wires.push(`M${middle} ${ay + 18}H${ax}`, `M${ax + 62} ${ay + 36}H${ax + 90}V${ay + 104}H${ax - 22}V${ay + 54}H${ax}`);
    symbols.push(`<use href="#sheet-r" x="${ax - 88}" y="${ay + 54}"/>`);
    wires.push(`M${rail} ${ay + 54}H${ax - 88}`, `M${ax - 24} ${ay + 54}H${ax}`);
    labels.push(`<text x="${ax + 6}" y="${ay - 12}">A${index + 1} / FEEDBACK</text>`);
    const rx = isLeft ? x + 16 : x - 80;
    wires.push(`M${left + 20} ${y + 324}H${rx}`, `M${rx + 64} ${y + 324}H${right - 20}`);
    symbols.push(`<use href="#sheet-r" x="${rx}" y="${y + 324}"/>`);
    const cx = isLeft ? w * .78 : w * .24;
    wires.push(`M${cx} ${y + 324}V${y + 358}`, `M${cx} ${y + 402}V${y + 424}`);
    symbols.push(`<use href="#sheet-c" transform="translate(${cx} ${y + 358}) rotate(90)"/><use href="#sheet-g" x="${cx}" y="${y + 424}"/>`);
    labels.push(`<text x="${x + 12}" y="${y + 21}">U${String(index + 1).padStart(2, '0')}</text><text x="${x + 12}" y="${y + 53}">${names[index % names.length]}</text><text x="${x + 12}" y="${y + 88}">IN / OUT / GND</text><text x="${rx + 18}" y="${y + 311}">R${index + 1}</text><text x="${cx + 12}" y="${y + 382}">C${index + 1}</text>`);
    rows.push({min:y-44,max:y+445,wires:wires.slice(wi),symbols:symbols.slice(si),labels:labels.slice(li)});
    index++;
  }
  // Keep identical document coordinates, but bound transparency/raster work to
  // small tiles. Offscreen drawing can be skipped without a page-sized surface.
  const tiles: string[] = [], nextUrls: string[] = [], tileHeight = 1024 * w / width;
  const ink=getComputedStyle(sheet).color;
  for(let top=0, tile=0; top<h; top+=tileHeight, tile++) {
   const bottom=Math.min(h,top+tileHeight), id=`sheet-${tile}`;
   const visible=rows.filter(row=>row.max>=top && row.min<=bottom);
   const rails=wires.slice(0,3).join(' ');
   const defs=`<defs><g id="${id}-r"><path d="M0 0h12l4-5 8 10 8-10 8 10 8-10 4 5h12"/></g><g id="${id}-c"><path d="M0 0h17m0-9v18m9-18v18m0-9h18"/></g><g id="${id}-g"><path d="M0 0v10m-11 0h22m-16 5h10m-7 5h4"/></g></defs>`;
   const symbols=visible.flatMap(row=>row.symbols).join('').replaceAll('#sheet-',`#${id}-`);
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${(bottom-top)*width/w}" viewBox="0 ${top} ${w} ${bottom-top}" preserveAspectRatio="none" color="${ink}">${defs}<g fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><path d="${rails} ${visible.flatMap(row=>row.wires).join(' ')}"/>${symbols}</g><g fill="currentColor" font-family="monospace" font-size="8" letter-spacing=".8">${visible.flatMap(row=>row.labels).join('')}</g></svg>`;
   const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));nextUrls.push(url);
   tiles.push(`<div class="schematic-tile" style="top:${top*width/w}px;height:${(bottom-top)*width/w}px"><img src="${url}" alt="" decoding="async" draggable="false"/></div>`);
  }
  sheet.innerHTML=tiles.join('');
  imageUrls.forEach(url=>URL.revokeObjectURL(url));imageUrls=nextUrls;
  // Decode once, before the user reaches distant strips. SVG image documents
  // stay outside the page's live style/layout tree and preserve vector quality.
  sheet.querySelectorAll('img').forEach(img=>{img.decode().catch(()=>{});});
  sheet.dataset.tiles=String(tiles.length);
  sheet.dataset.segments = String(index);
  sheet.dataset.documentHeight = String(height);
}
function schedule() { if (!pending) pending = requestAnimationFrame(layout); }
const observer = new ResizeObserver(schedule); observer.observe(main);
window.addEventListener('resize', schedule, { passive: true });
document.fonts.ready.then(schedule);
window.addEventListener('pagehide', event => { if(!event.persisted){imageUrls.forEach(url=>URL.revokeObjectURL(url));imageUrls=[];previous='';} cancelAnimationFrame(pending); pending = 0; observer.disconnect(); });
window.addEventListener('pageshow', () => { observer.observe(main); schedule(); });
schedule();

