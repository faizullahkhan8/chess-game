const socket = io();
const chess = new Chess();
const boardElement = document.querySelector("#chessBoard");
const playerRoleElem = document.querySelector("#playerTurn");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let playerTurn = true;
let invalidMove = false;

const renderBoard = () => {
    const board = chess.board();
    playerRoleElem.innerText = playerTurn ? "White's turn" : "Black's turn";
    boardElement.innerHTML = "";
    boardElement.classList.add(playerRole === "b" ? "flipped" : "notFlipped");

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        pieceElement.classList.add("draggable");
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });
};
const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q",
    };

    socket.emit("move", move);
};
const getPieceUnicode = (piece) => {
    const chessPieces = {
        K: "♔", // King
        Q: "♕", // Queen
        R: "♖", // Rook
        B: "♗", // Bishop
        N: "♘", // Knight
        P: "♙", // Pawn
        k: "♔", // King
        q: "♕", // Queen
        r: "♖", // Rook
        b: "♗", // Bishop
        n: "♘", // Knight
        p: "♙", // Pawn
    };

    return chessPieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spactatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    playerTurn = !playerTurn;
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", (move) => {
    invalidMove = move ? ture : false;
});

renderBoard();
