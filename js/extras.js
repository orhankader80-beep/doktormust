"use strict";

/* ===== HASTA DOSYALARI ===== */

// Aynı ad ve yüz aynı hasta sayılır.
function findFile(patient) {
    return state.files.find(file =>
        file.name === patient.name && file.emoji === patient.emoji);
}

// Ziyareti dosyaya işler. Düzenli hasta ödülü varsa sonuç penceresine
// eklenecek satırı, yoksa boş metin döndürür.
function recordVisit(patient, stars) {
    const file = findFile(patient) || {
        name: patient.name, emoji: patient.emoji, age: patient.age,
        visits: 0, stars: 0, regular: false, history: []
    };

    file.visits++;
    file.stars += stars;
    file.history = [...file.history, {
        day: dayKey(),
        problem: patient.problem,
        card: patient.correctTreatment,
        stars,
        checkup: patient.checkup
    }].slice(-5);

    // Son gelen hasta listenin sonuna taşınır; en eski dosyalar düşer.
    state.files = state.files.filter(other => other !== file).concat(file).slice(-120);

    if (file.regular) {
        state.coins += 5;
        return "\n" + t("🤝 Düzenli hasta bonusu: +5 coin");
    }

    if (file.visits >= 3) {
        file.regular = true;
        state.coins += 30;
        state.gems++;
        return "\n" + t("🤝 {0} artık düzenli hastan! +30 coin, +1 💎", patient.name);
    }

    return "";
}

function renderFiles() {
    const grid = $("filesGrid");

    renderLetters();

    grid.innerHTML = "";
    $("filesNote").hidden = state.files.length > 0;

    [...state.files].reverse().forEach(file => {
        const last = file.history[file.history.length - 1];
        const card = document.createElement("div");

        card.className = "card patient-card" + (file.regular ? " checkup" : "");
        card.innerHTML = `
            ${file.regular ? `<div class="tag good">${escapeHTML(t("🤝 DÜZENLİ HASTA"))}</div>` : ""}
            <div class="patient-face small">${faceSVG(file, { mood: "ok" })}</div>
            <h3>${escapeHTML(file.name)}, ${file.age}</h3>
            <div class="problem">${escapeHTML(t("Ziyaret: {0} • ⭐ {1}", file.visits, file.stars))}</div>
            <div class="small muted">${escapeHTML(last ? t("Son: {0}", t(last.problem)) : "")}</div>
            <p><button class="secondary-btn">${escapeHTML(t("📂 Dosyayı Aç"))}</button></p>
        `;

        card.querySelector("button").onclick = () => openFile(file);
        grid.appendChild(card);
    });
}

function openFile(file) {
    const visits = file.history.map(visit => {
        const card = treatments.find(treatment => treatment.id === visit.card);

        return `• ${dayLabel(visit.day)} — ` + (visit.checkup
            ? t("Kontrol ziyareti")
            : t(visit.problem) + (card ? " → " + card.label : "") + " " + "⭐".repeat(visit.stars));
    });

    showInfo({ person: file, mood: "ok" }, `${file.name}, ${file.age}`,
        t("Ziyaret sayısı: {0}", file.visits) + "\n" +
        t("Toplam yıldız: {0}", file.stars) + "\n" +
        (file.regular
            ? t("🤝 Düzenli hastan: her vakasında +5 coin bonus.")
            : t("3 ziyarette düzenli hastan olur.")) +
        "\n\n" + t("Son ziyaretler") + "\n" + visits.reverse().join("\n"),
        t("Dosyalarda her hastanın son 5 ziyareti tutulur."));
}

/* ===== VÜCUT HARİTASI ===== */

