/**
 * Deepwatch Aquarium - browser version for GitHub Pages
 * Same ideas as game.py, drawn with HTML5 Canvas.
 */

const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 600;

const TURTLE_MOVE_TIME = 20.0;
const SHARK_MOVE_TIME = 20.0;
const SECONDS_PER_HOUR = 20.0;
const GLITCH_TIME = 0.5;
const NEWSPAPER_SECONDS = 3.0;
const TWELVE_AM_SECONDS = 2.0;
const NEWSPAPER_TILT = -5;
const PAPER_GRAY = [228, 226, 220];

const CAMERAS = [
  ["CAM 1 Lobby", "lobby.png"],
  ["CAM 2 Gift Shop", "gift_shop.png"],
  ["CAM 3 Reef", "tropical_reef.png"],
  ["CAM 4 Shark Tunnel", "shark_tunnel.png"],
  ["CAM 5 Jellyfish", "jellyfish_room.png"],
  ["CAM 6 Tide Pool", "tide_pool.png"],
  ["CAM 7 Staff Hall", "staff_hall.png"],
  ["CAM 8 Controls", "controls_room.png"],
  ["CAM 9 Drain Hub", "drain_hub.png"],
  ["CAM 10 Filter", "filter_room.png"],
  ["CAM 11 Penguin", "penguin_cove.png"],
  ["CAM 12 Kelp", "kelp_forest.png"],
  ["CAM 13 Ray Bay", "ray_bay.png"],
  ["CAM 14 Cafe", "cafe.png"],
  ["CAM 15 Storage", "storage.png"],
  ["CAM 16 Deep Tank", "deep_tank.png"],
];

// short name, camera index (null = office), x, y, w, h
const MAP_ROOMS = [
  ["Cafe", 13, 20, 40, 64, 32],
  ["Kelp", 11, 200, 40, 64, 32],
  ["Penguin", 10, 290, 40, 64, 32],
  ["Gift", 1, 20, 95, 64, 32],
  ["Lobby", 0, 110, 95, 64, 32],
  ["Reef", 2, 200, 95, 64, 32],
  ["Ray", 12, 290, 95, 64, 32],
  ["Storage", 14, 20, 150, 64, 32],
  ["Hall", 6, 110, 150, 64, 32],
  ["Shark", 3, 200, 150, 64, 32],
  ["Filter", 9, 290, 150, 64, 32],
  ["Tide", 5, 20, 205, 64, 32],
  ["Office", null, 110, 205, 64, 32],
  ["Drain", 8, 290, 205, 64, 32],
  ["Jelly", 4, 20, 260, 64, 32],
  ["Controls", 7, 110, 260, 64, 32],
  ["Deep", 15, 200, 260, 64, 32],
];

const MAP_LINKS = [
  ["Lobby", "Gift"],
  ["Lobby", "Reef"],
  ["Gift", "Cafe"],
  ["Gift", "Storage"],
  ["Storage", "Tide"],
  ["Storage", "Hall"],
  ["Tide", "Jelly"],
  ["Tide", "Hall"],
  ["Jelly", "Controls"],
  ["Reef", "Kelp"],
  ["Reef", "Shark"],
  ["Kelp", "Penguin"],
  ["Kelp", "Ray"],
  ["Ray", "Penguin"],
  ["Ray", "Shark"],
  ["Shark", "Hall"],
  ["Shark", "Filter"],
  ["Shark", "Deep"],
  ["Penguin", "Filter"],
  ["Filter", "Deep"],
  ["Filter", "Drain"],
  ["Deep", "Drain"],
  ["Hall", "Office"],
];

const DRAIN_LINKS = [
  ["Drain", "Office"],
  ["Drain", "Shark"],
  ["Drain", "Tide"],
  ["Drain", "Filter"],
  ["Drain", "Jelly"],
  ["Drain", "Deep"],
  ["Drain", "Ray"],
  ["Drain", "Kelp"],
  ["Drain", "Penguin"],
];

