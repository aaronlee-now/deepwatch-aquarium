/**
 * Deepwatch Aquarium — main game (browser / GitHub Pages)
 * HTML5 Canvas version. The old Python game.py is deprecated.
 */

const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 600;

// bump this when you ship an update (matches game.js?v= in index.html)
const GAME_VERSION = 24;

const TURTLE_MOVE_TIME = 20.0;
const SHARK_MOVE_TIME = 20.0;
const CRAB_MOVE_TIME = 14.0;
const OCTOPUS_MOVE_TIME = 16.0;
const RAY_MOVE_TIME = 12.0;
const SECONDS_PER_HOUR = 20.0;
const GLITCH_TIME = 0.5;
const SOUND_COOLDOWN = 3.5;
const SOUND_IGNORE_CHANCE = 0.35;
// seconds to crawl in from a next-door room if you only play sound once
const SOUND_PULL_SECONDS = 6.0;
// each successful sound while dragging bumps them farther in
const SOUND_PULL_BOOST = 0.3;
const NEWSPAPER_SECONDS = 3.0;
const TWELVE_AM_SECONDS = 2.0;
// threat in office while you're on cams — animals mess with the controls
const CAMERA_HIJACK_SECONDS = 20.0;
// after you pick a cam, hijack waits this long then flips to a random one
const HIJACK_CAM_SWITCH_MIN = 0.8;
const HIJACK_CAM_SWITCH_MAX = 2.8;
const JUMPSCARE_SECONDS = 2.2;
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
  ["Cafe", 13, 12, 28, 84, 40],
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
    // cache-bust so new room art shows after refresh
    img.src = src + (src.includes("?") ? "&" : "?") + "v=ray1";
  });
}

/** Draw an image scaled to size. Slight night tint only. */
function drawDarkImage(targetCtx, image, x, y, width, height) {
  targetCtx.drawImage(image, x, y, width, height);
  targetCtx.fillStyle = "rgba(0, 0, 0, 0.08)";
  targetCtx.fillRect(x, y, width, height);
}

/** Draw a threat sprite centered on x,y. */
function drawThreatSprite(targetCtx, image, centerX, centerY, width) {
  const height = width * (image.height / image.width);
  targetCtx.drawImage(
    image,
    centerX - width / 2,
    centerY - height / 2,
    width,
    height
  );
}

/** Draw the scary shark sprite centered on x,y. */
function drawSharkSprite(targetCtx, image, centerX, centerY, width) {
  drawThreatSprite(targetCtx, image, centerX, centerY, width);
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

/** Octopus can sneak on doors AND drains. */
function mergeNeighbors(land, drain) {
  const merged = {};
  const keys = new Set([...Object.keys(land), ...Object.keys(drain)]);
  for (const key of keys) {
    merged[key] = [...(land[key] || [])];
    for (const n of drain[key] || []) {
      if (!merged[key].includes(n)) merged[key].push(n);
    }
  }
  return merged;
}

const OCTO_NEIGHBORS = mergeNeighbors(LAND_NEIGHBORS, DRAIN_NEIGHBORS);

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

function moveOctopus(octoRoom, drainClosed) {
  const choices = (OCTO_NEIGHBORS[octoRoom] || []).slice();
  if (drainClosed) {
    const i = choices.indexOf("Office");
    if (i >= 0) choices.splice(i, 1);
  }
  choices.push(octoRoom);
  return choices[Math.floor(Math.random() * choices.length)];
}

function cameraToRoomName(camIndex) {
  for (const [name, cam] of MAP_ROOMS) {
    if (cam === camIndex) return name;
  }
  return null;
}

/**
 * Move one room closer to the target along the shortest path.
 * Far animals need several PLAY SOUND clicks to get next door.
 */
function nextRoomToward(fromRoom, targetRoom, neighbors, blockedRooms) {
  if (fromRoom === targetRoom) return fromRoom;

  const blocked = blockedRooms || [];
  const queue = [fromRoom];
  const cameFrom = new Map();
  cameFrom.set(fromRoom, null);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === targetRoom) break;
    for (const next of neighbors[current] || []) {
      if (blocked.includes(next)) continue;
      if (cameFrom.has(next)) continue;
      cameFrom.set(next, current);
      queue.push(next);
    }
  }

  if (!cameFrom.has(targetRoom)) return fromRoom;

  let step = targetRoom;
  while (cameFrom.get(step) !== fromRoom) {
    step = cameFrom.get(step);
    if (step == null) return fromRoom;
  }
  return step;
}

