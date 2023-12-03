const WORD_URL = "https://words.dev-apis.com/word-of-the-day";
const VALIDATE_URL = "https://words.dev-apis.com/validate-word"

const menu = document.querySelector(".menu");
const roundContainer = document.querySelector(".round");
const tileContainer = document.querySelector(".tiles");
const screens = document.querySelectorAll(".screen");

// Word for the round gets saved here.
let word;
let round = 1;
let highscore = 0;

// How many rows there are on the screen.
let rows = 5;

// How many tiles there are per row.
let tilesPerRow = 5;

// The current row the player is on.
let activeRow = 0;

// The position in the row the player is on.
let rowPos = 0;

// Each row letter inputted gets saved in the buffer.
let rowBuffer;

// Supports random or word of the day.
async function fetchWord(random) {
  showLoading();
  let query = `${WORD_URL}`;

  if (random) query += `${random ? "?random=1" : ""}`

  const promise = await fetch(query);
  const response = await promise.json();
  hideLoading();

  return response.word.toUpperCase();
}

async function isWord(word) {
  showLoading();
  const promise = await fetch(VALIDATE_URL, {
    method: "POST",
    body: JSON.stringify({ word: word })
  });
  const response = await promise.json();
  hideLoading();
  return response.validWord;
}

// Each key pressed gets pushed to the buffer.
function processKeyUp(key) {
  if (!rowBuffer) return;
  if (rowBuffer.length >= tilesPerRow) return;

  rowBuffer.push(key.toUpperCase());
  forward();
}

// The main input listener, filters non letters 
// and checks for enter and backspace first.
function setupListener() {
  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();

    if (key == "enter") {
      checkRow();
      return;
    } else if (key == "backspace") {
      backward();
      return;
    }

    if (!isLetter(key)) return;
    processKeyUp(key);
  });

  // Register listeners for each button.
  // The addListener function handles the repetitive stuff.
  addListener(".btn-play", "click", () => {
    hideMenu();
    showTiles();
    setupRound();
  });

  addListener(".btn-nextround", "click", () => {
    round++;
    setupRound();
    hideWinScreen();
  });

  addListener(".btn-reset", "click", () => {
    setupRound();
    hideLoseScreen();
  });

  addListener(".btn-quit", "click", () => {
    hideLoseScreen();
    hideTiles();
    showMenu();
  });
}

// We repeatedly create listeners for the buttons, so this handles that.
function addListener(selector, event, func) {
  document.querySelector(selector).addEventListener(event, func)
}

// I'm generating the tiles here instead of manually creating them in the HTML document.
// Allows to expand the tiles just by changing the top variables.
function setupTiles() {
  let newRows = [];
  
  // We generate the row containers for the tiles.
  for (let i = 0; i < rows + 1; i++) {
    let row = document.createElement("div");
    
    row.classList.add("row");
    tileContainer.prepend(row);
    newRows.push(row);
  }

  // Now generate the tiles for each row.
  newRows.forEach((r) => {
    for (let i = 0; i < tilesPerRow; i++) {
      let tile = document.createElement("div");
    
      tile.classList.add("tile");
      r.append(tile);
    }
  })
}

async function setupRound() {
  // Refresh and clear the buffer and tiles for each new round.
  clearBuffer();
  clearTiles();

  activeRow = 0;
  rowPos = 0;

  word = await fetchWord(true);
  roundContainer.innerText = "Round: " + round;
}

function winRound() {
  if (round > highscore) {
    highscore = round;
  }

  showWinScreen();
}

function loseRound() {
  showLoseScreen();

  // Rounds get reset back to 1 when you lose.
  round = 1;
}

// These handle visibility of the elements, by adding the .hide class.
function hide(element) {
  element.classList.add("hide");
}

function show(element) {
  element.classList.remove("hide");
}

