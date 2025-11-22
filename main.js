const directionArrows = {
  N: "↑",
  NE: "↗",
  E: "→",
  SE: "↘",
  S: "↓",
  SW: "↙",
  W: "←",
  NW: "↖"
};

const directionOffsets = {
  N: [0, -1],
  NE: [1, -1],
  E: [1, 0],
  SE: [1, 1],
  S: [0, 1],
  SW: [-1, 1],
  W: [-1, 0],
  NW: [-1, -1]
};

let nextShipId = 1;

const gameState = {
  mode: "setup", // "setup" o "battle"
  battleMode: "duello",
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

  // bottoni modalità battaglia
  const battleModeButtons = document.querySelectorAll(".battle-mode-btn");
  battleModeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      setBattleMode(mode);
    });
  });

  // team color picker
  const colorButtons = document.querySelectorAll(".team-color-option");
  const hidden = document.getElementById("team-color");
  colorButtons.forEach(btn => {
    const color = btn.dataset.color;
    btn.style.backgroundColor = color;
    btn.addEventListener("click", () => {
      hidden.value = color;
      colorButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
  if (colorButtons[0]) {
    colorButtons[0].click();
  }

  // TIMONIERE: bottoni e form
  const moveBtn = document.getElementById("helm-move-btn");
  const caBtn = document.getElementById("helm-ca-btn");
  const moveConfirm = document.getElementById("helm-move-confirm");
  const caConfirm = document.getElementById("helm-ca-confirm");

  if (moveBtn) {
    moveBtn.addEventListener("click", () => {
      const moveForm = document.getElementById("helm-move-form");
      const caForm = document.getElementById("helm-ca-form");
      moveForm.classList.remove("hidden");
      caForm.classList.add("hidden");

      const ship = getCurrentTurnShip();
      const xInput = document.getElementById("helm-x");
      const yInput = document.getElementById("helm-y");
      const dirInput = document.getElementById("helm-direction");
      const valInput = document.getElementById("helm-value");
      if (ship) {
        xInput.value = ship.x;
        yInput.value = ship.y;
        dirInput.value = ship.direction;
        valInput.value = "";
      }
    });
  }

  if (caBtn) {
    caBtn.addEventListener("click", () => {
      const moveForm = document.getElementById("helm-move-form");
      const caForm = document.getElementById("helm-ca-form");
      moveForm.classList.add("hidden");
      caForm.classList.remove("hidden");

      const valInput = document.getElementById("helm-ca-value");
      const result = document.getElementById("helm-ca-result");
      valInput.value = "";
      result.textContent = "";
    });
  }

  if (moveConfirm) {
    moveConfirm.addEventListener("click", () => {
      const ship = getCurrentTurnShip();
      if (!ship) return;

      const xInput = document.getElementById("helm-x");
      const yInput = document.getElementById("helm-y");
      const dirInput = document.getElementById("helm-direction");
      const valInput = document.getElementById("helm-value");

      let newX = parseInt(xInput.value, 10);
      let newY = parseInt(yInput.value, 10);
      const dir = dirInput.value || ship.direction;
      let value = parseInt(valInput.value, 10);
      if (isNaN(value) || value < 0) value = 0;

      const mapW = gameState.map.width;
      const mapH = gameState.map.height;
      if (isNaN(newX) || newX < 0 || newX >= mapW) newX = ship.x;
      if (isNaN(newY) || newY < 0 || newY >= mapH) newY = ship.y;

      ship.x = newX;
      ship.y = newY;
      ship.direction = dir;

      // Danno da rostro, se presente
      applyRostroDamage(ship, value);

      renderAll();
      showShipDetails(ship);
    });
  }

  if (caConfirm) {
    caConfirm.addEventListener("click", () => {
      const ship = getCurrentTurnShip();
      if (!ship) return;

      const valInput = document.getElementById("helm-ca-value");
      const result = document.getElementById("helm-ca-result");
      let value = parseInt(valInput.value, 10);
      if (isNaN(value) || value < 0) value = 0;

      const bonus = getCaModifierFromValue(value);
      ship.tempCaBonus = bonus;

      if (bonus === 0) {
        result.textContent = `Nessuna modifica alla CA (valore ${value}).`;
      } else if (bonus > 0) {
        result.textContent = `CA aumentata di +${bonus} fino al prossimo turno del timoniere.`;
      } else {
        result.textContent = `CA ridotta di ${bonus} (malus) fino al prossimo turno del timoniere.`;
      }

      renderAll();
      showShipDetails(ship);
    });
  }
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
  renderBattleMode();
  renderTurn();
}

function setBattleMode(mode) {
  // si può cambiare SOLO in modalità battaglia
  if (gameState.mode !== "battle") return;

  gameState.battleMode = mode;
  renderBattleMode();
}

function onShipFormSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById("ship-name");
  const teamNameInput = document.getElementById("team-name");
  const teamColorInput = document.getElementById("team-color");
  const autoCheckbox = document.getElementById("ship-auto");

  const typeSelect = document.getElementById("ship-type");
  const levelSelect = document.getElementById("ship-level");
  const cannonSelect = document.getElementById("ship-cannons");
  const dirSelect = document.getElementById("ship-direction");
  const xInput = document.getElementById("ship-x");
  const yInput = document.getElementById("ship-y");

  const cargoBallsInput = document.getElementById("cargo-balls");
  const cargoWoodInput = document.getElementById("cargo-wood");
  const cargoFoodInput = document.getElementById("cargo-food");

  const roleHpInputs = [
    document.getElementById("role1-hp"),
    document.getElementById("role2-hp"),
    document.getElementById("role3-hp"),
    document.getElementById("role4-hp"),
    document.getElementById("role5-hp"),
    document.getElementById("role6-hp")
  ];

  const siegeSelects = [
    document.getElementById("siege-slot-1"),
    document.getElementById("siege-slot-2"),
    document.getElementById("siege-slot-3")
  ];

  const mapW = gameState.map.width;
  const mapH = gameState.map.height;

  let x = parseInt(xInput?.value, 10);
  let y = parseInt(yInput?.value, 10);

  if (isNaN(x) || x < 0 || x >= mapW) x = 0;
  if (isNaN(y) || y < 0 || y >= mapH) y = 0;

  const type = parseInt(typeSelect?.value, 10) || 1;
  const level = parseInt(levelSelect?.value, 10) || 1;
  const cannonType = cannonSelect?.value || "corto";
  const direction = dirSelect?.value || "N";

  const balls = parseInt(cargoBallsInput?.value, 10) || 0;
  const wood = parseInt(cargoWoodInput?.value, 10) || 0;
  const food = parseInt(cargoFoodInput?.value, 10) || 0;

  const teamName = teamNameInput?.value || "";
  const teamColor = teamColorInput?.value || "#ffffff";
  const automatic = !!autoCheckbox?.checked;

  const id = "ship" + nextShipId++;

  // Stat automatiche
  const maxPf = 400 * level * type;
  const pf = maxPf;
  const cd = 8 + 2 * level;
  const ca = 8 + 2 * type;

  // PF ruoli: se vuoto -> 30 * livello
  const defaultRoleHp = 30 * level;
  const roles = [];
  for (let i = 0; i < 6; i++) {
    const input = roleHpInputs[i];
    let value = defaultRoleHp;
    if (input && input.value !== "") {
      const v = parseInt(input.value, 10);
      if (!isNaN(v) && v >= 0) value = v;
    }
    roles.push({
      id: i + 1,
      name: "Ruolo " + (i + 1),
      hp: value,
      maxHp: value
    });
  }

  // Macchine d'assedio: fino a 3 slot, anche uguali
  const siegeMachines = siegeSelects.map(sel =>
    sel ? (sel.value || null) : null
  );

  const ship = {
    id,
    name: nameInput?.value || `Nave ${id}`,
    teamName,
    teamColor,
    automatic,
    type,
    level,
    cannonType,
    direction,
    x,
    y,
    cd,
    ca,
    pf,
    maxPf,
    tempCaBonus: 0,
    cargo: {
      balls,
      wood,
      food
    },
    siegeMachines,
    roles
  };

  gameState.ships.push(ship);
  gameState.turn.order = gameState.ships.map(s => s.id);

  // pulizia form
  if (nameInput) nameInput.value = "";
  if (teamNameInput) teamNameInput.value = "";
  if (levelSelect) levelSelect.value = "1";
  if (cannonSelect) cannonSelect.value = "corto";
  if (dirSelect) dirSelect.value = "N";
  if (xInput) xInput.value = "";
  if (yInput) yInput.value = "";
  if (cargoBallsInput) cargoBallsInput.value = "";
  if (cargoWoodInput) cargoWoodInput.value = "";
  if (cargoFoodInput) cargoFoodInput.value = "";
  if (autoCheckbox) autoCheckbox.checked = false;
  roleHpInputs.forEach(input => {
    if (input) input.value = "";
  });
  siegeSelects.forEach(select => {
    if (select) select.value = "";
  });

  renderAll();
}

function renderAll() {
  clearGrid();
  renderShips();
  renderShipList();
  renderMode();
  renderBattleMode();
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
    cell.removeAttribute("title");
  });
}

