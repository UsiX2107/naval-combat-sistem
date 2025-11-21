const typeIcons = {
  1: "🚢", // Sloop
  2: "⛵", // Goletta
  3: "🚤", // Brigantino (placeholder)
  4: "🛳️", // Fregata
  5: "⚓"   // Galeone (placeholder)
};

let nextShipId = 1;

const gameState = {
  mode: "setup", // "setup" o "battle"
  map: {
    width: 20,
    height: 15
  },
  ships: [],
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
    if (gameState.turn.order.length === 0) {
      gameState.turn.order = gameState.ships.map(s => s.id);
      gameState.turn.currentIndex = 0;
    }
  }

  renderMode();
  renderTurn();
}

function onShipFormSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById("ship-name");
  const typeSelect = document.getElementById("ship-type");
  const levelSelect = document.getElementById("ship-level");
  const cannonSelect = document.getElementById("ship-cannons");
  const xInput = document.getElementById("ship-x");
  const yInput = document.getElementById("ship-y");
  const maxHpInput = document.getElementById("ship-maxhp");
  const cargoBallsInput = document.getElementById("cargo-balls");
  const cargoWoodInput = document.getElementById("cargo-wood");
  const cargoFoodInput = document.getElementById("cargo-food");

  const mapW = gameState.map.width;
  const mapH = gameState.map.height;

  let x = parseInt(xInput.value, 10);
  let y = parseInt(yInput.value, 10);

  if (isNaN(x) || x < 0 || x >= mapW) x = 0;
  if (isNaN(y) || y < 0 || y >= mapH) y = 0;

  const maxHp = parseInt(maxHpInput.value, 10) || 30;
  const type = parseInt(typeSelect.value, 10);
  const level = parseInt(levelSelect.value, 10) || 1;
  const cannonType = cannonSelect.value;

  const balls = parseInt(cargoBallsInput.value, 10) || 0;
  const wood = parseInt(cargoWoodInput.value, 10) || 0;
  const food = parseInt(cargoFoodInput.value, 10) || 0;

  const id = "ship" + nextShipId++;
  const defaultRoleHp = 30 * level;
  const siegeSlots = type <= 2 ? 1 : (type <= 4 ? 2 : 3);

  const roles = [];
  for (let i = 1; i <= 6; i++) {
    roles.push({
      id: i,
      name: "Ruolo " + i,
      hp: defaultRoleHp,
      maxHp: defaultRoleHp
    });
  }

  const ship = {
    id,
    name: nameInput.value || `Nave ${id}`,
    type,
    level,
    cannonType,
    x,
    y,
    hp: maxHp,
    maxHp,
    cargo: {
      balls,
      wood,
      food
    },
    siegeSlots,
    siegeMachines: [],
    roles
  };

  gameState.ships.push(ship);
  gameState.turn.order = gameState.ships.map(s => s.id);

  nameInput.value = "";
  levelSelect.value = "1";
  cannonSelect.value = "corto";
  xInput.value = "";
  yInput.value = "";
  maxHpInput.value = "30";
  cargoBallsInput.value = "";
  cargoWoodInput.value = "";
  cargoFoodInput.value = "";

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
    cell.innerHTML = "";
    cell.className = "cell";
    cell.onclick = null;
  });
}

function renderShips() {
  gameState.ships.forEach(ship => {
    const selector = `.cell[data-x="${ship.x}"][data-y="${ship.y}"]`;
    const cell = document.querySelector(selector);
    if (cell) {
      const icon = typeIcons[ship.type] || "🚢";
      cell.innerHTML = `
        <div class="ship-cell-content">
          <span class="ship-icon">${icon}</span>
          <span class="ship-level-badge">Lv${ship.level}</span>
        </div>
      `;
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

  const typeNameMap = {
    1: "Sloop",
    2: "Goletta",
    3: "Brigantino",
    4: "Fregata",
    5: "Galeone"
  };
  const typeName = typeNameMap[ship.type] || ship.type;

  const rolesRows = ship.roles
    .map((role, index) => {
      return `
        <tr>
          <td>${role.name}</td>
          <td>
            <input type="number" class="role-hp-input" data-role-index="${index}" value="${role.hp}">
            / ${role.maxHp}
          </td>
        </tr>
      `;
    })
    .join("");

  details.innerHTML = `
    <h3>${ship.name}</h3>
    <p>Tipo: ${typeName}</p>
    <p>Livello: ${ship.level}</p>
    <p>Tipo cannoni: ${ship.cannonType}</p>
    <p>Posizione: (${ship.x}, ${ship.y})</p>
    <p>HP scafo: ${ship.hp} / ${ship.maxHp}</p>

    <h4>Stiva</h4>
    <p>Palle: ${ship.cargo.balls} | Legno: ${ship.cargo.wood} | Cibo: ${ship.cargo.food}</p>

    <h4>Macchine d'assedio</h4>
    <p>Slot disponibili: ${ship.siegeSlots}</p>
    <div id="siege-machines">
      <!-- in futuro: elenco delle macchine d'assedio -->
    </div>

    <h4>Ruoli (PF)</h4>
    <table class="roles-table">
      <tbody>
        ${rolesRows}
      </tbody>
    </table>

    <h4>Modifiche / Upgrade</h4>
    <div id="ship-upgrades">
      <!-- sezione vuota per modifiche future -->
    </div>

    <button id="delete-ship-btn">Elimina nave</button>
  `;

  const inputs = details.querySelectorAll(".role-hp-input");
  inputs.forEach(input => {
    input.addEventListener("change", event => {
      const idx = parseInt(event.target.dataset.roleIndex, 10);
      let value = parseInt(event.target.value, 10);
      if (isNaN(value) || value < 0) value = 0;
      ship.roles[idx].hp = value;
      event.target.value = value;
    });
  });

  const deleteBtn = document.getElementById("delete-ship-btn");
  deleteBtn.addEventListener("click", () => {
    deleteShip(ship.id);
  });
}

function deleteShip(shipId) {
  gameState.ships = gameState.ships.filter(s => s.id !== shipId);
  gameState.turn.order = gameState.turn.order.filter(id => id !== shipId);

  if (gameState.turn.currentIndex >= gameState.turn.order.length) {
    gameState.turn.currentIndex = 0;
  }

  const details = document.getElementById("ship-details");
  details.innerHTML = "Seleziona una nave per vedere i dettagli.";

  renderAll();
}

function renderMode() {
  const label = document.getElementById("mode-label");
  const nextTurnBtn = document.getElementById("next-turn-btn");
  const creationPanel = document.getElementById("creation-panel");

  if (gameState.mode === "setup") {
    label.textContent = "Modalità: Creazione";
    nextTurnBtn.style.display = "none";
    if (creationPanel) creationPanel.style.display = "block";
  } else {
    label.textContent = "Modalità: Battaglia";
    nextTurnBtn.style.display =
      gameState.ships.length > 0 ? "block" : "none";
    if (creationPanel) creationPanel.style.display = "none";
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
