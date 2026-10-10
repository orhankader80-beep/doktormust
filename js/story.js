"use strict";

/* ===== HİKÂYE MODU ===== */

function storyChapter() {
    const current = state.story.current;
    return current ? chapters.find(chapter => chapter.id === current.id) : null;
}

// Bölümler sırayla açılır: ilki hep açıktır, sonrakiler bir önceki bitince.
function chapterUnlocked(index) {
    return index === 0 || state.story.done.includes(chapters[index - 1].id);
}

// Baş vaka, bölümün sıradan vakalarından sonra gelir.
function makeStoryPatient(chapter, index) {
    const group = ageGroups[state.doctor.age];
    const pool = diseasePool[group.pool]
        .filter(disease => chapter.cards.includes(disease.correctTreatment));
    const boss = index >= chapter.cases;
    const lead = chapterBosses[chapter.id];

    const patient = makePatient(boss
        ? { ...pick(pool), problem: lead.problem, says: [lead.speech] }
        : pick(pool), group);

    patient.story = true;
    patient.boss = boss;
    patient.emergency = chapter.timed === true;

    if (boss) {
        patient.name = lead.name;
        patient.emoji = lead.emoji;
        makeTricky(patient);
    }

    return patient;
}

function ensureStoryPatient() {
    const current = state.story.current;
    const chapter = storyChapter();
    if (!current || !chapter || current.patient) return;

    current.patient = makeStoryPatient(chapter, current.index);
}

function startChapter(id) {
    const index = chapters.findIndex(chapter => chapter.id === id);
    if (!appOpen || index < 0) return;

    const chapter = chapters[index];

    if (!chapterUnlocked(index)) {
        toast(t("🔒 Önce \"{0}\" bölümünü bitirmelisin.", chapters[index - 1].name));
        return;
    }

    const current = state.story.current;

    if (current && current.id !== id &&
        !confirm(t("Devam eden bölümdeki ilerlemen silinir. Yeni bölüme geçilsin mi?"))) return;

    state.story.current = { id, index: 0, stars: 0, patient: null };
    ensureStoryPatient();
    commit();
    renderStory();

    showInfo(chapter.emoji, chapter.name,
        chapter.intro + "\n\n" +
        t("Bu bölümde {0} vaka ve bir baş vaka var. Baş vakada rapor istenemez.", chapter.cases) +
        (chapter.timed ? "\n" + t("Bu bölümdeki bütün vakalar sürelidir.") : ""),
        t("Hikâye vakaları da kurgusaldır; gerçek teşhis ya da tedavi bilgisi vermez."));
}

function leaveChapter() {
    if (!appOpen || !state.story.current) return;
    if (!confirm(t("Bölümden çıkarsan bu bölümdeki ilerlemen silinir. Çıkılsın mı?"))) return;

    state.story.current = null;
    commit();
    renderStory();
}

// Vaka tamamlanınca bölümü ilerletir; sonuç penceresine eklenecek metni döndürür.
function advanceStory(stars) {
    const current = state.story.current;
    const chapter = storyChapter();
    if (!current || !chapter) return "";

    const total = chapter.cases + 1;

    current.stars += stars;
    current.index++;
    current.patient = null;

    if (current.index < total) {
        ensureStoryPatient();

        return "\n" + (current.index === chapter.cases
            ? t("📚 {0}: sırada baş vaka var!", chapter.name)
            : t("📚 {0}: {1} / {2} vaka tamamlandı.", chapter.name, current.index, total));
    }

    // İlk bitirişte büyük, tekrarlarda küçük ödül verilir.
    const first = !state.story.done.includes(chapter.id);
    const coins = first ? 150 : 50;
    const gems = first ? 5 : 1;

    if (first) state.story.done.push(chapter.id);
    state.story.best[chapter.id] = Math.max(state.story.best[chapter.id] || 0, current.stars);
    state.story.current = null;
    state.coins += coins;
    state.gems += gems;
    playSound("level");

    return "\n\n" +
        t("🏁 \"{0}\" bölümü tamamlandı! {1} / {2} yıldız", chapter.name, current.stars, total * 3) +
        "\n" + chapter.outro +
        "\n" + t("+{0} coin, +{1} 💎", coins, gems);
}

function renderStory() {
    ensureStoryPatient();

    const current = state.story.current;
    const chapter = storyChapter();
    const box = $("storyCurrent");

    box.innerHTML = "";
    box.hidden = !chapter;

    if (chapter) {
        const total = chapter.cases + 1;
        const head = document.createElement("div");

        head.className = "card story-progress";
        head.innerHTML = `
            <h3>${chapter.emoji} ${escapeHTML(chapter.name)}</h3>
            <p class="muted">${escapeHTML(current.index === chapter.cases
                ? t("Son vaka: baş vaka!")
                : t("Vaka {0} / {1}", current.index + 1, total))}
                • ${escapeHTML(t("Toplanan yıldız: {0}", current.stars))}</p>
            <div class="progress-track"><div class="progress-fill"></div></div>
            <p><button class="danger-btn">${escapeHTML(t("✖ Bölümden Çık"))}</button></p>
        `;

        head.querySelector(".progress-fill").style.width = current.index / total * 100 + "%";
        head.querySelector("button").onclick = leaveChapter;

        box.appendChild(head);
        box.appendChild(patientCard(current.patient));
    }

    $("storyGrid").innerHTML = "";

    chapters.forEach((item, index) => {
        const done = state.story.done.includes(item.id);
        const active = current && current.id === item.id;
        const locked = !chapterUnlocked(index);
        const cards = item.cards
            .map(id => treatments.find(treatment => treatment.id === id).label).join(", ");

        const status = active ? t("⏩ Devam ediyor")
            : done ? t("✅ En iyi: {0} / {1} ⭐", state.story.best[item.id], (item.cases + 1) * 3)
            : locked ? t("🔒 Önceki bölümü bitir") : t("Yeni bölüm");

        const card = document.createElement("div");
        card.className = "card game-card";
        card.innerHTML = `
            <div class="game-big">${locked ? "🔒" : item.emoji}</div>
            <h3>${index + 1}. ${escapeHTML(item.name)}</h3>
            <p class="small muted">${escapeHTML(cards)}</p>
            <p>${escapeHTML(status)}</p>
            <button class="${locked || active ? "secondary-btn" : "primary-btn"}"
                ${locked || active ? "disabled" : ""}>
                ${escapeHTML(done ? t("🔁 Tekrar Oyna") : t("▶️ Başla"))}
            </button>
        `;

        card.querySelector("button").onclick = () => startChapter(item.id);

        // Biten bölümün diploması görüntülenip kaydedilebilir.
        if (done) {
            const diploma = document.createElement("button");
            diploma.className = "secondary-btn diploma-btn";
            diploma.textContent = t("🎓 Diploma");
            diploma.onclick = () => openDiploma(item.id);
            card.appendChild(diploma);
        }
        $("storyGrid").appendChild(card);
    });
}