// This checks the rows letters to see if any match the criteria.
async function checkRow() {
  if (rowPos < tilesPerRow) return;
  let combined = rowBuffer.join("");

  let valid = await isWord(combined);


  // Looping through each letter, checking if any match, then apply the styles
  // and or the win and lose states.
  for (let i = 0; i < rowBuffer.length; i++) {
    if (!valid) {
      updateTile(activeRow, i, "red");
      continue;
    }

    updateTile(activeRow, i, "used");
    
    let letter = rowBuffer[i];
    let match = isMatch(letter, i);

    if (!match) continue;
    if (match == "green") {
      updateTile(activeRow, i, "green");
      continue;
    }

    updateTile(activeRow, i, "yellow");
  }

  if (!valid) return;

  if (combined == word) {
    winRound();
    return;
  }

  if (activeRow == rows) {
    loseRound();
    return;
  }

  activeRow++;
  clearBuffer();
}

// Returns a list of all the tile rows.
function getRows() {
  return document.querySelectorAll(".row");
}

function getTiles() {
  return document.querySelectorAll(".tile");
}

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

function isMatch(letter, position) {
  if (!word.includes(letter)) return;

  if (word[position] == letter) return "green";
  return "yellow";
}

// When pressing enter, this will add the letter to the tile
// then move the position over one.
function forward() {
  if (rowPos >= 5) return;
  
  updateTile(activeRow, rowPos, "add");
  rowPos++;
  console.log(activeRow, rowPos, rowBuffer)
}

// When pressing backspace, this will remove the letter of the tile
// then move the position back one.
function backward() {
  if (rowPos == 0) return;
  
  document.querySelectorAll(".red").forEach((e) => {
    e.classList.remove("red");
  });

  updateTile(activeRow, rowPos - 1, "delete");
  rowPos--;
  rowBuffer.pop();
}


// Updates the tiles according to actions.
function updateTile(row, position, action) {
  let tile = getRows()[row].childNodes[position];

  if (!tile) return;
  switch (action) {
    case "add":
      tile.innerText = rowBuffer[rowBuffer.length - 1];
      break;
    case "delete":
      tile.innerText = "";
      clearTileClasses(tile);
      break;
    case "green":
      tile.classList.add("green");
      break;
    case "yellow":
      tile.classList.add("yellow");
      break;
    case "red":
      tile.classList.add("red");
      break;
    case "used":
      tile.classList.add("used-tile");
      break;
  }
}

// We need to be able to clear the left over tile classes between games
// this function handles that for each tile passed.
function clearTileClasses(tile) {
  tile.classList.remove("used-tile", "green", "yellow", "red");
}

// Remove all tile styles, used for new rounds.
function clearTiles() {
  Array.from(getTiles()).forEach((tile) => {
    tile.innerText = "";
    clearTileClasses(tile);
  });
}

function clearBuffer() {
  rowBuffer = [];
  rowPos = 0;
}

// A bunch of functions to control visibility of different sections.

function showMenu() {
  show(menu);
  menu.getElementsByClassName("score")[0].innerText = highscore;
}

function hideMenu() {
  hide(menu);
}

function showTiles() {
  show(tileContainer);
  show(document.querySelector(".round"));
}

function hideTiles() {
  hide(tileContainer);
  hide(document.querySelector(".round"));
}

function showWinScreen() {
  displayWord(screens[0].getElementsByClassName("word")[0]);
  show(screens[0]);
}

function hideWinScreen() {
  hide(screens[0]);
}

function showLoseScreen() {
  displayWord(screens[1].getElementsByClassName("word")[0]);
  show(screens[1]);
}

function hideLoseScreen() {
  hide(screens[1]);
}

function showLoading() {
  show(document.querySelector(".loading"))
}

function hideLoading() {
  hide(document.querySelector(".loading"))
}

function displayWord(element) {
  element.innerText = word;
}

// Sets up the event listeners and generates tiles using HTML divs.
setupListener();
setupTiles();