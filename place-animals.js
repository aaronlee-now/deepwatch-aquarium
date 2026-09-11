/**
 * Simple tool: place animals on each camera room picture.
 * Saves animal-placements.json for the main game to use later.
 */

const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 600;

// room short name (matches game map), label, image file
const ROOMS = [
  ["Lobby", "CAM 1 Lobby", "lobby.png"],
  ["Gift", "CAM 2 Gift Shop", "gift_shop.png"],
  ["Reef", "CAM 3 Reef", "tropical_reef.png"],
  ["Shark", "CAM 4 Shark Tunnel", "shark_tunnel.png"],
  ["Jelly", "CAM 5 Jellyfish", "jellyfish_room.png"],
  ["Tide", "CAM 6 Tide Pool", "tide_pool.png"],
  ["Hall", "CAM 7 Staff Hall", "staff_hall.png"],
  ["Controls", "CAM 8 Controls", "controls_room.png"],
  ["Drain", "CAM 9 Drain Hub", "drain_hub.png"],
  ["Filter", "CAM 10 Filter", "filter_room.png"],
  ["Penguin", "CAM 11 Penguin", "penguin_cove.png"],
  ["Kelp", "CAM 12 Kelp", "kelp_forest.png"],
  ["Ray", "CAM 13 Ray Bay", "ray_bay.png"],
  ["Cafe", "CAM 14 Cafe", "cafe.png"],
  ["Storage", "CAM 15 Storage", "storage.png"],
  ["Deep", "CAM 16 Deep Tank", "deep_tank.png"],
];

// animal id, button label, image file, default x, y, size
const ANIMALS = [
  ["turtle", "Turtle", "turtle_threat.png", 360, 300, 160],
  ["shark", "Shark", "shark_threat.png", 640, 300, 160],
  ["crab", "Crab", "crab_threat.png", 500, 370, 150],
  ["octopus", "Octopus", "octopus_threat.png", 500, 210, 150],
  ["ray", "Ray", "ray_threat.png", 520, 350, 140],
];

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const roomSelect = document.getElementById("roomSelect");
const animalButtons = document.getElementById("animalButtons");
const sizeSlider = document.getElementById("sizeSlider");
const sizeLabel = document.getElementById("sizeLabel");
const darkerSlider = document.getElementById("darkerSlider");
const darkerLabel = document.getElementById("darkerLabel");
const statusEl = document.getElementById("status");

let roomIndex = 0;
let selectedAnimal = "turtle";
let placements = makeDefaultPlacements();
let roomImages = {};
let animalImages = {};
let dragAnimal = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let saveTimer = null;
let saveReady = false; // don't save while first load is happening
let movedDuringDrag = false;

function makeDefaultPlacements() {
  const data = {};
  for (const [roomName] of ROOMS) {
    data[roomName] = {};
    for (const [id, , , x, y, size] of ANIMALS) {
      data[roomName][id] = { x, y, size, dark: 0 };
    }
  }
  return data;
}

function currentRoomName() {
  return ROOMS[roomIndex][0];
}

function getSpot(animalId) {
  return placements[currentRoomName()][animalId];
}

function setStatus(text) {
  statusEl.textContent = text;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load " + src));
    img.src = src;
  });
}

