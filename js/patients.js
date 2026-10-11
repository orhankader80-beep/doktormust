"use strict";

/* ===== HASTALAR ===== */

// Hastanın bölümü; genel klinik hastalarında null.
function wardOf(patient) {
    return patient.ward ? wards.find(ward => ward.id === patient.ward) || null : null;
}

// Genel ya da bölüm kartının bilgisi: { id, label, signs }.
function cardInfo(id) {
    const general = treatments.find(card => card.id === id);

    if (general) {
        return { id, label: general.label, signs: guideData.find(guide => guide.card === id).signs };
    }

    for (const ward of wards) {
        const card = ward.cards.find(card => card.id === id);
        if (card) return card;
    }

    return null;
}

function toolsFor(patient) {
    const ward = wardOf(patient);
    return ward ? ward.tools : examTools;
}

function cardsFor(patient) {
    const ward = wardOf(patient);
    return ward ? ward.cards : treatments;
}

const hasStaff = id => state.staff.includes(id);

// ward: uzmanlık bölümü hastasıysa o bölüm, değilse null.
function makePatient(disease, group, ward = null) {
    const card = disease.correctTreatment;
    const signs = cardSigns[card] || cardSigns.agri_kesici;
    const name = pick(namePool);
    const emoji = pick(sharedNames.includes(name) ? patientEmojis
        : girlNames.includes(name) ? girlEmojis : boyEmojis);

    // Dosyası olan hasta her gelişinde aynı yaşta görünür.
    const file = findFile({ name, emoji });
    const known = file && file.age >= group.min && file.age <= group.max;

    return {
        id: newId(),
        name,
        age: known ? file.age : between([group.min, group.max]),
        emoji,
        color: pick(colors),
        problem: disease.problem,
        correctTreatment: card,
        hint: ward ? "" : guideData.find(guide => guide.card === card).name,
        area: disease.area,
        speech: pick(disease.says),
        temp: between(tempRanges[signs.temp]),
        bpm: between(pulseRanges[signs.steth === "slow" ? "slow" : signs.temp]),
        // Hemşire, genel klinik hastalarının ateşini önceden ölçer.
        exams: !ward && hasStaff("nurse") ? ["temp"] : [],
        patience: has("pet") ? 4 : 3,
        mistakes: 0,
        usedXray: false,
        testPaid: false,
        xrayPaid: false,
        emergency: ward ? ward.timed === true : has("ambulance") && Math.random() < .25,
        checkup: false,
        special: false,
        story: false,
        boss: false,
        ward: ward ? ward.id : "",
        timeLeft: 45
    };
}

// İyileşen eski bir hastanın kontrol ziyareti: kart seçilmez, yalnızca karşılanır.
function makeCheckup(visitor, group) {
    return {
        ...makePatient({
            problem: checkupProblem,
            correctTreatment: visitor.card,
            area: "",
            says: [checkupSpeech[visitor.card]]
        }, group),
        name: visitor.name,
        age: visitor.age,
        emoji: visitor.emoji,
        exams: [],
        emergency: false,
        checkup: true
    };
}

// Haftanın özel hastası: şikâyeti belirsizdir, rapor istenemez, sabrı azdır.
function makeSpecialPatient() {
    const group = ageGroups[state.doctor.age];
    const patient = makePatient({
        ...pick(diseasePool[group.pool]),
        problem: specialProblem,
        says: specialSpeech
    }, group);

    patient.special = true;
    patient.emergency = false;
    makeTricky(patient);

    return patient;
}

// Zor vaka: sabır azdır ve bulgulardan biri yanıltıcı olabilir.
function makeTricky(patient) {
    patient.patience = 2;

    // Yanıltıcı bulgu: ateşi normal olması gereken vakada hafif ateş.
    if (cardSigns[patient.correctTreatment].temp === "normal" && Math.random() < .6) {
        patient.temp = between(tempRanges.mild);
    }
}

/* ---- Bekleme odası: muayene edilen hastanın yerine sıradaki gelir ---- */

