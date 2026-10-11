"use strict";

/* ===== KLİNİK SAHNESİ ===== */

// Oyunun ana ekranı bir panel değil, kliniğin kendisidir: doktor ortada durur, hastalar
// içeride bekler, diğer ekranlara menüden değil odadaki eşyalara dokunarak gidilir.
// Oda, "Kliniğimi Süsle" ekranındaki duvar, zemin, manzara ve eşyalarla aynı görünür.

// Odadaki dokunulabilir eşyalar: [kimlik, simge, ad, x %, y %].
const sceneSpots = [
    ["wards", "🚪", t("Bölümler"), 10, 13],
    ["story", "📚", t("Hikâye"), 28, 13],
    ["games", "🎮", t("Oyunlar"), 72, 13],
    ["store", "🛍️", t("Mağaza"), 90, 13],
    ["album", "📒", t("Albüm"), 10, 34],
    ["panel", "📋", t("Görevler"), 28, 34],
    ["gift", "🎁", t("Ödül"), 72, 34],
    ["badges", "🏆", t("Rozetler"), 90, 34]
];

// Hastaların odada durduğu yerler (x %, y %: ayakların yeri). Arkadakiler önce çizilir.
const sceneSlots = [[12, 81], [35, 81], [65, 81], [88, 81], [24, 98], [50, 98], [76, 98]];

let sceneKey = "";
let sceneSeen = new Set();

function scenePatients() {
    if (state.shift.closed) return [];

    const special = state.weekly.patient;
    return (special ? [special, ...state.activePatients] : state.activePatients).slice(0, sceneSlots.length);
}

function giftReady() {
    return state.daily.lastClaim !== dayKey();
}

function openPanel() {
    if (!appOpen) return;
    openModal("panelModal");
    updateUI();
}

function openRobot() {
    if (!appOpen) return;
    openModal("robotModal");
    renderRobot();
}

function sceneAction(id) {
    if (!appOpen) return;

    playSound("tap");

    if (id === "panel") openPanel();
    else if (id === "robot") openRobot();
    else if (id === "gift") {
        if (giftReady()) claimDaily();
        else toast(t("🎁 Bugünün ödülünü aldın. Yarın yine gel!"));
    } else showScreen(id);
}