function roomsAreNeighbors(a, b, neighbors) {
  return (neighbors[a] || []).includes(b);
}

/**
 * Try to lure one threat toward the camera room.
 * Far: one room hop. Next door: start / boost a slow crawl.
 * Returns { room, pull, reacted }.
 */
function tryLureThreat(room, pull, target, neighbors, blockedRooms) {
  const blocked = blockedRooms || [];
  if (blocked.includes(target) && room !== target) {
    return { room, pull, reacted: false };
  }

  // already crawling into this camera — extra sound pulls harder
  if (pull && pull.to === target && pull.from === room) {
    return {
      room,
      pull: {
        from: pull.from,
        to: pull.to,
        progress: Math.min(1, pull.progress + SOUND_PULL_BOOST),
      },
      reacted: true,
    };
  }

  // next door: begin a slow drag into the room
  if (roomsAreNeighbors(room, target, neighbors) && !blocked.includes(target)) {
    return {
      room,
      pull: {
        from: room,
        to: target,
        progress: SOUND_PULL_BOOST * 0.4,
      },
      reacted: true,
    };
  }

  // farther away: walk one room closer first
  const next = nextRoomToward(room, target, neighbors, blocked);
  if (next !== room) {
    return { room: next, pull: null, reacted: true };
  }

  return { room, pull: null, reacted: false };
}

