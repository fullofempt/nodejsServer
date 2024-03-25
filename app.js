const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { initTicTacToe } = require('./ticTacToe');

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;



let gameStates = {};
let activeSessions = {
    sessionId: [
        "Session 1",
        "Session 2",
    ]
}; //массив для сессий
let activePlayers = {
    players: [
        "Игрок 1",
        "Игрок 2",
        "Игрок 3",
    ],
    playerId: [
        "Игрок 11",
        "Игрок 22",
        "Игрок 33",
    ]
}; //массив для сессий

// Функция создания рандомного айдишника
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}



// Создание новой сессии
app.post('/user/add', (req, res) => {
    const playerId = generateId();
    activePlayers[playerId] = { name: req.body.name }; //имя игрока передается в теле запроса
    console.log('Игрок создан:', activePlayers[playerId]);
    res.status(200).json({ playerId });
});

//вывод всех существующик игроков
app.get("/user/get", (req, res) => {
    const allPlayers = Object.values(activePlayers);
    console.log('Все игроки:', allPlayers);
    res.status(200).json(allPlayers);
})



app.post('/session/create/', (req, res) => {
    const sessionId = generateId();
    activeSessions[sessionId] = { id: sessionId };
    console.log('Сессия создалась:', activeSessions[sessionId]);
    res.status(200).json({ sessionId });
})

app.get("/session/get/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;
    if (activeSessions[sessionId]) {
        console.log('Сессия:', activeSessions[sessionId]);
        res.status(200).json(activeSessions[sessionId]); 
    } else {
        res.status(404).json({ error: 'Сессия не найдена' });
    }
})

app.get("/session/get_all", (req, res) => {
    const allSessions = Object.values(activeSessions);
    console.log('Все Cессии:', allSessions);
    res.status(200).json(allSessions);
})

// app.post('/session/join/:sessionId', (req, res) => {
//     const sessionId = req.params.sessionId;
//     if (activeSessions[sessionId]) {
//         const playerId = Math.random().toString(36).substring(2, 9);
//         activeSessions[sessionId].players.push(playerId);
//         res.send(`Сессия ID: ${sessionId}, ID Игрока: ${playerId}`);
//     } else {
//         res.status(404).json({ error: 'Сессия не найдена' });
//     }
// });

// Присоединение к существующей сессии
app.post('/session/join/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    if (activeSessions[sessionId]) {
        const playerId = Math.random().toString(36).substring(2, 9);
        activeSessions[sessionId].players.push(playerId);
        res.send(`Joined session with session ID: ${sessionId}, player ID: ${playerId}`);
    } else {
        res.status(404).json({ error: 'Сессия не найдена' });
    }
});

app.post('/session/:sessionId/play', (req, res) => {
    const sessionId = req.params.sessionId;
    const playerId = req.body.playerId;

    // Создание нового экземпляра игры, если он не существует
    if (!gameStates[sessionId]) {
        gameStates[sessionId] = {
            currentPlayer: 'X', // Начальный игрок
            board: ['', '', '', '', '', '', '', '', ''] 
        };
    }

    res.status(200).json(gameStates[sessionId]);
});

// Определение маршрута для хода игрока в игре крестики-нолики
app.post('/session/:sessionId/move', (req, res) => {
    const sessionId = req.params.sessionId;
    const playerId = req.body.playerId;
    const cellIndex = req.body.cellIndex;

    if (!gameStates[sessionId]) {
        return res.status(404).json({ error: 'Игра не найдено' });
    }

    const gameState = gameStates[sessionId];

    // является ли текущий игрок действительным игроком в сессии

    if (gameState.currentPlayer !== playerId) {
        return res.status(403).json({ error: 'Не твой ход' });
    }

    // является ли выбранная ячейка пустой
    if (gameState.board[cellIndex] !== '') {
        return res.status(400).json({ error: 'Клетка занята' });
    }

    // Установка метки текущего игрока в выбранной ячейке
    gameState.board[cellIndex] = gameState.currentPlayer;

    // Смена текущего игрока
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';

    res.status(200).json(gameState);
});

// Определение маршрута для получения текущего состояния игры
app.get('/session/:sessionId/state', (req, res) => {
    const sessionId = req.params.sessionId;

    if (!gameStates[sessionId]) {
        return res.status(404).json({ error: 'Игра не найдена' });
    }

    res.status(200).json(gameStates[sessionId]);
});

// Разрешаем доступ к статическим файлам
app.use(express.static(path.join(__dirname, 'public')));

// Рендерим HTML страницу
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка события с помощью сокетов
io.on('connection', (socket) => {
    console.log('A user connected.');
    initTicTacToe(socket); 

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
