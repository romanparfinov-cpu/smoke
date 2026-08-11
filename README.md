# ISTERIKA - Vape Store & Catalog

Премиальный каталог вейп-продукции **ISTERIKA** с онлайн-заказами, панелью администратора, авторизацией Google и интеграцией Firebase / Telegram.

---

## 🚀 Быстрый запуск на Vercel

### Шаг 1. Скачивание проекта и загрузка на GitHub
1. Скачайте проект через меню **Settings -> Export to ZIP** или **Export to GitHub** в AI Studio.
2. Если вы скачали ZIP-архив:
   - Распакуйте его на компьютере.
   - Инициализируйте Git и создайте репозиторий на GitHub:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/isterika-vape-store.git
     git push -u origin main
     ```

### Шаг 2. Деплой на Vercel
1. Перейдите на [vercel.com](https://vercel.com/) и войдите через GitHub.
2. Нажмите **Add New... -> Project**.
3. Выберите ваш репозиторий **isterika-vape-store**.
4. **Framework Preset**: Выберите **Vite**.
5. Нажмите **Deploy**.

---

## 🛠 Локальная разработка

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Запустите локальный сервер разработки:
   ```bash
   npm run dev
   ```
3. Откройте в браузере: `http://localhost:3000`

---

## 📦 Сборка для продакшена

```bash
npm run build
```
Готовые статические файлы будут в папке `dist/`.
