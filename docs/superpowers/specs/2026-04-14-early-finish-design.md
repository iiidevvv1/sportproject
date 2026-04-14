# Фича: Досрочное завершение игры

**Дата:** 2026-04-14  
**Статус:** ✅ Одобрено  
**Автор:** Спортсмен  

---

## Обзор

Позволяет завершить игру раньше `max_ends` с опциональным вводом счёта текущего энда. Оставшиеся энды автоматически создаются как "плейсхолдеры" (отображаются как X в таблице).

## Требования

### Функциональные

1. **Триггер:** Нажата кнопка "Завершить досрочно" (существующая кнопка в футере InGame)
2. **Диалог:** "Ввести результат этого энда?" с двумя вариантами:
   - ДА → открыть модаль EndResult, ввести счёт текущего энда
   - НЕТ → пропустить ввод, закончить сразу
3. **Создание плейсхолдеров:** Все оставшиеся энды до `max_ends` создаются автоматически с `status='placeholder'`
4. **Молот:** Для каждого плейсхолдера рассчитывается молот по стандартным правилам
5. **Финиш:** После создания всех эндов игра завершается (`status='finished'`)
6. **Атомарность:** Все операции выполняются в одной БД транзакции
7. **Отображение:** На Stats странице плейсхолдеры отображаются как X, обычные блэнк энды (0:0, `status='played'`) как 0:0

### Технические

- Новая колонка в таблице `ends`: `status TEXT DEFAULT 'played'`
  - `'played'` = обычный энд (сыгран или блэнк)
  - `'placeholder'` = X энд (создан при досрочном финише)
- Новый backend endpoint: `POST /api/games/:id/early-finish`
- Переиспользуется компонент `EndResult` для ввода результата
- Новый компонент диалога: `EarlyFinishDialog`

---

## Архитектура

### База данных

**Migration:** Добавить колонку в `ends` таблицу
```sql
ALTER TABLE ends ADD COLUMN status TEXT DEFAULT 'played';
```

### Backend

**Endpoint:** `POST /api/games/:id/early-finish`

**Request body:**
```typescript
{
  endNumber: number;        // текущий энд (тот, для которого можно ввести результат)
  scoreHome?: number;       // счёт домашней команды (если введён)
  scoreAway?: number;       // счёт гостей (если введён)
  skipResult: boolean;      // true = пропустить ввод результата
}
```

**Response:**
```typescript
{
  success: boolean;
  game_id: number;
  ends_created: number;     // количество созданных плейсхолдеров
}
```

**Логика обработчика:**
1. Найти игру по ID
2. Если `skipResult=false` и scoreHome/scoreAway переданы:
   - Создать энд с переданными score и `status='played'`
3. Создать все оставшиеся энды (от `endNumber+1` до `game.max_ends`):
   - `score_home=0, score_away=0, status='placeholder'`
   - Рассчитать молот по стандартным правилам (`getHammerForEnd`)
4. Обновить игру: `status='finished'`
5. Вернуть success

**Важно:** Всё выполнить в одной транзакции (SQLite `BEGIN ... COMMIT`)

### Frontend

**Компоненты:**

1. **EarlyFinishDialog** (новый)
   - Диалог с двумя кнопками: "Ввести результат" и "Пропустить"
   - Props: `isOpen`, `onYes`, `onNo`
   - Управляется из InGame.tsx

2. **InGame.tsx** (модифицировать)
   - Добавить state: `showEarlyFinishDialog`
   - Добавить handler для кнопки "Завершить досрочно"
   - При клике на кнопку → открыть диалог
   - При ДА → открыть модаль EndResult
   - При НЕТ или после сохранения EndResult → вызвать POST `/api/games/:id/early-finish`
   - После успеха → редирект на Stats

3. **Stats.tsx** (модифицировать)
   - При отображении таблицы эндов проверять `end.status`
   - Если `status='placeholder'` → показать "X"
   - Иначе → показать `score_home:score_away`

**API Hook:**

Добавить в `api.ts`:
```typescript
export async function earlyFinishGame(
  gameId: number,
  body: {
    endNumber: number;
    scoreHome?: number;
    scoreAway?: number;
    skipResult: boolean;
  }
): Promise<any>
```

---

## Поток взаимодействия

```
Пользователь нажимает "Завершить досрочно"
    ↓
[EarlyFinishDialog] "Ввести результат этого энда?"
    ↓
    ├─ ДА
    │   ↓
    │   [EndResult Modal] ввести score текущего энда
    │   ↓
    │   Сохранить → вызвать POST /api/games/:id/early-finish {endNumber, scoreHome, scoreAway, skipResult:false}
    │   ↓
    │
    └─ НЕТ
        ↓
        Сразу вызвать POST /api/games/:id/early-finish {endNumber, skipResult:true}
        ↓

Сервер:
  1. Если skipResult=false: создать энд с переданными score, status='played'
  2. Создать все оставшиеся энды (до max_ends) с score=0:0, status='placeholder'
  3. Обновить game.status='finished'
  4. Вернуть успех
  
Фронтенд:
  ↓
  Редирект на /stats/:id
  ↓
  Таблица эндов отображает плейсхолдеры как X
```

---

## Тестирование

### Backend

- Unit test для `/api/games/:id/early-finish`:
  - ДА с вводом score: энд создан, плейсхолдеры созданы, игра завершена
  - НЕТ без ввода: плейсхолдеры созданы, игра завершена
  - Молот рассчитан корректно для каждого плейсхолдера
  - Атомарность: при ошибке ничего не создаётся

### Frontend

- End-to-end: нажать "Завершить досрочно" → диалог → ввести score → Stats показывает X для плейсхолдеров

---

## Миграция БД

```sql
ALTER TABLE ends ADD COLUMN status TEXT DEFAULT 'played';

-- Обновить существующие энды (если есть)
UPDATE ends SET status = 'played' WHERE status IS NULL;
```

---

## Статус

- ✅ Дизайн одобрен (2026-04-14)
- ⏳ План реализации в разработке
- ⏳ Реализация
- ⏳ Тестирование
- ⏳ Deployment
