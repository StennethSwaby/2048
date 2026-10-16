/* =========================================================
   NEON ARCADE — 2048
   ========================================================= */


// Number of rows and columns.
const BOARD_SIZE = 4;

// Get the HTML elements we will update.
const gameBoard = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const newGameButton = document.getElementById("new-game");

// The board is our source of truth.
// Each zero represents an empty cell.
let board = [];

// Game scores are stored in JavaScript memory only.
let score = 0;
let bestScore = 0;

let gameOver = false;

/**
 * Creates an empty 4x4 array.
 *
 * Array.from() generates the four rows.
 * Each row is a separate array containing four zeros.
 */
function createEmptyBoard() {
    return Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(0)
    );
}

/**
 * Creates the 16 visual cells inside our HTML game board.
 *
 * We call this once when the application starts.
 */
function createBoard() {
    gameBoard.innerHTML = "";

    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        gameBoard.appendChild(cell);
    }
}

/**
 * Finds all empty cells and randomly selects one.
 * A new tile is placed at that position.
 *
 * Standard 2048 typically spawns a 2 (90% chance)
 * or a 4 (10% chance).
 *
 * Returns false if the board has no empty cells.
 */
function spawnRandomTile() {
    const emptyCells = [];

    // Search every row and column for empty positions.
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 0) {
                emptyCells.push({ row, col });
            }
        }
    }

    // No space is available for a new tile.
    if (emptyCells.length === 0) {
        return false;
    }

    // Choose one of the available positions randomly.
    const randomIndex = Math.floor(
        Math.random() * emptyCells.length
    );

    const { row, col } = emptyCells[randomIndex];

    // Generate a 2 most of the time, otherwise a 4.
    board[row][col] = Math.random() < 0.9 ? 2 : 4;

    return true;
}

/**
 * Updates the webpage to match our JavaScript board array.
 *
 * This is called rendering.
 */
function renderBoard() {
    const cells = gameBoard.querySelectorAll(".cell");

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {

            // Convert a 2D position into a 1D index.
            const index = row * BOARD_SIZE + col;

            const cell = cells[index];
            const value = board[row][col];

            // Empty cells display no number.
            cell.textContent = value === 0 ? "" : value;

            // Reset old tile-specific classes.
            cell.className = "cell";

            // Add a class based on the tile's value.
            if (value !== 0) {
                cell.classList.add(`tile-${value}`);
            }
        }
    }

    // Keep the scoreboard synchronized with game state.
    scoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
}

/**
 * Resets the game to its starting state.
 */
function startNewGame() {
    board = createEmptyBoard();
    score = 0;
    gameOver = false;

    // A new game begins with two randomly placed tiles.
    spawnRandomTile();
    spawnRandomTile();

    renderBoard();
    checkGameStatus();
}

/**
 * Application entry point.
 */

/**
 * Slides and merges one row toward the left.
 *
 * Example:
 * [2, 0, 2, 4] becomes [4, 4, 0, 0].
 *
 * This function updates the score when tiles merge.
 * It does not directly change the webpage.
 */
function mergeRowLeft(row) {
    const numbers = row.filter(value => value !== 0);
    const merged = [];
    let points = 0;

    for (let i = 0; i < numbers.length; i++) {
        if (
            i + 1 < numbers.length &&
            numbers[i] === numbers[i + 1]
        ) {
            const newValue = numbers[i] * 2;

            merged.push(newValue);
            points += newValue;

            // A tile can only merge once per move.
            i++;
        } else {
            merged.push(numbers[i]);
        }
    }

    while (merged.length < BOARD_SIZE) {
        merged.push(0);
    }

    return {
        row: merged,
        points: points
    };
}

/**
 * Compares two boards to determine whether a move changed anything.
 *
 * If the board hasn't changed, we should NOT spawn a new tile.
 */
function boardsAreEqual(boardA, boardB) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (boardA[row][col] !== boardB[row][col]) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Moves all tiles in the requested direction.
 *
 * We reuse mergeRowLeft() for every direction by reversing
 * rows or reading columns as arrays.
 *
 * Returns a new board without changing the original board.
 */