function drawThreat(image, centerX, centerY, width, dark) {
  if (!image) return;
  const height = width * (image.height / image.width);
  const x = centerX - width / 2;
  const y = centerY - height / 2;

  // darken only the animal picture (keeps clear edges)
  const amount = Number(dark) || 0;
  ctx.save();
  if (amount > 0) {
    const brightness = 1 - Math.min(0.92, amount / 300);
    ctx.filter = `brightness(${brightness})`;
  }
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

function hitTest(animalId, mx, my) {
  const spot = getSpot(animalId);
  const image = animalImages[animalId];
  if (!spot || !image) return false;
  const height = spot.size * (image.height / image.width);
  return (
    mx >= spot.x - spot.size / 2 &&
    mx <= spot.x + spot.size / 2 &&
    my >= spot.y - height / 2 &&
    my <= spot.y + height / 2
  );
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function draw() {
  const [, label, file] = ROOMS[roomIndex];
  const roomImg = roomImages[file];

  ctx.fillStyle = "#0f141e";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  if (roomImg) {
    ctx.drawImage(roomImg, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  // draw animals (selected on top)
  const order = ANIMALS.map(([id]) => id).filter((id) => id !== selectedAnimal);
  order.push(selectedAnimal);

  for (const id of order) {
    const spot = getSpot(id);
    const image = animalImages[id];
    if (!image) continue;

    drawThreat(image, spot.x, spot.y, spot.size, spot.dark);

    if (id === selectedAnimal) {
      const height = spot.size * (image.height / image.width);
      ctx.strokeStyle = "rgba(255, 230, 120, 0.95)";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        spot.x - spot.size / 2 - 4,
        spot.y - height / 2 - 4,
        spot.size + 8,
        height + 8
      );
    }
  }

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(20, 16, 420, 40);
  ctx.fillStyle = "rgb(255,240,200)";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(label, 30, 44);
}

function refreshSizeUi() {
  const spot = getSpot(selectedAnimal);
  sizeSlider.value = String(spot.size);
  sizeLabel.textContent = String(spot.size);
  darkerSlider.value = String(spot.dark || 0);
  darkerLabel.textContent = String(spot.dark || 0);
}

function selectAnimal(id) {
  selectedAnimal = id;
  for (const btn of animalButtons.querySelectorAll("button")) {
    btn.classList.toggle("selected", btn.dataset.id === id);
  }
  refreshSizeUi();
  draw();
}

function buildUi() {
  for (let i = 0; i < ROOMS.length; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = ROOMS[i][1];
    roomSelect.appendChild(opt);
  }

  for (const [id, label] of ANIMALS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = id;
    btn.textContent = label;
    btn.addEventListener("click", () => selectAnimal(id));
    animalButtons.appendChild(btn);
  }

  selectAnimal("turtle");
}

function setRoom(index) {
  roomIndex = (index + ROOMS.length) % ROOMS.length;
  roomSelect.value = String(roomIndex);
  refreshSizeUi();
  draw();
  setStatus("Editing " + ROOMS[roomIndex][1]);
}

function buildSaveObject() {
  return {
    version: 1,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    rooms: placements,
  };
}

async function saveToProjectFile() {
  const body = JSON.stringify(buildSaveObject(), null, 2);
  // backup in the browser too, so work is harder to lose
  try {
    localStorage.setItem("deepwatch-animal-placements", body);
  } catch (_err) {
    // private mode / full storage — ignore
  }
  const res = await fetch("/api/save-placements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Save failed");
  }
}

function downloadBackupJson() {
  const text = JSON.stringify(buildSaveObject(), null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "animal-placements.json";
  a.click();
  URL.revokeObjectURL(url);
}

function scheduleSave(reason) {
  if (!saveReady) return;
  if (saveTimer) clearTimeout(saveTimer);
  setStatus("Saving…");
  saveTimer = setTimeout(async () => {
    try {
      await saveToProjectFile();
      setStatus("Saved to animal-placements.json" + (reason ? " (" + reason + ")" : ""));
    } catch (_err) {
      try {
        localStorage.setItem(
          "deepwatch-animal-placements",
          JSON.stringify(buildSaveObject(), null, 2)
        );
      } catch (_e2) {
        // ignore
      }
      setStatus("Not saved to project. Use http://127.0.0.1:8765 and run place_server.py");
    }
  }, 250);
}

function applyLoadedData(data) {
  if (!data || !data.rooms) {
    throw new Error("File needs a rooms section");
  }
  // keep defaults, then overwrite with saved spots
  const next = makeDefaultPlacements();
  for (const [roomName, animals] of Object.entries(data.rooms)) {
    if (!next[roomName]) continue;
    for (const [id, spot] of Object.entries(animals)) {
      if (!next[roomName][id]) continue;
      next[roomName][id] = {
        x: Number(spot.x),
        y: Number(spot.y),
        size: Number(spot.size),
        dark: Number(spot.dark) || 0,
      };
    }
  }
  placements = next;
  refreshSizeUi();
  draw();
}

async function tryLoadSavedFile() {
  try {
    const res = await fetch("animal-placements.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      applyLoadedData(data);
      setStatus("Loaded animal-placements.json");
      return;
    }
  } catch (_err) {
    // try browser backup next
  }

  try {
    const raw = localStorage.getItem("deepwatch-animal-placements");
    if (!raw) return;
    applyLoadedData(JSON.parse(raw));
    setStatus("Loaded browser backup (click Save now to write the project file)");
  } catch (_err) {
    // no backup
  }
}

function onPointerDown(event) {
  const { x, y } = canvasPoint(event);
  movedDuringDrag = false;

  // click selected animal first, else any animal under the mouse
  let hit = null;
  if (hitTest(selectedAnimal, x, y)) {
    hit = selectedAnimal;
  } else {
    for (let i = ANIMALS.length - 1; i >= 0; i--) {
      const id = ANIMALS[i][0];
      if (hitTest(id, x, y)) {
        hit = id;
        break;
      }
    }
  }

  if (!hit) {
    // click empty space → move selected animal here
    const spot = getSpot(selectedAnimal);
    spot.x = Math.round(x);
    spot.y = Math.round(y);
    draw();
    scheduleSave("click place");
    return;
  }

  selectAnimal(hit);
  const spot = getSpot(hit);
  dragAnimal = hit;
  dragOffsetX = spot.x - x;
  dragOffsetY = spot.y - y;
  canvas.classList.add("dragging");
  canvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!dragAnimal) return;
  const { x, y } = canvasPoint(event);
  const spot = getSpot(dragAnimal);
  spot.x = Math.round(x + dragOffsetX);
  spot.y = Math.round(y + dragOffsetY);
  movedDuringDrag = true;
  draw();
}

function onPointerUp(event) {
  if (!dragAnimal) return;
  dragAnimal = null;
  canvas.classList.remove("dragging");
  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch (_err) {
    // already released
  }
  if (movedDuringDrag) {
    scheduleSave("drag");
  }
}

async function main() {
  buildUi();
  setStatus("Loading pictures…");

  // load all pictures (one by one so a missing file is easy to see)
  for (const [, label, file] of ROOMS) {
    try {
      roomImages[file] = await loadImage("images/" + file);
      draw();
    } catch (err) {
      console.error(err);
      setStatus("Missing room picture: " + label + " (" + file + ")");
      throw err;
    }
  }
  for (const [id, label, file] of ANIMALS) {
    try {
      animalImages[id] = await loadImage("images/" + file);
      draw();
    } catch (err) {
      console.error(err);
      setStatus("Missing animal picture: " + label + " (" + file + ")");
      throw err;
    }
  }

  roomSelect.addEventListener("change", () => {
    setRoom(Number(roomSelect.value));
  });
  document.getElementById("prevRoom").addEventListener("click", () => {
    setRoom(roomIndex - 1);
  });
  document.getElementById("nextRoom").addEventListener("click", () => {
    setRoom(roomIndex + 1);
  });

  sizeSlider.addEventListener("input", () => {
    const spot = getSpot(selectedAnimal);
    spot.size = Number(sizeSlider.value);
    sizeLabel.textContent = String(spot.size);
    draw();
    scheduleSave("size");
  });
  document.getElementById("smallerBtn").addEventListener("click", () => {
    const spot = getSpot(selectedAnimal);
    spot.size = Math.max(60, spot.size - 10);
    refreshSizeUi();
    draw();
    scheduleSave("size");
  });
  document.getElementById("biggerBtn").addEventListener("click", () => {
    const spot = getSpot(selectedAnimal);
    spot.size = Math.min(280, spot.size + 10);
    refreshSizeUi();
    draw();
    scheduleSave("size");
  });

  darkerSlider.addEventListener("input", () => {
    const spot = getSpot(selectedAnimal);
    spot.dark = Number(darkerSlider.value);
    darkerLabel.textContent = String(spot.dark);
    draw();
    scheduleSave("dark");
  });

  document.getElementById("saveBtn").addEventListener("click", async () => {
    try {
      await saveToProjectFile();
      setStatus("Saved to animal-placements.json");
    } catch (_err) {
      downloadBackupJson();
      setStatus("Downloaded backup. For project save use http://127.0.0.1:8765");
    }
  });

  document.getElementById("resetRoomBtn").addEventListener("click", () => {
    const defaults = makeDefaultPlacements();
    placements[currentRoomName()] = defaults[currentRoomName()];
    refreshSizeUi();
    draw();
    scheduleSave("reset room");
  });

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  await tryLoadSavedFile();
  saveReady = true;
  setRoom(0);
}

main().catch((err) => {
  console.error(err);
  setStatus("Error loading pictures — open this page from the game folder.");
});
