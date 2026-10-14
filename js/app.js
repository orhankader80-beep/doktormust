"use strict";

/* ===== BİLDİRİM VE SES ===== */

function toast(message, success = false) {
    if (success) playSound();

    // Art arda gelen bildirimler birbirini ezmesin diye sıraya alınır.
    if (!$("toast").hidden) {
        const last = toastQueue.length
            ? toastQueue[toastQueue.length - 1] : $("toast").textContent;
        if (last !== message && toastQueue.length < 4) toastQueue.push(message);
        return;
    }

    showToast(message);
}

function showToast(message) {
    $("toast").textContent = message;
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        $("toast").hidden = true;
        if (toastQueue.length) showToast(toastQueue.shift());
    }, toastQueue.length ? 2200 : 3400);
}

function confetti() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    for (let i = 0; i < 28; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti";
        piece.textContent = pick(["🎉", "⭐", "💙", "✨", "🎈"]);
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.animationDuration = 1.4 + Math.random() * 1.4 + "s";
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 3000);
    }
}

// [frekans, gecikme] çiftleri.
const tunes = {
    ok: [[620, 0], [850, .1]],
    bad: [[300, 0], [220, .12]],
    tap: [[720, 0]],
    level: [[523, 0], [659, .12], [784, .24], [1047, .36]],
    win: [[523, 0], [659, .1], [784, .2], [1047, .3], [1319, .42]],
    sticker: [[1047, 0], [1319, .08], [1568, .16]],
    coin: [[988, 0], [1319, .07]],
    lose: [[392, 0], [330, .14], [262, .28]],
    page: [[440, 0], [554, .08]]
};

// Titreşim: yanlış kart, kazanma ve seviye atlama gibi anlarda kısa geri bildirim.
const buzzes = { ok: 25, bad: [40, 60, 40], lose: [60, 80, 60], win: 70, level: [50, 50, 90] };

function buzz(type) {
    if (!state.vibrate || !navigator.vibrate || !own(buzzes, type)) return;

    // Tarayici, kullanici sayfaya dokunmadan titresime izin vermez.
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;

    try {
        navigator.vibrate(buzzes[type]);
    } catch (error) {
        console.warn("Titreşim başlatılamadı.", error);
    }
}

// Mini oyunlar sürerken ekranın kararmasını önler.
let wakeLock = null;
let awake = false;

function keepAwake(on) {
    if (awake === on) return;
    awake = on;

    if (nativeApp() && typeof nativeApp().keepAwake === "function") {
        nativeApp().keepAwake(on);
        return;
    }

    if (!navigator.wakeLock) return;

    if (on) {
        navigator.wakeLock.request("screen")
            .then(lock => {
                if (awake) wakeLock = lock;
                else lock.release();
            })
            .catch(() => {});
    } else if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
    }
}

function playSound(type = "ok") {
    buzz(type);
    if (!state.sound) return;

    try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;

        audioContext = audioContext || new Audio();
        const context = audioContext;

        const play = () => {
            for (const [frequency, delay] of tunes[type] || tunes.ok) {
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                const now = context.currentTime + delay;

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(frequency, now);

                gain.gain.setValueAtTime(.0001, now);
                gain.gain.exponentialRampToValueAtTime(.05, now + .015);
                gain.gain.exponentialRampToValueAtTime(.0001, now + .16);

                oscillator.connect(gain);
                gain.connect(context.destination);

                oscillator.start(now);
                oscillator.stop(now + .18);
                oscillator.onended = () => {
                    oscillator.disconnect();
                    gain.disconnect();
                };
            }
        };

        if (context.state === "suspended") {
            context.resume().then(play).catch(() => {});
        } else {
            play();
        }
    } catch (error) {
        console.warn("Ses çalınamadı.", error);
    }
}

function canSpeak() {
    return Boolean(nativeApp() || window.speechSynthesis);
}

// Metni seçili dilde seslendirir. Simgeler okunmasın diye ayıklanır.
function speak(text) {
    const clean = text
        .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Variation_Selector}\p{Join_Control}]/gu, " ")
        .replace(/\s+/g, " ").trim();

    // Android uygulamasında tarayıcı sesi yoktur; telefonun kendi seslendirmesi kullanılır.
    if (nativeApp()) {
        if (!nativeApp().speak(clean, currentLang)) {
            toast(t("🔇 Bu cihazda sesli okuma kullanılamıyor."));
        }

        return;
    }

    const synth = window.speechSynthesis;

    if (!synth || typeof SpeechSynthesisUtterance !== "function") {
        toast(t("🔇 Bu tarayıcı sesli okumayı desteklemiyor."));
        return;
    }

    try {
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(clean);

        const voice = synth.getVoices().find(voice => voice.lang.toLowerCase().startsWith(currentLang));
        if (voice) utterance.voice = voice;

        utterance.lang = currentLang === "tr" ? "tr-TR" : "en-US";
        utterance.rate = .92;
        synth.speak(utterance);
    } catch (error) {
        console.warn("Sesli okuma başlatılamadı.", error);
    }
}

function stopSpeech() {
    if (nativeApp()) {
        nativeApp().stopSpeech();
        return;
    }

    try {
        window.speechSynthesis?.cancel();
    } catch (error) {
        console.warn("Sesli okuma durdurulamadı.", error);
    }
}

/* ===== KAYIT OKUMA / YAZMA ===== */

function readDatabase() {
    const raw = localStorage.getItem(DB_KEY);
    const parsed = raw === null ? {} : JSON.parse(raw);

    if (!isRecord(parsed)) throw new Error("Geçersiz kayıt biçimi.");

    const result = Object.create(null);
    for (const [key, value] of Object.entries(parsed)) result[key] = value;
    return result;
}

function writeDatabase(database) {
    localStorage.setItem(DB_KEY, JSON.stringify(database));
    storageProblem = false;
}

function setSession(username) {
    try {
        if (username === null) localStorage.removeItem(SESSION_KEY);
        else localStorage.setItem(SESSION_KEY, username);
    } catch (error) {
        console.warn("Oturum kaydedilemedi.", error);
    }
}

function persist() {
    if (!currentUser) return false;

    try {
        // Diğer hesapların son verilerini korumak için yeniden oku.
        const database = readDatabase();

        if (!own(database, currentUser) || !isRecord(database[currentUser])) {
            throw new Error("Oyun hesabı bulunamadı.");
        }

        database[currentUser] = {
            ...database[currentUser],
            state: clone(state),
            clinicItems: clone(clinicItems)
        };

        writeDatabase(database);
        return true;
    } catch (error) {
        storageProblem = true;
        console.warn("İlerleme kaydedilemedi.", error);
        toast(t("⚠️ İlerleme kaydedilemedi. Mevcut kayıt dosyası değiştirilmedi."));
        return false;
    }
}

function between([min, max]) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// Eski sürüm kayıtlarında bölge yoktur; şikâyet adından tahmin edilir.
function guessArea(problem) {
    // Şikâyet adları kayıtlarda Türkçedir; bu kelimeler çevrilmez.
    /* i18n-off */
    const words = [
        ["Kulak", "kulak"], ["Karın", "karin"], ["Mide", "karin"], ["Kol", "kol"],
        ["Bacak", "bacak"], ["Bilek", "bilek"], ["Baş", "bas"], ["Diş", "dis"]
    ];
    /* i18n-on */

    return words.find(([word]) => problem.includes(word))?.[1] || "";
}

