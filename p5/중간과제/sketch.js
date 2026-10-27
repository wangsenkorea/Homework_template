// WISHING POOL MEMO
// p5.js draws the wishing pool and its objects.
// HTML/CSS handles text input and management panels.
// Data is saved in this browser.

let notes = [];
let selectedType = "boat";
let currentNoteId = null;
let listFilter = "all";
let animationItems = [];
let ripples = [];
let pool = {};
let canvas;
let toastTimer = null;
let pressedNote = null;
let dragStart = null;
let dragOffset = null;
let noteWasDragged = false;
let waterDragPrevious = null;
let waterRipplePrevious = null;
const TEXT = {
    floating:"수면", resting:"연못 아래", wishes:"소원은 이곳에 머뭅니다", count:"수면 {a}개 · 연못 아래 {b}개",
    boat:"종이배", leaf:"나뭇잎", coin:"동전", boatDesc:"일상 · 생각", leafDesc:"기분 · 순간", coinDesc:"소원 · 목표",
    editEyebrow:"기록 수정", newEyebrow:"마음 띄우기", editTitle:"이 기록 수정하기", newTitle:"생각 하나 남기기", titleLabel:"제목", titlePlaceholder:"기억하기 쉬운 이름을 붙여주세요", contentLabel:"내용", contentPlaceholder:"어떤 생각을 남기고 싶나요?", choose:"연못에 띄울 물건 선택", cancel:"취소", save:"수정 저장", toss:"연못에 띄우기", writeFirst:"내용을 조금 적은 뒤 연못에 띄워주세요.", updated:"기록을 수정했어요.", tossed:"연못에 띄웠어요. 이 생각이 편안히 머물길.",
    surfaceRecord:"수면의 기록", bottomRecord:"연못 아래의 기록", created:"작성", modified:"최근 수정", edit:"수정", favorite:"☆ 즐겨찾기", favorited:"★ 즐겨찾기됨", retrieve:"수면으로 건져 올리기", sink:"연못 아래로 보내기", dissolve:"물에 녹여 보내기", putBack:"연못에 돌려놓기", addedFavorite:"즐겨찾기에 담았어요.", removedFavorite:"즐겨찾기에서 뺐어요.", sunk:"기록이 천천히 가라앉았어요.", retrieved:"기록을 수면으로 건져 올렸어요.", returned:"연못에 다시 띄웠어요.",
    letGo:"놓아주기", dissolveQuestion:"물속으로 녹여 보낼까요?", cannotUndo:"삭제한 기록은 되돌릴 수 없어요.", think:"조금 더 생각하기", confirmDissolve:"녹여 보내기", dissolved:"기록을 물에 녹여 보냈어요.", archive:"작은 기록 모음", allTitle:"모든 기록", allFilter:"전체", favoriteFilter:"★ 즐겨찾기", bottomFilter:"연못 아래", surfaceFilter:"수면", backPool:"연못으로 돌아가기", empty:"아직 기록이 없어요.<br>작은 생각 하나를 적어 연못에 띄워보세요.", stateBottom:"연못 아래", stateSurface:"수면"
};
function t(key) { return TEXT[key] || key; }
function tr(key, values={}) { return t(key).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? ""); }

const STORAGE_KEY = "wishingPoolMemo_v1";
function getTypes() {
  return {
    boat: { name: t("boat"), emoji: "⛵", description: t("boatDesc") },
    leaf: { name: t("leaf"), emoji: "🍃", description: t("leafDesc") },
    coin: { name: t("coin"), emoji: "🪙", description: t("coinDesc") }
  };
}
let TYPES = getTypes();

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-holder");

  canvas.position(0, 0);
  canvas.style("position", "absolute");
  canvas.style("z-index", "0");

  canvas.elt.style.pointerEvents = "auto";

  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  textFont("sans-serif");
  textAlign(CENTER, CENTER);

  loadNotes();

  document.getElementById("newBtn").addEventListener("click", openCreateModal);

  document.getElementById("allBtn").addEventListener("click", () => {
    openListModal("all");
  });

  document.getElementById("closeModal").addEventListener("click", closeModal);

  document.getElementById("modal-backdrop").addEventListener("click", event => {
    if (event.target.id === "modal-backdrop") {
      closeModal();
    }
  });

  updateCount();
}

