const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Создаем или открываем базу данных
const db = new sqlite3.Database(path.join(__dirname, 'db.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Database connected successfully');
    }
});

// Создаем таблицу пользователей, если она не существует
const createUsersTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        );
    `;
    db.run(query, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table created successfully');
        }
    });
};

// Обновлённая версия создания таблицы чатов без столбца timestamp
const createChatTableWithoutTimestamp = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            message TEXT NOT NULL
        );
    `;
    db.run(query, (err) => {
        if (err) {
            console.error('Error creating chat history table:', err.message);
        } else {
            console.log('Chat history table created successfully');
        }
    });
};

// Вызываем функцию для создания таблицы
createChatTableWithoutTimestamp();

// Вызываем функцию для создания таблицы пользователей
createUsersTable();

module.exports = db;