function queueSize() {
    return hasStaff("reception") ? 4 : 2;
}

// Kliniğe yeni gelen kişi: çoğunlukla yeni bir vaka, bazen kontrole gelen eski hasta.
function newArrival() {
    const group = ageGroups[state.doctor.age];
    const visitors = state.treated
        .filter(visitor => visitor.age >= group.min && visitor.age <= group.max);

    if (visitors.length && Math.random() < .15) {
        const visitor = pick(visitors);
        state.treated = state.treated.filter(other => other !== visitor);
        return makeCheckup(visitor, group);
    }

    // Bazı vakalar doktorun seviyesi yükseldikçe açılır.
    const pool = diseasePool[group.pool]
        .filter(disease => state.level >= (disease.level || 1));

    return makePatient(pick(pool), group);
}

function refillQueue() {
    // Mesai bittiyse yeni hasta gelmez.
    if (state.shift.closed) {
        state.queue = [];
        return;
    }

    state.queue = state.queue.slice(0, queueSize());
    while (state.queue.length < queueSize()) state.queue.push(newArrival());
}

function generatePatients() {
    if (state.shift.closed) return;

    state.activePatients = Array.from({ length: 6 }, newArrival);
    state.queue = [];
    refillQueue();
}

// İyileşen hasta klinikte dolaşır ve sonra kontrole gelebilir.
function rememberVisitor(patient) {
    if (patient.ward) return;

    state.treated.push({
        name: patient.name,
        emoji: patient.emoji,
        age: patient.age,
        card: patient.correctTreatment
    });

    state.treated = state.treated.slice(-8);
}

function removePatient(patient) {
    if (patient.special) {
        state.weekly.patient = null;
        return;
    }

    if (patient.story) {
        if (state.story.current) state.story.current.patient = null;
        return;
    }

    if (patient.ward) {
        const list = state.wardPatients[patient.ward].filter(other => other.id !== patient.id);
        state.wardPatients[patient.ward] = list;
        ensureWard(wardOf(patient));
        return;
    }

    state.activePatients = state.activePatients.filter(other => other.id !== patient.id);

    // Boşalan yere bekleme odasındaki ilk kişi geçer, sıraya yenisi eklenir.
    if (state.queue.length) state.activePatients.push(state.queue.shift());
    refillQueue();
}

function losePatient(patient, message) {
    closeModal();
    if (patient.special) state.weekly.failDay = dayKey();
    removePatient(patient);
    const shiftNote = patient.ward || patient.story ? "" : advanceShift(30, 0);

    // Hikâyede giden hastanın yerine aynı sıradaki yeni hasta gelir.
    if (patient.story) ensureStoryPatient();

    commit();
    refreshPatientScreens();
    playSound("lose");
    toast(message);
    if (shiftNote) toast(shiftNote.trim());
}

// Hasta listesi değişince açık olan ekranı (hastalar, hikâye ya da bölümler) yeniler.
function refreshPatientScreens() {
    renderPatients();
    if (!activeModal) renderScene();
    if (currentScreen === "story") renderStory();
    if (currentScreen === "wards") renderWards();
}

function stopCaseTimer() {
    clearInterval(caseTimer);
    caseTimer = null;
}

function stopExam() {
    clearTimeout(examTimer);
    examTimer = null;
}

function reportCost(kind) {
    if (kind === "test") return has("microscope") ? 0 : 10;
    return has("xray") ? 10 : 20;
}

function payReport(patient, kind) {
    const key = kind + "Paid";
    if (patient.special || patient.boss) return false;
    if (patient[key]) return true;

    const cost = reportCost(kind);
    if (state.coins < cost) {
        toast(t("🪙 Bu rapor için yeterli coinin yok."));
        return false;
    }

    state.coins -= cost;
    patient[key] = true;
    return true;
}