function draw() {
  drawBackground();
  calculatePool();
  drawPool();
  drawWaterSurface();
  drawPoolObjects();
  drawRipples();
  drawPoolLabels();
  updateAnimations();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawBackground() {
  const ctx = drawingContext;
  const g = ctx.createRadialGradient(width*.5, height*.42, 0, width*.5, height*.5, Math.max(width,height)*.78);
  g.addColorStop(0, "#f2f0e5");
  g.addColorStop(.58, "#e6e9df");
  g.addColorStop(1, "#d9e1d8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  // Very subtle drifting light, like reflected daylight around the basin.
  noStroke();
  for (let i=0;i<8;i++) {
    const x = width*(.12 + noise(i*2.7, frameCount*.001)*.76);
    const y = height*(.10 + noise(20+i*3.1, frameCount*.0012)*.80);
    fill(255, 255, 239, 8 + 4*sin(frameCount*.012+i));
    ellipse(x,y, width*.12, height*.035);
  }
}

function calculatePool() {
  // A nearly full-screen circular basin, seen from a slightly elevated angle.
  const d = min(width * (width < 620 ? 1.18 : 1.12), height * 1.16, 1900);
  pool = { x: width / 2, y: height * .57, d, r: d / 2, waterD: d * .96, waterR: d * .48 };
}

function drawGardenDetails() {
  // No decorative stone blocks: keep the composition clean and close to the reference.
}

function drawPool() {
  const ctx = drawingContext;
  const x=pool.x, y=pool.y, d=pool.d;
  // Soft shadow under a simple, continuous pale rim.
  ctx.save(); ctx.shadowColor='rgba(20,54,66,.22)'; ctx.shadowBlur=d*.035; ctx.shadowOffsetY=d*.025;
  noStroke(); fill('#526e77'); ellipse(x,y,d*1.015,d*.84); ctx.restore();
  // Smooth uninterrupted pool lip, not individual stones.
  noStroke(); fill('#839ba0'); ellipse(x,y,d*1.015,d*.835);
  fill('#d8e0dc'); ellipse(x,y-d*.008,d*.995,d*.815);
  fill('#9eb7bb'); ellipse(x,y-d*.014,d*.972,d*.785);
  fill('#4d8c9e'); ellipse(x,y-d*.016,d*.952,d*.758);
  // Water gradient, clipped to the broad pool.
  ctx.save();
  const ww=d*.95, wh=d*.755;
  const grad=ctx.createRadialGradient(x-d*.19,y-d*.20,d*.025,x,y,d*.52);
  grad.addColorStop(0,'#b7e7ee'); grad.addColorStop(.24,'#83c9df'); grad.addColorStop(.52,'#5aaacb'); grad.addColorStop(.78,'#3c8eb4'); grad.addColorStop(1,'#286a91');
  ctx.fillStyle=grad; ctx.beginPath(); ctx.ellipse(x,y,ww/2,wh/2,0,0,TWO_PI); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x,y,ww/2,wh/2,0,0,TWO_PI); ctx.clip();
  const glow=ctx.createRadialGradient(x-d*.16,y-d*.2,0,x-d*.1,y-d*.12,d*.52);
  glow.addColorStop(0,'rgba(245,255,255,.48)'); glow.addColorStop(.45,'rgba(155,231,245,.13)'); glow.addColorStop(1,'rgba(9,56,94,.24)');
  ctx.fillStyle=glow; ctx.fillRect(x-ww/2,y-wh/2,ww,wh);
  // Fine, organic moving water contours and sun caustics.
  const tm=frameCount*.008;
  for(let i=0;i<34;i++){
    const yy=y-wh*.47+i*wh*.028;
    ctx.beginPath(); let begun=false;
    for(let xx=-ww*.49;xx<=ww*.49;xx+=d*.008){
      const edge=1-(xx/(ww*.5))**2; if(edge<=0) continue;
      const amp=d*(.0014+(i%5)*.0005);
      const py=yy+sin(xx/d*8+tm*1.1+i*.8)*amp+sin(xx/d*17-tm*.7+i)*amp*.35;
      if(abs(py-y)<wh*.5*sqrt(edge)){ if(!begun){ctx.moveTo(x+xx,py);begun=true;}else ctx.lineTo(x+xx,py); }
    }
    ctx.strokeStyle=i%3===0?`rgba(240,255,255,${.12+.07*sin(tm+i)})`:`rgba(14,79,115,${.04+.025*cos(tm+i)})`;
    ctx.lineWidth=Math.max(1,d*.0011); ctx.stroke();
  }
  for(let i=0;i<220;i++){
    const nx=noise(i*1.91,tm*.18), ny=noise(90+i*1.37,tm*.15);
    const gx=(nx-.5)*ww*.95, gy=(ny-.5)*wh*.94;
    if((gx/(ww*.5))**2+(gy/(wh*.5))**2>.94) continue;
    const len=d*(.003+(i%7)*.0014), alpha=20+35*(.5+.5*sin(tm*1.4+i*2.3));
    ctx.beginPath(); ctx.ellipse(x+gx,y+gy,len,d*.0012,sin(i)*.15,0,TWO_PI);
    ctx.fillStyle=`rgba(244,255,255,${alpha/255})`; ctx.fill();
  }
  ctx.restore();

  // Three-tier fountain: clean stone bowls, a central rising jet, and arcing streams.
  const fx=x, fy=y-d*.11;
  push();
  translate(fx, fy);
  scale(0.5);
  translate(-fx, -fy);
  // shadow/reflection beneath fountain
  noStroke(); fill('rgba(19,65,86,.20)'); ellipse(fx,fy+d*.24,d*.24,d*.08);
  // lower pedestal
  fill('#718f9a'); ellipse(fx,fy+d*.17,d*.19,d*.075); fill('#b7cbd0'); ellipse(fx,fy+d*.145,d*.17,d*.064);
  fill('#7799a4'); rect(fx-d*.035,fy-d*.015,d*.07,d*.19,5); fill('#d4e4e6'); rect(fx-d*.012,fy-d*.01,d*.018,d*.17,3);
  // lower wide bowl
  fill('#6b8790'); ellipse(fx,fy+d*.04,d*.39,d*.135); fill('#d1e0e1'); ellipse(fx,fy+d*.015,d*.38,d*.13);
  fill('#8bb4bf'); ellipse(fx,fy+d*.008,d*.32,d*.092); fill('#76c6dc'); ellipse(fx,fy-d*.002,d*.28,d*.067);
  // middle column and bowl
  fill('#718f99'); rect(fx-d*.025,fy-d*.105,d*.05,d*.13,4); fill('#d8e7e8'); rect(fx-d*.008,fy-d*.105,d*.012,d*.12,3);
  fill('#6d8992'); ellipse(fx,fy-d*.11,d*.25,d*.09); fill('#d8e5e5'); ellipse(fx,fy-d*.13,d*.245,d*.085); fill('#83c9d8'); ellipse(fx,fy-d*.14,d*.19,d*.055);
  // top column and small bowl
  fill('#718f99'); rect(fx-d*.016,fy-d*.235,d*.032,d*.105,4); fill('#dcebed'); rect(fx-d*.005,fy-d*.23,d*.008,d*.09,2);
  fill('#6e8993'); ellipse(fx,fy-d*.235,d*.15,d*.052); fill('#dce9e9'); ellipse(fx,fy-d*.247,d*.145,d*.05); fill('#83d2e5'); ellipse(fx,fy-d*.252,d*.105,d*.03);
  // Fountain is decorative and still: no water jets, arcs, or droplets.
  pop();
}

function drawWaterSurface() {
  const ctx = drawingContext;
  const x=pool.x, y=pool.y, d=pool.d, t=frameCount*.009;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x,y,pool.waterD*.52,pool.waterD*.47,0,0,Math.PI*2); ctx.clip();

  // Moving fine wavelets: layered curved strokes with different speeds and scales.
  for (let i=0;i<42;i++) {
    const yy = y - pool.waterR*.82 + i*pool.waterR*.04;
    const amp = d*(.0025 + (i%5)*.0007);
    ctx.beginPath();
    for (let xx=-pool.waterR*.98; xx<=pool.waterR*.98; xx+=d*.012) {
      const edge = sqrt(max(0,1-(xx/(pool.waterR*1.02))**2));
      const wave = sin(xx/d*3.2 + t*(.7+(i%4)*.16) + i*.63)*amp +
                   sin(xx/d*7.1 - t*.7 + i*.9)*amp*.32 +
                   (noise(xx*.008+i*.15,t*.2)-.5)*amp*.5;
      const py=yy+wave;
      if (abs(py-y) < pool.waterR*.92*edge) {
        if (xx === -pool.waterR*.98) ctx.moveTo(x+xx,py); else ctx.lineTo(x+xx,py);
      }
    }
    ctx.strokeStyle = i%4===0 ? `rgba(218,246,232,${.10+.035*sin(t+i)})` : `rgba(9,57,66,${.055+.02*cos(t+i)})`;
    ctx.lineWidth = i%4===0 ? Math.max(1,d*.0017) : Math.max(1,d*.0011); ctx.stroke();
  }

  // Elongated reflected sky glints drift across the surface.
  for (let i=0;i<95;i++) {
    const nx=noise(i*2.13, t*.16), ny=noise(100+i*1.71,t*.13);
    const gx=(nx-.5)*pool.waterR*1.72 + sin(t*.7+i)*d*.009;
    const gy=(ny-.5)*pool.waterR*1.5 + cos(t*.45+i*2)*d*.005;
    const inside=(gx*gx)/(pool.waterR*pool.waterR)+(gy*gy)/(pool.waterR*.88)**2 < .94;
    if (!inside) continue;
    const len=d*(.006+(i%6)*.002), alpha=18+22*(.5+.5*sin(t*1.3+i));
    noStroke(); fill(205,242,225,alpha);
    push(); translate(x+gx,y+gy); rotate(sin(i*9.1)*.12);
    ellipse(0,0,len,d*.0018); pop();
  }
  ctx.restore();

  // Fountain droplets and concentric rings. The rings breathe subtly rather than pulsing hard.
  noFill();
  for(let i=0;i<4;i++) {
    const phase=(frameCount*.012+i*.24)%1;
    const rr=d*(.018+phase*.055);
    stroke(222,246,232,75*(1-phase)); strokeWeight(Math.max(1,d*.0015));
    ellipse(x,y-d*.17,rr*1.4,rr*.65);
  }
  noStroke();
}