const DRAIN_MAP_LINKS = [
  ["Cafe", "Gift"],
  ["Kelp", "Penguin"],
  ["Kelp", "Reef"],
  ["Penguin", "Ray"],
  ["Gift", "Lobby"],
  ["Lobby", "Reef"],
  ["Reef", "Ray"],
  ["Gift", "Storage"],
  ["Lobby", "Hall"],
  ["Reef", "Shark"],
  ["Ray", "Filter"],
  ["Storage", "Hall"],
  ["Hall", "Shark"],
  ["Shark", "Filter"],
  ["Storage", "Tide"],
  ["Hall", "Office"],
  ["Shark", "Deep"],
  ["Filter", "Drain"],
  ["Tide", "Office"],
  ["Office", "Deep"],
  ["Deep", "Drain"],
  ["Tide", "Jelly"],
  ["Office", "Controls"],
  ["Deep", "Controls"],
  ["Jelly", "Controls"],
  ["Penguin", "Filter"],
];

const NEWSPAPER_FILLER =
  "Blah. Blah. Blah, Blah. Blah. This ad has nothing to do with anything " +
  "relevant to the game. Blah. Blah. Blah. Blah. Blah. Chances are you " +
  "won't make it past Night 3. Blah. Blah. Yackity Smackity. Blah. Blah. " +
  "This probably isn't the best choice of a summer job, since you most " +
  "likely won't survive the week. I'd recommend being a cashier, sack boy, " +
  "or work in a warehouse. They are all very respectable jobs, and you " +
  "probably won't get chased by fish in them. Well, you might. But it would " +
  "be unlikely. Blah. Blah. ";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw an image scaled to size, then darken it a little for night. */
function drawDarkImage(targetCtx, image, x, y, width, height) {
  targetCtx.drawImage(image, x, y, width, height);
  targetCtx.fillStyle = "rgba(0, 0, 0, 0.27)";
  targetCtx.fillRect(x, y, width, height);
}

function makeButton(text, x, y, width, height) {
  return { text, x, y, width, height };
}