function renderBody() {
    const spots = $("bodySpots");
    const list = $("bodyList");
    const open = organs.filter(organ => state.stickers.includes(organ.sticker));

    spots.innerHTML = "";
    list.innerHTML = "";

    $("bodyProgress").textContent = t("Açılan organ: {0} / {1} • İncelenen: {2}",
        open.length, organs.length, state.organsSeen.length);

    organs.forEach(organ => {
        const unlocked = open.includes(organ);
        const seen = state.organsSeen.includes(organ.id);

        const spot = document.createElement("button");
        spot.className = "body-spot" + (unlocked ? " open" : "") + (seen ? " seen" : "");
        spot.style.left = organ.x + "%";
        spot.style.top = organ.y + "%";
        spot.textContent = unlocked ? organ.emoji : "🔒";
        spot.setAttribute("aria-label", unlocked ? organ.name : t("Kilitli organ"));
        spot.onclick = () => openOrgan(organ.id);
        spots.appendChild(spot);

        const chip = document.createElement("button");
        chip.className = "organ-chip" + (unlocked ? " open" : "");
        chip.textContent = unlocked
            ? `${organ.emoji} ${organ.name}${seen ? " ✅" : ""}` : "🔒 ???";
        chip.onclick = () => openOrgan(organ.id);
        list.appendChild(chip);
    });
}

function openOrgan(id) {
    const organ = organs.find(organ => organ.id === id);
    if (!appOpen || !organ) return;

    if (!state.stickers.includes(organ.sticker)) {
        const sticker = allStickers.find(sticker => sticker.id === organ.sticker);
        toast(t("🔒 Bu organı açmak için \"{0}\" çıkartmasını bul.", sticker.name));
        return;
    }

    let reward = "";

    if (!state.organsSeen.includes(id)) {
        state.organsSeen.push(id);
        state.coins += 10;
        addXP(5);
        reward = "\n\n" + t("İlk inceleme ödülü: +10 coin, +5 XP");
        commit();
        renderBody();
    }

    showInfo(organ.emoji, organ.name,
        t("🔧 Ne işe yarar?") + "\n" + organ.job + "\n\n" +
        t("✨ Biliyor muydun?") + "\n" + organ.fact + "\n\n" +
        t("🛡️ Nasıl korurum?") + "\n" + organ.care + reward,
        t("Bu bilgiler geneldir. Merak ettiklerini bir büyüğüne veya doktoruna sor."));
}

/* ===== ÖZEL GÜNLER ===== */

// Takvime göre bugün geçerli olan özel gün. Çıkartmalar buna göre çıkar.
function currentSeason() {
    const now = new Date();
    const today = dayKey();

    return seasons.find(season => season.dates
        ? season.dates.some(([from, to]) => today >= from && today <= to)
        : season.match(now.getMonth() + 1, now.getDate())) || null;
}

// Ekranda gösterilen özel gün; ebeveyn köşesindeki önizleme yalnızca süsleri etkiler.
function shownSeason() {
    return seasons.find(season => season.id === seasonPreview) || currentSeason();
}

/* ===== KLİNİK DEKORU VE DOKTOR ===== */

function renderDecor() {
    const area = $("clinicEditArea");
    const view = decorOptions.view.find(option => option.id === state.decor.view);
    const room = rooms.find(room => room.id === currentRoom);
    const season = shownSeason();

    for (const option of decorOptions.wall) {
        area.classList.toggle("wall-" + option.id, option.id === state.decor.wall);
    }

    $("clinicFloor").className = "clinic-floor floor-" + state.decor.floor;
    $("clinicWindow").className = "clinic-window view-" + view.id;
    $("clinicWindow").textContent = view.emoji;
    $("clinicSign").textContent = room.id === "main" ? "" : room.emoji;
    $("clinicGarland").textContent = season ? season.decor.join(" ") : "";
}

function renderDecorOptions() {
    for (const [kind, options] of Object.entries(decorOptions)) {
        const box = $("decor-" + kind);
        box.innerHTML = "";

        options.forEach(option => {
            const locked = state.level < (option.level || 1);
            const active = state.decor[kind] === option.id;
            const button = document.createElement("button");

            button.textContent = locked
                ? t("🔒 {0} (Seviye {1})", option.name, option.level)
                : (option.emoji ? option.emoji + " " : "") + option.name;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
            button.onclick = () => setDecor(kind, option.id);
            box.appendChild(button);
        });
    }
}