function normalizePatient(p, group) {
    if (
        !isRecord(p) ||
        typeof p.name !== "string" ||
        typeof p.problem !== "string" ||
        !Number.isFinite(p.age) ||
        p.age < group.min || p.age > group.max ||
        typeof p.correctTreatment !== "string"
    ) return null;

    // Bölüm hastasının kartı o bölüme, diğerlerininki genel kartlara ait olmalıdır.
    const ward = wards.find(ward => ward.id === p.ward) || null;
    const valid = ward
        ? ward.cards.some(card => card.id === p.correctTreatment)
        : own(cardSigns, p.correctTreatment);
    if (!valid) return null;

    const signs = cardSigns[p.correctTreatment] || cardSigns.agri_kesici;
    const checkup = p.checkup === true && !ward;
    const fallback = ward
        ? wardCases[ward.id].find(item => item.card === p.correctTreatment).says[0]
        : (checkup ? checkupSpeech : fallbackSpeech)[p.correctTreatment];

    return {
        id: newId(),
        name: p.name.slice(0,40),
        age: Math.floor(p.age),
        emoji: typeof p.emoji === "string" ? p.emoji.slice(0,16) : "🧒",
        color: /^#[0-9a-f]{6}$/i.test(p.color || "") ? p.color : colors[0],
        problem: p.problem.slice(0,60),
        correctTreatment: p.correctTreatment,
        hint: guideData.find(g => g.card === p.correctTreatment)?.name || t("Oyun vakası"),
        area: areaNames.includes(p.area) ? p.area
            : typeof p.area === "string" ? "" : guessArea(p.problem),
        speech: typeof p.speech === "string" && p.speech.trim() ? p.speech.slice(0,220) : fallback,
        temp: Number.isInteger(p.temp) && p.temp >= 360 && p.temp <= 400
            ? p.temp : between(tempRanges[signs.temp]),
        bpm: Number.isInteger(p.bpm) && p.bpm >= 50 && p.bpm <= 130
            ? p.bpm : between(pulseRanges[signs.steth === "slow" ? "slow" : signs.temp]),
        exams: (ward ? ward.tools : examTools).map(tool => tool.id)
            .filter(id => Array.isArray(p.exams) && p.exams.includes(id)),
        patience: clamp(number(p.patience,3), 1, 4),
        mistakes: number(p.mistakes),
        usedXray: p.usedXray === true,
        usedTest: p.usedTest === true,
        referral: typeof p.referral === "string" && !ward && !checkup ? p.referral.slice(0,20) : "",
        rescue: p.rescue === true && !ward,
        tricky: p.tricky === true && !ward && !checkup,
        testPaid: p.testPaid === true,
        xrayPaid: p.xrayPaid === true,
        emergency: ward ? ward.timed === true : p.emergency === true && !checkup,
        checkup,
        special: false,
        story: false,
        boss: false,
        ward: ward ? ward.id : "",
        timeLeft: clamp(number(p.timeLeft,45), 5, 45)
    };
}

