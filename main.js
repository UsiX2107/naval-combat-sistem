const typeIcons = {
  1: "🚢",
  2: "⛵",
  3: "🚤",
  4: "🛳️",
  5: "⚓"
};

let nextShipId = 1;

const gameState = {
  mode: "setup", // "setup" o "battle"
  map: {
    width: 20,
    height: 15
  },
  ships: [], // nessuna nave pre-caricata
  turn: {
    order: [],
    currentIndex: 0
  }
};

function init() {
  bindUI();
  renderGrid();
  renderAll();
}

function bindUI() {
  const form = document.getElementById("ship-form");
  form.addEventListener("submit", onShipFormSubmit);

  document
    .getElementById("setup-mode-btn")
    .addEventListener("click", () => setMode("setup"));

  document
    .getElementById("battle-mode-btn")
    .addEventListener("click", () => setMode("battle"));

  document
    .getElementById("next-turn-btn")
    .addEventListener("click", nextTurn);
}

function setMode(mode) {
  gameState.mode = mode;

  if (mode === "battle") {
    // costruisce l'ordine dei turni in base alle navi esistenti
    if (gameState.turn.order.length === 0) {
      gameState.turn.order = gameState.ships.map(s => s.id);
      gameState.turn.currentIndex = 0;
    }
  }

  renderMode();
  renderTurn();
}

function onShipFormSubmit(event) {
  event.preventDefault(); // blocca il reload della pagina

  const nameInput = document.getElementById("ship-name");
  const typeSelect = document.getElementById("ship-type");
  const xInput = document.getElementById("ship-x");
  const yInput = document.getElementById("ship-y");
  const maxHpInput = document.getElementById("ship-maxhp");

  const mapW = gameState.map.width;
  const mapH = gameState.map.height;

  let x = parseInt(xInput.value, 10);
  let y = parseInt(yInput.value, 10);

  if (isNaN(x) || x < 0 || x >= mapW) x = 0;
  if (isNaN(y) || y < 0 || y >= mapH) y = 0;

  const maxHp = parseInt(maxHpInput.value, 10) || 30;
  const type = parseInt(typeSelect.value, 10);

  const id = "ship" + nextShipId++;
  const ship = {
    id,
    name: nameInput.value || `Nave ${id}`,
    type,
    x,
    y,
    hp: maxHp,
    maxHp
  };

  gameState.ships.push(ship);
  // aggiorna l'ordine dei turni (semplice: ordine di creazione)
  gameState.turn.order = gameState.ships.map(s => s.id);

  // pulisce il form
  nameInput.value = "";
  xInput.value = "";
  yInput.value = "";
  maxHpInput.value = "30";

  renderAll();
}

function renderAll() {
  clearGrid();
  renderShips();
  renderShipList();
  renderMode();
  renderTurn();
}

function renderGrid() {
  const map = document.getElementById("map-container");
  map.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("grid");

  for (let y = 0; y < gameState.map.height; y++) {
    const row = document.createElement("tr");

    for (let x = 0; x < gameState.map.width; x++) {
      const cell = document.createElement("td");
      cell.classList.add("cell");
      cell.dataset.x = x;
      cell.dataset.y = y;
      row.appendChild(cell);
    }

    table.appendChild(row);
  }

  map.appendChild(table);
}

function clearGrid() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach(cell => {
    cell.textContent = "";
    cell.className = "cell"; // resetta tutte le classi alla sola "cell"
  });
}

function renderShips() {
  gameState.ships.forEach(ship => {
    const selector = `.cell[data-x="${ship.x}"][data-y="${ship.y}"]`;
    const cell = document.querySelector(selector);
    if (cell) {
      const icon = typeIcons[ship.type] || "🚢";
      cell.textContent = icon;
      cell.classList.add("ship", `ship-type-${ship.type}`);
      cell.onclick = () => showShipDetails(ship);
    }
  });
}

function renderShipList() {
  const list = document.getElementById("ship-list");
  list.innerHTML = "";

  gameState.ships.forEach(ship => {
    const li = document.createElement("li");
    li.textContent = ship.name;
    li.addEventListener("click", () => {
      showShipDetails(ship);
    });
    list.appendChild(li);
  });
}

function showShipDetails(ship) {
  const details = document.getElementById("ship-details");
  details.innerHTML = `
    <h3>${ship.name}</h3>
    <p>Tipo: ${ship.type}</p>
    <p>Posizione: (${ship.x}, ${ship.y})</p>
    <p>HP: ${ship.hp} / ${ship.maxHp}</p>
  `;
}

function renderMode() {
  const label = document.getElementById("mode-label");
  const nextTurnBtn = document.getElementById("next-turn-btn");

  if (gameState.mode === "setup") {
    label.textContent = "Modalità: Creazione";
    nextTurnBtn.style.display = "none";
  } else {
    label.textContent = "Modalità: Battaglia";
    nextTurnBtn.style.display =
      gameState.ships.length > 0 ? "block" : "none";
  }
}

function renderTurn() {
  const el = document.getElementById("turn-label");

  if (gameState.mode !== "battle" || gameState.ships.length === 0) {
    el.textContent = "";
    return;
  }

  const orderNames = gameState.turn.order
    .map(id => gameState.ships.find(s => s.id === id))
    .filter(Boolean)
    .map(s => s.name)
    .join(" → ");

  const currentId =
    gameState.turn.order[gameState.turn.currentIndex] || null;
  const currentShip = gameState.ships.find(s => s.id === currentId);

  if (currentShip) {
    el.textContent = `Turno: ${currentShip.name} | Ordine: ${orderNames}`;
  } else {
    el.textContent = `Ordine: ${orderNames}`;
  }
}

function nextTurn() {
  if (gameState.turn.order.length === 0) return;
  gameState.turn.currentIndex =
    (gameState.turn.currentIndex + 1) % gameState.turn.order.length;
  renderTurn();
}

window.addEventListener("DOMContentLoaded", init);