function drawPoolObjects() {
  // bottom notes first, so floating objects appear above them
  const bottomNotes = notes.filter(n => n.state === "bottom");
  const surfaceNotes = notes.filter(n => n.state === "surface");

  bottomNotes.forEach((note, i) => {
    const p = getNotePosition(note, i, bottomNotes.length, true);
    drawNoteObject(note, p.x, p.y, .76, true);
  });

  surfaceNotes.forEach((note, i) => {
    const p = getNotePosition(note, i, surfaceNotes.length, false);
    const floatY = sin(frameCount * .035 + note.seed) * 3;
    drawNoteObject(note, p.x, p.y + floatY, 1, false);
  });

  // animated newly tossed objects
  for (const item of animationItems) {
    const progress = constrain((millis() - item.start) / 650, 0, 1);
    const eased = 1 - pow(1 - progress, 3);
    const x = lerp(item.fromX, item.toX, eased);
    const y = lerp(item.fromY, item.toY, eased);
    push();
    translate(x, y);
    rotate((1 - progress) * .7);
    drawObjectGlyph(item.type, 1.15, false);
    pop();
  }
}

function getNotePosition(note, index, total, isBottom) {
  if (note.position) {
    return {
      x: pool.x + note.position.x * pool.waterR,
      y: pool.y + note.position.y * pool.waterR
    };
  }

  // Stable positions around a ring, derived from each note's saved seed.
  const usableR = pool.waterR * (isBottom ? .74 : .77);
  const angle = note.angle !== undefined ? note.angle : index * 2.399;
  const radial = note.radial !== undefined ? note.radial : .25 + ((index * 37) % 60) / 100;
  return {
    x: pool.x + cos(angle) * usableR * radial,
    y: pool.y + sin(angle) * usableR * radial * .88 + (isBottom ? pool.d * .055 : pool.d * .01)
  };
}