function normalizeState(saved) {
    saved = isRecord(saved) ? saved : {};
    const doctor = isRecord(saved.doctor) ? saved.doctor : {};

    const result = {
        ...clone(defaultState),
        ...saved,
        doctor: { ...clone(defaultState.doctor), ...doctor }
    };

    result.doctor.name = typeof result.doctor.name === "string"
        ? result.doctor.name.slice(0,40) : t("Doktor");

    if (!own(ageGroups, result.doctor.age)) result.doctor.age = "küçük";
    result.doctor.face = number(result.doctor.face) % 3;

    // Eski kayıtlarda ten ve saç yoktur; seçili hazır yüzden türetilir.
    const savedDoctor = isRecord(saved.doctor) ? saved.doctor : {};
    const preset = doctorPresets[result.doctor.face];

    [["skin", faceSkins], ["hairColor", doctorHairs], ["hairStyle", doctorStyles]].forEach(([key, list], index) => {
        result.doctor[key] = Number.isInteger(savedDoctor[key])
            ? clamp(savedDoctor[key], 0, list.length - 1) : preset[index];
    });

    result.ownedAccessories = [...new Set([
        ...defaultState.ownedAccessories,
        ...(Array.isArray(saved.ownedAccessories) ? saved.ownedAccessories : [])
    ])].filter(i => Number.isInteger(i) && i >= 0 && i < accessories.length);

    result.doctor.accessory = number(result.doctor.accessory) % accessories.length;
    if (!result.ownedAccessories.includes(result.doctor.accessory)) {
        result.doctor.accessory = 0;
    }

    result.difficulty = own(difficulties, saved.difficulty) ? saved.difficulty : "normal";

    for (const key of ["stars", "perfect", "emergencies", "gamesWon", "tipsSeen",
        "checkups", "weeklyWins"]) {
        result[key] = number(saved[key]);
    }

    result.tutorialDone = saved.tutorialDone === true;
    result.autoRead = saved.autoRead === true;
    result.music = saved.music === true;
    result.vibrate = saved.vibrate !== false;
    result.motion = typeof saved.motion === "boolean" ? saved.motion : null;
    result.clinicName = typeof saved.clinicName === "string" ? saved.clinicName.trim().slice(0,24) : "";
    result.familyKey = typeof saved.familyKey === "string" && validFamilyKey(saved.familyKey) ? saved.familyKey : "";

    const codes = isRecord(saved.familyCodes) ? saved.familyCodes : {};
    result.familyCodes = {
        day: typeof codes.day === "string" ? codes.day.slice(0,10) : "",
        list: (Array.isArray(codes.list) ? codes.list : []).filter(code => typeof code === "string").slice(-20).map(code => code.slice(0,8))
    };
    result.theme = themes.some(theme => theme[0] === saved.theme) ? saved.theme : "blue";

    const dayCase = isRecord(saved.dailyCase) ? saved.dailyCase : {};
    result.dailyCase = {
        day: typeof dayCase.day === "string" ? dayCase.day.slice(0,10) : "",
        done: dayCase.done === true,
        stars: clamp(number(dayCase.stars), 0, 3),
        mistakes: clamp(number(dayCase.mistakes), 0, 2)
    };

    result.friends = (Array.isArray(saved.friends) ? saved.friends : [])
        .filter(friend => isRecord(friend) && typeof friend.name === "string" && friend.name.trim() && typeof friend.week === "string")
        .slice(-20)
        .map(friend => ({
            name: friend.name.trim().slice(0,14),
            week: friend.week.slice(0,10),
            cases: clamp(number(friend.cases), 0, 1155),
            perfect: clamp(number(friend.perfect), 0, 1155)
        }));

    const farm = isRecord(saved.farm) ? saved.farm : {};
    result.farm = {
        day: typeof farm.day === "string" ? farm.day.slice(0,10) : "",
        games: number(farm.games),
        duels: number(farm.duels)
    };

    // v10: depo, sahiplenilen hayvanlar, reklam ve kariyer basamağı.
    const stock = isRecord(saved.stock) ? saved.stock : {};
    result.stock = {};
    for (const item of supplies) result.stock[item.id] = clamp(number(stock[item.id], STOCK_START), 0, STOCK_MAX);

    result.pets = (Array.isArray(saved.pets) ? saved.pets : [])
        .filter(pet => isRecord(pet) && typeof pet.name === "string" && own(petKinds, pet.emoji))
        .slice(0, PET_MAX)
        .map(pet => ({
            name: pet.name.slice(0,12),
            emoji: pet.emoji,
            joy: clamp(number(pet.joy, 60), 0, 100),
            care: typeof pet.care === "string" && /^\d{4}-\d{2}-\d{2}$/.test(pet.care) ? pet.care : dayKey(),
            fed: typeof pet.fed === "string" ? pet.fed.slice(0,10) : "",
            played: typeof pet.played === "string" ? pet.played.slice(0,10) : ""
        }));

    const ad = isRecord(saved.ad) ? saved.ad : {};
    result.ad = { kind: adOptions.some(option => option.id === ad.kind) ? ad.kind : "", day: number(ad.day) };

    // Eski kayıtlarda kariyer yoktur; şimdiki ünvan kutlanmış sayılır.
    result.career = Number.isInteger(saved.career)
        ? clamp(saved.career, 0, careerSteps.length - 1) : careerIndex(Math.max(1, number(saved.level) || 1));

    // v11: acil çağrı, haftalık turnuva, şubeler, emeklilik ve büyük düğmeler.
    result.callPending = saved.callPending === true;

    const cup = isRecord(saved.cup) ? saved.cup : {};
    result.cup = {
        week: typeof cup.week === "string" ? cup.week.slice(0,10) : "",
        progress: number(cup.progress),
        done: cup.done === true,
        total: number(cup.total)
    };

    result.branches = (Array.isArray(saved.branches) ? saved.branches : [])
        .filter(branch => isRecord(branch) && cityList.some(city => city.id === branch.city))
        .filter((branch, index, list) => list.findIndex(other => other.city === branch.city) === index)
        .map(branch => ({
            city: branch.city,
            level: clamp(number(branch.level, 1), 1, BRANCH_MAX),
            doctor: typeof branch.doctor === "string" && branch.doctor ? branch.doctor.slice(0,20) : pick(helperDoctors)
        }));
    result.branchDay = typeof saved.branchDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(saved.branchDay) ? saved.branchDay : "";

    const retired = isRecord(saved.retired) ? saved.retired : {};
    result.retired = { count: clamp(number(retired.count), 0, 99), lastPay: number(retired.lastPay) };
    result.bigUI = saved.bigUI === true;

    const shift = isRecord(saved.shift) ? saved.shift : {};
    result.shift = {
        minute: clamp(number(shift.minute) || SHIFT_OPEN, SHIFT_OPEN, SHIFT_CLOSE),
        day: Math.max(1, number(shift.day) || 1),
        cases: number(shift.cases),
        stars: number(shift.stars),
        closed: shift.closed === true,
        home: shift.closed === true && shift.home === true,
        reports: clamp(number(shift.reports), 0, 99),
        // Kliniğin kapandığı an (gerçek zaman); yeni gün bundan 15 dakika sonra başlatılabilir.
        closedAt: shift.closed === true ? number(shift.closedAt) : 0
    };

    result.letters = (Array.isArray(saved.letters) ? saved.letters : [])
        .filter(letter => isRecord(letter) && typeof letter.name === "string" && typeof letter.emoji === "string")
        .slice(-24)
        .map(letter => ({
            name: letter.name.slice(0,40),
            emoji: letter.emoji.slice(0,16),
            line: clamp(number(letter.line), 0, letterLines.length - 1),
            day: typeof letter.day === "string" ? letter.day.slice(0,10) : ""
        }));
    result.diplomaSeen = saved.diplomaSeen === true;

    result.doctor.avatar = avatars.includes(result.doctor.avatar)
        ? result.doctor.avatar : avatars[0];

    result.staff = staffList.map(member => member.id)
        .filter(id => Array.isArray(saved.staff) && saved.staff.includes(id));

    result.week = normalizeWeek(saved.week);
    result.lastWeek = isRecord(saved.lastWeek) && normalizeWeek(saved.lastWeek).key
        ? normalizeWeek(saved.lastWeek) : null;

    const savedWardCases = isRecord(saved.wardCases) ? saved.wardCases : {};
    result.wardCases = {};

    for (const ward of wards) {
        result.wardCases[ward.id] = number(savedWardCases[ward.id]);
    }

    result.petName = typeof saved.petName === "string" ? saved.petName.trim().slice(0,12) : "";

    const decor = isRecord(saved.decor) ? saved.decor : {};
    result.decor = { coat: coatColors.some(([color]) => color === decor.coat) ? decor.coat : "#ffffff" };

    for (const [kind, options] of Object.entries(decorOptions)) {
        result.decor[kind] = options.some(option => option.id === decor[kind])
            ? decor[kind] : options[0].id;
    }

    result.organsSeen = organs.map(organ => organ.id)
        .filter(id => Array.isArray(saved.organsSeen) && saved.organsSeen.includes(id));

    const savedStats = isRecord(saved.cardStats) ? saved.cardStats : {};
    result.cardStats = {};

    for (const card of Object.keys(defaultState.cardStats)) {
        const entry = own(savedStats, card) && isRecord(savedStats[card]) ? savedStats[card] : {};
        result.cardStats[card] = { right: number(entry.right), wrong: number(entry.wrong) };
    }

    result.tipsShown = healthTips.map((tip, index) => index)
        .filter(index => Array.isArray(saved.tipsShown) && saved.tipsShown.includes(index));

    const savedLog = isRecord(saved.playLog) ? saved.playLog : {};
    result.playLog = {};

    for (const day of Object.keys(savedLog)
        .filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)).sort().slice(-14)) {
        result.playLog[day] = Math.min(number(savedLog[day]), 86400);
    }

    const extra = isRecord(saved.limitExtra) ? saved.limitExtra : {};
    result.limitMinutes = limitChoices.includes(saved.limitMinutes) ? saved.limitMinutes : 0;
    result.limitExtra = {
        day: typeof extra.day === "string" ? extra.day.slice(0,10) : "",
        minutes: Math.min(number(extra.minutes), 1440)
    };

    result.files = (Array.isArray(saved.files) ? saved.files : [])
        .filter(file =>
            isRecord(file) &&
            typeof file.name === "string" &&
            typeof file.emoji === "string"
        )
        .slice(-120)
        .map(file => ({
            name: file.name.slice(0,40),
            emoji: file.emoji.slice(0,16),
            age: clamp(number(file.age,6), 4, 14),
            visits: number(file.visits),
            stars: number(file.stars),
            regular: file.regular === true,
            history: (Array.isArray(file.history) ? file.history : [])
                .filter(visit => isRecord(visit) && typeof visit.problem === "string")
                .slice(-5)
                .map(visit => ({
                    day: typeof visit.day === "string" ? visit.day.slice(0,10) : "",
                    problem: visit.problem.slice(0,60),
                    card: typeof visit.card === "string" && own(cardSigns, visit.card)
                        ? visit.card : "",
                    stars: clamp(number(visit.stars), 0, 3),
                    checkup: visit.checkup === true
                }))
        }));

    const stickerIds = new Set(allStickers.map(sticker => sticker.id));
    result.stickers = [...new Set(
        (Array.isArray(saved.stickers) ? saved.stickers : [])
            .filter(id => stickerIds.has(id))
    )];

    result.albumSets = stickerSets
        .filter(set => Array.isArray(saved.albumSets) && saved.albumSets.includes(set.id))
        .map(set => set.id);

    const savedRecords = isRecord(saved.records) ? saved.records : {};
    result.records = {};
    for (const key of Object.keys(defaultState.records)) {
        result.records[key] = number(savedRecords[key]);
    }

    const daily = isRecord(saved.daily) ? saved.daily : {};
    const progress = isRecord(daily.progress) ? daily.progress : {};
    result.daily = {
        lastClaim: typeof daily.lastClaim === "string" ? daily.lastClaim.slice(0,10) : "",
        streak: Math.min(number(daily.streak), 100000),
        questDate: typeof daily.questDate === "string" ? daily.questDate.slice(0,10) : "",
        progress: {
            cases: number(progress.cases),
            games: number(progress.games),
            perfect: number(progress.perfect)
        },
        claimed: (Array.isArray(daily.claimed) ? daily.claimed : [])
            .filter(id => quests.some(quest => quest.id === id))
    };

    if (!/^#[0-9a-f]{6}$/i.test(result.doctor.bg)) {
        result.doctor.bg = defaultState.doctor.bg;
    }

    result.coins = Math.min(number(result.coins,250), 1000000000);
    result.gems = Math.min(number(result.gems,10), 1000000000);
    result.xp = Math.min(number(result.xp), 10000000);
    result.level = clamp(number(result.level,1), 1, 100000);
    result.patients = number(result.patients);
    result.dark = result.dark === true;
    result.sound = result.sound !== false;
    result.clinicEdited = result.clinicEdited === true;

    const allowedBadges = new Set(badges.map(b => b[0]));
    result.badges = [...new Set(
        (Array.isArray(saved.badges) ? saved.badges : [])
            .filter(id => allowedBadges.has(id))
    )];

    const allowedItems = new Set(storeItems.map(item => item.id));
    result.ownedItems = [...new Set([
        ...defaultState.ownedItems,
        ...(Array.isArray(saved.ownedItems) ? saved.ownedItems : [])
    ])].filter(id => allowedItems.has(id));

    const group = ageGroups[result.doctor.age];

    result.activePatients = (
        Array.isArray(saved.activePatients) ? saved.activePatients : []
    ).map(p => normalizePatient(p, group)).filter(Boolean);

    result.queue = (Array.isArray(saved.queue) ? saved.queue : [])
        .map(p => normalizePatient(p, group))
        .filter(p => p && !p.ward)
        .slice(0, 4);

    const savedWards = isRecord(saved.wardPatients) ? saved.wardPatients : {};
    result.wardPatients = {};

    for (const ward of wards) {
        result.wardPatients[ward.id] =
            (Array.isArray(savedWards[ward.id]) ? savedWards[ward.id] : [])
                .map(p => normalizePatient(p, group))
                .filter(p => p && p.ward === ward.id)
                .slice(0, 3);
    }

    result.treated = (Array.isArray(saved.treated) ? saved.treated : [])
        .filter(visitor =>
            isRecord(visitor) &&
            typeof visitor.name === "string" &&
            typeof visitor.emoji === "string" &&
            Number.isFinite(visitor.age) &&
            typeof visitor.card === "string" &&
            own(cardSigns, visitor.card)
        )
        .slice(-8)
        .map(visitor => ({
            name: visitor.name.slice(0,40),
            emoji: visitor.emoji.slice(0,16),
            age: Math.floor(visitor.age),
            card: visitor.card
        }));

    const weekly = isRecord(saved.weekly) ? saved.weekly : {};
    const special = normalizePatient(weekly.patient, group);

    if (special) {
        special.special = true;
        special.checkup = false;
        special.emergency = false;
    }

    result.weekly = {
        week: typeof weekly.week === "string" ? weekly.week.slice(0,10) : "",
        done: weekly.done === true,
        failDay: typeof weekly.failDay === "string" ? weekly.failDay.slice(0,10) : "",
        patient: special
    };

    const story = isRecord(saved.story) ? saved.story : {};
    const savedBest = isRecord(story.best) ? story.best : {};
    const savedCurrent = isRecord(story.current) ? story.current : {};
    const chapter = chapters.find(chapter => chapter.id === savedCurrent.id);

    result.story = {
        done: chapters.map(chapter => chapter.id)
            .filter(id => Array.isArray(story.done) && story.done.includes(id)),
        best: {},
        current: null
    };

    for (const { id, cases } of chapters) {
        result.story.best[id] = clamp(number(savedBest[id]), 0, (cases + 1) * 3);
    }

    if (chapter) {
        const index = clamp(number(savedCurrent.index), 0, chapter.cases);
        const patient = normalizePatient(savedCurrent.patient, group);

        if (patient) {
            patient.story = true;
            patient.boss = index === chapter.cases;
            patient.emergency = chapter.timed === true;
        }

        // Geçersiz ya da eksik hasta, hikâye ekranı açılınca yeniden oluşturulur.
        result.story.current = {
            id: chapter.id,
            index,
            stars: clamp(number(savedCurrent.stars), 0, index * 3),
            patient
        };
    }

    while (result.xp >= result.level * 100) {
        result.xp -= result.level * 100;
        result.level++;
    }

    return result;
}