function updatePull(room, pull, dt) {
  if (!pull) return { room, pull: null };
  const progress = pull.progress + dt / SOUND_PULL_SECONDS;
  if (progress >= 1) {
    return { room: pull.to, pull: null };
  }
  return {
    room,
    pull: { from: pull.from, to: pull.to, progress },
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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

function threatEntersOffice(oldRoom, newRoom) {
  return oldRoom !== "Office" && newRoom === "Office";
}

const JUMPSCARE_MESSAGES = {
  turtle: "The turtle crushed you!",
  shark: "The shark attacked!",
  crab: "The crab got you!",
  octopus: "The octopus grabbed you!",
  ray: "The ray struck!",
};

function drawCameraGlitchHeavy() {
  drawCameraGlitch();
  if (Math.random() < 0.65) drawCameraGlitch();
  for (let i = 0; i < 8; i++) {
    const w = 60 + Math.floor(Math.random() * 200);
    const h = 4 + Math.floor(Math.random() * 20);
    const x = Math.floor(Math.random() * (SCREEN_WIDTH - w));
    const y = Math.floor(Math.random() * (SCREEN_HEIGHT - h));
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 256)},0,0,0.45)`;
    ctx.fillRect(x, y, w, h);
  }
}

function pickRandomCamera(excludeIndex) {
  if (CAMERAS.length <= 1) return 0;
  let next = Math.floor(Math.random() * CAMERAS.length);
  while (next === excludeIndex) {
    next = Math.floor(Math.random() * CAMERAS.length);
  }
  return next;
}

function randomHijackCamDelay() {
  return (
    HIJACK_CAM_SWITCH_MIN +
    Math.random() * (HIJACK_CAM_SWITCH_MAX - HIJACK_CAM_SWITCH_MIN)
  );
}

/**
 * Play the lure sound: a little kid saying "Hi" with giggling.
 * Random each time (pitch, words, giggle pattern).
 */
function playLureKidSound() {
  try {
    // stop any leftover speech so clicks don't pile up
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // random kid-like "Hi" lines
    const hiLines = [
      "Hi",
      "Hi!",
      "Hiii",
      "Hi hi",
      "Hi hee hee hee",
      "Heehee heehee hi",
      "Hi! Heehee heehee",
      "Hee hee hee hee hi",
    ];
    const line = hiLines[Math.floor(Math.random() * hiLines.length)];

    if (window.speechSynthesis) {
      const talk = new SpeechSynthesisUtterance(line);
      // high pitch + slightly silly rate = more like a little kid
      talk.pitch = 1.55 + Math.random() * 0.45;
      talk.rate = 0.85 + Math.random() * 0.35;
      talk.volume = 1;
      window.speechSynthesis.speak(talk);
    }

    // extra random giggles with Web Audio (bubbly high tones)
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const now = audioCtx.currentTime;
    const giggleCount = 5 + Math.floor(Math.random() * 6);
    const startDelay = 0.1 + Math.random() * 0.25;

    for (let i = 0; i < giggleCount; i++) {
      const t = now + startDelay + i * (0.08 + Math.random() * 0.08);
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      const base = 520 + Math.random() * 380;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.08);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18 + Math.random() * 0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }
  } catch (err) {
    // browser may block audio until the player has clicked — ignore
  }
}

/** Loud FNaF-style scream using Web Audio (no sound file needed). */
function playJumpscareScream() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();

    const now = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(1.1, now);
    master.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
    master.connect(audioCtx.destination);

    // harsh noise burst
    const noiseLen = Math.floor(audioCtx.sampleRate * 0.45);
    const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      const fade = 1 - i / noiseLen;
      noiseData[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuf;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(900, now);
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);

    // screaming saw tone dropping fast
    const scream = audioCtx.createOscillator();
    scream.type = "sawtooth";
    scream.frequency.setValueAtTime(420, now);
    scream.frequency.exponentialRampToValueAtTime(90, now + 0.35);
    scream.frequency.exponentialRampToValueAtTime(55, now + 0.6);
    const screamGain = audioCtx.createGain();
    screamGain.gain.setValueAtTime(0.45, now);
    screamGain.gain.exponentialRampToValueAtTime(0.01, now + 0.62);
    scream.connect(screamGain);
    screamGain.connect(master);
    scream.start(now);
    scream.stop(now + 0.65);

    // low thud impact
    const thud = audioCtx.createOscillator();
    thud.type = "square";
    thud.frequency.setValueAtTime(110, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    const thudGain = audioCtx.createGain();
    thudGain.gain.setValueAtTime(0.7, now);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    thud.connect(thudGain);
    thudGain.connect(master);
    thud.start(now);
    thud.stop(now + 0.3);
  } catch (err) {
    // browser may block audio until user has clicked — ignore
  }
}

function drawFnafJumpscare(image, timer) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  if (!image) return;

  // face just appears and wiggles around (no zoom / strobe)
  const size = 460;
  const wiggleX = Math.sin(timer * 38) * 32 + (Math.random() - 0.5) * 20;
  const wiggleY = Math.cos(timer * 31) * 28 + (Math.random() - 0.5) * 20;
  const tilt = Math.sin(timer * 22) * 0.12 + (Math.random() - 0.5) * 0.06;

  const cx = SCREEN_WIDTH / 2 + wiggleX;
  const cy = SCREEN_HEIGHT / 2 + wiggleY;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  drawThreatSprite(ctx, image, 0, 0, size);
  ctx.restore();
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

  ctx.fillStyle = "rgb(90,90,90)";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("v" + GAME_VERSION, SCREEN_WIDTH - 24, SCREEN_HEIGHT - 20);
  ctx.textAlign = "left";
}

function drawMap(
  mapRect,
  currentCam,
  sharkRoom,
  showDrains,
  sharkPull,
  sharkImage,
  rayRoom,
  rayPull,
  rayImage,
) {
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
    let cx;
    let cy;
    if (sharkPull) {
      const fromRoom = findRoom(sharkPull.from);
      const toRoom = findRoom(sharkPull.to);
      if (fromRoom && toRoom) {
        const [fx, fy] = roomCenter(fromRoom);
        const [tx, ty] = roomCenter(toRoom);
        cx = lerp(fx, tx, sharkPull.progress);
        cy = lerp(fy, ty, sharkPull.progress);
      } else {
        [cx, cy] = roomCenter(shark);
      }
    } else {
      [cx, cy] = roomCenter(shark);
    }
    if (sharkImage) {
      drawSharkSprite(ctx, sharkImage, cx, cy, 28);
    } else {
      ctx.fillStyle = "rgba(60,140,220,0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const ray = findRoom(rayRoom);
  if (ray) {
    let cx;
    let cy;
    if (rayPull) {
      const fromRoom = findRoom(rayPull.from);
      const toRoom = findRoom(rayPull.to);
      if (fromRoom && toRoom) {
        const [fx, fy] = roomCenter(fromRoom);
        const [tx, ty] = roomCenter(toRoom);
        cx = lerp(fx, tx, rayPull.progress);
        cy = lerp(fy, ty, rayPull.progress);
      } else {
        [cx, cy] = roomCenter(ray);
      }
    } else {
      [cx, cy] = roomCenter(ray);
    }
    if (rayImage) {
      drawThreatSprite(ctx, rayImage, cx, cy, 26);
    } else {
      ctx.fillStyle = "rgba(180,120,220,0.9)";
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
    }
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

function drawAirFan(cx, cy, radius, angle) {
  ctx.save();
  ctx.translate(cx, cy);

  // outer ring
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgb(150,185,205)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // blades
  ctx.rotate(angle);
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(radius * 0.42, 0, radius * 0.42, radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(130,175,200,0.9)";
    ctx.fill();
  }

  // center hub
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgb(200,220,230)";
  ctx.fill();
  ctx.restore();
}

function drawAirDisplay(x, y, oxygen, fanAngle) {
  const airLeft = Math.max(0, Math.ceil(oxygen));
  let color = "rgb(120,210,230)";
  if (airLeft <= 40) color = "rgb(220,180,60)";
  if (airLeft <= 20) color = "rgb(230,80,80)";

  const fanR = 14;
  drawAirFan(x + fanR, y, fanR, fanAngle);

  ctx.fillStyle = color;
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(String(airLeft), x + fanR * 2 + 12, y + 9);
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
  const sharkThreatImage = await loadImage("images/shark_threat.png");
  const turtleThreatImage = await loadImage("images/turtle_threat.png");
  const crabThreatImage = await loadImage("images/crab_threat.png");
  const octopusThreatImage = await loadImage("images/octopus_threat.png");
  const rayThreatImage = await loadImage("images/ray_threat.png");
  const cameraImages = [];
  for (const [, filename] of CAMERAS) {
    cameraImages.push(await loadImage("images/" + filename));
  }
  const newspaperPage = makeNewspaperPage();
  const urlRoom = new URLSearchParams(window.location.search).get("room");

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
  let crabRoom = "Tide";
  let crabTimer = 0;
  let octoRoom = "Jelly";
  let octoTimer = 0;
  let rayRoom = "Ray";
  let rayTimer = 0;
  let showDrainMap = false;
  let nightHours = 0;
  let glitchTimer = 0;
  let soundCooldown = 0;
  let soundFlash = 0;
  let soundIgnoredFlash = 0;
  // slow crawl into a next-door camera room (null when not dragging)
  let turtlePull = null;
  let sharkPull = null;
  let crabPull = null;
  let octoPull = null;
  let rayPull = null;
  let hijackTimer = 0;
  let hijackCamTimer = 0;
  let hijackAnimal = null;
  let jumpscareTimer = 0;
  let jumpscareNeedsSound = false;
  let gameOverReason = "oxygen";

  const openCamsButton = makeButton("CAMERAS", 780, 500, 180, 50);
  const closeCamsButton = makeButton("CLOSE CAMS", 800, 540, 170, 45);
  const mapModeButton = makeButton("SHOW DRAINS", 600, 360, 180, 40);
  const soundButton = makeButton("PLAY SOUND", 20, 540, 170, 45);
  const drainButton = makeButton("CLOSE DRAIN", 20, 500, 180, 50);
  const tryAgainButton = makeButton("TRY AGAIN", 400, 400, 200, 50);
  const startButton = makeButton("New Game", 70, 270, 250, 50);
  const playAgainButton = makeButton("PLAY AGAIN", 400, 400, 200, 50);
  let fanAngle = 0;
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
    crabRoom = "Tide";
    crabTimer = 0;
    octoRoom = "Jelly";
    octoTimer = 0;
    rayRoom = "Ray";
    rayTimer = 0;
    showDrainMap = false;
    nightHours = 0;
    glitchTimer = 0;
    soundCooldown = 0;
    soundFlash = 0;
    soundIgnoredFlash = 0;
    turtlePull = null;
    sharkPull = null;
    crabPull = null;
    octoPull = null;
    rayPull = null;
    hijackTimer = 0;
    hijackCamTimer = 0;
    hijackAnimal = null;
    jumpscareTimer = 0;
    jumpscareNeedsSound = false;
    gameOverReason = "oxygen";
  }

  function startJumpscare() {
    camerasOpen = false;
    mode = "jumpscare";
    jumpscareTimer = 0;
    jumpscareNeedsSound = true;
  }

  function threatImageFor(animal) {
    if (animal === "turtle") return turtleThreatImage;
    if (animal === "shark") return sharkThreatImage;
    if (animal === "crab") return crabThreatImage;
    if (animal === "octopus") return octopusThreatImage;
    if (animal === "ray") return rayThreatImage;
    return null;
  }

  function beginOfficeAttack(animal) {
    if (mode !== "playing") return;
    hijackAnimal = animal;
    gameOverReason = animal;
    if (camerasOpen) {
      mode = "camera_hijack";
      hijackTimer = 0;
      // keep the cam you're on; shortly flip to a random one
      hijackCamTimer = randomHijackCamDelay();
    } else {
      startJumpscare();
    }
  }

  function checkOfficeEntry(animal, oldRoom, newRoom) {
    if (threatEntersOffice(oldRoom, newRoom)) beginOfficeAttack(animal);
  }

  // tip: open http://.../?room=Cafe to jump straight to that camera
  if (urlRoom) {
    for (const [name, cam] of MAP_ROOMS) {
      if (name.toLowerCase() === urlRoom.toLowerCase() && cam !== null) {
        currentCam = cam;
        camerasOpen = true;
        mode = "playing";
        break;
      }
    }
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
    } else if (mode === "camera_hijack" || (mode === "playing" && camerasOpen)) {
      if (pointInButton(closeCamsButton, mx, my)) {
        if (mode === "camera_hijack") startJumpscare();
        else camerasOpen = false;
      }
      if (pointInButton(mapModeButton, mx, my)) showDrainMap = !showDrainMap;
      if (pointInButton(soundButton, mx, my) && soundCooldown <= 0) {
          playLureKidSound();
          const target = cameraToRoomName(currentCam);
          let anyoneReacted = false;
          if (target !== null) {
            // each animal may ignore this sound on its own
            if (Math.random() >= SOUND_IGNORE_CHANCE) {
              const oldTurtle = turtleRoom;
              const turtleResult = tryLureThreat(
                turtleRoom,
                turtlePull,
                target,
                LAND_NEIGHBORS,
                []
              );
              turtleRoom = turtleResult.room;
              turtlePull = turtleResult.pull;
              checkOfficeEntry("turtle", oldTurtle, turtleRoom);
              if (turtleResult.reacted) anyoneReacted = true;
            }

            if (Math.random() >= SOUND_IGNORE_CHANCE) {
              const sharkBlocked = drainClosed ? ["Office"] : [];
              const oldShark = sharkRoom;
              const sharkResult = tryLureThreat(
                sharkRoom,
                sharkPull,
                target,
                DRAIN_NEIGHBORS,
                sharkBlocked
              );
              sharkRoom = sharkResult.room;
              sharkPull = sharkResult.pull;
              checkOfficeEntry("shark", oldShark, sharkRoom);
              if (sharkResult.reacted) anyoneReacted = true;
            }

            if (Math.random() >= SOUND_IGNORE_CHANCE) {
              const oldCrab = crabRoom;
              const crabResult = tryLureThreat(
                crabRoom,
                crabPull,
                target,
                LAND_NEIGHBORS,
                []
              );
              crabRoom = crabResult.room;
              crabPull = crabResult.pull;
              checkOfficeEntry("crab", oldCrab, crabRoom);
              if (crabResult.reacted) anyoneReacted = true;
            }

            if (Math.random() >= SOUND_IGNORE_CHANCE) {
              const octoBlocked = drainClosed ? ["Office"] : [];
              const oldOcto = octoRoom;
              const octoResult = tryLureThreat(
                octoRoom,
                octoPull,
                target,
                OCTO_NEIGHBORS,
                octoBlocked
              );
              octoRoom = octoResult.room;
              octoPull = octoResult.pull;
              checkOfficeEntry("octopus", oldOcto, octoRoom);
              if (octoResult.reacted) anyoneReacted = true;
            }

            if (Math.random() >= SOUND_IGNORE_CHANCE) {
              const rayBlocked = drainClosed ? ["Office"] : [];
              const oldRay = rayRoom;
              const rayResult = tryLureThreat(
                rayRoom,
                rayPull,
                target,
                DRAIN_NEIGHBORS,
                rayBlocked
              );
              rayRoom = rayResult.room;
              rayPull = rayResult.pull;
              checkOfficeEntry("ray", oldRay, rayRoom);
              if (rayResult.reacted) anyoneReacted = true;
            }

            if (anyoneReacted) {
              glitchTimer = GLITCH_TIME;
              soundFlash = 0.8;
              soundIgnoredFlash = 0;
            } else {
              soundFlash = 0;
              soundIgnoredFlash = 1.0;
            }
          }
          soundCooldown = SOUND_COOLDOWN;
        }
      const clicked = mapClickToCamera(mx, my, mapRect);
      if (clicked !== null) {
        currentCam = clicked;
        // during hijack: you get the cam you picked, then it flips randomly soon
        if (mode === "camera_hijack") {
          hijackCamTimer = randomHijackCamDelay();
        }
      }
    } else if (mode === "playing") {
      if (pointInButton(drainButton, mx, my)) drainClosed = !drainClosed;
      if (pointInButton(openCamsButton, mx, my)) camerasOpen = true;
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
      else oxygen += 2.5 * dt;
      oxygen = Math.max(0, Math.min(100, oxygen));
      // fan spins with the air; slows down when the drain is closed
      fanAngle += (drainClosed ? 1.2 : 7) * dt;
      if (oxygen <= 0) {
        gameOverReason = "oxygen";
        mode = "game_over";
      }

      if (glitchTimer > 0) glitchTimer -= dt;
      if (soundCooldown > 0) soundCooldown -= dt;
      if (soundFlash > 0) soundFlash -= dt;
      if (soundIgnoredFlash > 0) soundIgnoredFlash -= dt;

      // slow crawl continues even if you wait
      const oldTurtleRoom = turtleRoom;
      const turtlePullUpdate = updatePull(turtleRoom, turtlePull, dt);
      turtleRoom = turtlePullUpdate.room;
      turtlePull = turtlePullUpdate.pull;
      checkOfficeEntry("turtle", oldTurtleRoom, turtleRoom);

      const oldSharkRoom = sharkRoom;
      const sharkPullUpdate = updatePull(sharkRoom, sharkPull, dt);
      sharkRoom = sharkPullUpdate.room;
      sharkPull = sharkPullUpdate.pull;
      checkOfficeEntry("shark", oldSharkRoom, sharkRoom);

      const oldCrabRoom = crabRoom;
      const crabPullUpdate = updatePull(crabRoom, crabPull, dt);
      crabRoom = crabPullUpdate.room;
      crabPull = crabPullUpdate.pull;
      checkOfficeEntry("crab", oldCrabRoom, crabRoom);

      const oldOctoRoom = octoRoom;
      const octoPullUpdate = updatePull(octoRoom, octoPull, dt);
      octoRoom = octoPullUpdate.room;
      octoPull = octoPullUpdate.pull;
      checkOfficeEntry("octopus", oldOctoRoom, octoRoom);

      const oldRayRoom = rayRoom;
      const rayPullUpdate = updatePull(rayRoom, rayPull, dt);
      rayRoom = rayPullUpdate.room;
      rayPull = rayPullUpdate.pull;
      checkOfficeEntry("ray", oldRayRoom, rayRoom);

      if (mode === "playing") {
        turtleTimer += dt;
      if (turtleTimer >= TURTLE_MOVE_TIME) {
        turtleTimer = 0;
        // don't wander off while being dragged by sound
        if (!turtlePull) {
          const oldRoom = turtleRoom;
          turtleRoom = moveThreat(turtleRoom, LAND_NEIGHBORS);
          if (turtleRoom !== oldRoom) glitchTimer = GLITCH_TIME;
          checkOfficeEntry("turtle", oldRoom, turtleRoom);
        }
      }

      sharkTimer += dt;
      if (sharkTimer >= SHARK_MOVE_TIME) {
        sharkTimer = 0;
        if (!sharkPull) {
          const oldRoom = sharkRoom;
          sharkRoom = moveShark(sharkRoom, drainClosed);
          if (sharkRoom !== oldRoom) glitchTimer = GLITCH_TIME;
          checkOfficeEntry("shark", oldRoom, sharkRoom);
        }
      }

      crabTimer += dt;
      if (crabTimer >= CRAB_MOVE_TIME) {
        crabTimer = 0;
        if (!crabPull) {
          const oldRoom = crabRoom;
          crabRoom = moveThreat(crabRoom, LAND_NEIGHBORS);
          if (crabRoom !== oldRoom) glitchTimer = GLITCH_TIME;
          checkOfficeEntry("crab", oldRoom, crabRoom);
        }
      }

      octoTimer += dt;
      if (octoTimer >= OCTOPUS_MOVE_TIME) {
        octoTimer = 0;
        if (!octoPull) {
          const oldRoom = octoRoom;
          octoRoom = moveOctopus(octoRoom, drainClosed);
          if (octoRoom !== oldRoom) glitchTimer = GLITCH_TIME;
          checkOfficeEntry("octopus", oldRoom, octoRoom);
        }
      }

      rayTimer += dt;
      if (rayTimer >= RAY_MOVE_TIME) {
        rayTimer = 0;
        if (!rayPull) {
          const oldRoom = rayRoom;
          rayRoom = moveShark(rayRoom, drainClosed);
          if (rayRoom !== oldRoom) glitchTimer = GLITCH_TIME;
          checkOfficeEntry("ray", oldRoom, rayRoom);
        }
      }
      }
    }

    if (mode === "camera_hijack") {
      hijackTimer += dt;
      if (glitchTimer > 0) glitchTimer -= dt;
      if (soundCooldown > 0) soundCooldown -= dt;
      if (soundFlash > 0) soundFlash -= dt;
      if (soundIgnoredFlash > 0) soundIgnoredFlash -= dt;

      hijackCamTimer -= dt;
      if (hijackCamTimer <= 0) {
        currentCam = pickRandomCamera(currentCam);
        hijackCamTimer = randomHijackCamDelay();
      }

      if (hijackTimer >= CAMERA_HIJACK_SECONDS) {
        startJumpscare();
      }
    }

    if (mode === "jumpscare") {
      if (jumpscareNeedsSound) {
        playJumpscareScream();
        jumpscareNeedsSound = false;
      }
      jumpscareTimer += dt;
      if (jumpscareTimer >= JUMPSCARE_SECONDS) mode = "game_over";
    }

    drainButton.text = drainClosed ? "OPEN DRAIN" : "CLOSE DRAIN";
    mapModeButton.text = showDrainMap ? "SHOW DOORS" : "SHOW DRAINS";
    soundButton.text = soundCooldown > 0 ? "Playing sound" : "PLAY SOUND";

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
      if (gameOverReason === "oxygen") {
        ctx.fillText("You Ran Out Of Air.", SCREEN_WIDTH / 2, 230);
      } else {
        ctx.fillText(
          JUMPSCARE_MESSAGES[gameOverReason] || "Something got you!",
          SCREEN_WIDTH / 2,
          230
        );
      }
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
    } else if (mode === "jumpscare") {
      drawFnafJumpscare(threatImageFor(hijackAnimal), jumpscareTimer);
    } else if (mode === "camera_hijack" || (mode === "playing" && camerasOpen)) {
      drawDarkImage(ctx, cameraImages[currentCam], 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      // always show which camera you're on (easy to check Cafe art)
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(20, 70, 360, 44);
      ctx.fillStyle = "rgb(255,240,200)";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(CAMERAS[currentCam][0], 30, 100);

      if (glitchTimer > 0) {
        drawCameraGlitch();
      } else {
        const camRoom = cameraToRoomName(currentCam);
        // Turtle on this camera (or slowly crawling in / out)
        if (turtlePull && (turtlePull.to === camRoom || turtlePull.from === camRoom)) {
          const t = turtlePull.progress;
          let x;
          if (turtlePull.to === camRoom) {
            x = lerp(80, SCREEN_WIDTH / 2 - 140, t);
          } else {
            x = lerp(SCREEN_WIDTH / 2 - 140, SCREEN_WIDTH - 80, t);
          }
          drawThreatSprite(ctx, turtleThreatImage, x, SCREEN_HEIGHT / 2, 160);
        } else {
          const turtleData = findRoom(turtleRoom);
          if (turtleData && turtleData[1] === currentCam) {
            drawThreatSprite(
              ctx,
              turtleThreatImage,
              SCREEN_WIDTH / 2 - 140,
              SCREEN_HEIGHT / 2,
              160
            );
          }
        }

        if (sharkPull && (sharkPull.to === camRoom || sharkPull.from === camRoom)) {
          const t = sharkPull.progress;
          let x;
          if (sharkPull.to === camRoom) {
            x = lerp(SCREEN_WIDTH - 80, SCREEN_WIDTH / 2 + 140, t);
          } else {
            x = lerp(SCREEN_WIDTH / 2 + 140, 80, t);
          }
          drawSharkSprite(ctx, sharkThreatImage, x, SCREEN_HEIGHT / 2, 160);
        } else {
          const sharkData = findRoom(sharkRoom);
          if (sharkData && sharkData[1] === currentCam) {
            drawSharkSprite(
              ctx,
              sharkThreatImage,
              SCREEN_WIDTH / 2 + 140,
              SCREEN_HEIGHT / 2,
              160
            );
          }
        }

        if (crabPull && (crabPull.to === camRoom || crabPull.from === camRoom)) {
          const t = crabPull.progress;
          let y;
          if (crabPull.to === camRoom) {
            y = lerp(SCREEN_HEIGHT - 60, SCREEN_HEIGHT / 2 + 70, t);
          } else {
            y = lerp(SCREEN_HEIGHT / 2 + 70, SCREEN_HEIGHT - 40, t);
          }
          drawThreatSprite(ctx, crabThreatImage, SCREEN_WIDTH / 2, y, 150);
        } else {
          const crabData = findRoom(crabRoom);
          if (crabData && crabData[1] === currentCam) {
            drawThreatSprite(
              ctx,
              crabThreatImage,
              SCREEN_WIDTH / 2,
              SCREEN_HEIGHT / 2 + 70,
              150
            );
          }
        }

        if (octoPull && (octoPull.to === camRoom || octoPull.from === camRoom)) {
          const t = octoPull.progress;
          let y;
          if (octoPull.to === camRoom) {
            y = lerp(60, SCREEN_HEIGHT / 2 - 90, t);
          } else {
            y = lerp(SCREEN_HEIGHT / 2 - 90, 40, t);
          }
          drawThreatSprite(ctx, octopusThreatImage, SCREEN_WIDTH / 2, y, 150);
        } else {
          const octoData = findRoom(octoRoom);
          if (octoData && octoData[1] === currentCam) {
            drawThreatSprite(
              ctx,
              octopusThreatImage,
              SCREEN_WIDTH / 2,
              SCREEN_HEIGHT / 2 - 90,
              150
            );
          }
        }

        if (rayPull && (rayPull.to === camRoom || rayPull.from === camRoom)) {
          const t = rayPull.progress;
          let x;
          if (rayPull.to === camRoom) {
            x = lerp(SCREEN_WIDTH - 100, SCREEN_WIDTH / 2 + 20, t);
          } else {
            x = lerp(SCREEN_WIDTH / 2 + 20, 100, t);
          }
          drawThreatSprite(ctx, rayThreatImage, x, SCREEN_HEIGHT / 2 + 50, 140);
        } else {
          const rayData = findRoom(rayRoom);
          if (rayData && rayData[1] === currentCam) {
            drawThreatSprite(
              ctx,
              rayThreatImage,
              SCREEN_WIDTH / 2 + 20,
              SCREEN_HEIGHT / 2 + 50,
              140
            );
          }
        }
      }

      drawMap(
        mapRect,
        currentCam,
        sharkRoom,
        showDrainMap,
        sharkPull,
        sharkThreatImage,
        rayRoom,
        rayPull,
        rayThreatImage,
      );
      drawButton(mapModeButton, { selected: showDrainMap, transparent: true });
      drawButton(soundButton, {
        selected: soundFlash > 0,
        danger: soundCooldown > 0,
        transparent: true,
      });
      drawButton(closeCamsButton, { transparent: true });
      drawClock(nightHours, 20, 45);
    } else if (mode === "playing") {
      drawDarkImage(ctx, officeImage, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.fillStyle = "rgb(220,240,255)";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("Night Guard Office", 20, 45);
      drawClock(nightHours, 850, 45);

      if (turtleRoom === "Office") {
        drawThreatSprite(ctx, turtleThreatImage, 430, 240, 200);
      }
      if (sharkRoom === "Office") {
        drawSharkSprite(ctx, sharkThreatImage, 560, 240, 180);
      }
      if (crabRoom === "Office") {
        drawThreatSprite(ctx, crabThreatImage, 495, 300, 160);
      }
      if (octoRoom === "Office") {
        drawThreatSprite(ctx, octopusThreatImage, 500, 180, 160);
      }
      if (rayRoom === "Office") {
        drawThreatSprite(ctx, rayThreatImage, 620, 260, 150);
      }

      drawButton(openCamsButton);
      drawButton(drainButton, { danger: drainClosed });
      // fan + number sit to the right of the drain button (no overlap)
      drawAirDisplay(215, 525, oxygen, fanAngle);
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
