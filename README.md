# ЕРЛЕР — Цифровой мемориал героев Казахстана

## Структура проекта

```
erler-project/
├── index.html          ← Главная страница (frontend)
├── api/
│   └── heroes.js       ← Vercel Serverless API (backend)
├── package.json
├── vercel.json
└── README.md
```

---

## Деплой на Vercel (пошаговая инструкция)

### 1. Установите Vercel CLI
```bash
npm i -g vercel
```

### 2. Создайте Vercel KV базу данных
1. Зайдите на vercel.com → Dashboard → Storage → Create Database → **KV**
2. Дайте имя (например `erler-db`)
3. После создания нажмите **Connect to Project** и выберите ваш проект

### 3. Подключите переменные окружения
В настройках Vercel проекта добавьте переменную:
```
ADMIN_PASSWORD = ваш_секретный_пароль
```

> ⚠️ Обязательно смените пароль `erler2024` в `index.html` и поставьте то же значение в env var.

### 4. Деплой
```bash
cd erler-project
vercel deploy --prod
```

---

## Как работает база данных

### Режим standalone (без backend)
Сейчас `index.html` использует **localStorage** — данные хранятся в браузере.  
Это отлично для разработки и тестирования.

### Режим Vercel + KV (production)
Замените функции в `DB` объекте в `index.html` на fetch-вызовы к API:

```javascript
// Пример: загрузить одобренных героев
const res = await fetch('/api/heroes?action=heroes');
const { data } = await res.json();
HEROES = data;

// Пример: отправить заявку
await fetch('/api/heroes?action=submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

// Пример: одобрить (с токеном)
await fetch('/api/heroes?action=approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_PASSWORD },
  body: JSON.stringify({ id: heroId })
});
```

---

## Функции модерации

| Действие | Кто | Как |
|----------|-----|-----|
| Отправить запись | Любой пользователь | Форма на сайте |
| Одобрить запись | Модератор/Админ | Панель модератора (кнопка ✓) |
| Отклонить запись | Модератор/Админ | Панель модератора (кнопка ✕) |
| Удалить запись | Модератор/Админ | Панель модератора или в карточке |

---

## Вход для модераторов

1. Нажмите кнопку **⚙ Admin** в правом верхнем углу
2. Введите пароль
3. Откроется панель модератора (снизу справа)

**Текущий пароль:** `erler2024` (смените перед деплоем!)

---

## Рекомендации по развитию

1. **Supabase вместо Vercel KV** — бесплатный PostgreSQL, удобная админка, авторизация через Supabase Auth
2. **Cloudinary** — для хранения фотографий героев (localStorage лимит 5MB)
3. **Email уведомления** — через Resend.com при новых заявках
4. **Модерация на Telegram** — бот уведомляет в чат о новых заявках с кнопками "Одобрить/Отклонить"
5. **Поиск** — добавить поле поиска по имени в секции "Архив"
6. **Страница каждого героя** — отдельный URL (`/heroes/1`) для SEO и шейринга
