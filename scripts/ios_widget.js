// FuelTracker — iOS виджет для Scriptable
// =====================================================================
// Установка:
// 1. Установить приложение "Scriptable" из App Store (бесплатно)
// 2. Открыть Scriptable → + → вставить этот код
// 3. Заменить API_URL и API_KEY своими значениями
// 4. Зажать рабочий стол → + → Scriptable → выбрать этот скрипт
// =====================================================================

const API_URL = "https://your-domain.com/api/v1"; // ← заменить
const API_KEY = "your-api-key-here";               // ← заменить

// ── Загрузка данных ──────────────────────────────────────────────────
async function fetchStats() {
  const req = new Request(`${API_URL}/stats`);
  req.headers = { "X-API-Key": API_KEY };
  try {
    return await req.loadJSON();
  } catch (e) {
    return null;
  }
}

// ── Форматирование ───────────────────────────────────────────────────
function formatOdometer(km) {
  return km ? km.toLocaleString("ru-RU") + " км" : "—";
}
function formatConsumption(c) {
  return c ? c.toFixed(2) + " л/100" : "—";
}
function formatCurrency(n) {
  return n ? Math.round(n).toLocaleString("ru-RU") + " ₽" : "—";
}

// ── Цвета ────────────────────────────────────────────────────────────
const ORANGE = new Color("#f97316");
const BG     = new Color("#1e293b");
const DIM    = new Color("#64748b");
const WHITE  = new Color("#f1f5f9");

// ── Построение виджета ───────────────────────────────────────────────
async function buildWidget(stats) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#0f172a");
  w.setPadding(14, 16, 14, 16);
  w.url = API_URL.replace("/api/v1", ""); // Открыть приложение при тапе

  // Заголовок
  const header = w.addStack();
  header.layoutHorizontally();
  const icon = header.addText("⛽");
  icon.font = Font.systemFont(16);
  header.addSpacer(6);
  const title = header.addText("FuelTracker");
  title.font = Font.boldSystemFont(15);
  title.textColor = ORANGE;

  w.addSpacer(10);

  if (!stats) {
    const err = w.addText("Нет данных");
    err.font = Font.systemFont(12);
    err.textColor = DIM;
    return w;
  }

  // Пробег
  const odoRow = w.addStack();
  odoRow.layoutHorizontally();
  const odoLabel = odoRow.addText("Пробег  ");
  odoLabel.font = Font.systemFont(11);
  odoLabel.textColor = DIM;
  const odoVal = odoRow.addText(formatOdometer(stats.last_odometer));
  odoVal.font = Font.boldSystemFont(13);
  odoVal.textColor = WHITE;

  w.addSpacer(6);

  // Расход (всё время и 30д)
  const consRow = w.addStack();
  consRow.layoutHorizontally();

  const c1 = consRow.addStack();
  c1.layoutVertically();
  const c1Label = c1.addText("Расход");
  c1Label.font = Font.systemFont(10);
  c1Label.textColor = DIM;
  const c1Val = c1.addText(formatConsumption(stats.avg_consumption));
  c1Val.font = Font.boldSystemFont(13);
  c1Val.textColor = ORANGE;

  consRow.addSpacer();

  const c2 = consRow.addStack();
  c2.layoutVertically();
  const c2Label = c2.addText("30 дней");
  c2Label.font = Font.systemFont(10);
  c2Label.textColor = DIM;
  const c2Val = c2.addText(formatConsumption(stats.avg_consumption_30d));
  c2Val.font = Font.boldSystemFont(13);
  c2Val.textColor = WHITE;

  w.addSpacer(6);

  // Потрачено
  const costRow = w.addStack();
  costRow.layoutHorizontally();
  const costLabel = costRow.addText("Итого  ");
  costLabel.font = Font.systemFont(11);
  costLabel.textColor = DIM;
  const costVal = costRow.addText(formatCurrency(stats.total_cost));
  costVal.font = Font.boldSystemFont(13);
  costVal.textColor = WHITE;

  w.addSpacer(8);

  // Время обновления
  const now = new Date();
  const updated = w.addText(`Обновлено ${now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`);
  updated.font = Font.systemFont(9);
  updated.textColor = DIM;

  return w;
}

// ── Запуск ───────────────────────────────────────────────────────────
const stats  = await fetchStats();
const widget = await buildWidget(stats);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Превью при запуске из Scriptable
  await widget.presentSmall();
}
Script.complete();
