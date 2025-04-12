# Настройка проекта

## 1. Установка зависимостей
Перед началом работы необходимо установить зависимости:

Выполните команду в корневой папке проекта:
```bash
npm install
```

##2. Настройка паролей
В коде вы увидите следующие поля:
1. <Пароль от Dev-панели>
2. <Пароль от выключения сервера>
Замените их на ваши пароли для соответствующих функций.

#Использование
##1. Запуск
Для запуска приложения выполните команду в корневой папке проекта:
```bash
npm run start
```

После этого откройте сайт в браузере по адресу:
```link
http://<Ваш подсетевой IP адрес>:8000/
```

Открытие порта 8000:
Если вы используете Windows, откройте порт через брандмауэр (инструкция по настройке здесь).

В Linux вам может понадобиться использовать команду sudo ufw allow 8000 для разрешения трафика на порт 8000.

##2. Команды и управление
###2.1. Вход в систему
Для входа в систему используйте следующие команды:

Вход в Dev-панель:
Для авторизации как разработчик (Dev-панель) откройте сайт с параметром ?dev=<Пароль от Dev-панели>, например:
```link
http://<Ваш подсетевой IP адрес>:8000/?dev=<Пароль от Dev-панели>
```
Здесь <Пароль от Dev-панели> — это пароль для доступа к Dev-панели. Замените его на ваш.

Остановка сервера:
Для остановки сервера откройте сайт с параметром ?stop=<Пароль от стопа>, например:
```link
http://<Ваш подсетевой IP адрес>:8000/?stop=<Пароль от выключения сервера>
```
Здесь <Пароль от выключения сервера> — это пароль для остановки сервера. Замените его на ваш.

###2.2. Управление чатом
Когда вы зайдете в чат, вы сможете:
1. Отправлять сообщения: Введите сообщение в поле и отправьте.
2. Сохранение сообщений: Все сообщения автоматически сохраняются в базе данных и отображаются всем пользователям чата.

###2.3. Функции для разработчиков
Если вы авторизовались как разработчик (через ?dev=<Пароль от Dev-панели>), вы получите доступ к дополнительным функциям:
1. Чистка истории чата (только для разработчиков): Для удаления всей истории чата введите команду /clear в консоли.
2. Кикать пользователей: Для того чтобы кикнуть пользователя с сервера, используйте команду kick <username>, где <username> — это имя пользователя, которого вы хотите выгнать.
3. Выводить предупреждения: Для отправки предупреждения пользователю используйте команду alert <username> <message>.
4. Перенаправить пользователя в очередь: Для того чтобы перенаправить пользователя в очередь, используйте команду wait <username>.
5. Эти команды доступны только разработчикам, и они могут использовать их в консоли приложения.

Структура проекта
public/ — Папка для статических файлов (CSS, JS, изображения).
views/ — Папка для шаблонов EJS.
db.js — Модуль для работы с базой данных (SQLite).
server.js — Главный серверный файл, обрабатывающий логику приложения.

Примечания
Для управления чатом и разработкой сервера вам нужно будет использовать соответствующие команды в URL-адресе или через консоль.
Убедитесь, что все пароли установлены правильно в коде, чтобы получить доступ к соответствующим панелям управления.