function renderShips() {
  gameState.ships.forEach(ship => {
    const selector = `.cell[data-x="${ship.x}"][data-y="${ship.y}"]`;
    const cell = document.querySelector(selector);
    if (cell) {
      const arrow = directionArrows[ship.direction] || "";

      cell.innerHTML = `
        <div class="ship-cell-content">
          <span class="ship-direction-arrow">${arrow}</span>
          <span class="ship-level-badge">Lv${ship.level}</span>
        </div>
      `;
      cell.classList.add("ship", `ship-type-${ship.type}`);
      cell.onclick = () => showShipDetails(ship);

      // tooltip nome nave + team
      const tooltipName = ship.teamName
        ? `${ship.name} [${ship.teamName}]`
        : ship.name;
      cell.title = tooltipName;

      // bordo colorato per team
      const content = cell.querySelector(".ship-cell-content");
      if (content) {
        content.style.borderColor = ship.teamColor || "#ffffff";
      }
    }
  });
}

function renderShipList() {
  const list = document.getElementById("ship-list");
  list.innerHTML = "";

  gameState.ships.forEach(ship => {
    const li = document.createElement("li");
    li.textContent = ship.teamName
      ? `${ship.name} (${ship.teamName})`
      : ship.name;
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

  const siegeList = ship.siegeMachines
    .map((m, idx) => {
      if (!m) return `<li>Slot ${idx + 1}: vuoto</li>`;
      return `<li>Slot ${idx + 1}: ${m}</li>`;
    })
    .join("");

  const automaticLabel = ship.automatic ? "Sì" : "No";

  const effectiveCa = ship.ca + (ship.tempCaBonus || 0);

  details.innerHTML = `
    <h3>${ship.name}</h3>
    <p>Team: ${ship.teamName || "-"} &nbsp; <span style="display:inline-block;width:10px;height:10px;background:${ship.teamColor};border:1px solid #fff;"></span></p>
    <p>Automatico: ${automaticLabel}</p>
    <p>Tipo: ${typeName}</p>
    <p>Livello: ${ship.level}</p>
    <p>Tipo cannoni: ${ship.cannonType}</p>
    <p>Direzione: ${ship.direction}</p>
    <p>Posizione: (${ship.x}, ${ship.y})</p>
    <p>CD: ${ship.cd} | CA: ${effectiveCa} (base ${ship.ca}${ship.tempCaBonus ? (ship.tempCaBonus > 0 ? " +" + ship.tempCaBonus : " " + ship.tempCaBonus) : ""}) | PF: ${ship.pf} / ${ship.maxPf}</p>

    <h4>Stiva</h4>
    <p>Palle: ${ship.cargo.balls} | Legno: ${ship.cargo.wood} | Cibo: ${ship.cargo.food}</p>

    <h4>Macchine d'assedio</h4>
    <ul>
      ${siegeList}
    </ul>

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

function renderBattleMode() {
  const buttons = document.querySelectorAll(".battle-mode-btn");
  buttons.forEach(btn => {
    const isActive = btn.dataset.mode === gameState.battleMode;
    btn.classList.toggle("active", isActive);
    btn.disabled = (gameState.mode !== "battle");
  });
}

function renderTurn() {
  const el = document.getElementById("turn-label");

  if (gameState.mode !== "battle" || gameState.ships.length === 0) {
    el.textContent = "";
    renderRolePanel(null);
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

  renderRolePanel(currentShip || null);
}

function nextTurn() {
  if (gameState.turn.order.length === 0) return;

  // fine turno: reset bonus CA del timoniere della nave che sta finendo il turno
  const prevId = gameState.turn.order[gameState.turn.currentIndex];
  const prevShip = gameState.ships.find(s => s.id === prevId);
  if (prevShip) {
    prevShip.tempCaBonus = 0;
  }

  gameState.turn.currentIndex =
    (gameState.turn.currentIndex + 1) % gameState.turn.order.length;

  renderTurn();
}

function getCurrentTurnShip() {
  if (gameState.turn.order.length === 0) return null;
  const currentId = gameState.turn.order[gameState.turn.currentIndex];
  return gameState.ships.find(s => s.id === currentId) || null;
}

function renderRolePanel(currentShip) {
  const info = document.getElementById("role-info");
  const actions = document.getElementById("role-actions");
  const label = document.getElementById("role-ship-label");

  if (!info || !actions || !label) return;

  if (gameState.mode !== "battle" || !currentShip) {
    info.textContent =
      "Passa in modalità battaglia e assicurati che ci sia almeno una nave per usare il timoniere.";
    actions.classList.add("hidden");
    return;
  }

  info.textContent = "Ruolo interno: Timoniere (1° ruolo della nave).";
  label.textContent = `Nave di turno: ${currentShip.name}`;
  actions.classList.remove("hidden");
}

// --- LOGICA CA / ROSTRO ---

function getCaModifierFromValue(value) {
  if (value <= 0) return 0;
  if (value === 1) return -4;
  if (value >= 2 && value <= 4) return -2;
  if (value >= 5 && value <= 9) return -1;
  if (value >= 10 && value <= 14) return 0;
  if (value >= 15 && value <= 19) return 1;
  if (value >= 20 && value <= 24) return 2;
  if (value >= 25 && value <= 29) return 3;
  if (value >= 30) return 4;
  return 0;
}

function shipHasRostro(ship) {
  return (
    ship.siegeMachines &&
    ship.siegeMachines.some(m => m === "rostro")
  );
}

function applyRostroDamage(attacker, value) {
  if (!shipHasRostro(attacker)) return;
  if (!value || value <= 0) return;

  const [dx, dy] = directionOffsets[attacker.direction] || [0, 0];
  const targetX = attacker.x + dx;
  const targetY = attacker.y + dy;

  const target = gameState.ships.find(
    s => s.id !== attacker.id && s.x === targetX && s.y === targetY
  );
  if (!target) return;

  const damage = 10 * attacker.type * value;
  target.pf = Math.max(0, target.pf - damage);
}

window.addEventListener("DOMContentLoaded", init);