function drawNoteObject(note, x, y, scale, isBottom) {
  push();
  translate(x, y);
  const bob = isBottom ? 0 : sin(frameCount * .03 + note.seed) * .025;
  rotate(bob + (note.type === "boat" ? -.08 : note.type === "leaf" ? .25 : 0));
  if (isBottom) {
    fill(20, 51, 54, 45);
    ellipse(0, 12 * scale, 39 * scale, 17 * scale);
    tint(255, 155);
  }
  drawObjectGlyph(note.type, scale, isBottom);
  noTint();

  // favorite star
  if (note.favorite) {
    noStroke();
    fill("#f5d98d");
    textSize(13 * scale);
    text("★", 19 * scale, -18 * scale);
  }
  pop();
}

function drawObjectGlyph(type, objectScale, isBottom) {
  push();
  scale(objectScale);
  if (type === "boat") {
    const hull = isBottom ? "#c4cbbd" : "#fff8e8";
    const hullShade = isBottom ? "#91a396" : "#d9dfcf";
    const sailLight = isBottom ? "#c7d0c3" : "#fff9e9";
    const sailMid = isBottom ? "#aebcaf" : "#e5eadb";
    const sailShade = isBottom ? "#899f91" : "#c2d2c4";

    noStroke();
    fill(16, 48, 48, isBottom ? 35 : 55);
    ellipse(0, 14, 46, 10);

    fill(hullShade);
    beginShape();
    vertex(-23, -5);
    vertex(0, 1);
    vertex(23, -5);
    vertex(16, 9);
    vertex(11, 13);
    vertex(-11, 13);
    vertex(-16, 9);
    endShape(CLOSE);

    fill(hull);
    beginShape();
    vertex(-19, -5);
    vertex(0, 0);
    vertex(19, -5);
    vertex(11, 5);
    vertex(-11, 5);
    endShape(CLOSE);

    fill(sailLight);
    triangle(0, -27, -16, -6, 0, 3);
    fill(sailMid);
    triangle(0, -27, 0, 3, 17, -6);
    fill(sailShade);
    triangle(0, -27, -5, -12, 0, 3);
    fill(isBottom ? "#d2d7ca" : "#fffdf2");
    triangle(0, -27, 5, -12, 17, -6);

    stroke(isBottom ? "#718a7e" : "#a8b7a6");
    strokeWeight(1);
    line(0, -25, 0, 3);
    line(-15, -6, 0, 2);
    line(16, -6, 0, 2);
    line(-11, 5, 0, 9);
    line(11, 5, 0, 9);
    noStroke();
    fill(isBottom ? "#859b8e" : "#c4cfbf");
    triangle(-11, 5, 0, 9, -11, 11);
    triangle(11, 5, 0, 9, 11, 11);
  } else if (type === "leaf") {
    noStroke();
    fill(isBottom ? "#9db3a0" : "#b8d5a7");
    beginShape();
    vertex(-21, 0);
    bezierVertex(-7, -23, 15, -20, 21, -3);
    bezierVertex(12, 16, -8, 20, -21, 0);
    endShape(CLOSE);
    stroke(isBottom ? "#789888" : "#6d9b78");
    strokeWeight(1.5);
    line(-17, 2, 17, -4);
    line(-4, -1, -2, -10);
    line(5, -3, 10, -11);
  } else {
    noStroke();
    fill(isBottom ? "#b7ad83" : "#e8cb7c");
    ellipse(0, 0, 35, 35);
    fill(isBottom ? "#9d936d" : "#caa95d");
    ellipse(0, 0, 27, 27);
    noFill();
    stroke(isBottom ? "#d1c7a0" : "#f8e7aa");
    strokeWeight(1.5);
    ellipse(0, 0, 19, 19);
    noStroke();
    fill(isBottom ? "#d0c69e" : "#f7e7b3");
    ellipse(-5, -5, 4, 4);
  }
  pop();
}

