///////////////////////// Application State /////////////////////////

let difficulty = 5;
let nextDifficulty = 5;
let graphicsLevel = "high";
let boardRows = 8;
let boardCols = 8;
let gameStarted = false;
let paused = false;
let toggleClear = false;
let stopClear;
let toggleFall = false;
let stopFall;
let toggleSwitch = false;
let stopSwitch;
let colorChange = false;
let loseCondition = false;
let score = 0;
let highScore = 0;
let musicMute = false;
let sfxMute = false;
let board;
let selected = null;
let fallingTiles = [];
let fixedTiles = [];

///////////////////////// Color Info /////////////////////////

const colors = [
    'red',
    'yellow',
    'blue',
    'green',
    'purple',
    'orange',
    'teal',
];

const colorHues = {
    red: 0,
    yellow: 64,
    blue: 240,
    green: 120,
    purple: 265,
    orange: 29,
    teal: 180
}

const getColor = selection => {
    if (selection > colors.length) selection = colors.length;
    return colors[Math.floor(Math.random() * selection)];
};

///////////////////////// Class Definitions /////////////////////////

class Tile {
    constructor(color, x, y) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    change() {
        this.color = getColor(difficulty)
    }
}

class Column {
    constructor(size, index) {
        this.size = size;
        this.index = index;
        this.length = 0;
        this.arr = [];
        this.nulls = 0;
        this.append(size);
    }

    getArr() {
        return this.arr.map(el => (el === null ? null : el.color));
    }

    set(position, color) {
        this.arr[position].color = color;
    }

    nullify(position) {
        this.arr[position] = null;
        this.nulls++;
    }

    firstNull() {
        return this.arr.indexOf(null);
    }

    removeNulls() {
        this.arr = this.arr.filter(el => el !== null);
        this.length -= this.nulls;
        this.nulls = 0;
        this.arr = this.arr.map((tile, index) => {
            tile.y = index;
            return tile;
        });
    }

    append(amount = this.nulls, selectionSize = difficulty) {
        const addition = [];
        for (let i = 0; i < amount; i++) {
            addition.push(
                new Tile(getColor(selectionSize), this.index, this.length + i)
            );
        }
        this.arr = this.arr.concat(addition);
        this.length += amount;
    }
}

