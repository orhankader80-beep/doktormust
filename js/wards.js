"use strict";

/* ===== UZMANLIK BÖLÜMLERİ ===== */

let currentWard = "dental";

function makeWardPatient(ward) {
    const item = pick(wardCases[ward.id]);

    return makePatient({
        problem: item.problem,
        correctTreatment: item.card,
        area: "",
        says: item.says
    }, ageGroups[state.doctor.age], ward);
}

// Her bölümde aynı anda üç hasta bekler; hepsi bitince yenileri gelir.
function ensureWard(ward) {
    if (state.wardPatients[ward.id].length) return;
    state.wardPatients[ward.id] = Array.from({ length: 3 }, () => makeWardPatient(ward));
}

function renderWards() {
    const open = wards.filter(ward => state.level >= ward.level);
    const ward = open.find(ward => ward.id === currentWard) || open[0] || null;

    $("wardTabs").innerHTML = "";

    wards.forEach(item => {
        const locked = state.level < item.level;
        const active = ward !== null && item.id === ward.id;
        const button = document.createElement("button");

        button.textContent = locked
            ? t("🔒 {0} (Seviye {1})", item.name, item.level)
            : `${item.emoji} ${item.name}`;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        button.onclick = () => {
            if (locked) {
                toast(t("🔒 {0} {1}. seviyede açılır.", item.name, item.level));
                return;
            }

            currentWard = item.id;
            renderWards();
        };

        $("wardTabs").appendChild(button);
    });

    $("wardGrid").innerHTML = "";
    $("wardGuide").innerHTML = "";
    $("wardCount").hidden = !ward;

    if (!ward) {
        $("wardIntro").textContent =
            t("İlk bölüm olan Diş Kliniği 2. seviyede açılır. Hasta muayene ederek seviye atla!");
        return;
    }

    currentWard = ward.id;
    ensureWard(ward);

    $("wardIntro").textContent = ward.intro;
    $("wardCount").textContent =
        t("Bu bölümde tamamlanan vaka: {0}", state.wardCases[ward.id]);

    state.wardPatients[ward.id]
        .forEach(patient => $("wardGrid").appendChild(patientCard(patient)));

    // Bölümün kartları ve işaretleri: muayene penceresindeki ipucu tablosunun aynısı.
    ward.cards.forEach(card => {
        const box = document.createElement("div");
        box.className = "card";
        box.innerHTML = `<h4>${escapeHTML(card.label)}</h4><p class="small muted">${escapeHTML(card.signs)}</p>`;
        $("wardGuide").appendChild(box);
    });
}

/* ===== KLİNİK EKİBİ ===== */

function renderStaff() {
    $("staffGrid").innerHTML = "";

    staffList.forEach(member => {
        const hired = hasStaff(member.id);
        const locked = !hired && state.level < member.level;
        const card = document.createElement("div");

        card.className = "card shop-item";
        card.innerHTML = `
            <div class="shop-emoji">${member.emoji}</div>
            <h3>${escapeHTML(member.name)}</h3>
            <p class="effect">✨ ${escapeHTML(member.effect)}</p>
            <div class="price">${priceLabel(member)}</div>
            <button class="${hired || locked ? "secondary-btn" : "primary-btn"}"
                ${hired || locked ? "disabled" : ""}>
                ${escapeHTML(hired ? t("✅ Ekipte") : locked ? t("🔒 Seviye ") + member.level : t("İşe Al"))}
            </button>
        `;

        card.querySelector("button").onclick = () => hireStaff(member.id);
        $("staffGrid").appendChild(card);
    });
}

function hireStaff(id) {
    const member = staffList.find(member => member.id === id);
    if (!appOpen || !member || hasStaff(id) || state.level < member.level) return;
    if (!pay(member)) return;

    state.staff.push(id);
    if (id === "reception") refillQueue();

    const saved = commit();
    renderStore();
    playSound("coin");

    if (!currentUser || saved) toast(t("👥 {0} ekibe katıldı!", member.name));
}

// Ekip üyeleri muayene odasında sabit yerlerinde durur.
function renderClinicStaff() {
    const area = $("clinicEditArea");
    const places = { reception: [12, 86], nurse: [64, 50], cleaner: [90, 60] };

    area.querySelectorAll(".clinic-staff").forEach(element => element.remove());
    if (currentRoom !== "main") return;

    staffList.filter(member => hasStaff(member.id)).forEach(member => {
        const figure = document.createElement("div");
        figure.className = "clinic-staff";
        figure.title = member.name;
        figure.textContent = member.emoji;
        figure.style.left = places[member.id][0] + "%";
        figure.style.top = places[member.id][1] + "%";
        area.appendChild(figure);
    });
}