function setDecor(kind, id) {
    if (!appOpen || !own(decorOptions, kind)) return;

    const option = decorOptions[kind].find(option => option.id === id);
    if (!option) return;

    if (state.level < (option.level || 1)) {
        toast(t("🔒 Bu seçenek {0}. seviyede açılır.", option.level));
        return;
    }

    state.decor[kind] = id;
    commit();
    renderDecor();
    renderDecorOptions();
}

function renderDoctorExtras() {
    $("coatGrid").innerHTML = "";

    coatColors.forEach(([color, name]) => {
        const active = state.decor.coat === color;
        const button = document.createElement("button");

        button.className = "coat-btn";
        button.style.background = color;
        button.title = name;
        button.classList.toggle("active", active);
        button.setAttribute("aria-label", name);
        button.setAttribute("aria-pressed", String(active));
        button.onclick = () => {
            if (!appOpen) return;
            state.decor.coat = color;
            commit();
            renderDoctorExtras();
        };

        $("coatGrid").appendChild(button);
    });

    const owned = has("pet");

    $("petForm").hidden = !owned;
    $("petNote").textContent = !owned
        ? t("Maskot için mağazadan Klinik Köpeği'ni al.")
        : state.petName
            ? t("🐶 {0} kliniğinde seni bekliyor!", state.petName)
            : t("Köpeğine bir ad ver.");

    if (document.activeElement !== $("petInput")) $("petInput").value = state.petName;
}

function savePetName() {
    if (!appOpen || !has("pet")) return;

    state.petName = $("petInput").value.trim().slice(0,12);
    const saved = commit();
    renderDoctorExtras();

    if (!currentUser || saved) {
        toast(state.petName
            ? t("🐶 Maskotunun adı artık {0}!", state.petName)
            : t("🐶 Maskotunun adı silindi."), true);
    }
}

/* ===== OYUN SÜRESİ VE GÜNLÜK SINIR ===== */

function playedToday() {
    return state.playLog[dayKey()] || 0;
}

// Bugünkü sınır (saniye). Ebeveynin eklediği süre yalnızca o gün geçerlidir.
function limitSeconds() {
    if (!state.limitMinutes) return 0;

    const extra = state.limitExtra.day === dayKey() ? state.limitExtra.minutes : 0;
    return (state.limitMinutes + extra) * 60;
}

function limitReached() {
    const limit = limitSeconds();
    return limit > 0 && playedToday() >= limit;
}

// Oyun açık ve görünürken geçen süre beşer saniyelik adımlarla sayılır.
function startPlayClock() {
    stopPlayClock();

    playTimer = setInterval(() => {
        if (!appOpen || document.hidden || limitReached()) return;

        const day = dayKey();
        state.playLog[day] = (state.playLog[day] || 0) + 5;
        playTicks++;

        // Süre yarım dakikada bir kaydedilir; yalnızca son 14 gün tutulur.
        if (playTicks % 6 === 0) {
            for (const old of Object.keys(state.playLog).sort().slice(0,-14)) {
                delete state.playLog[old];
            }

            if (currentUser && !storageProblem) persist();
            if (currentScreen === "parent") renderParent();
        }

        checkLimit();
    }, 5000);
}

function stopPlayClock() {
    clearInterval(playTimer);
    playTimer = null;
}

// Süre dolunca oyunun üstüne dinlenme perdesi iner; ebeveyn süre ekleyebilir.
function checkLimit() {
    const overlay = $("limitOverlay");
    const reached = appOpen && limitReached();

    if (reached === !overlay.hidden) return;

    if (reached) {
        endDrag();
        closeModal();
        stopMusic();
        if (currentUser && !storageProblem) persist();
    }

    overlay.hidden = !reached;
    $("app").inert = reached || activeModal !== null;

    if (reached) overlay.querySelector("button").focus();
    else startMusic();
}

function extendLimit(minutes) {
    if (!appOpen) return;

    const today = dayKey();
    const extra = state.limitExtra.day === today ? state.limitExtra.minutes : 0;

    state.limitExtra = { day: today, minutes: Math.min(extra + minutes, 1440) };
    closeModal();
    commit();
    checkLimit();
}