class Gameboard {
    constructor(sizeX, sizeY) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.columns = [];
        for (let i = 0; i < sizeX; i++) {
            this.columns.push(new Column(sizeY, i));
        }
    }

    getArr() {
        return this.columns.map(col => col.getArr());
    }

    tile(x, y) {
        return this.columns[x].arr[y]
    }

    switch(tileACol, tileARow, tileBCol, tileBRow) {
        const AColor = this.tile(tileACol, tileARow).color;
        const BColor = this.tile(tileBCol, tileBRow).color;
        this.columns[tileBCol].set(tileBRow, AColor);
        this.columns[tileACol].set(tileARow, BColor);
        return this.getArr();
    }

    checkColumns(matches = [], start = 0, end = this.sizeX - 1) {
        let x = start;
        while (x <= end) {
            let y = 0;
            while (y < this.sizeY - 2) {
                let currColor = this.tile(x, y).color;
                if (
                    this.tile(x, y + 1).color === currColor &&
                    this.tile(x, y + 2).color === currColor
                ) {
                    if (!matches.includes(this.tile(x, y)))
                        matches.push(this.tile(x, y));
                    if (!matches.includes(this.tile(x, y + 1)))
                        matches.push(this.tile(x, y + 1));
                    if (!matches.includes(this.tile(x, y + 2)))
                        matches.push(this.tile(x, y + 2));
                }
                y++;
            }
            x++;
        }
        return matches;
    }

    checkRows(matches = [], start = 0, end = this.sizeY - 1) {
        let y = start;
        while (y <= end) {
            let x = 0;
            while (x < this.sizeX - 2) {
                let currColor = this.tile(x, y).color;
                if (
                    this.tile(x + 1, y).color === currColor &&
                    this.tile(x + 2, y).color === currColor
                ) {
                    if (!matches.includes(this.tile(x, y)))
                        matches.push(this.tile(x, y));
                    if (!matches.includes(this.tile(x + 1, y)))
                        matches.push(this.tile(x + 1, y));
                    if (!matches.includes(this.tile(x + 2, y)))
                        matches.push(this.tile(x + 2, y));
                }
                x++;
            }
            y++;
        }
        return matches;
    }

    clearMatches() {
        const matches = this.checkColumns(this.checkRows());
        matches.forEach(match => {
            this.columns[match.x].nullify(match.y);
            this.columns[match.x].append(1);
        });
        return matches;
    }

    getFixed() {
        const fixed = [];
        this.columns.forEach(col => {
            let foundNull = false;
            col.arr.forEach(tile => {
                if (!foundNull) {
                    if (tile === null) {
                        foundNull = true;
                    } else {
                        fixed.push(tile);
                    }
                }
            });
        });
        return fixed;
    }

    getFalling() {
        const falling = [];
        this.columns.forEach(col => {
            const firstNull = col.arr.indexOf(null);
            if (firstNull !== -1) {
                col.arr.forEach(tile => {
                    if (tile !== null && tile.y > firstNull) {
                        falling.push(tile);
                    }
                });
            }
        });
        return falling;
    }

    removeNulls() {
        this.columns.forEach(col => {
            col.removeNulls();
        });
        return this.getArr();
    }

    checkPossibleMoves() {
        let moves = [];
        let matches = [];
        let colNum = 0;
        let rowNum = 0;

        while (colNum < this.sizeX) {
            rowNum = 0;
            while (rowNum < this.sizeY - 1) {
                let currMove = [rowNum, colNum, rowNum + 1, colNum];
                this.switch(...currMove);
                matches = this.checkRows(this.checkColumns());
                if (matches.length > 0) {
                    moves.push(currMove);
                }
                this.switch(...currMove);
                rowNum++;
            }
            colNum++;
        }

        rowNum = 0;
        while (rowNum < this.sizeY) {
            colNum = 0;
            while (colNum < this.sizeX - 1) {
                let currMove = [rowNum, colNum, rowNum, colNum + 1];
                this.switch(...currMove);
                matches = this.checkRows(this.checkColumns());
                if (matches.length > 0) {
                    moves.push(currMove);
                }
                this.switch(...currMove);
                colNum++;
            }
            rowNum++;
        }
        return moves;
    }
}


class ShatterParticle {
    constructor(x, y, hue) {
        this.hue = hue + (-.5 * this.hueVariance + Math.random() * this.hueVariance)
        this.startX = x
        this.startY = y
        this.done = false
        this.countedDone = false
    }

    // THIS CODE BASED ON: https://css-tricks.com/adding-particle-effects-to-dom-elements-with-canvas/

    spreadAdjustment = window.innerWidth > window.innerHeight
      ? 
      window.innerHeight / 500
      :
      window.innerWidth / 500

    // Set the speed for our particle
    speed = {
        x: this.spreadAdjustment * (-10 + Math.random() * 20),
        y: this.spreadAdjustment * (-10 + Math.random() * 20)
    };

    acceleration = {
        x: .85,
        y: .85
    };
    
    // Size our particle
    radius = 2 + Math.random() * 2;

    // Set color variance
    hueVariance = 20

    // Set a max time to live for our particle
    life = 25 + Math.random() * 15;
    remainingLife = this.life;

    // Set size change over time (growth or deteriation)
    sizeChange = -(this.radius / this.life)

    sizeAcceleration = 1

