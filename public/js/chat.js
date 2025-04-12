document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    const chat = document.getElementById("chat");
    const form = document.getElementById("message-form");
    const input = document.getElementById("message");
    const userList = document.getElementById("user-list");

    const messages = [];

    function append(msg, system = false) {
        const div = document.createElement("div");
        div.classList.add('message');
        div.textContent = msg;
        div.id = "msg-" + Date.now(); 
        if (!system) {
            div.addEventListener("click", () => deleteMessage(div.id));
        }
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
        messages.push(div);
    }  

    socket.on("connect", () => {
        append("[Система] Подключено к серверу.", true);
    });

    socket.on("reject", msg => {
        append("[Система] " + msg, true);
    });

    // Обработка истории чата
    socket.on("chat history", history => {
        history.forEach(line => {
            if (line.trim() !== "") append(line);
        });
    });

    socket.on("new message", msg => {
        append(msg);
    });

    socket.on("kick message", msg => {
        append("[Система] " + msg, true);
    });

    socket.on("alertMsg", msg => {
        alert(msg)
    });

    socket.on("local message", (data) => {
        const msg = data.msg;
        const username = data.username;
        
        if (msg && username) {
            append("[" + username + " Шепчет вам] " + msg, true);
        } else {
            console.error("Ошибка в данных: ", data);
        }
    });       

    // Обработка списка пользователей
    socket.on("update users", users => {
        userList.innerHTML = ''; // Очистить текущий список
        users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = user;
            userList.appendChild(li);
        });
    });

    socket.on('update dev users', (users) => {
        const devUserList = document.getElementById('dev-user-list');
        devUserList.innerHTML = "";  // Очищаем текущий список
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.textContent = user;
            devUserList.appendChild(listItem);
        });
    });

    // Редирект при кике
    socket.on("redirect", url => {
        window.location.href = url;
    });

    // Функция для очистки истории чата в базе данных
    window.clearChat = function() {
        if (confirm("Вы уверены, что хотите очистить историю чата?")) {
            socket.emit('clear chat history');  // Отправляем запрос на сервер для очистки
        }
    };

    socket.on('chat history cleared', () => {
        append("[Система] История чата была очищена в базе данных.", true);
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            socket.emit("send message", text);
            input.value = "";
        }
    });

    // Функции для других действий (кик, локальные сообщения и т.д.)
    window.kickUser = function() {
        const usernameToKick = prompt("Введите имя пользователя для кика:");
        if (usernameToKick) {
            socket.emit("kick user", usernameToKick, "kick");
        }
    };

    window.localMsg = function() {
        const usernameToLocalMsg = prompt("Введите имя пользователя для отправки локального сообщения:");
        const msgToLocalMsg = prompt("Введите сообщение для отправки локального сообщения:");
        if (usernameToLocalMsg) {
            if (msgToLocalMsg) {
                socket.emit("localmsg", msgToLocalMsg, usernameToLocalMsg);
            }
        }
    };
});