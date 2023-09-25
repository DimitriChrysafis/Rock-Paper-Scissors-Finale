const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const graphCanvases = {
    "R": document.getElementById("rockGraph"),
    "P": document.getElementById("paperGraph"),
    "S": document.getElementById("scissorsGraph")
};
const graphCtx = {
    "R": graphCanvases["R"].getContext("2d"),
    "P": graphCanvases["P"].getContext("2d"),
    "S": graphCanvases["S"].getContext("2d")
};
const graphWidth = graphCanvases["R"].width;
const graphHeight = graphCanvases["R"].height;
const graphData = { "R": [], "P": [], "S": [] };
const graphMaxDataPoints = 50; // Number of data points to display on the graph
const maxGraphY = 50;

const objects = ["R", "P", "S"];
const objectColors = ["red", "blue", "green"];
const objectSizes = 40;
const maxSpeed = 4;
const initialCount = 20;
let score = { "R": 0, "P": 0, "S": 0 };
let sum = 0;
let gamePaused = false;
let winner = null;
let startTime = Date.now();

const objectsList = [];

function getRandomPosition() {
    const x = Math.random() * (canvas.width - objectSizes);
    const y = Math.random() * (canvas.height - objectSizes);
    return { x, y };
}

function getRandomVelocity() {
    const speed = (Math.random() * maxSpeed * 2) - maxSpeed;
    return speed;
}

function changeType(obj) {
    if (obj === "R") return "P";
    if (obj === "P") return "S";
    if (obj === "S") return "R";
}

function initializeObjects() {
    for (const obj of objects) {
        for (let i = 0; i < initialCount; i++) {
            const position = getRandomPosition();
            const velocityX = getRandomVelocity();
            const velocityY = getRandomVelocity();
            objectsList.push({ x: position.x, y: position.y, vx: velocityX, vy: velocityY, type: obj });
        }
    }
}

function drawObjects() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const obj of objectsList) {
        ctx.fillStyle = objectColors[objects.indexOf(obj.type)];
        ctx.fillRect(obj.x, obj.y, objectSizes, objectSizes);

        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(obj.type, obj.x + 10, obj.y + 25);
    }
}

function updateObjects() {
    if (gamePaused) return;

    for (const obj of objectsList) {
        obj.x += obj.vx;
        obj.y += obj.vy;

        if (obj.x < 0 || obj.x + objectSizes > canvas.width) {
            obj.vx *= -1;
        }
        if (obj.y < 0 || obj.y + objectSizes > canvas.height) {
            obj.vy *= -1;
        }
    }

    for (let i = 0; i < objectsList.length; i++) {
        for (let j = i + 1; j < objectsList.length; j++) {
            const objA = objectsList[i];
            const objB = objectsList[j];

            if (
                objA.x < objB.x + objectSizes &&
                objA.x + objectSizes > objB.x &&
                objA.y < objB.y + objectSizes &&
                objA.y + objectSizes > objB.y
            ) {
                if (objA.type !== objB.type) {
                    const dominantType = {
                        "RS": "R",
                        "PR": "P",
                        "SP": "S",
                        "SR": "R",
                        "PS": "S",
                        "RP": "P",
                    }[objA.type + objB.type];

                    // Update the objects based on dominance
                    objA.type = dominantType;
                    objB.type = dominantType;
                }
            }
        }
    }
}

function calculateCounts() {
    score = { "R": 0, "P": 0, "S": 0 };
    for (const obj of objectsList) {
        score[obj.type]++;
    }
    sum = score["R"] + score["P"] + score["S"];

    if (score["R"] === 0 && score["P"] === 0) {
        winner = "Scissors";
        gamePaused = true;
    } else if (score["P"] === 0 && score["S"] === 0) {
        winner = "Rock";
        gamePaused = true;
    } else if (score["S"] === 0 && score["R"] === 0) {
        winner = "Paper";
        gamePaused = true;
    }
}

function drawGraph() {
    for (const type of objects) {
        const data = graphData[type];

        if (data.length >= graphMaxDataPoints) {
            data.shift();
        }

        data.push(score[type]);

        const ctx = graphCtx[type];
        ctx.clearRect(0, 0, graphWidth, graphHeight);

        ctx.strokeStyle = objectColors[objects.indexOf(type)];
        ctx.beginPath();
        ctx.moveTo(50, 0);
        ctx.lineTo(50, graphHeight);
        ctx.moveTo(0, graphHeight);
        ctx.lineTo(graphWidth, graphHeight);
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText("Time", graphWidth - 25, graphHeight - 25);
        ctx.fillText("Score", 10, 10);

        ctx.strokeStyle = objectColors[objects.indexOf(type)];
        ctx.beginPath();
        ctx.moveTo(50, graphHeight - Math.min(maxGraphY, Math.max(0, data[0])));

        for (let j = 1; j < data.length; j++) {
            ctx.lineTo(((j / graphMaxDataPoints) * (graphWidth - 50)) + 50, graphHeight - Math.min(maxGraphY, Math.max(0, data[j])));
        }

        ctx.stroke();
    }
}

function drawHistogram() {
    const histogramCanvas = document.getElementById("histogram");
    const histogramCtx = histogramCanvas.getContext("2d");
    histogramCtx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

    const maxScore = Math.max(score["R"], score["P"], score["S"]);
    const barWidth = 50;
    const spacing = 20;
    const startX = 30;
    const startY = histogramCanvas.height - 30;

    for (const type of objects) {
        const count = score[type];
        const barHeight = (count / maxScore) * (histogramCanvas.height - 60);
        const x = startX + objects.indexOf(type) * (barWidth + spacing);

        histogramCtx.fillStyle = objectColors[objects.indexOf(type)];
        histogramCtx.fillRect(x, startY - barHeight, barWidth, barHeight);

        histogramCtx.fillStyle = "black";
        histogramCtx.fillText(type, x + barWidth / 2 - 10, startY + 20);
    }
}

function gameLoop() {
    drawObjects();
    updateObjects();
    calculateCounts();
    updateScore();
    updateElapsedTime();
    drawGraph();
    drawHistogram();
    if (winner) {
        displayWinner();
    }
    requestAnimationFrame(gameLoop);
}

function updateScore() {
    const scoreDiv = document.getElementById("score");
    scoreDiv.textContent = `Rock: ${score["R"]}, Paper: ${score["P"]}, Scissors: ${score["S"]} | Sum: ${sum}`;
}

function updateElapsedTime() {
    const elapsedTimeDiv = document.getElementById("elapsed-time");
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000); // in seconds
    elapsedTimeDiv.textContent = `Elapsed Time: ${elapsedTime} seconds`;
}

function displayWinner() {
    const winnerDiv = document.getElementById("winner");
    winnerDiv.textContent = `Winner: ${winner}`;
    winnerDiv.style.display = "block";
}

initializeObjects();
gameLoop();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
