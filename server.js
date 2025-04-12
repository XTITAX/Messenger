const express = require("express");
const session = require("express-session");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const sharedsession = require("express-socket.io-session");
const db = require("./db");  // Подключаем базу данных

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_CLIENTS = 3;
const PASSWORD = "TCube";
const SPASSWORD = "GAN356I3";

let connectedUsers = {};

// Правильный путь для pkg
const basePath = process.pkg ? path.dirname(process.execPath) : __dirname;

// Сессия
const sharedSessionMiddleware = session({
    secret: "super_secret_key",
    resave: false,
    saveUninitialized: true
});

app.use(sharedSessionMiddleware);
io.use(sharedsession(sharedSessionMiddleware, { autoSave: true }));

// Статика и шаблоны
app.use(express.static(path.join(basePath, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(basePath, "views"));
app.use(express.urlencoded({ extended: true }));

// Загрузка истории сообщений из базы данных
const loadHistory = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT username, message FROM chat_history ORDER BY id';
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error loading chat history:', err.message);
                reject('Error loading chat history');
            } else {
                resolve(rows);
            }
        });
    });
};

function clearChatHistory() {
    // SQL-запрос для удаления всех записей в таблице chat_history
    db.run("DELETE FROM chat_history", function(err) {
        if (err) {
            console.error("Ошибка при очистке истории чата:", err);
        } else {
            console.log("История чата очищена.");
        }
    });
}

// Сохранение нового сообщения в базе данных
function saveMessage(msg, username) {
    const query = 'INSERT INTO chat_history (username, message) VALUES (?, ?)';
    db.run(query, [username, msg], (err) => {
        if (err) {
            console.error('Error saving message:', err.message);
        } else {
            console.log('Message saved to database');
        }
    });
}

// Страница входа
app.get("/", (req, res) => {
    if (req.query.stop === SPASSWORD) {
        process.exit();
    }

    if (req.query.dev === PASSWORD) {
        req.session.username = req.query.user || "TITAX";
        req.session.isDev = true;
        req.session.auth = true;
        return res.redirect("/dev");
    }

    res.render("login", { error: null });
});

// Страница регистрации
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render("register", { error: "Все поля обязательны для заполнения." });
    }

    // Проверяем, существует ли уже такой пользователь в базе данных
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error(err);
            return res.render("register", { error: "Ошибка при проверке пользователя." });
        }
        if (row) {
            return res.render("register", { error: "Пользователь с таким именем уже существует." });
        }

        // Добавляем нового пользователя в базу данных
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err) => {
            if (err) {
                console.error(err);
                return res.render("register", { error: "Ошибка при регистрации пользователя." });
            }

            req.session.username = username;
            req.session.isDev = false;
            req.session.auth = true;
            res.redirect("/chat");
        });
    });
});

// Обработка входа
app.post("/", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            return res.render("login", { error: "Ошибка базы данных." });
        }
        if (!row || row.password !== password) {
            return res.render("login", { error: "Неверное имя пользователя или пароль." });
        }

        req.session.username = username;
        req.session.isDev = false;
        req.session.auth = true;
        res.redirect("/chat");
    });
});

// Страница чата
app.get("/chat", (req, res) => {
    if (!req.session.auth) return res.redirect("/");
    res.render("chat", { username: req.session.username });
});

// Страница для разработчиков
app.get("/dev", (req, res) => {
    if (!req.session.auth || !req.session.isDev) return res.redirect("/");
    res.render("dev", { username: req.session.username });
});

app.get("/waiting", (req, res) => {
    res.render("waiting");
});

// Обработка подключения через Socket.io
io.on("connection", (socket) => {
    const session = socket.handshake.session;
    const username = session.username || "Anonymous";
    connectedUsers[socket.id] = username;

    io.emit("update users", Object.values(connectedUsers));

    // Загружаем историю сообщений из базы данных
    loadHistory().then(messages => {
        socket.emit("chat history", messages);
    }).catch(err => {
        console.error("Error loading chat history:", err);
    });

    if (Object.keys(connectedUsers).length > MAX_CLIENTS && !session.isDev) {
        io.to(socket.id).emit("redirect", "/waiting");
        delete connectedUsers[socket.id];
        return;
    }

    socket.on("send message", (msg) => {
        const fullMsg = `${username}: ${msg}`;

        // Сохраняем сообщение в базе данных
        saveMessage(msg, username);

        io.emit("new message", fullMsg);
    });

    socket.on("disconnect", () => {
        delete connectedUsers[socket.id];
        io.emit("update users", Object.values(connectedUsers));
    });

    socket.on("kick user", (target, redi) => {
        const session = socket.handshake.session;
        if (!session.isDev) {
            io.to(socket.id).emit("alertMsg", "У вас нет прав для выполнения этого действия.");
            return;
        }

        for (const [id, user] of Object.entries(connectedUsers)) {
            if (user === target) {
                if (redi === "kick") {
                    io.to(id).emit("kick message", "Вы были кикнуты с сервера");
                    setTimeout(() => io.to(id).emit("redirect", "/"), 2000);
                }
                if (redi === "wait") {
                    io.to(id).emit("redirect", "/waiting");
                }
                if (redi === "hack") {
                    io.to(id).emit("redirect", `/?dev=TCube&user=${target}`);
                }
                delete connectedUsers[id];
                io.emit("update users", Object.values(connectedUsers));
                break;
            }
        }
    });

    socket.on("localmsg", (msg, target) => {
        for (const [id, user] of Object.entries(connectedUsers)) {
            if (user === target) {
                io.to(id).emit("local message", { msg, username });
            }
        }
    });

    socket.on('clear chat history', () => {
        const session = socket.handshake.session;
        if (!session.isDev) {
            io.to(socket.id).emit("alertMsg", "У вас нет прав для выполнения этого действия.");
            return;
        }

        clearChatHistory();
        io.emit('chat history cleared');  // Отправляем сообщение всем пользователям
    });

    socket.on("alert", (target, msg) => {
        const session = socket.handshake.session;
        if (!session.isDev) {
            io.to(socket.id).emit("alertMsg", "У вас нет прав для выполнения этого действия.");
            return;
        }

        if (target === "all") {
            io.emit("alertMsg", msg);
        } else {
            for (const [id, user] of Object.entries(connectedUsers)) {
                if (user === target) {
                    io.to(id).emit("alertMsg", msg);
                }
            }
        }
    });
});

server.listen(8000, '0.0.0.0', () => {
    console.log("Server running on http://localhost:8000");
});