function loadAccount(account) {
    state = normalizeState(account.state);

    const savedClinic = Array.isArray(account.clinicItems)
        ? account.clinicItems : defaultClinic;

    clinicItems = savedClinic
        .filter(item => isRecord(item) && state.ownedItems.includes(item.type))
        .map(item => ({
            id: newId(),
            type: item.type,
            room: rooms.some(room => room.id === item.room) ? item.room : "main",
            x: clamp(Number.isFinite(item.x) ? item.x : 50, 7, 93),
            y: clamp(Number.isFinite(item.y) ? item.y : 50, 10, 90),
            r: Number.isFinite(item.r) ? item.r % 360 : 0
        }));
}

/* ===== YEREL HESAP PAROLALARI ===== */

function hex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2,"0")).join("");
}

// Kullanıcıya olduğu gibi gösterilebilen hata; friendly işareti bunu belirtir.
function unsupportedCrypto() {
    return Object.assign(new Error(
        t("Bu tarayıcıda parola işlemi desteklenmiyor. Misafir olarak oynayabilirsin.")
    ), { friendly: true });
}

async function derivePassword(password, salt, iterations) {
    if (!globalThis.crypto?.subtle) {
        throw unsupportedCrypto();
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations,
        hash: "SHA-256"
    }, key, 256);

    return hex(new Uint8Array(bits));
}

async function createCredentials(password) {
    if (!globalThis.crypto?.subtle) {
        throw unsupportedCrypto();
    }

    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const iterations = 120000;

    return {
        type: "pbkdf2-sha256",
        salt,
        iterations,
        hash: await derivePassword(password, salt, iterations)
    };
}