function drawRipples() {
  noFill();
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    const p = (millis() - r.start) / 900;
    if (p >= 1) {
      ripples.splice(i, 1);
      continue;
    }
    const scale = r.scale ?? 1;
    const alpha = r.alpha ?? 1;
    stroke(225, 243, 231, 150 * (1 - p) * alpha);
    strokeWeight(1.5);
    ellipse(r.x, r.y, (12 + p * 80) * scale, (8 + p * 52) * scale);
    ellipse(r.x, r.y, (7 + p * 46) * scale, (5 + p * 29) * scale);
  }
  noStroke();
}

function drawPoolLabels() {
  fill(239, 245, 231, 210);
  textSize(max(10, pool.d * 0.024));
  text(t("wishes"), pool.x, pool.y + pool.d * 0.24);

  const surfaceCount = notes.filter(n => n.state === "surface").length;
  const bottomCount = notes.filter(n => n.state === "bottom").length;

  fill("#173e5c");
  textSize(max(11, pool.d * 0.012));

  const countY = min(height - 40, pool.y + pool.d * 0.5);

  text(
    tr("count", {
      a: surfaceCount,
      b: bottomCount
    }),
    width / 2,
    countY
  );
}

function updateAnimations() {
  const now = millis();
  animationItems = animationItems.filter(item => now - item.start < 700);
}

function mousePressed() {
  if (document.getElementById("modal-backdrop").classList.contains("hidden")) {
    const candidates = notes.map((note, i) => {
      const group = notes.filter(n => n.state === note.state);
      const idx = group.findIndex(n => n.id === note.id);
      const p = getNotePosition(note, idx, group.length, note.state === "bottom");
      const bob = note.state === "bottom" ? 0 : sin(frameCount * .035 + note.seed) * 3;
      return { note, x: p.x, y: p.y + bob };
    }).reverse();

    for (const c of candidates) {
      const hit = c.note.type === "coin" ? 25 : 29;
      if (dist(mouseX, mouseY, c.x, c.y) < hit) {
        pressedNote = c.note;
        dragStart = { x: mouseX, y: mouseY };
        dragOffset = { x: c.x - mouseX, y: c.y - mouseY };
        noteWasDragged = false;
        return false;
      }
    }

    if (dist(mouseX, mouseY, pool.x, pool.y) < pool.waterR) {
      ripples.push({ x: mouseX, y: mouseY, start: millis(), scale: .3, alpha: .35 });
      pressedNote = null;
      dragStart = { x: mouseX, y: mouseY };
      dragOffset = null;
      noteWasDragged = false;
      waterDragPrevious = { x: mouseX, y: mouseY };
      waterRipplePrevious = { x: mouseX, y: mouseY };
    }
  }
  return false;
}