    // This function will be called by our animation logic later on
    draw = ctx => {
        let p = this;

        if(p.remainingLife > 0 && p.radius > 1) {
            // Draw a circle at the current location
            ctx.beginPath();
            ctx.arc(p.startX, p.startY, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
            if (graphicsLevel === "high") {
              ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
              ctx.shadowBlur = 25;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
            }
            ctx.fill();
            ctx.closePath();

            // Update the particle's location and life
            p.remainingLife--;
            p.radius += p.sizeChange;
            p.startX += p.speed.x;
            p.startY += p.speed.y;
            p.speed.x *= p.acceleration.x;
            p.speed.y *= p.acceleration.y;
            p.sizeChange *= p.sizeAcceleration;
        } else {
          p.done = true
        }
    }
}

///////////////////////// Canvas/DOM settings /////////////////////////

const canvasFx = document.querySelector('#canvas-fx');
const canvas1 = document.querySelector('#canvas-1');
const canvas2 = document.querySelector('#canvas-2');
const canvas3 = document.querySelector('#canvas-3');
const canvasBg = document.querySelector('#canvas-bg');

let screenWidth = window.innerWidth;
let canvasWidth, canvasHeight, unit;

function setCanvasDimensions() {
  if (800 > screenWidth) {
    canvasWidth = 320;
    canvasHeight = 320;
  } else if (1600 < screenWidth) {
    canvasWidth = 640;
    canvasHeight = 640;
  } else {
    canvasWidth = 0.4 * screenWidth;
    canvasHeight = 0.4 * screenWidth;
  }

  unit = canvasWidth / boardRows;
  
  canvasFx.width = canvasWidth;
  canvasFx.height = canvasHeight;
  canvas1.width = canvasWidth;
  canvas1.height = canvasHeight;
  canvas2.width = canvasWidth;
  canvas2.height = canvasHeight;
  canvas3.width = canvasWidth;
  canvas3.height = canvasHeight;
  canvasBg.width = canvasWidth;
  canvasBg.height = canvasHeight;
  
  if (gameStarted) {
    renderBg();
    renderFixed();
  };
}

setCanvasDimensions();


window.addEventListener("resize", () => {
  screenWidth = window.innerWidth
  setCanvasDimensions();
})

const canVibrate = "vibrate" in navigator || "mozVibrate" in navigator;

if (canVibrate && !("vibrate" in navigator)) {
    navigator.vibrate = navigator.mozVibrate;
}

const cfx = canvasFx.getContext('2d'); 
const c1 = canvas1.getContext('2d');
const c2 = canvas2.getContext('2d');
const c3 = canvas3.getContext('2d');
const cbg = canvasBg.getContext('2d');

const canvasWrapper = document.querySelector('.canvas-wrapper');

const scoreCounter = document.querySelector('#score-counter');
scoreCounter.textContent = 0;

const highScoreCounter = document.querySelector('#high-score-counter');
highScoreCounter.textContent = 0;

const debugButton = document.querySelector('#debug-button');
const debugButton2 = document.querySelector('#debug-button-2');

// const bgMusic = document.querySelector("#bg-music")
// bgMusic.addEventListener('timeupdate', function() {
//   const buffer = .46
//   if (this.currentTime > this.duration - buffer) {
//       this.currentTime = 0
//       this.play()
//   }}, false);

// const sfxDrop = document.querySelector("#sfx-drop")
// const sfxRotate = document.querySelector("#sfx-rotate")
// const sfxClear = document.querySelector("#sfx-clear")
// const sfxDeath = document.querySelector("#sfx-death")

// const sfx = [sfxDrop, sfxRotate, sfxClear, sfxDeath]
// sfx.forEach(sound => sound.volume = .8)

const gameOverScreen = document.querySelector('.game-over');
const gameOverText = document.querySelector('.game-over p');
const gameOverButton = document.querySelector('.game-over button');

const pauseScreen = document.querySelector('.pause');
const pauseText = document.querySelector('.pause p');
const pauseButton = document.querySelector('.pause button');

const images = {
  red: new Image(),
  blue: new Image(),
  yellow: new Image(),
  green: new Image(),
  purple: new Image(),
  orange: new Image(),
  teal: new Image()
};
images.red.src = './assets/Red Gem.png';
images.blue.src = './assets/Blue Gem.png';
images.yellow.src = './assets/Yellow Gem.png';
images.green.src = './assets/Green Gem.png';
images.purple.src = './assets/Purple Gem.png';
images.orange.src = './assets/Orange Gem.png';
images.teal.src = './assets/Teal Gem.png';

///////////////////////// Logic /////////////////////////

///// Initialize /////

function initializeState() {
  board = new Gameboard(boardRows, boardCols);
  let matches = board.clearMatches();
  while (matches.length) {
      board.removeNulls();
      matches = board.clearMatches();
  }

  gameStarted = false;
  loseCondition = false;
  paused = false;
  toggleFall = false;
  score = 0;
  selected = null;
  fallingTiles = [];
}

function start() {
    navigator.vibrate(30);
    difficulty = nextDifficulty;
    initializeState();
    canvasWrapper.focus();
    scoreCounter.textContent = score;
    cfx.clearRect(0, 0, canvasFx.width, canvasFx.height);
    c1.clearRect(0, 0, canvas1.width, canvas1.height);
    c2.clearRect(0, 0, canvas2.width, canvas2.height);
    c3.clearRect(0, 0, canvas3.width, canvas3.height);
    renderBg();
    gameStarted = true;
    //   bgMusic.play();
    gameOverScreen.classList.add('hidden');

    renderFixed();
}

function incrementScore(num) {
    score += num;
    scoreCounter.textContent = score;
    if (highScore < score) {
      highScore = score;
      highScoreCounter.textContent = highScore;
    }
}

///// Game Options /////
function changeDifficulty(selected) {
  nextDifficulty = Number(selected.value)
}

function setGraphics(level) {
  graphicsLevel = level;
}

///// Audio Options /////

// function toggleMusic() {
//   musicMute = !musicMute;
//   if (musicMute) {
//     bgMusic.muted = true
//     bgMusic.currentTime = 0;
//     bgMusic.pause();
//   } else {
//     bgMusic.muted = false
//     bgMusic.currentTime = 0;
//     bgMusic.play();
//   }
// }

// function toggleSfx() {
//   sfxMute = !sfxMute
//   if (sfxMute) {
//     sfx.forEach(sound => {
//       sound.muted = true
//     })
//   } else {
//     sfx.forEach(sound => {
//       sound.muted = false
//     })
//   }
// }

///// Render Board /////

function drawTile(x, y, type, canvas) {
    let cv;
    if (canvas === 1) {
        cv = c1;
    } else if (canvas === 2) {
        cv = c2;
    } else {
        cv = c3;
    }
    cv.drawImage(images[type], x, y, unit, unit);
}

function drawRect(x, y) {
    c1.beginPath();
    c1.rect(x * unit, canvas1.height - unit - y * unit, unit, unit);
    c1.strokeStyle = '#00fbff';
    c1.strokeWidth = 5;
    c1.stroke();
}

function renderBg() {
    cbg.beginPath();
    cbg.rect(0, 0, canvasWidth, canvasHeight);
    cbg.fillStyle = '#1a1a1a';
    cbg.fill();
    for (let x = 0; x < boardCols; x++) {
        for (let y = 0; y < boardRows; y++) {
            cbg.beginPath();
            cbg.rect(x * unit, y * unit, unit, unit);
            cbg.fillStyle = (x + y) % 2 === 0 ? '#303030' : '#1a1a1a';
            cbg.fill();
        }
    }
}

function renderFixed(tileArray = board.getFixed()) {
    c3.clearRect(0, 0, canvas3.width, canvas3.height);
    tileArray.forEach(tile => {
        drawTile(
            tile.x * unit,
            canvas3.height - (tile.y + 1) * unit,
            tile.color,
            3
        );
    });
}

function renderFalling(tileArray = board.getFalling()) {
    c2.clearRect(0, 0, canvas2.width, canvas2.height);
    tileArray.forEach(tile => {
        drawTile(
            tile.x * unit,
            canvas3.height - (tile.y + 1) * unit,
            tile.color,
            2
        );
    });
}


///// Reset /////

function gameOver() {
    //   bgMusic.pause();
    //   bgMusic.currentTime = 0;
    //   sfxDeath.play();
    gameOverText.textContent = 'GAME OVER';
    gameOverButton.textContent = 'RESTART?';
    gameOverScreen.classList.remove('hidden');
}

//// Handle input ////
function getTile(offsetX, offsetY) {
  return {
    x: Math.floor(offsetX / unit),
    y: Math.floor((canvas1.height - offsetY) / unit)
  }
}

canvas1.addEventListener('mousedown', function(ev) {
    if (toggleFall || toggleClear || toggleSwitch) return;

    const { x, y } = getTile(ev.offsetX, ev.offsetY);
    startTurn(x, y);
});

canvas1.addEventListener('contextmenu', function(ev) {
    ev.preventDefault()
    if (!colorChange) return;

    const { x, y } = getTile(ev.offsetX, ev.offsetY);
    board.tile(x, y).change();
    renderFixed();
});

function startTurn(x, y) {
  selected = [x, y];
  canvas1.addEventListener('mousemove', dragSelected);
  canvas1.addEventListener('mouseup', removeListeners);
  canvas1.addEventListener('mouseout', removeListeners);
  
  function dragSelected(ev) {
    const { x:newX, y:newY } = getTile(ev.offsetX, ev.offsetY);
    if (newX === x && newY === y) {
      return;
    } else if (
      (x === newX && Math.abs(y - newY) === 1) ||
      (y === newY && Math.abs(x - newX) === 1)
    ) {
      removeListeners();
      board.switch(x, y, newX, newY);
      c1.clearRect(0, 0, canvas1.width, canvas1.height);
      startAnimateSwitch(clearTiles, newX, newY)
    } else {
      removeListeners();
    }
  }

  function removeListeners() {
    canvas1.removeEventListener('mousemove', dragSelected)
    canvas1.removeEventListener('mouseup', removeListeners)
    canvas1.removeEventListener('mouseout', removeListeners)
  }
}

// function startTurn(x, y) {
//     if (selected === null) {
//         navigator.vibrate(30);
//         drawRect(x, y);
//         selected = [x, y];
//     } else if (selected[0] === x && selected[1] === y) {
//         c1.clearRect(0, 0, canvas1.width, canvas1.height);
//         selected = null;
//     } else if (
//         (selected[0] === x && Math.abs(selected[1] - y) === 1) ||
//         (selected[1] === y && Math.abs(selected[0] - x) === 1)
//     ) {
//         navigator.vibrate(30);
//         selected === null
//         board.switch(selected[0], selected[1], x, y);
//         c1.clearRect(0, 0, canvas1.width, canvas1.height);
//         startAnimateSwitch(clearTiles, x, y)
//     }
// }

function clearTiles() {
    board.removeNulls();
    matches = board.clearMatches();
    renderFixed();
    renderFalling();
    if (matches.length) {
        incrementScore(matches.length * matches.length)
        startAnimateClear(
            () => startAnimateFall(clearTiles), matches
        )        
    } else {
        selected = null;
        possible = board.checkPossibleMoves();
        if (!possible.length) {
            gameOver();
        }
    }    
}

function startAnimateSwitch(callback, x, y, firstPass=true) {
    toggleSwitch = true;
    tile1 = [...selected];
    tile2 = [x, y];
    diffX = tile1[0] - tile2[0];
    diffY = tile1[1] - tile2[1];
    color2 = board.tile(tile1[0], tile1[1]).color
    color1 = board.tile(tile2[0], tile2[1]).color
    let counter = 0;
    c3.clearRect(tile1[0] * unit, canvas3.height - (tile1[1] + 1) * unit, unit, unit);
    c3.clearRect(tile2[0] * unit, canvas3.height - (tile2[1] + 1) * unit, unit, unit);

    animateSwitch()

    function animateSwitch() {
        stopSwitch = requestAnimationFrame(animateSwitch);
        c2.clearRect(0, 0, canvas2.width, canvas2.height);

        tile1[0] -= (diffX / 15)
        tile1[1] -= (diffY / 15)
        tile2[0] += (diffX / 15)
        tile2[1] += (diffY / 15)

        if (counter < 15) {
            drawTile(
                tile1[0] * unit,
                canvas2.height - (tile1[1] + 1) * unit,
                color1,
                2
            );
            drawTile(
                tile2[0] * unit,
                canvas2.height - (tile2[1] + 1) * unit,
                color2,
                2
            );
        } else {
            cancelAnimationFrame(stopSwitch);
            matches = board.checkColumns(board.checkRows());
            if (!matches.length && firstPass) {
                board.switch(selected[0], selected[1], x, y);
                startAnimateSwitch(callback, x, y, false);
            } else {
                toggleSwitch = false;
                selected = null;
                return callback();
            }
        }
        counter++;
    }
}

function startAnimateClear(callback, matches) {
    toggleClear = true;
    let particlesPerTile = Math.floor(120 / matches.length);
    let counter = 0; // used to call callback function early
    let doneCounter = particlesPerTile * matches.length
    let particles = [];

    for(let i = 0; i < matches.length; i++) {
        for (let j = 0; j < particlesPerTile; j++) {
            particles = shatterEmitter(matches[i], particles)
        }
    }
    
    function shatterEmitter(tile, particles) {
        let hue = colorHues[tile.color]
        let x = tile.x * unit + .5 * unit
        let y = (canvas1.height - tile.y * unit) - .5 * unit
    
        return [...particles, new ShatterParticle(x, y, hue)]
    } 

    animateClear()

    function animateClear() {
        stopClear = requestAnimationFrame(animateClear);
        // Clear out the old particles
        cfx.clearRect(0, 0, canvasFx.width, canvasFx.height);

        if (counter == 15) {
            callback();
        }

        // Draw all of our particles in their new location
        for(let i = 0; i < particles.length; i++) {
            if (!particles[i].done) {
              particles[i].draw(cfx);
            } else if (!particles[i].countedDone) {
              particles[i].countedDone = true
              doneCounter--
            }
        }
        if (doneCounter === 0 || counter > 1000) {
          particles = [];
          cancelAnimationFrame(stopClear);
          toggleClear = false;
        }
        counter++;
    }
}

function startAnimateFall(callback, tileArray = board.getFalling(), fixedTileArray = board.getFixed()) {
    const floor = board.columns.map(col => col.firstNull())

    animateFall()

    function animateFall() {
        stopFall = requestAnimationFrame(animateFall);
        c2.clearRect(0, 0, canvas2.width, canvas2.height);
        toggleFall = true;
        if (!tileArray.length) {
            cancelAnimationFrame(stopFall);
            toggleFall = false;
            return callback()
        }
        tileArray = tileArray.map(tile => {
            tile.y -= 0.1;
            return tile;
        });
        triggerFixed = false;
        tileArray = tileArray.filter(tile => {
            if (tile.y <= floor[tile.x] + 0.1) {
                tile.y = Math.floor(tile.y)
                fixedTileArray.push(tile);
                floor[tile.x]++
                triggerFixed = true;
                return false;
            } else {
                return true;
            }
        });
        tileArray.forEach(tile => {
            drawTile(
                tile.x * unit,
                canvas2.height - (tile.y + 1) * unit,
                tile.color,
                2
            );
        });
        if (triggerFixed) {
            renderFixed(fixedTileArray);
        }
    }
}


debugButton !== null && debugButton.addEventListener('click', ev => {
    ev.preventDefault();
});

debugButton !== null && debugButton.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    colorChange = true;
});

debugButton2 !== null && debugButton2.addEventListener('click', ev => {
    ev.preventDefault();
    console.log(
        'STATE:\n',
        'unit:', unit, '\n',
        'boardRows:', boardRows, '\n',
        'boardCols:', boardCols, '\n',
        'gameStarted:', gameStarted, '\n',
        'paused:', paused, '\n',
        'toggleClear:', toggleClear, '\n',
        'stopClear:', stopClear, '\n',
        'toggleFall:', toggleFall, '\n',
        'stopFall:', stopFall, '\n',
        'toggleSwitch:', toggleSwitch, '\n',
        'stopSwitch:', stopSwitch, '\n',
        'colorChange:', colorChange, '\n',
        'loseCondition:', loseCondition, '\n',
        'score:', score, '\n',
        'musicMute:', musicMute, '\n',
        'sfxMute:', sfxMute, '\n',
        'board:', board, '\n',
        'selected:', selected, '\n',
        'fallingTiles:', fallingTiles, '\n',
        'fixedTiles:', fixedTiles, '\n',
    );
});