function updateTreatmentStatus() {
    const patient = currentPatient();
    if (!patient) return;

    $("tmStatus").textContent = t("Sabır: ") + "❤️".repeat(patient.patience) +
        (patient.emergency ? t("  •  ⏱️ {0} sn", patient.timeLeft) : "");

    const testCost = patient.testPaid ? 0 : reportCost("test");
    const xrayCost = patient.xrayPaid ? 0 : reportCost("xray");

    $("testButton").textContent = t("🩸 Tahlil Raporu") +
        (testCost ? ` (🪙 ${testCost})` : "");
    $("xrayButton").textContent = t("🩻 Görüntüleme Raporu") +
        (xrayCost ? ` (🪙 ${xrayCost})` : "");
}

function renderPatients() {
    refreshWeekly();

    const grid = $("patientGrid");
    const weekly = state.weekly;
    grid.innerHTML = "";

    $("weeklyNote").textContent = weekly.done
        ? t("🌟 Haftanın özel hastasını iyileştirdin. Yenisi pazartesi gelir.")
        : weekly.patient ? "" : t("🌟 Haftanın özel hastası bugün gitti; yarın tekrar gelecek.");
    $("weeklyNote").hidden = !$("weeklyNote").textContent;

    $("queueLabel").textContent = t("🪑 Bekleme odası: ");
    $("queueStrip").innerHTML = state.queue.map(patient => faceSVG(patient, { mood: "sick" })).join("");

    if (state.shift.closed) {
        $("queueLabel").textContent = t("🌙 Klinik kapandı. 15 dakika dinlendikten sonra Klinik ekranından yeni güne başlayabilirsin.");
    }

    const list = weekly.patient
        ? [weekly.patient, ...state.activePatients] : state.activePatients;

    list.forEach(patient => grid.appendChild(patientCard(patient)));
}

// Hasta kartı; hastalar, hikâye ve bölüm ekranlarında kullanılır.
function patientCard(patient) {
    const kind = patient.special || patient.boss ? "special"
        : patient.checkup ? "checkup" : patient.emergency ? "emergency" : "";
    const label = patient.special ? t("🌟 HAFTANIN HASTASI • 3 kat ödül + 3 💎")
        : patient.boss ? t("👑 BAŞ VAKA • 2 kat ödül")
        : patient.checkup ? t("💚 KONTROL ZİYARETİ")
        : patient.emergency ? t("🚑 ACİL • 2 kat ödül") : "";
    const tone = kind === "special" ? "gold" : kind === "checkup" ? "good" : "";

    const file = findFile(patient);
    const visit = patient.checkup ? ""
        : file && file.regular ? t("🤝 Düzenli hastan")
        : file ? t("📁 {0}. ziyaret", file.visits + 1) : t("🆕 Yeni hasta");

    const card = document.createElement("div");
    card.className = "card patient-card " + kind;

    card.innerHTML = `
        ${label ? `<div class="tag ${tone}">${escapeHTML(label)}</div>` : ""}
        <div class="patient-face">${patientFace(patient)}</div>
        <h3>${escapeHTML(patient.name)}, ${patient.age}</h3>
        <div class="problem">${escapeHTML(t(patient.problem))}</div>
        <div class="hearts">${patient.checkup
            ? t("Artık çok daha iyi! 😊")
            : t("Sabır: ") + "❤️".repeat(patient.patience)}</div>
        <div class="small muted">${escapeHTML(visit)}</div>
        <p><button class="primary-btn">${patient.checkup
            ? t("👋 Karşıla") : t("🩺 Muayene Et")}</button></p>
    `;

    card.querySelector("button").addEventListener("click", () => {
        openTreatment(patient.id);
    });

    return card;
}

function findPatient(id) {
    const special = state.weekly.patient;
    const story = state.story.current && state.story.current.patient;

    if (special && special.id === id) return special;
    if (story && story.id === id) return story;

    for (const ward of wards) {
        const found = state.wardPatients[ward.id].find(patient => patient.id === id);
        if (found) return found;
    }

    return state.activePatients.find(patient => patient.id === id);
}

function currentPatient() {
    return findPatient(activePatientId);
}