function mouseDragged() {
  if (!dragStart || !document.getElementById("modal-backdrop").classList.contains("hidden")) {
    return false;
  }

  if (!noteWasDragged && dist(mouseX, mouseY, dragStart.x, dragStart.y) > 5) {
    noteWasDragged = true;
  }

  if (pressedNote && noteWasDragged) {
    const targetX = mouseX + dragOffset.x;
    const targetY = mouseY + dragOffset.y;
    setNotePosition(pressedNote, targetX, targetY);
  } else if (waterDragPrevious) {
    const deltaX = mouseX - waterDragPrevious.x;
    const deltaY = mouseY - waterDragPrevious.y;
    const influenceRadius = pool.waterR * .18;

    notes.filter(note => note.state === "surface").forEach(note => {
      const current = getNotePosition(note, notes.indexOf(note), notes.length, false);
      const distance = dist(current.x, current.y, waterDragPrevious.x, waterDragPrevious.y);
      if (distance > influenceRadius) return;

      const influence = 1 - distance / influenceRadius;
      setNotePosition(note, current.x + deltaX * influence * .45, current.y + deltaY * influence * .45);
    });

    if (waterRipplePrevious && dist(mouseX, mouseY, waterRipplePrevious.x, waterRipplePrevious.y) > 55) {
      ripples.push({ x: mouseX, y: mouseY, start: millis(), scale: .25, alpha: .3 });
      waterRipplePrevious = { x: mouseX, y: mouseY };
    }
  }

  waterDragPrevious = { x: mouseX, y: mouseY };
  return false;
}

function setNotePosition(note, x, y) {
  const normalizedX = (x - pool.x) / pool.waterR;
  const normalizedY = (y - pool.y) / pool.waterR;
  const ellipseDistance = sqrt(normalizedX * normalizedX + (normalizedY / .88) ** 2);
  const maxDistance = .86;
  const scaleFactor = ellipseDistance > maxDistance ? maxDistance / ellipseDistance : 1;

  note.position = {
    x: normalizedX * scaleFactor,
    y: normalizedY * scaleFactor
  };
}

function mouseReleased() {
  if (noteWasDragged) {
    saveNotes();
    ripples.push({ x: mouseX, y: mouseY, start: millis() });
  } else if (pressedNote) {
    openDetailModal(pressedNote.id);
  }

  pressedNote = null;
  dragStart = null;
  dragOffset = null;
  noteWasDragged = false;
  waterDragPrevious = null;
  waterRipplePrevious = null;
  return false;
}

function touchStarted() {
  // p5 routes touch through mousePressed; prevent mobile page scrolling on canvas.
  return false;
}

// -------------------- Data --------------------

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    notes = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(notes)) notes = [];
  } catch (e) {
    notes = [];
  }
  notes.forEach((n, i) => {
    if (!n.seed) n.seed = i * 13.7 + 2;
    if (n.angle === undefined) n.angle = i * 2.399;
    if (n.radial === undefined) n.radial = .25 + ((i * 37) % 60) / 100;
    if (!n.state) n.state = "surface";
    if (n.favorite === undefined) n.favorite = false;
  });
  storeLocalNotes();
}

function saveNotes() {
  storeLocalNotes();
}

function storeLocalNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  updateCount();
}

function updateCount() {
  const count = document.getElementById("recordCount");
  if (count) count.textContent = notes.length;
}