function setLimit(minutes) {
    if (!appOpen || !limitChoices.includes(minutes)) return;

    state.limitMinutes = minutes;
    commit();
    renderParent();
    checkLimit();
}

/* ===== EBEVEYN KÖŞESİ ===== */

function renderParent() {
    const minutes = seconds => Math.round(seconds / 60);
    const limit = limitSeconds();

    $("parentTime").textContent = t("Bugün: {0} dk", minutes(playedToday())) +
        (limit ? " / " + t("{0} dk sınır", minutes(limit)) : "");

    // Son 7 günün çubukları.
    const days = Array.from({ length: 7 }, (unused, index) => dayKey(index - 6));
    const top = Math.max(600, ...days.map(day => state.playLog[day] || 0));

    $("parentBars").innerHTML = "";

    days.forEach(day => {
        const seconds = state.playLog[day] || 0;
        const bar = document.createElement("div");

        bar.className = "play-bar";
        bar.innerHTML = `
            <b>${minutes(seconds)}</b>
            <span></span>
            <small>${currentLang === "tr"
                ? day.slice(8) + "." + day.slice(5,7) : day.slice(5)}</small>
        `;

        bar.querySelector("span").style.height = Math.max(3, seconds / top * 100) + "%";
        $("parentBars").appendChild(bar);
    });

    $("limitSeg").innerHTML = "";

    limitChoices.forEach(choice => {
        const active = state.limitMinutes === choice;
        const button = document.createElement("button");

        button.textContent = choice ? t("{0} dk", choice) : t("Sınır yok");
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        button.onclick = () => setLimit(choice);
        $("limitSeg").appendChild(button);
    });

    const rate = state.patients ? Math.round(state.perfect / state.patients * 100) : 0;

    $("parentSummary").textContent = [
        t("Seviye: {0}", state.level),
        t("Tamamlanan vaka: {0}", state.patients),
        t("İlk denemede doğru kart (3 yıldız): %{0}", rate),
        t("Kazanılan mini oyun: {0}", state.gamesWon),
        t("Biten hikâye bölümü: {0} / {1}", state.story.done.length, chapters.length),
        t("İncelenen organ: {0} / {1}", state.organsSeen.length, organs.length),
        t("Günlük seri: {0} gün", state.daily.streak)
    ].join("\n");

    // Kart başına doğru/yanlış: çocuğun hangi kartta zorlandığını gösterir.
    let hardest = null;
    $("parentCards").innerHTML = "";

    treatments.forEach(treatment => {
        const { right, wrong } = state.cardStats[treatment.id];
        const total = right + wrong;
        const row = document.createElement("div");

        if (wrong && (!hardest || wrong / total > hardest.rate)) {
            hardest = { label: treatment.label, rate: wrong / total };
        }

        row.className = "stat-row";
        row.innerHTML = `
            <span>${escapeHTML(treatment.label)}</span>
            <div class="progress-track"><div class="progress-fill"></div></div>
            <small>${escapeHTML(total
                ? t("{0} doğru, {1} hata", right, wrong) : t("Henüz veri yok"))}</small>
        `;

        row.querySelector(".progress-fill").style.width =
            (total ? right / total * 100 : 0) + "%";
        $("parentCards").appendChild(row);
    });

    $("parentHardest").textContent = hardest
        ? t("En çok zorlandığı kart: {0}", hardest.label)
        : t("Henüz yanlış kart seçilmedi.");

    $("parentTipsTitle").textContent = t("💡 Görülen sağlık bilgileri ({0} / {1})",
        state.tipsShown.length, healthTips.length);
    $("parentTips").innerHTML = "";

    const shown = state.tipsShown.length
        ? state.tipsShown.map(index => healthTips[index])
        : [t("Henüz sağlık bilgisi görülmedi. Bilgiler tamamlanan vakalardan sonra çıkar.")];

    shown.forEach(tip => {
        const item = document.createElement("li");
        item.textContent = tip;
        $("parentTips").appendChild(item);
    });

    $("seasonSeg").innerHTML = "";

    [null, ...seasons].forEach(season => {
        const id = season ? season.id : null;
        const button = document.createElement("button");

        button.textContent = season ? `${season.emoji} ${season.name}` : t("Takvime göre");
        button.classList.toggle("active", seasonPreview === id);
        button.setAttribute("aria-pressed", String(seasonPreview === id));
        button.onclick = () => {
            seasonPreview = id;
            updateUI();
            renderParent();
        };

        $("seasonSeg").appendChild(button);
    });

    renderParentExtras();
}