// Bir aletin o hastadaki bulgusu. alert: normalden farklı bulgu.
function findingFor(patient, tool) {
    const ward = wardOf(patient);

    if (ward) {
        const [text, alert] = cardInfo(patient.correctTreatment).findings[tool];
        return { text, alert };
    }

    const signs = cardSigns[patient.correctTreatment];

    if (tool === "temp") {
        const level = patient.temp >= 385 ? "high" : patient.temp >= 375 ? "mild" : "normal";

        return {
            alert: level !== "normal",
            text: decimal(patient.temp / 10) + " °C — " + findingTexts.temp[level]
        };
    }

    const sign = signs[tool];
    const special = areaTexts[sign];
    const text = special && own(special, patient.area)
        ? special[patient.area] : findingTexts[tool][sign];

    return {
        alert: sign !== "normal",
        text: tool === "steth" ? t("{0} 💓 {1} atım/dk", text, patient.bpm) : text
    };
}

// Muayene penceresinin aletlerini, kartlarını ve ipucu tablosunu hastanın bölümüne göre kurar.
function setupTreatment(patient) {
    $("tmTools").innerHTML = "";

    toolsFor(patient).forEach(tool => {
        const button = document.createElement("button");
        button.className = "exam-tool";
        button.dataset.tool = tool.id;
        button.innerHTML = `<span>${tool.emoji}</span><small>${escapeHTML(tool.name)}</small>`;
        button.onclick = () => useTool(tool.id);
        $("tmTools").appendChild(button);
    });

    $("tmOptions").innerHTML = "";
    $("tmCheat").innerHTML = "";

    cardsFor(patient).forEach(item => {
        const card = cardInfo(item.id);

        const button = document.createElement("button");
        button.className = "choice";
        button.dataset.card = card.id;
        button.textContent = card.label;
        button.onclick = () => applyTreat(card.id);
        $("tmOptions").appendChild(button);

        const row = document.createElement("p");
        row.innerHTML = `<b>${escapeHTML(card.label)}</b><br>${escapeHTML(card.signs)}`;
        $("tmCheat").appendChild(row);
    });
}

function renderExam(freshTool = null) {
    const patient = currentPatient();
    if (!patient) return;

    const tools = toolsFor(patient);

    $("tmTools").querySelectorAll("button").forEach(button => {
        const tool = tools.find(tool => tool.id === button.dataset.tool);
        const used = patient.exams.includes(tool.id);

        button.disabled = used;
        button.classList.toggle("used", used);
        if (examTimer === null) button.classList.remove("busy");
        button.querySelector("small").textContent = (used ? "✅ " : "") + tool.name;
    });

    const list = $("tmFindings");
    list.innerHTML = "";

    if (!patient.exams.length) {
        const item = document.createElement("li");
        item.className = "empty";
        item.textContent = t("Henüz muayene yapmadın. Yukarıdan bir alet seç!");
        list.appendChild(item);
    }

    patient.exams.forEach(id => {
        const tool = tools.find(tool => tool.id === id);
        const finding = findingFor(patient, id);
        const item = document.createElement("li");

        item.className = (finding.alert ? "alert" : "") + (id === freshTool ? " fresh" : "");
        item.textContent = `${tool.emoji} ${finding.alert ? "❗" : "✅"} ${finding.text}`;
        list.appendChild(item);
    });
}

function useTool(id) {
    const patient = currentPatient();
    if (!appOpen || !patient || examTimer !== null) return;
    if (patient.exams.includes(id)) return;

    const button = $("tmTools").querySelector(`[data-tool="${id}"]`);
    const focused = document.activeElement === button;
    const still = isStill();

    button.classList.add("busy");
    playSound("tap");
    if (!still) stageExam(patient, toolsFor(patient).find(tool => tool.id === id));

    examTimer = setTimeout(() => {
        examTimer = null;
        if (currentPatient() !== patient) return;

        patient.exams.push(id);
        commit();
        renderExam(id);

        // Kullanılan alet devre dışı kalır; klavye odağı sıradaki düğmeye geçer.
        if (focused) {
            ($("tmTools").querySelector("button:not(:disabled)") ||
                $("treatmentChooseButton")).focus();
        }

        const finding = findingFor(patient, id);
        stageReact(patient, toolsFor(patient).find(tool => tool.id === id), finding.alert);
        playSound(finding.alert ? "page" : "tap");

        // Rehber, hastanın tepkisi görüldükten sonra sıradaki adıma geçer.
        setTimeout(() => coachDone("tool"), still ? 0 : 1200);

        if (state.autoRead) speak(finding.text);
    }, still ? 0 : 1000);
}