function makeId() {
  return "memo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function formatDate(time) {
  return new Date(time).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// -------------------- Modal helpers --------------------

function openModal(html) {
  document.getElementById("modal-content").innerHTML = html;
  document.getElementById("modal-backdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
  currentNoteId = null;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function openCreateModal() {
  currentNoteId = null;
  selectedType = "boat";
  openFormModal(false, null);
}

function openEditModal(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  currentNoteId = id;
  selectedType = note.type;
  openFormModal(true, note);
}

function openFormModal(isEdit, note) {
  const title = isEdit ? note.title : "";
  const content = isEdit ? note.content : "";
  const type = isEdit ? note.type : selectedType;
  openModal(`
    <p class="modal-eyebrow">${isEdit ? t("editEyebrow") : t("newEyebrow")}</p>
    <h2 class="modal-title">${isEdit ? t("editTitle") : t("newTitle")}</h2>
    <form id="memoForm">
      <label class="field-label" for="memoTitle">${t("titleLabel")}</label>
      <input class="text-field" id="memoTitle" maxlength="60" placeholder="${t("titlePlaceholder")}" value="${escapeHTML(title)}">
      <label class="field-label" for="memoContent">${t("contentLabel")}</label>
      <textarea class="text-area" id="memoContent" maxlength="1200" placeholder="${t("contentPlaceholder")}">${escapeHTML(content)}</textarea>
      <label class="field-label">${t("choose")}</label>
      <div class="type-grid">
        ${Object.keys(TYPES).map(key => `
          <button type="button" class="type-option ${key === type ? "selected" : ""}" data-type="${key}">
            <span class="type-emoji">${TYPES[key].emoji}</span>
            <span class="type-name">${TYPES[key].name}</span>
            <span class="type-desc">${TYPES[key].description}</span>
          </button>`).join("")}
      </div>
      <div class="modal-actions">
        <button type="button" class="secondary-btn" id="cancelForm">${t("cancel")}</button>
        <button type="submit" class="main-btn">${isEdit ? t("save") : t("toss")}</button>
      </div>
    </form>
  `);

  document.querySelectorAll(".type-option").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedType = btn.dataset.type;
      document.querySelectorAll(".type-option").forEach(b => b.classList.toggle("selected", b === btn));
    });
  });
  document.getElementById("cancelForm").addEventListener("click", closeModal);
  [document.getElementById("memoTitle"), document.getElementById("memoContent")].forEach(field => {
    field.addEventListener("pointerdown", () => field.focus());
  });
  document.getElementById("memoTitle").focus();
  document.getElementById("memoForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const titleInput = document.getElementById("memoTitle").value.trim();
    const contentInput = document.getElementById("memoContent").value.trim();
    if (!titleInput && !contentInput) {
  showToast(t("writeFirst"));
  document.getElementById("memoTitle").focus();
  return;
}

const finalTitle = titleInput || contentInput.slice(0, 18);
const finalContent = contentInput || titleInput;

    const now = Date.now();

    if (isEdit) {
      const target = notes.find(n => n.id === currentNoteId);
      if (!target) return;
      target.title = finalTitle;
target.content = finalContent;
      target.type = selectedType;
      target.updatedAt = now;
      saveNotes();
      closeModal();
      showToast(t("updated"));
    } else {
      const note = {
        id: makeId(),
        title: finalTitle,
content: finalContent,
        type: selectedType,
        createdAt: now,
        updatedAt: now,
        favorite: false,
        state: "surface",
        seed: Math.random() * 1000,
        angle: Math.random() * TWO_PI,
        radial: .22 + Math.random() * .5
      };
      notes.push(note);
      saveNotes();
      const target = getNotePosition(note, notes.filter(n => n.state === "surface").length - 1, notes.length, false);
      animationItems.push({ type: note.type, fromX: width / 2, fromY: 35, toX: target.x, toY: target.y, start: millis() });
      ripples.push({ x: target.x, y: target.y, start: millis() });
      closeModal();
      showToast(t("tossed"));
    }
  });
}

