// Use the API_URL variable to make fetch requests to the API.
// Replace the placeholder with your cohort name (ex: 2109-UNF-HY-WEB-PT)
const cohortName = "2410-ftb-et-web-am";
const API_URL = `https://fsa-puppy-bowl.herokuapp.com/api/${cohortName}/players`;

// Initialize empty players array
const state = {
  players:[],
}

/**
 * Fetches all players from the API.
 * @returns {Object[]} the array of player objects
 */
const fetchAllPlayers = async () => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    state.players = data.data;
    return state.players;
  } catch (err) {
    console.error("Uh oh, trouble fetching players!", err);
  }
};

/**
 * Fetches a single player from the API.
 * @param {number} playerId
 * @returns {Object} the player object
 */
const fetchSinglePlayer = async (playerId) => {
  try {
    const response = await fetch(`${API_URL}/${playerId}`);
    const data = await response.json();
    return data.data["player"];
  } catch (err) {
    console.error(`Oh no, trouble fetching player #${playerId}!`, err);
  }
};

/**
 * Adds a new player to the roster via the API.
 * @param {Object} playerObj the player to add
 * @returns {Object} the player returned by the API
 */
const addNewPlayer = async (playerObj) => {
  try {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type" : "application/json"},
        body: JSON.stringify(playerObj)
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(json.message);
    }
    init();
    return json.data.newPlayer;
  } catch (err) {
    console.error("Oops, something went wrong with adding that player!", err);
  }
};

/**
 * Removes a player from the roster via the API.
 * @param {number} playerId the ID of the player to remove
 */
const removePlayer = async (playerId) => {
  try {
    const response = await fetch(`${API_URL}/${playerId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      throw new Error('Unable to delete the player.');
    }
    init();
  } catch (err) {
    console.error(
      `Whoops, trouble removing player #${playerId} from the roster!`,
      err
    );
  }
};

/**
 * Updates `<main>` to display a list of all players.
 *
 * If there are no players, a corresponding message is displayed instead.
 *
 * Each player is displayed in a card with the following information:
 * - name
 * - id
 * - image (with alt text of the player's name)
 *
 * Additionally, each card has two buttons:
 * - "See details" button that, when clicked, calls `renderSinglePlayer` to
 *    display more information about the player
 * - "Remove from roster" button that, when clicked, will call `removePlayer` to
 *    remove that specific player and then re-render all players
 *
 * Note: this function should replace the current contents of `<main>`, not append to it.
 * @param {Object[]} playerList - an array of player objects
 */
const renderAllPlayers = (playerList) => {
  const main = document.querySelector('main');

  if (playerList.players.length > 0) {
    const playerElements = playerList.players.map((player) => {
      const playerElement = document.createElement('div');
      playerElement.className = "playerSummarized";
      playerElement.innerHTML = `
        <p>Name: ${player.name}</p>
        <p>ID: ${player.id}</p>
        <img src="${player.imageUrl}" alt="${player.name}" />
        <br>
        <br>
      `;

      const removePlayerBtn = document.createElement('button');
      removePlayerBtn.className = "playerBtn";
      removePlayerBtn.textContent = "Remove Player";
      playerElement.append(removePlayerBtn);

      removePlayerBtn.addEventListener('click', () => {
        removePlayer(player.id);
      })

      const playerDetailsBtn = document.createElement('button');
      playerDetailsBtn.className = "playerBtn";
      playerDetailsBtn.textContent = "See Details";
      playerElement.append(playerDetailsBtn);

      playerDetailsBtn.addEventListener('click', () => {
        renderSinglePlayer(player);
      })

      return playerElement;
    });
    main.replaceChildren(...playerElements);
  } else {
    const message = document.createElement('h1');
    playerElement.innerHTML = 'No players available to display.'
    main.replaceChildren(playerElement)
  }
};

/**
 * Updates `<main>` to display a single player.
 * The player is displayed in a card with the following information:
 * - name
 * - id
 * - breed
 * - image (with alt text of the player's name)
 * - team name, if the player has one, or "Unassigned"
 *
 * The card also contains a "Back to all players" button that, when clicked,
 * will call `renderAllPlayers` to re-render the full list of players.
 * @param {Object} player an object representing a single player
 */