function speakPatient() {
    const patient = currentPatient();
    if (!patient) return;

    stageTalk(t(patient.speech));

    speak([
        t(patient.speech),
        ...patient.exams.map(id => findingFor(patient, id).text)
    ].join(" "));
}

// Kontrol ziyareti: iyileşen hasta teşekkür eder ve küçük bir ödül bırakır.
function finishCheckup(patient) {
    const { name, emoji } = patient;
    const speech = t(patient.speech);

    removePatient(patient);
    state.checkups++;
    state.coins += 15;
    addXP(8);

    const regular = recordVisit(patient, 0);
    const sticker = rollSticker(.4);
    const shiftNote = advanceShift(15, 0);
    const saved = commit();
    renderPatients();
    playSound();

    showInfo({ person: { name, emoji }, mood: "happy", cheer: true }, t("{0} kontrole geldi!", name),
        t("💬 \"{0}\"\n\n+15 coin, +8 XP", speech) + regular + sticker +
        (currentUser && !saved ? t("\nİlerleme şu anda kalıcı kaydedilemedi.") : ""),
        t("Kontrol ziyaretinde kart seçilmez; iyileşen hastan sana uğrar."));

    if (shiftNote) toast(shiftNote.trim());

    if (state.autoRead) speak(speech);
}

function openTreatment(id) {
    if (!appOpen) return;
    const patient = findPatient(id);
    if (!patient) return;

    if (patient.checkup) {
        finishCheckup(patient);
        return;
    }

    const hard = patient.special || patient.boss;

    openModal("treatmentModal");
    activePatientId = id;
    setupTreatment(patient);

    renderStage(patient);
    stageTalk(t(patient.speech));
    $("tmRobotText").hidden = true;
    $("tmName").textContent = t("{0}, {1} yaşında", patient.name, patient.age);
    $("tmProblem").textContent = t(patient.problem);
    $("tmSpeech").textContent = t(patient.speech);
    $("tmSpeak").hidden = !canSpeak();
    $("tmReports").hidden = hard;
    $("tmCheatBox").open = false;
    $("tmResult").textContent = (hard
        ? t("🌟 Özel vaka: rapor istenemez ve bulgulardan biri seni yanıltabilir. ") +
          t("Dört aletle de muayene et, en belirgin işarete göre kartını seç.")
        : t("Önce aletlerle muayene et, sonra bulgulara uyan kartı seç.\n\n") +
          t("Tahlil raporu vakanın kodunu verir. Görüntüleme raporu kartı doğrudan ") +
          t("gösterir ama o vakada en fazla 2 yıldız alırsın.")) +
        (patient.emergency ? t("\n\n🚑 Acil vaka: süre dolmadan doğru kartı seç!") : "");
    $("tmOptions").hidden = true;
    $("treatmentChooseButton").hidden = false;
    renderExam();
    updateTreatmentStatus();

    if (state.autoRead) speak(t(patient.speech));

    // Acil vakalarda süre yalnızca muayene penceresi açıkken işler.
    if (patient.emergency) {
        caseTimer = setInterval(() => {
            const active = currentPatient();
            if (!active) {
                stopCaseTimer();
                return;
            }

            active.timeLeft--;

            if (active.timeLeft <= 0) {
                losePatient(active, t("🚑 Süre doldu. {0} başka bir kliniğe gönderildi.", active.name));
            } else {
                updateTreatmentStatus();
            }
        }, 1000);
    }
}