/* ===== DİL VE YÜKLEME ===== */

function chooseLanguage(lang) {
    if (lang === currentLang) return;

    if (appOpen && !currentUser && !confirm(
        t("Dil değişince sayfa yenilenir ve misafir ilerlemesi silinir. Devam edilsin mi?")
    )) return;

    if (appOpen && currentUser) persist();
    if (!setLanguage(lang)) toast(t("⚠️ Dil ayarı kaydedilemedi."));
}

function renderLanguage() {
    $("langSeg").innerHTML = "";

    for (const [id, name] of [["tr", "Türkçe"], ["en", "English"]]) {
        const button = document.createElement("button");

        button.textContent = name;
        button.lang = id;
        button.classList.toggle("active", currentLang === id);
        button.setAttribute("aria-pressed", String(currentLang === id));
        button.onclick = () => chooseLanguage(id);
        $("langSeg").appendChild(button);
    }
}

// Oyun bir web adresinden açıldıysa çevrimdışı çalışma için hizmet işçisini kaydeder.
// Android uygulamasında dosyalar zaten cihazdadır; kayıt gerekmez.
function registerWorker() {
    if (nativeApp()) return;
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;

    navigator.serviceWorker.register("sw.js").catch(error => {
        console.warn("Çevrimdışı destek kurulamadı.", error);
    });
}

function renderInstall() {
    // Android uygulamasında "uygulama olarak yükle" satırı anlamsızdır.
    $("installRow").hidden = $("installNote").hidden = Boolean(nativeApp());
    if (nativeApp()) return;

    const installed = Boolean(window.matchMedia?.("(display-mode: standalone)").matches);
    const web = /^https?:$/.test(location.protocol);

    $("installButton").disabled = installed || !installPrompt;
    $("installButton").textContent = installed ? t("✅ Yüklü") : t("📲 Yükle");
    $("installNote").textContent = installed
        ? t("Oyun bu cihaza uygulama olarak yüklenmiş.")
        : !web ? t("Yükleme, oyun bir web adresinden (http/https) açıldığında çalışır.")
        : installPrompt ? t("Oyunu ana ekranına ekleyip internetsiz de oynayabilirsin.")
        : t("Tarayıcı menüsündeki \"Uygulamayı yükle\" ya da \"Ana ekrana ekle\" seçeneğini kullanabilirsin.");
}

function installApp() {
    if (!installPrompt) return;

    const prompt = installPrompt;
    installPrompt = null;

    prompt.prompt();
    prompt.userChoice.catch(() => {}).then(renderInstall);
}

/* ===== ORTAK GÜNCELLEME ===== */

// updateUI her çağrıldığında yeni bölümlerin özet alanlarını yeniler.
function updateExtras() {
    const season = shownSeason();
    const chapter = storyChapter();

    $("seasonBanner").hidden = !season;

    if (season) {
        $("seasonText").textContent = `${season.emoji} ${season.greet} ` + (seasonPreview
            ? t("(Önizleme: çıkartmalar yalnızca gerçek özel günlerde çıkar.)")
            : t("Bu günlere özel çıkartmalar vakalardan çıkabilir!"));
    }

    $("storyText").textContent = chapter
        ? t("Devam eden bölüm: {0}", chapter.name)
        : t("{0} / {1} bölüm tamamlandı.", state.story.done.length, chapters.length);

    $("petLine").textContent = has("pet") && state.petName
        ? t("🐶 {0} seni gördüğüne çok sevindi!", state.petName) : "";
    $("petLine").hidden = !$("petLine").textContent;

    renderLanguage();
    renderInstall();
}
