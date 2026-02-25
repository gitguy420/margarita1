# Маргарита — Telegram Mini App (Синастрия + PDF)

Это прототип Telegram Mini App, который собирает данные двух людей и генерирует PDF‑отчёт о совместимости. Дизайн и текст — оригинальные, ориентированные на женскую аудиторию, с мягкой эстетикой и эмодзи.

## Что уже есть
- Форма Telegram Mini App на 2 человек (имя, фамилия, дата, время, регион, город)
- Обработка варианта «время неизвестно»
- Реальные астрономические расчёты позиций планет (через `astronomy-engine`)
- Расчёт аспектов между картами
- Генерация PDF через Puppeteer
- Данные городов РФ (пока демо, есть скрипт для полной базы)

## Важно про расчёты
Мы **не используем Swiss Ephemeris** (AGPL/коммерческая лицензия). Расчёты основаны на `astronomy-engine` (MIT), что подходит для коммерческого закрытого продукта.

## Запуск

### 1) Сервер
```bash
cd /Users/sasharomanov/Documents/TG/server
npm install
npm run dev
```

### 2) Фронтенд
```bash
cd /Users/sasharomanov/Documents/TG/web
npm install
npm run dev
```

Откройте `http://localhost:5173`.

## Полная база городов РФ
Сейчас используется демо‑файл `server/src/data/ru_cities.json`. Для загрузки полного списка (все города РФ):

```bash
/Users/sasharomanov/Documents/TG/scripts/fetch_cities.sh
```

Если источник изменится, можно указать собственный путь через `RU_CITIES_PATH`.

## Структура
- `/Users/sasharomanov/Documents/TG/server` — API + PDF генерация
- `/Users/sasharomanov/Documents/TG/web` — Telegram Mini App
- `/Users/sasharomanov/Documents/TG/refs` — референсы

## Следующие улучшения
- Добавить вычисление домов/асцендента при известном времени
- Улучшить нарратив под конкретные аспекты
- Сократить PDF или сделать «расширенную» версию

## Deploy: Vercel (web) + Render (backend)

Ниже готовый рабочий путь под ваш выбор: фронт на Vercel, API/PDF на Render.

### 1) Backend на Render

1. Запушить проект в GitHub.
2. В Render создать новый `Web Service` из репозитория.
3. Runtime: `Docker`.
4. Root directory: `server`.
5. Можно использовать [`server/render.yaml`](/Users/sasharomanov/Documents/TG/server/render.yaml) как blueprint.
6. В переменных окружения сервиса задать:
   - `NODE_ENV=production`
   - `BRAND_NAME=Margarita` (или ваш бренд)
   - `CORS_ORIGIN=https://<your-vercel-domain>` (например `https://margarita.vercel.app`)
7. Дождаться деплоя и проверить:
   - `GET https://<render-domain>/api/status`

Пример env: [`server/.env.example`](/Users/sasharomanov/Documents/TG/server/.env.example)

### 2) Frontend на Vercel

1. В Vercel импортировать тот же репозиторий.
2. Root directory проекта: `web`.
3. Framework preset: Vite (или автоопределение).
4. Добавить env:
   - `VITE_API_URL=https://<render-domain>`
5. Деплой.

Vercel конфиг: [`web/vercel.json`](/Users/sasharomanov/Documents/TG/web/vercel.json)  
Пример env: [`web/.env.example`](/Users/sasharomanov/Documents/TG/web/.env.example)

### 3) Создание Telegram-бота через BotFather

1. Открыть `@BotFather`.
2. Выполнить `/newbot`.
3. Указать имя и username (username должен заканчиваться на `bot`).
4. Сохранить токен (формат вроде `123456:ABC...`).

### 4) Подключение Mini App URL

1. В `@BotFather` открыть `/mybots` -> выбрать вашего бота.
2. `Bot Settings` -> `Menu Button` -> `Configure menu button`.
3. Указать:
   - `Button name`: например `Открыть Маргариту`
   - `Web App URL`: `https://<your-vercel-domain>`
4. Открыть бота в Telegram и нажать кнопку меню.

### 5) Минимальная проверка прода

1. Форма открывается внутри Telegram без ошибок.
2. Регионы/города загружаются.
3. Генерация PDF работает за 10-30 секунд.
4. В логах backend нет ошибок CORS.