function reqTest() {
    const patient = currentPatient();
    if (!patient || !payReport(patient,"test")) return;

    // Bölüm vakalarında rapor, en belirleyici aleti gösterir.
    const ward = wardOf(patient);
    const key = ward && ward.tools.find(tool => tool.id === cardInfo(patient.correctTreatment).key);

    $("tmResult").textContent = t("🩸 Kurgusal tahlil raporu\n\n") + (ward
        ? t("Bu vakada en çok ipucunu \"{0}\" verir.", key.name)
        : patient.hint + t("\n\nKodun karşılığını Oyun Rehberi'nde bulabilirsin."));

    commit();
    updateTreatmentStatus();
}

function reqXray() {
    const patient = currentPatient();
    if (!patient || !payReport(patient,"xray")) return;

    patient.usedXray = true;

    $("tmResult").textContent =
        t("🩻 Kurgusal görüntüleme raporu\n\n") +
        t("Bu oyun vakasıyla eşleşen kart: {0}", cardInfo(patient.correctTreatment).label);

    commit();
    updateTreatmentStatus();
}

function showTreatments() {
    const patient = currentPatient();
    if (!patient) return;

    if (!patient.exams.length && !patient.testPaid && !patient.xrayPaid) {
        toast(t("🩺 Önce en az bir aletle muayene et."));
        return;
    }

    $("tmOptions").hidden = false;
    $("treatmentChooseButton").hidden = true;
    coachDone("choose");
}

function applyTreat(id) {
    if (!appOpen) return;
    const patient = currentPatient();
    if (!patient) return;

    const card = patient.correctTreatment;

    if (card !== id) {
        patient.mistakes++;
        patient.patience--;
        state.cardStats[card].wrong++;
        state.week.wrong[card] = (state.week.wrong[card] || 0) + 1;

        if (patient.patience <= 0) {
            losePatient(patient, t("😢 {0} beklemekten sıkıldı ve gitti.", patient.name));
            return;
        }

        $("tmResult").textContent =
            t("Bu kart bulgularla eşleşmedi ve bir sabır kalbi gitti. ") +
            t("Muayene notlarını ve ipucu tablosunu tekrar inceleyebilirsin.");

        playSound("bad");
        commit();
        updateTreatmentStatus();
        refreshPatientScreens();
        stageWrong(patient);
        coachDone("wrong");
        return;
    }

    // Doğru kart: önce tedavi sahnesi oynanır, ödüller sahne bitince verilir.
    startCure(patient);
}