async function verifyPassword(account, password) {
    if (isRecord(account.credentials)) {
        const c = account.credentials;

        if (
            c.type !== "pbkdf2-sha256" ||
            typeof c.salt !== "string" ||
            typeof c.hash !== "string" ||
            !Number.isInteger(c.iterations) ||
            c.iterations < 10000 ||
            c.iterations > 1000000
        ) return false;

        return await derivePassword(password, c.salt, c.iterations) === c.hash;
    }

    // Eski sürümde oluşturulan hesaplarla uyumluluk.
    return typeof account.password === "string" &&
        account.password === password.trim();
}

/* ===== GİRİŞ ===== */

function switchAuthView(view) {
    const views = ["home", "login", "register", "profile"];
    if (authBusy || !views.includes(view)) return;

    for (const name of views) {
        $("auth-" + name).hidden = name !== view;
    }

    if (view === "home") renderProfiles();
    if (view === "profile") renderAvatarPick();
}

function setAuthBusy(value) {
    authBusy = value;
    $("authScreen").querySelectorAll("button").forEach(button => {
        button.disabled = value;
    });
}

async function doRegister() {
    if (authBusy) return;

    const username = $("regUsername").value.trim();
    const password = $("regPassword").value;

    if (!username || username.length > 15 || !password.trim()) {
        toast(t("⚠️ En fazla 15 karakterlik kullanıcı adı ve bir parola gir."));
        return;
    }

    setAuthBusy(true);

    try {
        let database = readDatabase();
        if (own(database, username)) {
            toast(t("⚠️ Bu kullanıcı adı zaten kullanılıyor."));
            return;
        }

        const credentials = await createCredentials(password);

        // Parola hazırlanırken değişmiş olabilecek kayıtları yeniden oku.
        database = readDatabase();
        if (own(database, username)) {
            toast(t("⚠️ Bu kullanıcı adı zaten kullanılıyor."));
            return;
        }

        const savedState = clone(defaultState);
        savedState.doctor.name = username;
        savedState.doctor.age = selectedAge;

        const account = {
            credentials,
            state: savedState,
            clinicItems: clone(defaultClinic)
        };

        database[username] = account;
        writeDatabase(database);

        currentUser = username;
        setSession(username);
        loadAccount(account);
        $("regPassword").value = "";
        openApp();
        toast(t("🎉 Hesabın oluşturuldu!"), true);
    } catch (error) {
        console.warn(error);
        toast(error.friendly
            ? error.message
            : t("⚠️ Hesap kaydedilemedi. Tarayıcı depolamasını kontrol et."));
    } finally {
        setAuthBusy(false);
    }
}

async function doLogin() {
    if (authBusy) return;

    const username = $("loginUsername").value.trim();
    const password = $("loginPassword").value;

    if (!username || !password) {
        toast(t("⚠️ Kullanıcı adı ve parola gir."));
        return;
    }

    setAuthBusy(true);

    try {
        let database = readDatabase();
        let account = own(database, username) ? database[username] : null;

        if (!isRecord(account) || !(await verifyPassword(account,password))) {
            toast(t("❌ Hatalı kullanıcı adı veya parola."));
            return;
        }

        // Eski düz metin parola kaydını mümkünse dönüştür.
        if (!account.credentials && globalThis.crypto?.subtle) {
            const oldPassword = account.password;
            const credentials = await createCredentials(oldPassword);

            database = readDatabase();
            account = database[username];

            if (!isRecord(account) || account.password !== oldPassword) {
                throw new Error("Hesap değişti. Tekrar giriş yap.");
            }

            account = { ...account, credentials };
            delete account.password;
            database[username] = account;

            try {
                writeDatabase(database);
            } catch (error) {
                console.warn("Eski parola kaydı dönüştürülemedi.", error);
            }
        }

        currentUser = username;
        setSession(username);
        loadAccount(account);
        $("loginPassword").value = "";
        openApp();
        toast(t("👋 Hoş geldin, Dr. {0}!", username), true);
    } catch (error) {
        console.warn(error);
        toast(t("⚠️ Hesap açılamadı. Kayıtları veya tarayıcı desteğini kontrol et."));
    } finally {
        setAuthBusy(false);
    }
}

function guestLogin() {
    if (authBusy) return;

    currentUser = null;
    setSession(null);
    state = clone(defaultState);
    clinicItems = clone(defaultClinic);
    state.doctor.name = t("Misafir");

    openApp();
    toast(t("🕵️ Misafir oyunu başladı. İlerlemen bu oturum içindir."));
}

function openApp() {
    closeModal();
    dragging = null;
    selectedClinicItem = null;
    selectedClinicType = null;
    currentRoom = "main";
    pendingLevelUps = 0;
    appOpen = true;

    if (!state.activePatients.length) generatePatients();
    refillQueue();
    rollWeek();
    refreshWeekly();

    // İlk hasta rehberi her profilde bir kez kendiliğinden açılır.
    const firstVisit = !state.tutorialDone;
    state.tutorialDone = true;

    $("authScreen").hidden = true;
    $("app").hidden = false;
    showScreen("home");
    commit();
    startPlayClock();
    startMusic();

    if (limitReached()) checkLimit();
    else if (firstVisit) startFirstCase();
}

function logout() {
    if (!appOpen) return;

    endDrag();
    stopPlayClock();
    stopMusic();
    if (currentUser) persist();
    closeModal();

    $("limitOverlay").hidden = true;
    $("app").inert = false;
    parentUnlocked = false;
    seasonPreview = null;

    currentUser = null;
    setSession(null);
    appOpen = false;
    selectedClinicItem = null;
    selectedClinicType = null;
    state = clone(defaultState);
    clinicItems = clone(defaultClinic);

    $("app").hidden = true;
    $("authScreen").hidden = false;
    document.body.classList.remove("dark", "menu-open");
    sceneSeen = new Set();
    sceneKey = "";
    classGame = null;
    document.body.style.removeProperty("--primary");
    document.body.style.removeProperty("--primary2");
    applyMotion();

    for (const id of ["loginUsername","loginPassword","regUsername","regPassword","profileName"]) {
        $(id).value = "";
    }

    switchAuthView("home");
    toast(t("🚪 Çıkış yapıldı."));
}

/* ===== ARAYÜZ VE BAŞARILAR ===== */

function rank() {
    return careerSteps[careerIndex()].name;
}

function doctorEmoji() {
    return ["👨‍⚕️","👩‍⚕️","🧑‍⚕️"][state.doctor.face] +
        accessories[state.doctor.accessory].emoji;
}

const has = id => state.ownedItems.includes(id);

/* ===== GÜNLÜK ÖDÜL VE GÖREVLER ===== */

function dayKey(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);

    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2,"0") + "-" +
        String(date.getDate()).padStart(2,"0");
}

function refreshDaily() {
    const daily = state.daily;

    if (daily.questDate !== dayKey()) {
        daily.questDate = dayKey();
        daily.progress = { cases: 0, games: 0, perfect: 0 };
        daily.claimed = [];
    }

    // Bir gün atlanırsa seri sıfırlanır.
    if (daily.lastClaim !== dayKey() && daily.lastClaim !== dayKey(-1)) {
        daily.streak = 0;
    }
}

