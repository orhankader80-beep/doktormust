"use strict";

/* ===== KİŞİSELLEŞTİRME ===== */

// Oyun rengi: düğmelerin ve vurguların rengi. [kimlik, ana renk, geçiş rengi]
const themes = [
    ["blue", "#4f8cff", "#7166ff"],
    ["green", "#1f9d55", "#12b886"],
    ["pink", "#e0468f", "#b65cf0"],
    ["orange", "#e8750a", "#f59f00"],
    ["purple", "#7c5cff", "#b65cf0"]
];

// Kliniğin tabelada ve başlıkta görünen adı; oyuncu ad vermediyse doktorun adından üretilir.
function clinicTitle() {
    return state.clinicName || t("Dr. {0} Kliniği", state.doctor.name);
}

function applyCustomTheme() {
    const [, primary, second] = themes.find(theme => theme[0] === state.theme) || themes[0];

    document.body.style.setProperty("--primary", primary);
    document.body.style.setProperty("--primary2", second);
}

function renderCustom() {
    applyCustomTheme();

    if (currentScreen === "home") $("pageTitle").textContent = clinicTitle();

    // Yazarken kutunun içeriği değişmesin diye odaktaki kutuya dokunulmaz.
    if (document.activeElement !== $("doctorNameInput")) $("doctorNameInput").value = state.doctor.name;
    if (document.activeElement !== $("clinicNameInput")) $("clinicNameInput").value = state.clinicName;

    const grid = $("themeGrid");
    grid.innerHTML = "";

    themes.forEach(([id, primary, second]) => {
        const active = state.theme === id;
        const button = document.createElement("button");

        button.className = "look-btn";
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label", id);
        button.style.background = `linear-gradient(135deg,${primary},${second})`;

        button.onclick = () => {
            if (!appOpen) return;
            state.theme = id;
            playSound("tap");
            commit();
        };

        grid.appendChild(button);
    });
}

function saveNames() {
    if (!appOpen) return;

    const name = $("doctorNameInput").value.trim().slice(0, 20);
    const clinic = $("clinicNameInput").value.trim().slice(0, 24);

    if (!name) {
        toast(t("✏️ Doktorun adı boş olamaz."));
        return;
    }

    state.doctor.name = name;
    state.clinicName = clinic;
    $("doctorNameInput").blur();
    $("clinicNameInput").blur();

    commit();
    playSound();
    toast(t("💾 Adlar kaydedildi: {0}", clinicTitle()));
}

/* ===== SINIF YARIŞMASI ===== */

// Aynı cihazda sırayla oynanır: her oyuncu bir hastaya bakar, topladığı yıldızlar tabloya
// yazılır. Yazılan adlar yalnızca yarışma boyunca bellekte tutulur; kaydedilmez.
// classGame: { players: [{ name, stars, played }], started, turn, round, patientId, cheered }
let classGame = null;

const CLASS_MAX = 50;

function openClass() {
    if (!appOpen) return;

    classGame = classGame || { players: [], started: false, turn: 0, round: 1, rounds: 0, patientId: null, cheered: false };
    openModal("classModal");
    renderClass();
}

function classNext() {
    openClass();
}