function finishTreat(patient) {
    const card = patient.correctTreatment;
    const event = todayEvent();

    const stars = patient.mistakes === 0 && !patient.usedXray ? 3
        : patient.mistakes <= 1 ? 2 : 1;

    let coins = 20 + stars * 15 + (has("robot") ? 10 : 0) +
        (stars === 3 && has("bed") ? 10 : 0) + clinicBonus() +
        (hasStaff("reception") ? 5 : 0);
    let xp = 15 + stars * 10 + (has("trophy") ? 10 : 0);
    let gems = 0;

    // Günün olayı küçük bir bonus getirir.
    coins += (event.coins || 0) + (stars === 3 ? event.perfect || 0 : 0);
    xp += event.xp || 0;
    if (event.vet && patient.ward === "vet") coins *= 2;

    if (patient.emergency) {
        coins *= 2;
        xp *= 2;
        state.emergencies++;
    }

    if (patient.special) {
        coins *= 3;
        xp *= 3;
        gems = 3;
        state.weekly.done = true;
        state.weeklyWins++;
    }

    if (patient.boss) {
        coins *= 2;
        xp *= 2;
    }

    // Hasta önce kaldırılır; aynı karttan ikinci ödül alınamaz.
    const patientName = patient.name;
    const person = { name: patient.name, emoji: patient.emoji };
    const coached = coach !== null;
    closeModal();
    removePatient(patient);

    // Hastalar bazen küçük bir hediye bırakır.
    const gift = Math.random() < (event.gift ? .6 : .2) ? 15 : 0;

    // Gösterilen sağlık bilgisi ebeveyn köşesinde listelenir.
    const tip = Math.floor(Math.random() * healthTips.length);

    if (!state.tipsShown.includes(tip)) {
        state.tipsShown.push(tip);
        state.week.tips++;
    }

    state.patients++;
    state.stars += stars;
    state.coins += coins + gift;
    state.gems += gems;
    state.tipsSeen++;
    state.cardStats[card].right++;
    state.week.cases++;
    if (patient.ward) state.wardCases[patient.ward]++;
    addXP(xp);
    questProgress("cases");
    rememberVisitor(patient);

    if (stars === 3) {
        state.perfect++;
        state.week.perfect++;
        questProgress("perfect");
    }

    const regular = recordVisit(patient, stars);
    const chapter = patient.story ? advanceStory(stars) : "";
    const sticker = rollSticker(
        patient.special || patient.boss || patient.emergency || event.sticker ? 1 : stars === 3 ? .7 : .5
    );
    const letter = maybeLetter(person);
    const shiftNote = patient.ward || patient.story ? "" : advanceShift(30, stars);

    const saved = commit();
    refreshPatientScreens();

    if (stars === 3) confetti();
    playSound("win");

    showInfo({ person, mood: "happy", cheer: true }, t("{0} vakası tamamlandı!", patientName),
        (coached ? t("🎓 İlk hastanı iyileştirdin! Artık kendi başına devam edebilirsin.\n\n") : "") +
        "⭐".repeat(stars) + "☆".repeat(3 - stars) +
        t("\n+{0} coin, +{1} XP", coins, xp) + (gems ? `, +${gems} 💎` : "") +
        (gift ? t("\n🎁 {0} sana bir hediye bıraktı: +{1} coin", patientName, gift) : "") +
        regular + sticker +
        (currentUser && !saved ? t("\nİlerleme şu anda kalıcı kaydedilemedi.") : "") +
        chapter + letter + shiftNote +
        `\n\n💬 ${patientName}: "${pick(thanksLines)}"` +
        t("\n\n💡 Sağlık bilgisi\n") + healthTips[tip],
        t("Bu bilgiler geneldir. Merak ettiklerini bir büyüğüne veya doktoruna sor."));

    offerPhoto(person, stars);
    sfx("yay", .15);
}

/* ===== REHBER ===== */

function renderGuide() {
    $("guideGrid").innerHTML = "";

    guideData.forEach((guide, index) => {
        const card = document.createElement("div");
        card.className = "card game-card";
        card.innerHTML = `
            <div class="game-big">${guide.emoji}</div>
            <h3>${escapeHTML(guide.name)}</h3>
            <button class="secondary-btn">${t("📖 Kartı İncele")}</button>
        `;
        card.querySelector("button").onclick = () => openGuide(index);
        $("guideGrid").appendChild(card);
    });
}

function openGuide(index) {
    const guide = guideData[index];
    if (!guide) return;

    showInfo(guide.emoji, guide.name,
        t("🔎 Muayene işaretleri") + "\n" + guide.signs + "\n\n" +
        t("Bu işaretleri görürsen ya da raporda \"{0}\" yazıyorsa bu oyunda \"{1}\" seçeneğini kullan.",
            guide.name, cardInfo(guide.card).label) + "\n\n" +
        t("Şikâyet adı tek başına yetmez; aynı şikâyet farklı kartlara çıkabilir. Önce hastayı muayene et."),
        t("Bu bilgi yalnızca oyunun kurgusal kart eşleştirme kuralları içindir."));
}

function showInfo(emoji, title, text, notice) {
    openModal("guideModal");

    setFigure($("gEmoji"), emoji);
    $("gPhoto").hidden = true;
    lastPhoto = null;
    $("gName").textContent = title;
    $("gDescription").textContent = text;
    $("gNotice").textContent = notice;
}