function questProgress(id) {
    refreshDaily();
    state.daily.progress[id] = Math.min(state.daily.progress[id] + 1, 99);
}

function questValue(quest) {
    const daily = state.daily;

    return quest.meta
        ? daily.claimed.filter(id => id !== quest.id).length
        : daily.progress[quest.id];
}

// Haftanın anahtarı, o haftanın pazartesi günüdür.
function weekKey() {
    return dayKey(-((new Date().getDay() + 6) % 7));
}

function refreshWeekly() {
    const weekly = state.weekly;

    if (weekly.week !== weekKey()) {
        weekly.week = weekKey();
        weekly.done = false;
        weekly.failDay = "";
        weekly.patient = null;
    }

    // Kaçırılan özel hasta ertesi gün yeniden gelir.
    if (!weekly.done && !weekly.patient && weekly.failDay !== dayKey()) {
        weekly.patient = makeSpecialPatient();
    }
}

function claimDaily() {
    if (!appOpen) return;
    refreshDaily();

    const daily = state.daily;
    if (daily.lastClaim === dayKey()) return;

    daily.streak++;
    daily.lastClaim = dayKey();

    const coins = Math.min(40 + daily.streak * 10, 150);
    const gems = daily.streak % 7 === 0 ? 5 : 1;
    state.coins += coins;
    state.gems += gems;

    const saved = commit();
    confetti();
    if (!currentUser || saved) {
        toast(t("🎁 {0}. gün ödülü: +{1} coin, +{2} 💎", daily.streak, coins, gems), true);
    }
}

function claimQuest(id) {
    if (!appOpen) return;
    refreshDaily();

    const quest = quests.find(quest => quest.id === id);
    const daily = state.daily;
    if (!quest || daily.claimed.includes(id) || questValue(quest) < quest.goal) return;

    daily.claimed.push(id);
    state.coins += quest.coins || 0;
    state.gems += quest.gems || 0;

    const saved = commit();
    if (!currentUser || saved) {
        toast(t("📋 Görev tamamlandı! ") +
            (quest.gems ? `+${quest.gems} 💎` : t("+{0} coin", quest.coins)), true);
    }
}

function renderDaily() {
    refreshDaily();

    const daily = state.daily;
    const claimed = daily.lastClaim === dayKey();

    $("dailyText").textContent = t("🔥 Seri: {0} gün. ", daily.streak) +
        (claimed ? t("Yarın tekrar gel!") : t("Bugünün ödülü seni bekliyor!"));
    $("dailyButton").disabled = claimed;
    $("dailyButton").textContent = claimed ? t("✅ Bugün alındı") : t("🎁 Ödülü Al");

    $("questList").innerHTML = "";

    quests.forEach(quest => {
        const value = Math.min(questValue(quest), quest.goal);
        const done = daily.claimed.includes(quest.id);
        const ready = !done && value >= quest.goal;

        const row = document.createElement("div");
        row.className = "quest-row";
        row.innerHTML = `
            <span>${escapeHTML(quest.label)} <b>(${value}/${quest.goal})</b></span>
            <button class="${ready ? "success-btn" : "secondary-btn"}"
                ${ready ? "" : "disabled"}>
                ${done ? t("✅ Alındı") : quest.gems ? "💎 " + quest.gems : "🪙 " + quest.coins}
            </button>
        `;

        row.querySelector("button").onclick = () => claimQuest(quest.id);
        $("questList").appendChild(row);
    });
}

function applyTheme() {
    document.body.classList.toggle("dark", state.dark);

    $("darkToggle").textContent = state.dark ? t("Açık") : t("Kapalı");
    $("darkToggle").classList.toggle("on", state.dark);
    $("darkToggle").setAttribute("aria-pressed", String(state.dark));

    $("soundToggle").textContent = state.sound ? t("Açık") : t("Kapalı");
    $("soundToggle").classList.toggle("on", state.sound);
    $("soundToggle").setAttribute("aria-pressed", String(state.sound));

    $("readToggle").textContent = state.autoRead ? t("Açık") : t("Kapalı");
    $("readToggle").classList.toggle("on", state.autoRead);
    $("readToggle").setAttribute("aria-pressed", String(state.autoRead));

    $("musicToggle").textContent = state.music ? t("Açık") : t("Kapalı");
    $("musicToggle").classList.toggle("on", state.music);
    $("musicToggle").setAttribute("aria-pressed", String(state.music));
    $("musicQuick").classList.toggle("on", state.music);
    $("musicQuick").setAttribute("aria-pressed", String(state.music));

    $("vibrateToggle").textContent = state.vibrate ? t("Açık") : t("Kapalı");
    $("vibrateToggle").classList.toggle("on", state.vibrate);
    $("vibrateToggle").setAttribute("aria-pressed", String(state.vibrate));

    $("motionToggle").textContent = isStill() ? t("Kapalı") : t("Açık");
    $("motionToggle").classList.toggle("on", !isStill());
    $("motionToggle").setAttribute("aria-pressed", String(!isStill()));
    applyMotion();

    document.body.style.setProperty("--coat", state.decor.coat);

    $("clinicEditArea").style.backgroundColor = state.dark
        ? "#1c2a3d" : state.doctor.bg;
}

function updateUI() {
    $("doctorNameText").textContent = state.doctor.name;
    $("coinStat").textContent = state.coins;
    $("gemStat").textContent = state.gems;
    $("levelStat").textContent = state.level;
    $("xpText").textContent = `${state.xp} / ${state.level * 100}`;
    $("xpBar").style.width = (state.xp / (state.level * 100) * 100) + "%";
    $("patientText").textContent = state.patients;
    $("badgeText").textContent = state.badges.length;
    $("rankText").textContent = t("{0} • Seviye {1}", rank(), state.level);
    $("doctorLevel").textContent = state.level;
    $("doctorXP").textContent = state.xp;
    $("doctorPatients").textContent = state.patients;
    $("doctorStars").textContent = state.stars;
    $("doctorPerfect").textContent = state.perfect;
    $("doctorGames").textContent = state.gamesWon;
    $("doctorCheckups").textContent = state.checkups;
    $("doctorStickers").textContent = `${state.stickers.length} / ${allStickers.length}`;

    renderDaily();
    $("doctorStreak").textContent = state.daily.streak + t(" gün");

    rollWeek();
    refreshWeekly();
    const weekly = state.weekly;

    $("weeklyText").textContent = weekly.done
        ? t("✅ Bu haftanın özel hastasını iyileştirdin. Yenisi pazartesi gelir.")
        : weekly.patient
            ? t("Gizemli bir vaka seni bekliyor: 3 kat ödül, 3 💎 ve bir çıkartma!")
            : t("Özel hasta bugün gitti. Yarın tekrar gelecek.");
    $("weeklyButton").disabled = !weekly.patient;

    updateExtras();

    $("stickerText").textContent = `${state.stickers.length} / ${allStickers.length}`;
    $("clinicScoreText").textContent = clinicScore();
    $("clinicBonusText").textContent =
        t("Her vakada +{0} coin bonus. Farklı eşyalar yerleştirdikçe artar.", clinicBonus());
    $("clinicScoreInline").textContent = t("🌟 Klinik puanı: {0}", clinicScore());

    for (const id of ["doctorPreview","doctorBig","clinicDoctor"]) {
        $(id).innerHTML = doctorFigure();
    }

    renderDoctorLook();
    renderEvent();
    renderShift();
    renderCustom();
    renderV9();
    renderV10();
    renderV11();
    renderRobot();

    // Sahne, açık bir pencere yokken güncellenir (pencere kapanınca da yenilenir).
    if (!activeModal) renderScene();

    $("profileInfo").textContent =
        `${currentUser ? t("Kayıtlı profil") : t("Misafir oturumu")} • ` +
        t("Hasta grubu: {0}", ageGroups[state.doctor.age].label);

    $("saveInfo").textContent = currentUser
        ? storageProblem
            ? t("Son kayıt işlemi başarısız oldu. İlerlemen şu anda yalnızca açık oyunda bulunuyor.")
            : t("İlerlemen bu tarayıcıda otomatik kaydedilir.")
        : t("Misafir ilerlemesi kalıcı kaydedilmez.");

    applyTheme();
}

