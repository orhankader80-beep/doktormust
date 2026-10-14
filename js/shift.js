"use strict";

/* ===== MESAİ SAATİ ===== */

// Klinikte oyunun kendi saati işler: gün 09:00'da başlar, bakılan her hasta saati ilerletir,
// 17:00'de mesai biter ve bekleyen hastalar gider. Klinik kapandıktan sonra yeni gün ancak
// gerçek zamanla 15 dakika geçince başlatılabilir (oyun kapalıyken de süre işler).
// Saat yalnızca genel klinik hastalarıyla ilerler; bölümler, hikâye ve mini oyunlar etkilenmez.
const SHIFT_OPEN = 9 * 60;
const SHIFT_CLOSE = 17 * 60;
const SHIFT_REST = 15 * 60 * 1000;

let shiftTimer = null;

function clockText() {
    const minute = state.shift.minute;
    return String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0");
}

// Yeni günün başlamasına kalan süre (milisaniye). Cihazın saati geri alınsa bile 15 dakikayı aşmaz.
function shiftWait() {
    if (!state.shift.closed || !state.shift.closedAt) return 0;
    return clamp(state.shift.closedAt + SHIFT_REST - Date.now(), 0, SHIFT_REST);
}

function waitText() {
    const seconds = Math.ceil(shiftWait() / 1000);
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

// Bir hastaya bakılınca saati ilerletir. Mesai bittiyse gün sonu yazısını, bitmediyse "" döndürür.
function advanceShift(minutes, stars) {
    const shift = state.shift;
    if (shift.closed) return "";

    shift.minute = Math.min(shift.minute + minutes, SHIFT_CLOSE);
    shift.cases++;
    shift.stars += stars;

    if (shift.minute < SHIFT_CLOSE) return "";

    const bonus = 20 + shift.stars * 2;

    shift.closed = true;
    shift.closedAt = Date.now();
    state.activePatients = [];
    state.queue = [];
    state.coins += bonus;

    return t("\n\n🌙 Mesai bitti! Bugün {0} hastaya baktın ve {1} yıldız topladın. Gün sonu primi: +{2} coin. Klinik kapandı; 15 dakika dinlendikten sonra yeni güne Klinik ekranından başlayabilirsin.",
        shift.cases, shift.stars, bonus);
}

function startDay() {
    if (!appOpen || !state.shift.closed) return;

    if (shiftWait() > 0) {
        toast(t("⏳ Klinik dinleniyor. Yeni gün {0} sonra başlayabilir.", waitText()));
        return;
    }

    state.shift = { minute: SHIFT_OPEN, day: state.shift.day + 1, cases: 0, stars: 0, closed: false, closedAt: 0, reports: 0, home: false };
    generatePatients();
    commit();
    showScreen("home");
    sfx("sparkle");
    toast(t("🌅 {0}. gün başladı! Hastalar kapıda.", state.shift.day));
}

// Sahnedeki "yeni gün" düğmesi: süre dolana kadar geri sayım gösterir.
function renderDayButton() {
    // Uyanma düğmesi yalnızca evdeyken vardır.
    const button = document.querySelector(".scene-night .day-btn");
    const waiting = shiftWait() > 0;

    if (button) {
        button.disabled = waiting;
        button.textContent = waiting ? "😴 " + waitText() : t("⏰ Uyan ve Kliniğe Git");
    }

    $("sceneHint").textContent = !state.shift.home
        ? t("Mesai bitti. Eve gidip dinlenme zamanı!")
        : waiting
            ? t("Evde uyuyorsun. Klinik dinleniyor; bu arada mini oyun oynayabilirsin!")
            : t("Günaydın! Uyanıp yeni güne başlayabilirsin.");

    // Geri sayım yalnızca gerekirken çalışır.
    if (waiting && button && shiftTimer === null) {
        shiftTimer = setInterval(() => {
            const shown = document.querySelector(".scene-night .day-btn");

            if (!appOpen || !state.shift.closed || !shown || shiftWait() <= 0) {
                clearInterval(shiftTimer);
                shiftTimer = null;
            }

            if (appOpen && state.shift.closed && shown) renderDayButton();
        }, 1000);
    }
}

function renderShift() {
    $("clockStat").textContent = state.shift.closed
        ? t("🌙 Kapalı")
        : "🕘 " + clockText() + " • " + t("{0}. gün", state.shift.day);
}
