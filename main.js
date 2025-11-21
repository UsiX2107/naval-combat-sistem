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
      y: 6,
      hp: 40,
      maxHp: 40,
    }
  ]
};

function init() {
  renderShipList();
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
