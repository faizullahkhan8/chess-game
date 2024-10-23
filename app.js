const express = require("express");
const { createServer } = require("http");
const socket = require("socket.io");
const path = require("path");
const { Chess } = require("chess.js");

const app = express();
const server = createServer(app);
const io = socket(server);
const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res, next) {
    res.render("index", { title: "Chess game" });
});

io.on("connection", (uniqueSocket) => {
    console.log("connected");

    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");
    } else {
        uniqueSocket.emit("spactatorRole");
    }

    uniqueSocket.on("disconnect", () => {
        if (players.white === uniqueSocket.id) {
            delete players.white;
        } else if (players.black === uniqueSocket.id) {
            delete players.black;
        }
    });

    uniqueSocket.on("move", (move) => {
        try {
            if (chess.turn() === "b" && uniqueSocket.id !== players.black)
                return;
            if (chess.turn() === "w" && uniqueSocket.id !== players.white)
                return;

            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move", move);
                uniqueSocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(error);
            uniqueSocket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, () => {
    console.log("server listing on port 3000");
});