function checkBadges() {
    const conditions = {
        first: state.patients >= 1,
        five: state.patients >= 5,
        twentyfive: state.patients >= 25,
        perfect10: state.perfect >= 10,
        emergency: state.emergencies >= 5,
        level3: state.level >= 3,
        level5: state.level >= 5,
        level10: state.level >= 10,
        rich: state.coins >= 500,
        clinic: state.clinicEdited,
        collector: storeItems.every(item => has(item.id)),
        streak3: state.daily.streak >= 3,
        streak7: state.daily.streak >= 7,
        gamer: state.gamesWon >= 20,
        germ: state.records.germ >= 15,
        wise: state.tipsSeen >= 10,
        sticker10: state.stickers.length >= 10,
        album: coreStickers.every(sticker => state.stickers.includes(sticker.id)),
        season: allStickers.some(sticker => sticker.season && state.stickers.includes(sticker.id)),
        storyall: state.story.done.length >= chapters.length,
        regulars: state.files.filter(file => file.regular).length >= 3,
        body: state.organsSeen.length >= organs.length,
        team: staffList.every(member => hasStaff(member.id)),
        diploma: state.diplomaSeen,
        family: state.checkups >= 5,
        weekly: state.weeklyWins >= 1,
        clinicstar: clinicScore() >= 150,
        allgames: Object.entries(state.records)
            .every(([key, value]) => key.startsWith("memory_") || value > 0) &&
            Object.keys(difficulties).some(level => state.records["memory_" + level] > 0)
    };

    for (const chapter of chapters) {
        conditions["ch_" + chapter.id] = state.story.done.includes(chapter.id);
    }

    Object.assign(conditions, extraBadgeConditions());

    for (const ward of wards) {
        conditions["ward_" + ward.id] = state.wardCases[ward.id] >= 5;
    }

    // Her yeni rozet 1 elmas kazandırır.
    const fresh = [];

    for (const [id, passed] of Object.entries(conditions)) {
        if (passed && !state.badges.includes(id)) {
            state.badges.push(id);
            state.gems++;
            fresh.push(badges.find(badge => badge[0] === id)[2]);
        }
    }

    return fresh;
}

// Tamamlanan her albüm sayfası bir kez 5 elmas ve 100 coin kazandırır.
function checkAlbum() {
    const fresh = [];

    for (const set of stickerSets) {
        const complete = set.stickers.every(sticker => state.stickers.includes(sticker.id));

        if (complete && !state.albumSets.includes(set.id)) {
            state.albumSets.push(set.id);
            state.gems += 5;
            state.coins += 100;
            fresh.push(set.name);
        }
    }

    return fresh;
}

// Çıkartma çıkarsa sonuç metnine eklenecek satırı, çıkmazsa boş metin döndürür.
function rollSticker(chance) {
    if (Math.random() >= chance) return "";

    // Özel gün çıkartmaları yalnızca kendi günlerinde çıkar.
    const season = currentSeason();
    const pool = allStickers
        .filter(sticker => !sticker.season || (season && sticker.season === season.id));
    const missing = pool.filter(sticker => !state.stickers.includes(sticker.id));
    const festive = missing.filter(sticker => sticker.season);

    const sticker = festive.length && Math.random() < .4 ? pick(festive)
        : missing.length && Math.random() < .75 ? pick(missing) : pick(pool);

    if (state.stickers.includes(sticker.id)) {
        state.coins += 5;
        return t("\n🎟️ Çıkartma: {0} {1} (sende vardı, +5 coin)", sticker.emoji, sticker.name);
    }

    state.stickers.push(sticker.id);
    state.week.stickers++;
    playSound("sticker");
    return t("\n🎟️ Yeni çıkartma: {0} {1}!", sticker.emoji, sticker.name);
}

// Kliniğe yerleştirilen eşyaların çeşidi, sayısı ve kullanılan odalar puan verir.
function clinicScore() {
    const placed = clinicItems.filter(item => has(item.type));
    const types = new Set(placed.map(item => item.type)).size;
    const usedRooms = new Set(placed.map(item => item.room || "main")).size;

    return types * 10 + Math.min(placed.length, 20) * 3 + usedRooms * 15 +
        (hasStaff("cleaner") ? 20 : 0);
}

function clinicBonus() {
    return Math.min(8, Math.floor(clinicScore() / 25));
}

function addXP(amount) {
    state.xp += amount;
    while (state.xp >= state.level * 100) {
        state.xp -= state.level * 100;
        state.level++;
        pendingLevelUps++;
    }
}

function commit() {
    // Her seviye atlama 2 elmas kazandırır.
    const levels = pendingLevelUps;
    pendingLevelUps = 0;
    state.gems += levels * 2;
    const promotion = checkPromotion();

    const pages = checkAlbum();
    const fresh = checkBadges();
    const saved = currentUser ? persist() : false;
    updateUI();

    if (levels) {
        confetti();
        playSound("level");
        toast(t("🚀 Seviye {0} oldun! +{1} 💎", state.level, levels * 2));

        const stat = $("levelStat").parentElement;
        stat.classList.remove("levelup");
        void stat.offsetWidth;
        stat.classList.add("levelup");

        if (currentScreen === "store") renderStore();
    }

    if (promotion) toast(t("🎓 Terfi! Artık {0} {1} oldun!", promotion.emoji, promotion.name), true);

    pages.forEach(name => toast(t("📒 \"{0}\" sayfası tamamlandı! +5 💎, +100 coin", name)));
    fresh.forEach(name => toast(t("🏆 Yeni rozet: {0} (+1 💎)", name)));
    return saved;
}