function pointInButton(button, mx, my) {
  return (
    mx >= button.x &&
    mx <= button.x + button.width &&
    my >= button.y &&
    my <= button.y + button.height
  );
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawButton(button, options) {
  const selected = options && options.selected;
  const danger = options && options.danger;
  const transparent = options && options.transparent;
  let color = "rgb(50, 80, 100)";
  if (selected) color = "rgb(70, 140, 90)";
  if (danger) color = "rgb(140, 60, 60)";

  ctx.save();
  if (transparent) ctx.globalAlpha = 0.55;
  roundRect(ctx, button.x, button.y, button.width, button.height, 8);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgb(180, 210, 220)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgb(240, 245, 250)";
  ctx.font = "20px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(button.text, button.x + 10, button.y + button.height / 2);
}

function buildNeighbors(links) {
  const neighbors = {};
  for (const [a, b] of links) {
    if (!neighbors[a]) neighbors[a] = [];
    if (!neighbors[b]) neighbors[b] = [];
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  return neighbors;
}

const LAND_NEIGHBORS = buildNeighbors(MAP_LINKS);
const DRAIN_NEIGHBORS = buildNeighbors(DRAIN_LINKS);

function findRoom(name) {
  return MAP_ROOMS.find((room) => room[0] === name) || null;
}

function roomCenter(room) {
  const [, , x, y, w, h] = room;
  return [x + w / 2, y + h / 2];
}

function roomEdgePoint(room, towardPoint) {
  const [cx, cy] = roomCenter(room);
  const [, , x, y, w, h] = room;
  const left = x;
  const top = y;
  const right = x + w;
  const bottom = y + h;
  const dx = towardPoint[0] - cx;
  const dy = towardPoint[1] - cy;
  if (dx === 0 && dy === 0) return [cx, cy];

  let tX = 1e9;
  let tY = 1e9;
  if (dx > 0) tX = (right - cx) / dx;
  else if (dx < 0) tX = (left - cx) / dx;
  if (dy > 0) tY = (bottom - cy) / dy;
  else if (dy < 0) tY = (top - cy) / dy;

  const t = Math.min(tX, tY);
  return [cx + dx * t, cy + dy * t];
}

function moveThreat(room, neighbors) {
  const choices = (neighbors[room] || []).slice();
  choices.push(room);
  return choices[Math.floor(Math.random() * choices.length)];
}

function moveShark(sharkRoom, drainClosed) {
  const choices = (DRAIN_NEIGHBORS[sharkRoom] || []).slice();
  if (drainClosed) {
    const i = choices.indexOf("Office");
    if (i >= 0) choices.splice(i, 1);
  }
  choices.push(sharkRoom);
  return choices[Math.floor(Math.random() * choices.length)];
}

function wrapFillerLines(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (test.length <= maxChars) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function makeNewspaperPage() {
  const width = 1400;
  const height = 900;
  const page = document.createElement("canvas");
  page.width = width;
  page.height = height;
  const p = page.getContext("2d");

  p.fillStyle = `rgb(${PAPER_GRAY.join(",")})`;
  p.fillRect(0, 0, width, height);
  for (let i = 0; i < 3000; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const d = Math.floor(Math.random() * 27) - 16;
    const shade = Math.max(0, Math.min(255, PAPER_GRAY[0] + d));
    p.fillStyle = `rgb(${shade},${shade},${shade})`;
    p.fillRect(x, y, 1, 1);
  }

  const filler = (NEWSPAPER_FILLER.repeat(6));
  const fillerLines = wrapFillerLines(filler, 28);
  const colWidth = 205;
  const colGap = 28;
  p.font = "14px Courier New, Courier, monospace";
  p.fillStyle = "rgb(108, 106, 102)";
  let col = 30;
  let colIndex = 0;
  while (col < width - colWidth) {
    let y = 20;
    let lineIndex = colIndex * 7;
    while (y < height - 10) {
      const line = fillerLines[lineIndex % fillerLines.length];
      p.fillText(line, col, y);
      y += 13;
      lineIndex += 1;
    }
    const ruleX = col + colWidth + colGap / 2;
    p.strokeStyle = "rgb(168, 166, 161)";
    p.beginPath();
    p.moveTo(ruleX, 20);
    p.lineTo(ruleX, height - 20);
    p.stroke();
    col += colWidth + colGap;
    colIndex += 1;
  }

  // blur filler by scaling down and up
  const small = document.createElement("canvas");
  small.width = Math.floor(width / 3);
  small.height = Math.floor(height / 3);
  small.getContext("2d").drawImage(page, 0, 0, small.width, small.height);
  p.clearRect(0, 0, width, height);
  p.imageSmoothingEnabled = true;
  p.drawImage(small, 0, 0, width, height);

  const adW = 500;
  const adH = 450;
  const adX = (width - adW) / 2;
  const adY = (height - adH) / 2;
  p.fillStyle = "rgb(242, 240, 235)";
  p.fillRect(adX, adY, adW, adH);
  p.strokeStyle = "rgb(25, 25, 25)";
  p.lineWidth = 7;
  p.strokeRect(adX, adY, adW, adH);

  p.fillStyle = "rgb(15, 15, 15)";
  p.font = "bold 48px Courier New, Courier, monospace";
  p.textAlign = "center";
  p.fillText("HELP WANTED", width / 2, adY + 60);
  p.font = "22px Courier New, Courier, monospace";
  p.fillText("Deepwatch Aquarium", width / 2, adY + 115);

  const adLines = [
    "Family aquarium looking for security",
    "guard to work the nightshift.",
    "12 am to 6am.",
    "",
    "Monitor cameras, ensure safety of",
    "equipment and sea exhibits.",
    "",
    "Not responsible for soggy shoes",
    "or runaway crabs.",
    "",
    "$120 a week.",
    "To apply, call:",
    "1-888-DEEP-FISH",
  ];
  let y = adY + 160;
  p.font = "20px Courier New, Courier, monospace";
  p.fillStyle = "rgb(20, 20, 20)";
  for (const line of adLines) {
    if (line === "") {
      y += 14;
      continue;
    }
    p.fillText(line, width / 2, y);
    y += 24;
  }
  p.textAlign = "left";

  for (let i = 0; i < 1400; i++) {
    const gx = Math.floor(Math.random() * width);
    const gy = Math.floor(Math.random() * height);
    const d = Math.floor(Math.random() * 41) - 25;
    const pixel = p.getImageData(gx, gy, 1, 1).data;
    const r = Math.max(0, Math.min(255, pixel[0] + d));
    const g = Math.max(0, Math.min(255, pixel[1] + d));
    const b = Math.max(0, Math.min(255, pixel[2] + d));
    p.fillStyle = `rgb(${r},${g},${b})`;
    p.fillRect(gx, gy, 1, 1);
  }

  return page;
}

function drawNewspaper(newspaperPage) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.save();
  ctx.translate(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  ctx.rotate((NEWSPAPER_TILT * Math.PI) / 180);
  ctx.drawImage(newspaperPage, -newspaperPage.width / 2, -newspaperPage.height / 2);
  ctx.restore();

  for (let i = 0; i < 45; i++) {
    const alpha = (55 * (1 - i / 45)) / 255;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.strokeRect(i, i, SCREEN_WIDTH - i * 2, SCREEN_HEIGHT - i * 2);
  }
}

function drawCameraGlitch() {
  for (let i = 0; i < 50; i++) {
    const y = Math.floor(Math.random() * SCREEN_HEIGHT);
    const h = 1 + Math.floor(Math.random() * 10);
    const shade = 30 + Math.floor(Math.random() * 200);
    const alpha = (100 + Math.floor(Math.random() * 100)) / 255;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
    ctx.fillRect(0, y, SCREEN_WIDTH, h);
  }
  for (let i = 0; i < 15; i++) {
    const w = 20 + Math.floor(Math.random() * 100);
    const h = 8 + Math.floor(Math.random() * 32);
    const x = Math.floor(Math.random() * (SCREEN_WIDTH - w));
    const y = Math.floor(Math.random() * (SCREEN_HEIGHT - h));
    const shade = Math.floor(Math.random() * 256);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},0.63)`;
    ctx.fillRect(x, y, w, h);
  }
}

function drawTitleStatic(amount) {
  for (let i = 0; i < amount; i++) {
    const y = Math.floor(Math.random() * SCREEN_HEIGHT);
    const h = 1 + Math.floor(Math.random() * 3);
    const shade = Math.floor(Math.random() * 256);
    const alpha = (20 + Math.floor(Math.random() * 50)) / 255;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
    ctx.fillRect(0, y, SCREEN_WIDTH, h);
  }
}

function drawTitleScreen(titleBg, titleTimer) {
  let shakeX = 0;
  let shakeY = 0;
  if (Math.random() < 0.15) {
    shakeX = Math.floor(Math.random() * 9) - 4;
    shakeY = Math.floor(Math.random() * 5) - 2;
  }
  drawDarkImage(ctx, titleBg, shakeX, shakeY, SCREEN_WIDTH, SCREEN_HEIGHT);

  ctx.fillStyle = "rgba(0, 0, 0, 0.69)";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.fillStyle = "rgba(0, 0, 0, 0.31)";
  ctx.fillRect(0, 0, 420, SCREEN_HEIGHT);

  for (let y = 0; y < SCREEN_HEIGHT; y += 3) {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCREEN_WIDTH, y);
    ctx.stroke();
  }

  drawTitleStatic(35);
  if (Math.random() < 0.12) drawCameraGlitch();
  if (Math.random() < 0.03) {
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  ctx.fillStyle = "rgb(230,230,230)";
  ctx.font = "bold 52px sans-serif";
  if (Math.random() < 0.1) {
    const jitter = Math.floor(Math.random() * 11) - 5;
    ctx.fillText("5 Nights at", 70 + jitter, 120);
    ctx.fillText("Deepwatch", 70 - jitter, 175);
  } else {
    ctx.fillText("5 Nights at", 70, 120);
    ctx.fillText("Deepwatch", 70, 175);
  }

  const blinkOn = Math.floor(titleTimer * 3) % 2 === 0;
  const arrow = blinkOn ? ">>" : "  ";
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "rgb(240,240,240)";
  ctx.fillText(arrow + " New Game", 80, 310);
  ctx.fillStyle = "rgb(90,90,90)";
  ctx.fillText("   Continue", 80, 360);

  ctx.fillStyle = "rgb(120,120,120)";
  ctx.font = "16px sans-serif";
  ctx.fillText("Survive until 6 AM", 80, 555);
}

function drawMap(mapRect, currentCam, sharkRoom, showDrains) {
  ctx.save();
  ctx.translate(mapRect.x, mapRect.y);

  const titleText = showDrains ? "MAP - DRAINS" : "MAP - DOORS";
  const linkList = showDrains ? DRAIN_MAP_LINKS : MAP_LINKS;
  const lineColor = showDrains ? "rgba(255,60,60,0.9)" : "rgba(255,255,255,0.86)";

  ctx.fillStyle = "rgb(255,255,255)";
  ctx.font = "22px sans-serif";
  ctx.fillText(titleText, 20, 24);

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  for (const [startName, endName] of linkList) {
    const start = findRoom(startName);
    const end = findRoom(endName);
    if (!start || !end) continue;
    const startCenter = roomCenter(start);
    const endCenter = roomCenter(end);
    const a = roomEdgePoint(start, endCenter);
    const b = roomEdgePoint(end, startCenter);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }

  for (const [, camIndex, x, y, w, h] of MAP_ROOMS) {
    ctx.strokeStyle = "rgba(255,255,255,0.86)";
    ctx.lineWidth = camIndex === currentCam ? 3 : 2;
    roundRect(ctx, x, y, w, h, 6);
    ctx.stroke();
  }

  const shark = findRoom(sharkRoom);
  if (shark) {
    const [cx, cy] = roomCenter(shark);
    ctx.fillStyle = "rgba(60,140,220,0.9)";
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgb(255,255,255)";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [name, , x, y, w, h] of MAP_ROOMS) {
    const label = name === "Office" ? "You" : name;
    ctx.fillText(label, x + w / 2, y + h / 2);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function mapClickToCamera(mx, my, mapRect) {
  for (const [, camIndex, x, y, w, h] of MAP_ROOMS) {
    if (camIndex === null) continue;
    const left = mapRect.x + x;
    const top = mapRect.y + y;
    if (mx >= left && mx <= left + w && my >= top && my <= top + h) {
      return camIndex;
    }
  }
  return null;
}

function drawOxygenBar(x, y, width, height, oxygen) {
  ctx.fillStyle = "rgb(200,220,230)";
  ctx.font = "16px sans-serif";
  ctx.fillText("OXYGEN", x, y - 8);

  roundRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = "rgb(30,40,50)";
  ctx.fill();
  ctx.strokeStyle = "rgb(180,210,220)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const fillWidth = Math.floor((width - 4) * (oxygen / 100));
  if (fillWidth > 0) {
    let fillColor = "rgb(60,160,180)";
    if (oxygen <= 40) fillColor = "rgb(200,160,50)";
    if (oxygen <= 20) fillColor = "rgb(200,70,70)";
    roundRect(ctx, x + 2, y + 2, fillWidth, height - 4, 4);
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
}

function hourLabel(hoursPastMidnight) {
  const hour = Math.floor(hoursPastMidnight);
  if (hour <= 0) return "12 AM";
  if (hour >= 6) return "6 AM";
  return hour + " AM";
}

function drawClock(hoursPastMidnight, x, y) {
  ctx.fillStyle = "rgb(230,240,255)";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(hourLabel(hoursPastMidnight), x, y);
}

function canvasMousePos(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

async function main() {
  const titleBg = await loadImage("images/lobby.png");
  const officeImage = await loadImage("images/office.png");
  const cameraImages = [];
  for (const [, filename] of CAMERAS) {
    cameraImages.push(await loadImage("images/" + filename));
  }
  const newspaperPage = makeNewspaperPage();

  let mode = "instructions";
  let titleTimer = 0;
  let newspaperTimer = 0;
  let twelveAmTimer = 0;
  let camerasOpen = false;
  let currentCam = 0;
  let drainClosed = false;
  let oxygen = 100;
  let turtleRoom = "Gift";
  let turtleTimer = 0;
  let sharkRoom = "Shark";
  let sharkTimer = 0;
  let showDrainMap = false;
  let nightHours = 0;
  let glitchTimer = 0;

  const openCamsButton = makeButton("CAMERAS", 780, 500, 180, 50);
  const closeCamsButton = makeButton("CLOSE CAMS", 800, 540, 170, 45);
  const mapModeButton = makeButton("SHOW DRAINS", 600, 360, 180, 40);
  const drainButton = makeButton("CLOSE DRAIN", 20, 500, 180, 50);
  const tryAgainButton = makeButton("TRY AGAIN", 400, 400, 200, 50);
  const startButton = makeButton("New Game", 70, 270, 250, 50);
  const playAgainButton = makeButton("PLAY AGAIN", 400, 400, 200, 50);
  const oxygenBar = { x: 20, y: 560, width: 180, height: 22 };
  const mapRect = { x: 580, y: 20, width: 400, height: 330 };

  function resetNight() {
    camerasOpen = false;
    currentCam = 0;
    drainClosed = false;
    oxygen = 100;
    turtleRoom = "Gift";
    turtleTimer = 0;
    sharkRoom = "Shark";
    sharkTimer = 0;
    showDrainMap = false;
    nightHours = 0;
    glitchTimer = 0;
  }

  canvas.addEventListener("click", (event) => {
    const { x: mx, y: my } = canvasMousePos(event);

    if (mode === "instructions") {
      if (pointInButton(startButton, mx, my)) {
        resetNight();
        newspaperTimer = 0;
        mode = "newspaper";
      }
    } else if (mode === "newspaper") {
      twelveAmTimer = 0;
      mode = "twelve_am";
    } else if (mode === "twelve_am") {
      mode = "playing";
    } else if (mode === "game_over") {
      if (pointInButton(tryAgainButton, mx, my)) {
        resetNight();
        twelveAmTimer = 0;
        mode = "twelve_am";
      }
    } else if (mode === "win") {
      if (pointInButton(playAgainButton, mx, my)) {
        mode = "instructions";
      }
    } else if (mode === "playing") {
      if (camerasOpen) {
        if (pointInButton(closeCamsButton, mx, my)) camerasOpen = false;
        if (pointInButton(mapModeButton, mx, my)) showDrainMap = !showDrainMap;
        const clicked = mapClickToCamera(mx, my, mapRect);
        if (clicked !== null) currentCam = clicked;
      } else {
        if (pointInButton(drainButton, mx, my)) drainClosed = !drainClosed;
        if (pointInButton(openCamsButton, mx, my)) camerasOpen = true;
      }
    }
  });

  let lastTime = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (mode === "instructions") titleTimer += dt;

    if (mode === "newspaper") {
      newspaperTimer += dt;
      if (newspaperTimer >= NEWSPAPER_SECONDS) {
        twelveAmTimer = 0;
        mode = "twelve_am";
      }
    }

    if (mode === "twelve_am") {
      twelveAmTimer += dt;
      if (twelveAmTimer >= TWELVE_AM_SECONDS) mode = "playing";
    }

    if (mode === "playing") {
      nightHours += dt / SECONDS_PER_HOUR;
      if (nightHours >= 6) {
        nightHours = 6;
        mode = "win";
      }

      if (drainClosed) oxygen -= 3 * dt;
      else oxygen += 8 * dt;
      oxygen = Math.max(0, Math.min(100, oxygen));
      if (oxygen <= 0) mode = "game_over";

      if (glitchTimer > 0) glitchTimer -= dt;

      turtleTimer += dt;
      if (turtleTimer >= TURTLE_MOVE_TIME) {
        turtleTimer = 0;
        const oldRoom = turtleRoom;
        turtleRoom = moveThreat(turtleRoom, LAND_NEIGHBORS);
        if (turtleRoom !== oldRoom) glitchTimer = GLITCH_TIME;
      }

      sharkTimer += dt;
      if (sharkTimer >= SHARK_MOVE_TIME) {
        sharkTimer = 0;
        const oldRoom = sharkRoom;
        sharkRoom = moveShark(sharkRoom, drainClosed);
        if (sharkRoom !== oldRoom) glitchTimer = GLITCH_TIME;
      }
    }

    drainButton.text = drainClosed ? "OPEN DRAIN" : "CLOSE DRAIN";
    mapModeButton.text = showDrainMap ? "SHOW DOORS" : "SHOW DRAINS";

    ctx.fillStyle = "rgb(15,20,30)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (mode === "instructions") {
      drawTitleScreen(titleBg, titleTimer);
    } else if (mode === "newspaper") {
      drawNewspaper(newspaperPage);
    } else if (mode === "twelve_am") {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      if (Math.random() < 0.7) drawTitleStatic(25);
      ctx.fillStyle = "rgb(230,230,230)";
      ctx.font = "bold 80px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("12 AM", SCREEN_WIDTH / 2, 280);
      ctx.fillStyle = "rgb(160,160,160)";
      ctx.font = "28px sans-serif";
      ctx.fillText("Night 1", SCREEN_WIDTH / 2, 340);
      ctx.textAlign = "left";
    } else if (mode === "game_over") {
      ctx.fillStyle = "rgb(10,15,25)";
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgb(230,240,255)";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("You Ran Out Of Air.", SCREEN_WIDTH / 2, 230);
      ctx.fillStyle = "rgb(220,80,80)";
      ctx.fillText("GAME OVER", SCREEN_WIDTH / 2, 280);
      ctx.fillStyle = "rgb(160,180,190)";
      ctx.font = "22px sans-serif";
      ctx.fillText("Click TRY AGAIN to restart.", SCREEN_WIDTH / 2, 340);
      ctx.textAlign = "left";
      drawButton(tryAgainButton, { danger: true });
    } else if (mode === "win") {
      ctx.fillStyle = "rgb(15,30,40)";
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgb(230,240,255)";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText("6 AM", SCREEN_WIDTH / 2, 200);
      ctx.fillStyle = "rgb(100,210,140)";
      ctx.fillText("Night 1 Complete!", SCREEN_WIDTH / 2, 255);
      ctx.fillStyle = "rgb(160,180,190)";
      ctx.font = "22px sans-serif";
      ctx.fillText("Click PLAY AGAIN to start over.", SCREEN_WIDTH / 2, 320);
      ctx.textAlign = "left";
      drawButton(playAgainButton, { selected: true });
    } else if (mode === "playing" && camerasOpen) {
      drawDarkImage(ctx, cameraImages[currentCam], 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      if (glitchTimer > 0) {
        drawCameraGlitch();
      } else {
        const turtleData = findRoom(turtleRoom);
        if (turtleData && turtleData[1] === currentCam) {
          ctx.fillStyle = "rgb(80,200,90)";
          ctx.beginPath();
          ctx.arc(SCREEN_WIDTH / 2 - 50, SCREEN_HEIGHT / 2, 40, 0, Math.PI * 2);
          ctx.fill();
        }
        const sharkData = findRoom(sharkRoom);
        if (sharkData && sharkData[1] === currentCam) {
          ctx.fillStyle = "rgb(60,140,220)";
          ctx.beginPath();
          ctx.arc(SCREEN_WIDTH / 2 + 50, SCREEN_HEIGHT / 2, 40, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawMap(mapRect, currentCam, sharkRoom, showDrainMap);
      drawButton(mapModeButton, { selected: showDrainMap, transparent: true });
      drawButton(closeCamsButton, { transparent: true });
      drawClock(nightHours, 20, 45);
    } else if (mode === "playing") {
      drawDarkImage(ctx, officeImage, 150, 40, 700, 400);
      ctx.fillStyle = "rgb(220,240,255)";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("Night Guard Office", 20, 45);
      drawClock(nightHours, 850, 45);

      if (turtleRoom === "Office") {
        ctx.fillStyle = "rgb(80,200,90)";
        ctx.beginPath();
        ctx.arc(430, 240, 50, 0, Math.PI * 2);
        ctx.fill();
      }
      if (sharkRoom === "Office") {
        ctx.fillStyle = "rgb(60,140,220)";
        ctx.beginPath();
        ctx.arc(560, 240, 50, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgb(160,180,190)";
      ctx.font = "20px sans-serif";
      ctx.fillText("Click CAMERAS to check the aquarium.", 20, 475);
      drawButton(openCamsButton);
      drawButton(drainButton, { danger: drainClosed });
      drawOxygenBar(
        oxygenBar.x,
        oxygenBar.y,
        oxygenBar.width,
        oxygenBar.height,
        oxygen
      );
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main().catch((err) => {
  console.error(err);
  ctx.fillStyle = "#100";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.fillStyle = "#faa";
  ctx.font = "22px sans-serif";
  ctx.fillText("Could not load images. Check the images/ folder.", 40, 80);
});