function moveBoard(direction) {
    const nextBoard = board.map(row => [...row]);
    let pointsEarned = 0;

    if (direction === "left" || direction === "right") {
        for (let row = 0; row < BOARD_SIZE; row++) {
            const input = direction === "right"
                ? [...board[row]].reverse()
                : board[row];

            const result = mergeRowLeft(input);

            nextBoard[row] = direction === "right"
                ? result.row.reverse()
                : result.row;

            pointsEarned += result.points;
        }
    } else if (direction === "up" || direction === "down") {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const column = board.map(row => row[col]);

            const input = direction === "down"
                ? column.reverse()
                : column;

            const result = mergeRowLeft(input);

            const mergedColumn = direction === "down"
                ? result.row.reverse()
                : result.row;

            for (let row = 0; row < BOARD_SIZE; row++) {
                nextBoard[row][col] = mergedColumn[row];
            }

            pointsEarned += result.points;
        }
    }

    return {
        nextBoard: nextBoard,
        pointsEarned: pointsEarned
    };
}

/**
 * Handles a player's move.
 */
function handleMove(direction) {
    // Do not allow moves after winning or losing.
    if (gameOver) {
        return;
    }

    // Calculate the proposed move without changing the score.
    const result = moveBoard(direction);

    // An invalid move does not change the game.
    if (boardsAreEqual(board, result.nextBoard)) {
        return;
    }

    // Apply the successful move.
    board = result.nextBoard;
    score += result.pointsEarned;

    // Update the highest score.
    bestScore = Math.max(bestScore, score);

    // Generate one new tile.
    spawnRandomTile();

    // Refresh the interface and check for win/loss.
    renderBoard();
    checkGameStatus();
}

/**
 * Listens for keyboard input.
 *
 * event.key tells us which key was pressed.
 */
function handleKeyDown(event) {

    const directions = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down"
    };

    const direction = directions[event.key];

    // Ignore keys that are not arrow keys.
    if (!direction) {
        return;
    }

    // Prevent arrow keys from scrolling the webpage.
    event.preventDefault();

    handleMove(direction);
}

/**
 * Starts the application and connects user controls.
 */

/**
 * Checks whether the board contains a winning tile.
 *
 * Returns true if any tile is 2048 or greater.
 */
function hasWinningTile() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] >= 2048) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Checks whether the player can still make a valid move.
 *
 * A move is possible when:
 * 1. At least one cell is empty.
 * 2. Two horizontally adjacent tiles match.
 * 3. Two vertically adjacent tiles match.
 *
 * Returns false only when none of these conditions is true.
 */
function hasAvailableMoves() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {

            const value = board[row][col];

            // An empty cell means there is still space to move.
            if (value === 0) {
                return true;
            }

            // Compare the current tile with the one to its right.
            if (
                col < BOARD_SIZE - 1 &&
                value === board[row][col + 1]
            ) {
                return true;
            }

            // Compare the current tile with the one below it.
            if (
                row < BOARD_SIZE - 1 &&
                value === board[row + 1][col]
            ) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Checks whether the player has won or lost.
 *
 * When either condition is met:
 * - Display the result panel.
 * - Mark the game as finished.
 */

function checkGameStatus() {
    const resultPanel = document.getElementById("game-result");
    const resultTitle = document.getElementById("result-title");
    const resultMessage = document.getElementById("result-message");

    if (hasWinningTile()) {
        gameOver = true;

        resultTitle.textContent = "YOU WIN!";
        resultMessage.textContent = "Congratulations! You reached 2048.";
        resultPanel.hidden = false;
        return;
    }

    if (!hasAvailableMoves()) {
        gameOver = true;

        resultTitle.textContent = "GAME OVER";
        resultMessage.textContent = "No moves remaining. Try again!";
        resultPanel.hidden = false;
        return;
    }

    // The game is still active.
    resultPanel.hidden = true;
}

function main() {
    createBoard();
    startNewGame();

    // Restart when the New Game button is clicked.
    newGameButton.addEventListener("click", startNewGame);

    // Listen for arrow keys anywhere on the page.
    document.addEventListener("keydown", handleKeyDown);
}

// Start the application.
main();
