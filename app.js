const WORD_URL = "https://words.dev-apis.com/word-of-the-day";
const letters = "abcdefghijklmnopqrstuvwxyz"

const menu = document.querySelector(".menu");
const roundContainer = document.querySelector(".round");
const tileContainer = document.querySelector(".tiles");
const screens = document.querySelectorAll(".screen");

let word;
let round = 1;
let row = 0;
let rows = 5;
let rowPosition = 0;
let lettersPerRow = 5;
let highscore = 0;

let rowBuffer;

async function fetchWord(random) {
  const query = `${WORD_URL}${random ? "?random=1" : ""}`;
  const promise = await fetch(query);
  const response = await promise.json();

  return response.word.toUpperCase();
}

function processKeyUp(key) {
  if (!rowBuffer) return;
  if (rowBuffer.length >= lettersPerRow) return;

  rowBuffer.push(key.toUpperCase());
  forward();
}

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

  document.querySelector(".btn-play").addEventListener("click", () => {
    hideMenu();
    showTiles();
    setupRound();
  });

  document.querySelector(".btn-nextround").addEventListener("click", () => {
    round++;
    setupRound();
    hideWinScreen();
  });

  document.querySelector(".btn-reset").addEventListener("click", () => {
    setupRound();
    hideLoseScreen();
  });

  document.querySelector(".btn-quit").addEventListener("click", () => {
    hideLoseScreen();
    hideTiles();
    showMenu();
  });
}

async function setupRound() {
  clearBuffer();
  clearTiles();

  row = 0;
  rowPosition = 0;

  word = await fetchWord(true);
  roundContainer.innerText = "Round: " + round;
  console.log("Word is " + word);
}

function winRound() {
  if (round > highscore) {
    highscore = round;
  }

  showWinScreen();
}

function loseRound() {
  showLoseScreen();
  round = 1;
}

function hide(element) {
  element.classList.add("hide");
}

function show(element) {
  element.classList.remove("hide");
}

function checkRow() {
  if (rowPosition < lettersPerRow) return;
  let combined = rowBuffer.join("");


  for (let i = 0; i < rowBuffer.length; i++) {
    updateTile(row, i, "used");
    
    let letter = rowBuffer[i];
    let match = isMatch(letter, i);

    if (!match) continue;
    if (match == "green") {
      updateTile(row, i, "green");
      continue;
    }

    updateTile(row, i, "yellow");
  }

  if (combined == word) {
    winRound();
    return;
  }

  if (row == rows) {
    loseRound();
    return;
  }

  row++;
  clearBuffer();
}

function getRows() {
  let rows = [[], [], [], [], [], []];

  let i = 0;
  tileContainer.childNodes.forEach((n) => {
    if (n.nodeName != "DIV") return;
    
    n.childNodes.forEach((cn) => {
      if (cn.nodeName != "DIV") return;
      rows[i].push(cn);
    })
    i++;
  })

  return rows;
}

function isLetter(letter) {
  return letters.includes(letter);
}

function isMatch(letter, position) {
  if (!word.includes(letter)) return;

  if (word[position] == letter) return "green";
  return "yellow";
}

function forward() {
  if (rowPosition >= 5) return;
  
  updateTile(row, rowPosition, "add");
  rowPosition++;
  console.log(row, rowPosition, rowBuffer)
}

function backward() {
  if (rowPosition == 0) return;
  
  updateTile(row, rowPosition - 1, "delete");
  rowPosition--;
  rowBuffer.pop();
}

function updateTile(row, position, action) {
  let rows = getRows();
  let tile = rows[row][position];

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
      tile.classList.add("green")
      break;
    case "yellow":
      tile.classList.add("yellow")
      break;
    case "used":
      tile.classList.add("used-tile")
      break;
  }
}

function clearTileClasses(tile) {
  tile.classList.remove("used-tile", "green", "yellow");
}

function clearTiles() {
  let rows = getRows();
  
  rows.forEach((r) => {
    for (let i = 0; i < r.length; i++) {
      updateTile(rows.indexOf(r), i, "delete");
    }
  });
}

function clearBuffer() {
  rowBuffer = [];
  rowPosition = 0;
}

function showMenu() {
  show(menu);
  menu.getElementsByClassName("score")[0].innerText = highscore;
}

function hideMenu() {
  hide(menu);
}

function showTiles() {
  show(tileContainer);
}

function hideTiles() {
  hide(tileContainer);
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

function displayWord(element) {
  element.innerText = word;
}

setupListener();