function openDetailModal(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  currentNoteId = id;
  const typeInfo = TYPES[note.type] || TYPES.boat;
  openModal(`
    <p class="modal-eyebrow">${typeInfo.name} · ${note.state === "bottom" ? t("bottomRecord") : t("surfaceRecord")}</p>
    <h2 class="modal-title">${typeInfo.emoji} ${escapeHTML(note.title)}</h2>
    <div class="detail-content">${escapeHTML(note.content)}</div>
    <div class="detail-meta">${t("created")} ${formatDate(note.createdAt)}${note.updatedAt !== note.createdAt ? " · " + t("modified") + " " + formatDate(note.updatedAt) : ""}</div>
    <div class="modal-actions">
      <button class="secondary-btn" id="editNote">${t("edit")}</button>
      <button class="secondary-btn" id="favoriteNote">${note.favorite ? t("favorited") : t("favorite")}</button>
      <button class="secondary-btn" id="toggleDepth">${note.state === "bottom" ? t("retrieve") : t("sink")}</button>
    </div>
    <div class="modal-actions">
      <button class="danger-btn" id="deleteNote">${t("dissolve")}</button>
      <button class="main-btn" id="putBack">${t("putBack")}</button>
    </div>
  `);
  document.getElementById("editNote").addEventListener("click", () => openEditModal(id));
  document.getElementById("favoriteNote").addEventListener("click", () => {
    note.favorite = !note.favorite;
    saveNotes();
    openDetailModal(id);
    showToast(note.favorite ? t("addedFavorite") : t("removedFavorite"));
  });
  document.getElementById("toggleDepth").addEventListener("click", () => {
    note.state = note.state === "bottom" ? "surface" : "bottom";
    saveNotes();
    ripples.push({ x: pool.x, y: pool.y, start: millis() });
    closeModal();
    showToast(note.state === "bottom" ? t("sunk") : t("retrieved"));
  });
  document.getElementById("deleteNote").addEventListener("click", () => confirmDelete(id));
  document.getElementById("putBack").addEventListener("click", () => {
    closeModal();
    ripples.push({ x: pool.x + random(-35, 35), y: pool.y + random(-25, 25), start: millis() });
    showToast(t("returned"));
  });
}

function confirmDelete(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;
  openModal(`
    <p class="modal-eyebrow">${t("letGo")}</p>
    <h2 class="modal-title">${t("dissolveQuestion")}</h2>
    <p class="detail-content">${t("cannotUndo")}</p>
    <div class="modal-actions">
      <button class="secondary-btn" id="keepNote">${t("think")}</button>
      <button class="danger-btn" id="confirmDissolve">${t("confirmDissolve")}</button>
    </div>
  `);
  document.getElementById("keepNote").addEventListener("click", () => openDetailModal(id));
  document.getElementById("confirmDissolve").addEventListener("click", () => {
    const p = getNotePosition(note, notes.indexOf(note), notes.length, note.state === "bottom");
    ripples.push({ x: p.x, y: p.y, start: millis() });
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    closeModal();
    showToast(t("dissolved"));
  });
}

function openListModal(filter) {
  listFilter = filter || "all";
  renderListModal();
}

function renderListModal() {
  let filtered = [...notes].sort((a, b) => b.createdAt - a.createdAt);
  if (listFilter === "boat" || listFilter === "leaf" || listFilter === "coin") filtered = filtered.filter(n => n.type === listFilter);
  if (listFilter === "favorite") filtered = filtered.filter(n => n.favorite);
  if (listFilter === "bottom") filtered = filtered.filter(n => n.state === "bottom");
  if (listFilter === "surface") filtered = filtered.filter(n => n.state === "surface");

  const filters = [
    ["all", t("allFilter")], ["boat", t("boat")], ["leaf", t("leaf")], ["coin", t("coin")],
    ["favorite", t("favoriteFilter")], ["bottom", t("bottomFilter")], ["surface", t("surfaceFilter")]
  ];
  openModal(`
    <p class="modal-eyebrow">${t("archive")}</p>
    <h2 class="modal-title">${t("allTitle")} <span style="font-size:13px;color:#8a9b93;font-weight:500;">${filtered.length}</span></h2>
    <div class="list-tools">
      ${filters.map(([key, label]) => `<button class="filter-btn ${listFilter === key ? "active" : ""}" data-filter="${key}">${label}</button>`).join("")}
    </div>
    <div class="record-list">
      ${filtered.length ? filtered.map(n => `
        <button class="record-row" data-note-id="${n.id}">
          <span class="record-icon">${TYPES[n.type]?.emoji || "⛵"}</span>
          <span class="record-info">
            <span class="record-name">${escapeHTML(n.title)} ${n.favorite ? "★" : ""}</span>
            <span class="record-preview">${escapeHTML(n.content)}</span>
          </span>
          <span class="record-state">${n.state === "bottom" ? t("bottomFilter") : t("surfaceFilter")}</span>
        </button>`).join("") : `<div class="empty-state">${t("empty")}</div>`}
    </div>
    <div class="modal-actions">
      <button class="secondary-btn" id="listClose">${t("backPool")}</button>
      <button class="main-btn" id="listCreate">${t("new")}</button>
    </div>
  `);
  document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => {
    listFilter = btn.dataset.filter;
    renderListModal();
  }));
  document.querySelectorAll("[data-note-id]").forEach(btn => btn.addEventListener("click", () => openDetailModal(btn.dataset.noteId)));
  document.getElementById("listClose").addEventListener("click", closeModal);
  document.getElementById("listCreate").addEventListener("click", openCreateModal);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