function addClassPlayer(event) {
    event.preventDefault();
    if (!classGame || classGame.started) return;

    const input = $("classInput");
    const name = input.value.trim().slice(0, 14);
    input.value = "";

    if (!name) return;

    if (classGame.players.some(player => player.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"))) {
        toast(t("Bu ad zaten listede."));
    } else if (classGame.players.length >= CLASS_MAX) {
        toast(t("En fazla {0} oyuncu eklenebilir.", CLASS_MAX));
    } else {
        classGame.players.push({ name, stars: 0, played: false });
        playSound("tap");
    }

    renderClass();
    $("classInput").focus();
}

function startClass() {
    if (!classGame || classGame.players.length < 2) return;

    classGame.started = true;
    classGame.turn = 0;
    classGame.round = 1;
    classGame.cheered = false;
    sfx("sparkle");
    renderClass();
}

function endClass() {
    classGame = null;
    closeModal();
    toast(t("🏫 Sınıf yarışması bitti."));
}

function newClassRound() {
    if (!classGame) return;

    // Takım maçı bittiyse yeni maç sıfırdan başlar.
    if (classGame.rounds && classGame.round >= classGame.rounds) {
        classGame.players.forEach(player => { player.stars = 0; });
        classGame.round = 0;
    }

    classGame.players.forEach(player => { player.played = false; });
    classGame.turn = 0;
    classGame.round++;
    classGame.cheered = false;
    renderClass();
}

// Sıradaki oyuncu için yeni bir hasta gelir (yarıda bırakılan hasta varsa o açılır).
function classPlay() {
    if (!appOpen || !classGame || !classGame.started) return;

    const player = classGame.players[classGame.turn];
    if (!player) return;

    let patient = classGame.patientId ? findPatient(classGame.patientId) : null;

    if (!patient) {
        const group = ageGroups[state.doctor.age];
        const pool = diseasePool[group.pool].filter(disease => state.level >= (disease.level || 1));

        patient = makePatient(pick(pool), group);
        patient.emergency = false;
        patient.klass = true;                 // yarışma hastası: mesai saatini ve sırayı etkilemez
        state.activePatients.unshift(patient);
        classGame.patientId = patient.id;
    }

    openTreatment(patient.id);
    toast(t("🏫 Sıra sende, {0}!", player.name));
}

// Yarışma hastası bitince (iyileşti ya da gitti) oyuncunun puanı yazılır.
function classResult(patient, stars) {
    if (!classGame || !classGame.started || !patient.klass) return;

    const player = classGame.players[classGame.turn];

    if (player) {
        player.stars += stars;
        player.played = true;
    }

    classGame.patientId = null;
    classGame.turn = classGame.players.findIndex(other => !other.played);

    const next = classGame.players[classGame.turn];

    $("gNext").textContent = next ? t("➡️ Sıradaki: {0}", next.name) : t("🏆 Sonuçları Gör");
    $("gNext").hidden = activeModal !== "guideModal";
}

function renderClass() {
    const body = $("classBody");
    if (!classGame) return;

    if (!classGame.started) {
        body.innerHTML = `
            <p>${escapeHTML(t("Sırayla oynayın: her oyuncu bir hastaya bakar, en çok yıldızı toplayan kazanır!"))}</p>
            <form class="robot-form" id="classForm">
                <input type="text" id="classInput" maxlength="14" autocomplete="off"
                    placeholder="${escapeHTML(t("Oyuncunun adı"))}" aria-label="${escapeHTML(t("Oyuncunun adı"))}">
                <button class="secondary-btn" type="submit">${escapeHTML(t("➕ Ekle"))}</button>
            </form>
            <div class="class-chips" id="classChips"></div>
            <p class="small muted">${escapeHTML(t("Takım olarak oynamak için takım sayısını seç; her takım 3 tur oynar:"))}</p>
            <div class="row team-row">
                ${[2, 3, 4].map(count => `<button class="toggle" type="button" data-teams="${count}">${escapeHTML(t("👥 {0} Takım", count))}</button>`).join("")}
            </div>
            <button class="primary-btn full" id="classStart">${escapeHTML(t("▶️ Yarışmayı Başlat"))}</button>
            <p class="notice">${escapeHTML(t("En az 2 oyuncu gerekir. Adlar yalnızca yarışma boyunca tutulur, kaydedilmez."))}</p>
        `;

        $("classForm").onsubmit = addClassPlayer;
        $("classStart").disabled = classGame.players.length < 2;
        $("classStart").onclick = startClass;
        body.querySelectorAll("[data-teams]").forEach(button => {
            button.onclick = () => fillTeams(Number(button.dataset.teams));
        });

        classGame.players.forEach((player, index) => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "toggle";
            chip.textContent = player.name + " ✕";
            chip.setAttribute("aria-label", t("{0} adlı oyuncuyu çıkar", player.name));
            chip.onclick = () => {
                classGame.players.splice(index, 1);
                renderClass();
            };
            $("classChips").appendChild(chip);
        });

        return;
    }

    const done = classGame.players.every(player => player.played);
    const more = done && classGame.rounds > 0 && classGame.round < classGame.rounds;
    const best = Math.max(...classGame.players.map(player => player.stars));
    const ranked = [...classGame.players].sort((a, b) => b.stars - a.stars);
    const current = classGame.players[classGame.turn];
    const medals = ["🥇", "🥈", "🥉"];

    const rows = ranked.map((player, index) => `
        <li class="${player === current && !done ? "turn" : ""}">
            <span>${player.played || classGame.round > 1 ? medals[index] || "🎖️" : "⏳"}</span>
            <b>${escapeHTML(player.name)}</b>
            <span>${player.played || classGame.round > 1 ? "⭐ " + player.stars : "—"}</span>
        </li>`).join("");

    const winners = classGame.players.filter(player => player.stars === best).map(player => player.name);

    body.innerHTML = `
        <p class="muted">${escapeHTML(classGame.rounds ? t("{0}. tur / {1}", classGame.round, classGame.rounds) : t("{0}. tur", classGame.round))}</p>
        <ol class="class-board">${rows}</ol>
        ${done && !more ? `<p class="class-winner">${escapeHTML(winners.length > 5
            ? t("🏆 {0} kişi {1} yıldızla birinci!", winners.length, best)
            : winners.length > 1
            ? t("🏆 Berabere: {0}", winners.join(", "))
            : t("🏆 Kazanan: {0}!", winners[0]))}</p>` : ""}
        <div class="stack">
            ${done
                ? `<button class="primary-btn full" id="classAgain">${escapeHTML(more ? t("➡️ {0}. tura geç", classGame.round + 1) : t("🔁 Yeni Tur"))}</button>`
                : `<button class="primary-btn full" id="classGo">${escapeHTML(t("▶️ Sıra: {0}", current.name))}</button>`}
            <button class="danger-btn full" id="classEnd">${escapeHTML(t("✖ Yarışmayı Bitir"))}</button>
        </div>
    `;

    if (done) $("classAgain").onclick = newClassRound;
    else $("classGo").onclick = classPlay;
    $("classEnd").onclick = endClass;

    if (done && !more && !classGame.cheered) {
        classGame.cheered = true;
        confetti();
        sfx("yay");
    }
}