// Sahne yalnızca görünen bir şey değiştiğinde yeniden çizilir; böylece her dokunuşta
// bütün oda baştan kurulmaz (telefonlarda akıcılık için).
function renderScene(force = false) {
    if (!appOpen || currentScreen !== "home") return;

    const patients = scenePatients();
    const items = clinicItems.filter(item =>
        (item.room || "main") === "main" && state.ownedItems.includes(item.type));

    const key = JSON.stringify([
        patients.map(patient => [patient.id, patient.patience, patient.emergency, patient.checkup]),
        state.queue.map(patient => patient.id),
        items.map(item => [item.type, item.x, item.y, item.r]),
        state.decor, state.doctor, state.dark, giftReady(), currentLang, state.shift.closed, state.shift.day, shiftWait() > 0, state.clinicName, shownSeason() && shownSeason().id
    ]);

    if (!force && key === sceneKey) return;
    sceneKey = key;

    const scene = $("scene");
    const view = decorOptions.view.find(option => option.id === state.decor.view);
    const season = shownSeason();

    scene.className = "scene clinic-edit-area wall-" + state.decor.wall;
    scene.style.backgroundColor = document.body.classList.contains("dark") ? "#1c2a3d" : state.doctor.bg;
    scene.innerHTML = "";

    const add = (tag, className, html = "") => {
        const element = document.createElement(tag);
        element.className = className;
        element.innerHTML = html;
        scene.appendChild(element);
        return element;
    };

    add("div", "clinic-floor floor-" + state.decor.floor);
    add("div", "scene-sign", escapeHTML("🏥 " + clinicTitle()));
    add("div", "clinic-garland", season ? escapeHTML(season.decor.join(" ")) : "").setAttribute("aria-hidden", "true");
    add("div", "clinic-window view-" + view.id, view.emoji).setAttribute("aria-hidden", "true");

    // Oyuncunun yerleştirdiği eşyalar odada da durur (yalnızca süs; dokunulmaz).
    items.forEach(item => {
        const info = itemInfo(item.type);
        if (!info) return;

        const element = add("div", "scene-item", itemArtHTML(info));
        element.setAttribute("aria-hidden", "true");
        element.style.left = item.x + "%";
        element.style.top = item.y + "%";
        element.style.transform = `translate(-50%,-50%) rotate(${item.r}deg)`;
    });

    sceneSpots.forEach(([id, emoji, label, x, y]) => {
        const button = add("button", "scene-spot" + (id === "gift" && giftReady() ? " ready" : ""),
            `<span class="spot-icon">${emoji}</span><small>${escapeHTML(label)}</small>`);
        button.type = "button";
        button.style.left = x + "%";
        button.style.top = y + "%";
        button.onclick = () => sceneAction(id);
    });

    const robot = add("button", "scene-spot scene-robot",
        `<span class="spot-icon"><svg class="art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${itemArt.robot}</svg></span><small>Robi</small>`);
    robot.type = "button";
    robot.style.left = "50%";
    robot.style.top = "34%";
    robot.onclick = () => sceneAction("robot");

    const doctor = add("button", "scene-doctor doc-holder", doctorFigure());
    doctor.type = "button";
    doctor.setAttribute("aria-label", t("Doktorum"));
    doctor.onclick = () => sceneAction("doctor");

    patients.forEach((patient, index) => {
        const [x, y] = sceneSlots[index];
        const fresh = !sceneSeen.has(patient.id);
        const kind = patient.special ? " special" : patient.checkup ? " checkup" : patient.emergency ? " emergency" : "";
        const sign = patient.special ? "🌟" : patient.checkup ? "💚" : patient.emergency ? "🚑" : t(patient.problem).split(" ")[0];

        const button = add("button", "scene-patient" + kind + (fresh ? " walk-in" : ""),
            `<span class="sp-sign">${escapeHTML(sign)}</span>` +
            patientFace(patient, { full: true }) +
            `<span class="sp-name">${escapeHTML(patient.name)}</span>`);

        button.type = "button";
        button.style.left = x + "%";
        button.style.top = y + "%";
        button.style.zIndex = String(10 + index);
        button.setAttribute("aria-label", patient.name + ": " + t(patient.problem));
        button.onclick = () => openTreatment(patient.id);
    });

    sceneSeen = new Set(patients.map(patient => patient.id));

    // Mesai bitince oda kararır ve yeni günü başlatan düğme çıkar.
    if (state.shift.closed) {
        const night = add("div", "scene-night",
            `<div class="night-card"><div class="night-moon">🌙</div><b>${escapeHTML(t("Klinik kapandı"))}</b>` +
            `<p>${escapeHTML(t("Bugün {0} hasta • {1} ⭐", state.shift.cases, state.shift.stars))}</p>` +
            `<button class="primary-btn" type="button">${escapeHTML(t("🌅 Yeni Güne Başla"))}</button></div>`);
        night.querySelector("button").onclick = startDay;
    }

    $("sceneQueue").innerHTML = state.queue.map(patient => faceSVG(patient, { mood: "sick" })).join("");
    $("sceneHint").textContent = patients.length ? t("Bir hastaya dokun ve muayene et!") : t("Şu an bekleyen hasta yok.");
    if (state.shift.closed) renderDayButton();
}

/* ---- Alt düğmeler ve menü ---- */

const dockScreens = ["home", "story", "wards", "games"];

function toggleMenu(open = !document.body.classList.contains("menu-open")) {
    if (!appOpen) return;
    document.body.classList.toggle("menu-open", open);
    if (open) $("nav").querySelector("button").focus();
}

function renderDock() {
    $("dock").querySelectorAll("button[data-screen]").forEach(button => {
        const active = button.dataset.screen === currentScreen;
        button.classList.toggle("active", active);
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });
}

// Sayfa açılırken bir kez: alt düğmeler kurulur, panel ve Robi kendi pencerelerine taşınır.
function setupScene() {
    dockScreens.forEach(id => {
        const [, emoji, label] = screenData.find(screen => screen[0] === id);
        const button = document.createElement("button");

        button.type = "button";
        button.dataset.screen = id;
        button.innerHTML = `<span>${emoji}</span><small>${escapeHTML(label)}</small>`;
        button.onclick = () => showScreen(id);
        $("dock").appendChild(button);
    });

    const menu = document.createElement("button");
    menu.type = "button";
    menu.innerHTML = `<span>☰</span><small>${escapeHTML(t("Menü"))}</small>`;
    menu.onclick = () => toggleMenu();
    $("dock").appendChild(menu);

    $("panelBody").appendChild($("homePanel"));
    $("homePanel").hidden = false;
    $("robotBody").appendChild(document.querySelector(".robot-card"));
}