const renderSinglePlayer = async (player) => {
  const singlePlayerDetails = await fetchSinglePlayer(player.id);

  let teamName = "";
  let teammateInfo = "";
  if (player.teamId != null) {
    teamName = singlePlayerDetails.team["name"];

    // Create array of all players that are part of the same team
    let teammateArr = [];
    console.log(teammateArr);
    for (let x=0; x<singlePlayerDetails.team.players.length; x++) {
      teammateArr.push(singlePlayerDetails.team.players[x].name);
    }
    teammateInfo = teammateArr.join(', ');
  } else {
    teamName = undefined;
    teammateInfo = "There are no teammates to display for this user."
  }
  
  // Reset main content here to blank
  const main = document.querySelector('main');
  main.innerHTML="";

  const section = document.createElement('section');
  section.className = "singlePlayerDetails";
  const innerHtml = `
    <p>Name: ${player.name}</p>
    <p>ID: ${player.id}</p>
    <p>Breed: ${player.breed}</p>
    <p>Team Name: ${teamName}</p>
    <br>
    <img src="${player.imageUrl}" alt="${player.name}" />
    <br><br>
    <p>Teammates: ${teammateInfo}</p>`;
  section.innerHTML = innerHtml;
  
  const backToAllPlayers = document.createElement('button');
  backToAllPlayers.textContent = "Back to All Players";
  section.appendChild(backToAllPlayers);
  backToAllPlayers.className = "backToAllPlayersBtn";
  backToAllPlayers.addEventListener('click', () => {
    renderAllPlayers(state.players);
  })

  main.replaceChildren(section);
};

/**
 * Fills in `<form id="new-player-form">` with the appropriate inputs and a submit button.
 * When the form is submitted, it should call `addNewPlayer`, fetch all players,
 * and then render all players to the DOM.
 */
const renderNewPlayerForm = () => {
  try {
    const form = document.querySelector('form');
    form.innerHTML = `
      <label for="playerName">Name</label>
      <input type="text" id="playerName" name="playerName" required/>
      <label for="playerBreed">Breed</label>
      <input type="text" id="playerBreed" name="playerBreed" required/>
      <label for="playerImgUrl">Image URL</label>
      <input type="text" id="playerImgUrl" name="playerImgUrl" required/>
      <label for="playerStatus">Status</label>
      <select id="playerStatus" name="playerStatus" required/>
        <option value="bench" selected>bench</option>
        <option value="field">field</option>
      </select>
      <button id="addPlayerBtn">Add Player</button>`
  } catch (err) {
    console.error("Uh oh, trouble rendering the new player form!", err);
  }
};

/**
 * Initializes the app by fetching all players and rendering them to the DOM.
 */
const init = async () => {
  const players = await fetchAllPlayers();
  renderAllPlayers(players);

  renderNewPlayerForm();
};

// This script will be run using Node when testing, so here we're doing a quick
// check to see if we're in Node or the browser, and exporting the functions
// we want to test if we're in Node.
if (typeof window === "undefined") {
  module.exports = {
    fetchAllPlayers,
    fetchSinglePlayer,
    addNewPlayer,
    removePlayer,
    renderAllPlayers,
    renderSinglePlayer,
    renderNewPlayerForm,
  };
} else {
  init();
}

const addPlayer = document.querySelector('form');
addPlayer.addEventListener('submit', async (event) => {
  event.preventDefault();

  const playerToAdd = {
    name: addPlayer.playerName.value,
    breed: addPlayer.playerBreed.value,
    imageUrl: addPlayer.playerImgUrl.value,
    status: addPlayer.playerStatus.value
  }

  // console.log(playerToAdd);

  const newPlayer = await addNewPlayer(playerToAdd);

  // Reset form after adding new player
  addPlayer.playerName.value = "";
  addPlayer.playerBreed.value = "";
  addPlayer.playerImgUrl.value = "";
  addPlayer.playerStatus.value = "";
  
  const players = await fetchAllPlayers();
  await renderAllPlayers(players);
})