function showScreen(name) {
    if (!appOpen) return;
    const info = screenData.find(screen => screen[0] === name);
    if (!info) return;

    // Ebeveyn köşesi her girişte küçük bir işlem sorusuyla açılır.
    if (name === "parent" && !parentUnlocked) {
        openGate("parent");
        return;
    }

    if (name !== "parent") parentUnlocked = false;

    endDrag();
    closeModal();
    currentScreen = name;

    for (const [id] of screenData) {
        $("screen-" + id).hidden = id !== name;
    }

    $("nav").querySelectorAll("button").forEach(button => {
        const active = button.dataset.screen === name;
        button.classList.toggle("active", active);
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });

    $("pageTitle").textContent = info[3];
    document.body.classList.remove("menu-open");
    renderDock();
    updateUI();

    if (name === "clinic") renderClinic();
    if (name === "patients") renderPatients();
    if (name === "store") renderStore();
    if (name === "guide") renderGuide();
    if (name === "badges") renderBadges();
    if (name === "games") renderGames();
    if (name === "album") renderAlbum();
    if (name === "story") renderStory();
    if (name === "wards") renderWards();
    if (name === "files") renderFiles();
    if (name === "body") renderBody();
    if (name === "parent") renderParent();
    if (name === "doctor") {
        renderAccessories();
        renderDoctorExtras();
    }
    if (name === "settings") renderSettings();
}

function renderSettings() {
    $("ageSeg").innerHTML = "";

    for (const [id, group] of Object.entries(ageGroups)) {
        const button = document.createElement("button");
        button.textContent = group.label;
        button.classList.toggle("active", state.doctor.age === id);
        button.setAttribute("aria-pressed", String(state.doctor.age === id));
        button.onclick = () => setAgeGroup(id);
        $("ageSeg").appendChild(button);
    }
}

function setAgeGroup(id) {
    if (!appOpen || !own(ageGroups,id) || state.doctor.age === id) return;

    if (!confirm(t("Yaş grubu değişince bekleyen hastaların yerine yeni hastalar gelir. Devam edilsin mi?"))) return;

    state.doctor.age = id;
    state.weekly.patient = null;
    if (state.story.current) state.story.current.patient = null;
    for (const ward of wards) state.wardPatients[ward.id] = [];
    generatePatients();
    const saved = commit();
    renderSettings();

    if (!currentUser || saved) toast(t("🧒 Yeni hasta grubu hazır."));
}

function toggleDark() {
    if (!appOpen) return;
    state.dark = !state.dark;
    commit();
}

function toggleSound() {
    if (!appOpen) return;
    state.sound = !state.sound;
    commit();
    if (state.sound) playSound();
}

function toggleVibrate() {
    if (!appOpen) return;
    state.vibrate = !state.vibrate;
    commit();
    buzz("win");
}

function toggleRead() {
    if (!appOpen) return;
    state.autoRead = !state.autoRead;
    commit();
    if (state.autoRead) speak(t("Sesli okuma açıldı."));
}

// Karakter canlandırmaları kapalı mı? Oyuncu seçmediyse cihazın ayarına bakılır.
function isStill() {
    if (typeof state.motion === "boolean") return !state.motion;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function applyMotion() {
    document.body.classList.toggle("still", isStill());
}

function toggleMotion() {
    if (!appOpen) return;

    state.motion = isStill();
    commit();
}

/* ===== TANITIM TURU ===== */

function startTour() {
    if (!appOpen) return;

    openModal("tourModal");
    tourIndex = 0;
    renderTour();
}

function renderTour() {
    const [emoji, title, text] = tourSteps[tourIndex];

    $("tourEmoji").textContent = emoji;
    $("tourTitle").textContent = title;
    $("tourText").textContent = text;
    $("tourDots").textContent = tourSteps
        .map((step, index) => index === tourIndex ? "●" : "○").join(" ");
    $("tourBack").disabled = tourIndex === 0;
    $("tourNext").textContent = tourIndex === tourSteps.length - 1
        ? t("🩺 Hastalara Git") : t("İleri ➡️");
}

function tourStep(direction) {
    if (activeModal !== "tourModal") return;

    if (direction > 0 && tourIndex === tourSteps.length - 1) {
        showScreen("patients");
        return;
    }

    tourIndex = clamp(tourIndex + direction, 0, tourSteps.length - 1);
    renderTour();
}

/* ===== YEDEKLEME ===== */

function exportBackup() {
    if (!appOpen) return;

    const data = {
        app: "doktormust",
        version: 1,
        saved: new Date().toISOString(),
        state: clone(state),
        clinicItems: clone(clinicItems)
    };

    const name = `doktormust-yedek-${dayKey()}.json`;

    // Android uygulaması dosyayı kendi "Kaydet" penceresiyle yazar ve onBackupSaved ile haber verir.
    if (nativeApp()) {
        nativeApp().saveBackup(name, JSON.stringify(data));
        return;
    }

    const url = URL.createObjectURL(
        new Blob([JSON.stringify(data)], { type: "application/json" })
    );
    const link = document.createElement("a");

    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast(t("📤 Yedek dosyası indirildi."));
}

// Android uygulaması yedeği kaydedince (ya da kaydedemeyince) çağırır.
function onBackupSaved(saved) {
    toast(saved ? t("📤 Yedek dosyası kaydedildi.") : t("⚠️ Yedek kaydedilemedi."));
}

async function importBackup(input) {
    const file = input.files?.[0];
    input.value = "";
    if (!appOpen || !file) return;

    try {
        if (file.size > 1000000) throw new Error("Yedek dosyası çok büyük.");

        const data = JSON.parse(await file.text());

        if (!appOpen) return;
        if (!isRecord(data) || data.app !== "doktormust" || !isRecord(data.state)) {
            throw new Error("Geçersiz yedek biçimi.");
        }

        if (!confirm(t("Yedek yüklenince şu anki ilerlemenin yerine geçer. Devam edilsin mi?"))) return;

        // Profil adı açık olan hesabın adı olarak kalır.
        const name = state.doctor.name;
        loadAccount({ state: data.state, clinicItems: data.clinicItems });
        state.doctor.name = name;
        state.tutorialDone = true;

        if (!state.activePatients.length) generatePatients();

        currentRoom = "main";
        selectedClinicItem = null;
        selectedClinicType = null;

        const saved = commit();
        showScreen("home");

        if (!currentUser || saved) toast(t("📥 Yedek yüklendi!"), true);
    } catch (error) {
        console.warn("Yedek yüklenemedi.", error);
        toast(t("⚠️ Bu dosya geçerli bir Doktormust yedeği değil."));
    }
}

/* ===== MODAL YÖNETİMİ ===== */

function openModal(id) {
    const previousFocus = activeModal ? returnFocus : document.activeElement;
    closeModal(false);

    returnFocus = previousFocus;
    activeModal = id;
    $(id).hidden = false;

    $("app").inert = true;
    document.body.style.overflow = "hidden";

    $(id).querySelector(".modal").focus();
}

function closeModal(restoreFocus = true) {
    stopCaseTimer();
    stopExam();
    stopStage();
    endCoach();
    resetCure();
    stopSpeech();
    stopGame();

    if (activeModal) $(activeModal).hidden = true;

    activeModal = null;
    activePatientId = null;
    gameRound = null;
    duel = null;
    $("gameModal").onkeydown = null;
    keepAwake(false);

    // Süre sınırı perdesi açıkken arkadaki oyun etkileşime kapalı kalır.
    $("app").inert = !$("limitOverlay").hidden;
    document.body.style.overflow = "";

    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;

    if (appOpen) renderScene();
}
