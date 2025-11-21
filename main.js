const gameState = {
  map: {
    width: 10,
    height: 8,
  },
  ships: [
    {
      id: "ship1",
      name: "La Vergine del Mare",
      x: 2,
      y: 3,
      hp: 30,
      maxHp: 30,
    },
    {
      id: "ship2",
      name: "L'Abisso",
      x: 5,
      y: 2,
      hp: 40,
      maxHp: 40,
    }
  ]
};

function init() {
  renderGrid();
  renderShips();
  renderShipList();
}

function renderGrid() {
  const map = document.getElementById("map-container");
  map.innerHTML = ""; // Pulisce

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

function renderShips() {
  gameState.ships.forEach(ship => {
    const cell = document.querySelector(
      `.cell[data-x="${ship.x}"][data-y="${ship.y}"]`
    );
    if (cell) {
      cell.textContent = "🚢";
      cell.classList.add("ship");
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
    <p>Posizione: (${ship.x}, ${ship.y})</p>
    <p>HP: ${ship.hp} / ${ship.maxHp}</p>
  `;
}

window.addEventListener("DOMContentLoaded", init);
