"use strict";

/* ===== SES EFEKTLERİ ===== */

// Sesler dosyadan çalınmaz, tarayıcının ses motoruyla o anda üretilir (çevrimdışı da çalışır).
let noiseBuffer = null;
let sfxPlayed = 0;

function tone(context, at, { from, to = from, time = .2, type = "sine", gain = .08 }) {
    const oscillator = context.createOscillator();
    const volume = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(to, 1), at + time);
    volume.gain.setValueAtTime(.0001, at);
    volume.gain.exponentialRampToValueAtTime(gain, at + .02);
    volume.gain.exponentialRampToValueAtTime(.0001, at + time);

    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + time + .03);
    oscillator.onended = () => {
        oscillator.disconnect();
        volume.disconnect();
    };
}

// Hışırtı: süzgeçten geçirilmiş gürültü (alkış, sargı, "vınn" sesi).
function hiss(context, at, { time = .2, from = 1000, to = from, gain = .06 }) {
    if (!noiseBuffer) {
        noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const volume = context.createGain();

    source.buffer = noiseBuffer;
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + time);
    volume.gain.setValueAtTime(.0001, at);
    volume.gain.exponentialRampToValueAtTime(gain, at + .015);
    volume.gain.exponentialRampToValueAtTime(.0001, at + time);

    source.connect(filter);
    filter.connect(volume);
    volume.connect(context.destination);
    source.start(at, Math.random() * .5, time + .05);
    source.onended = () => {
        source.disconnect();
        filter.disconnect();
        volume.disconnect();
    };
}

const sounds = {
    whoosh: (c, t) => hiss(c, t, { time: .3, from: 400, to: 2600, gain: .05 }),
    pop: (c, t) => tone(c, t, { from: 520, to: 900, time: .12, gain: .07 }),
    ouch: (c, t) => tone(c, t, { from: 540, to: 250, time: .3, type: "triangle", gain: .07 }),
    heart: (c, t) => {
        for (const beat of [0, .62]) {
            tone(c, t + beat, { from: 72, to: 44, time: .13, gain: .28 });
            tone(c, t + beat + .17, { from: 62, to: 40, time: .11, gain: .2 });
        }
    },
    aah: (c, t) => {
        tone(c, t, { from: 232, to: 214, time: .5, type: "sawtooth", gain: .022 });
        tone(c, t, { from: 464, to: 428, time: .5, type: "triangle", gain: .02 });
    },
    gulp: (c, t) => {
        tone(c, t, { from: 320, to: 150, time: .12, gain: .09 });
        tone(c, t + .15, { from: 260, to: 120, time: .12, gain: .07 });
    },
    wrap: (c, t) => {
        hiss(c, t, { time: .13, from: 1900, to: 900, gain: .07 });
        hiss(c, t + .15, { time: .13, from: 1600, to: 800, gain: .06 });
    },
    munch: (c, t) => {
        for (const bite of [0, .13, .26]) hiss(c, t + bite, { time: .07, from: 700, to: 500, gain: .08 });
    },
    cool: (c, t) => {
        tone(c, t, { from: 1250, to: 1600, time: .18, gain: .04 });
        tone(c, t + .12, { from: 1500, to: 1900, time: .2, gain: .035 });
    },
    sparkle: (c, t) => {
        [880, 1175, 1568].forEach((note, index) => tone(c, t + index * .08, { from: note, time: .16, gain: .05 }));
    },
    clap: (c, t) => {
        for (let i = 0; i < 6; i++) hiss(c, t + i * .13 + Math.random() * .02, { time: .06, from: 1500, to: 1100, gain: .09 });
    },
    yay: (c, t) => {
        [523, 659, 784, 1047].forEach((note, index) =>
            tone(c, t + index * .1, { from: note, time: .2, type: "triangle", gain: .07 }));
        sounds.clap(c, t + .25);
    },
    beep: (c, t) => {
        tone(c, t, { from: 660, time: .08, type: "square", gain: .025 });
        tone(c, t + .09, { from: 990, time: .1, type: "square", gain: .025 });
    },
    shutter: (c, t) => {
        hiss(c, t, { time: .05, from: 3000, to: 2000, gain: .08 });
        hiss(c, t + .09, { time: .07, from: 2000, to: 1200, gain: .07 });
    }
};

function sfx(name, delay = 0) {
    if (!state.sound || !own(sounds, name)) return;

    try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;

        audioContext = audioContext || new Audio();
        const context = audioContext;

        const play = () => {
            sounds[name](context, context.currentTime + delay);
            sfxPlayed++;
        };

        if (context.state === "suspended") context.resume().then(play).catch(() => {});
        else play();
    } catch (error) {
        console.warn("Ses efekti çalınamadı.", error);
    }
}

/* ===== TEDAVİ SAHNESİ ===== */

// Doğru kart seçilince hasta hemen iyileşmez; tedaviyi oyuncu kendi uygular.
// cure: { id: hasta, done: yapılan dokunuş, plan, timer }
let cure = null;

// spot: "mouth" (ağız), "area" (şikâyet bölgesi) ya da tam boy çizimde [x, y].
const cures = {
    antibiyotik: { emoji: ["🥄"], label: t("🥄 Şurubu ver"), count: 3, spot: "mouth", open: true, sound: "gulp" },
    dinlenme: { emoji: ["🍵", "🍵", "🛌"], label: t("🍵 Ihlamur içir ve dinlendir"), count: 3, spot: "mouth", open: true, sound: "gulp" },
    agri_kesici: { emoji: ["🧊"], label: t("🧊 Soğuk kompres yap"), count: 3, spot: "area", sound: "cool" },
    mide_ilaci: { emoji: ["🥄"], label: t("🥄 Mide şurubunu ver"), count: 3, spot: "mouth", open: true, sound: "gulp" },
    vitamin: { emoji: ["🍎", "🍊", "🍌"], label: t("🍎 Meyve tabağını ver"), count: 3, spot: "mouth", open: true, sound: "munch" },
    alci: { emoji: ["🩹"], label: t("🩹 Alçıyı sar"), count: 4, spot: "area", cast: true, sound: "wrap" }
};

const wardCureSpots = {
    dental: "mouth", eye: [50, 52], skin: [70, 60], er: [52, 110], vet: [50, 150]
};

function curePlan(patient) {
    const ward = wardOf(patient);
    if (!ward) return cures[patient.correctTreatment] || cures.agri_kesici;

    // Bölüm kartlarında kartın kendi simgesi kullanılır.
    const emoji = cardInfo(patient.correctTreatment).label.split(" ")[0];

    return {
        emoji: [emoji], label: t("{0} Tedaviyi uygula", emoji), count: 3,
        spot: wardCureSpots[ward.id] || [50, 110], open: ward.id === "dental", sound: "sparkle"
    };
}

function cureSpot(patient, plan) {
    if (plan.spot === "mouth") return [50, 72];
    if (plan.spot === "area") return areaSpot(patient);
    return plan.spot;
}

const examParts = ["tmToolsTitle", "tmTools", "tmFindings", "tmRobot", "tmCheatBox"];

// Muayene penceresini tedavi sahnesinden çıkarıp muayene haline döndürür.
function resetCure() {
    if (cure) clearTimeout(cure.timer);
    cure = null;

    for (const id of examParts) $(id).hidden = false;
    $("tmCure").hidden = true;
    $("tmCureButton").disabled = false;
}

function startCure(patient) {
    stopCaseTimer();
    stopExam();
    stopStage();

    cure = { id: patient.id, done: 0, plan: curePlan(patient), timer: null };

    for (const id of [...examParts, "tmReports", "tmOptions", "treatmentChooseButton"]) $(id).hidden = true;
    $("tmCure").hidden = false;
    $("tmResult").textContent = t("✅ Doğru kart! Şimdi tedaviyi sen uygula.");
    $("tmStatus").textContent = "";

    renderStage(patient, { mood: "ok" });
    renderCure();
    sfx("sparkle");
    coachDone("cure");
    $("tmCureButton").focus();
}

function renderCure() {
    const { plan, done } = cure;

    $("tmCureText").textContent = t("Düğmeye {0} kez dokun.", plan.count);
    $("tmCureDots").textContent = "🟢".repeat(done) + "⚪".repeat(plan.count - done);
    $("tmCureButton").textContent = plan.label;
}

function cureTap() {
    const patient = currentPatient();
    if (!appOpen || !cure || !patient || patient.id !== cure.id || cure.done >= cure.plan.count) return;

    const plan = cure.plan;
    const [x, y] = cureSpot(patient, plan);
    const last = cure.done + 1 >= plan.count;

    cure.done++;

    renderStage(patient, {
        mood: last ? "happy" : "plain",
        cheer: last,
        open: !last && plan.open === true,
        marks: plan.cast ? { cast: cure.done, pain: false, tear: false } : last ? { pain: false, tear: false } : {}
    });

    stageFly(plan.emoji[(cure.done - 1) % plan.emoji.length], x, y);
    sfx(plan.sound);
    buzz("tap");
    renderCure();

    if (!last) return;

    // Son dokunuştan sonra hasta sevinir, ardından sonuç penceresi açılır.
    $("tmCureButton").disabled = true;
    stagePop("💚");

    cure.timer = setTimeout(() => {
        if (cure && currentPatient() === patient) finishTreat(patient);
    }, isStill() ? 200 : 1000);
}

/* ===== GÜNÜN OLAYI ===== */

// Her gün sırayla bir olay olur ve o günün vakalarına küçük bir bonus getirir.
const dailyEvents = [
    { emoji: "🚌", name: t("Okul gezisi günü"), text: t("Bugün her vakada +10 coin!"), coins: 10 },
    { emoji: "🌟", name: t("Yıldız günü"), text: t("Bugün her vakada +10 XP!"), xp: 10 },
    { emoji: "🎟️", name: t("Çıkartma şenliği"), text: t("Bugün her vakadan çıkartma çıkar!"), sticker: true },
    { emoji: "🎁", name: t("Hediye günü"), text: t("Bugün hastalar daha sık hediye bırakır!"), gift: true },
    { emoji: "💌", name: t("Mektup günü"), text: t("Bugün hastalar daha çok teşekkür mektubu yazar!"), letter: true },
    { emoji: "🏅", name: t("Usta doktor günü"), text: t("Bugün 3 yıldızlı vakalarda +20 coin!"), perfect: 20 },
    { emoji: "🐾", name: t("Pati günü"), text: t("Bugün Pati Kliniği vakalarında 2 kat coin!"), vet: true }
];

function todayEvent() {
    const day = Math.floor(new Date(dayKey() + "T12:00:00").getTime() / 86400000);
    return dailyEvents[((day % dailyEvents.length) + dailyEvents.length) % dailyEvents.length];
}

function renderEvent() {
    const event = todayEvent();
    $("eventBanner").textContent = `${event.emoji} ${t("Bugünün olayı")}: ${event.name} — ${event.text}`;
}

/* ===== TEŞEKKÜR MEKTUPLARI ===== */

const letterLines = [
    t("Sevgili doktorum, beni iyileştirdiğin için çok teşekkür ederim. Sen dünyanın en iyi doktorusun!"),
    t("Artık hiç korkmuyorum. Büyüyünce ben de senin gibi doktor olacağım!"),
    t("Bugün okula gidebildim ve arkadaşlarımla oynadım. Hepsi senin sayende!"),
    t("Sana bir resim çizdim: sen, ben ve kliniğin. Çok güzel oldu!"),
    t("Annem senin çok iyi bir doktor olduğunu söyledi. Bence de öyle!"),
    t("İlacımı hiç ağlamadan içtim. Bana cesaret verdiğin için teşekkürler!"),
    t("Kliniğini çok sevdim. Hasta olmasam da seni görmeye geleceğim!"),
    t("Hav hav! Miyav! (Çeviri: Seni çok seviyoruz, doktor!)")
];

// İyileşen hasta bazen mektup bırakır; mektuplar Dosyalar ekranındaki panoda toplanır.
function maybeLetter(person) {
    const chance = todayEvent().letter ? .7 : state.letters.length ? .22 : 1;
    if (Math.random() >= chance) return "";

    const line = isPet(person) ? letterLines.length - 1
        : Math.floor(Math.random() * (letterLines.length - 1));

    state.letters.push({ name: person.name, emoji: person.emoji, line, day: dayKey() });
    state.letters = state.letters.slice(-24);

    return t("\n💌 {0} sana bir teşekkür mektubu bıraktı! Dosyalar ekranındaki panoya asıldı.", person.name);
}

function renderLetters() {
    const grid = $("letterGrid");

    grid.innerHTML = "";
    $("letterNote").hidden = state.letters.length > 0;

    [...state.letters].reverse().forEach(letter => {
        const card = document.createElement("div");
        card.className = "letter-card";
        card.innerHTML = `
            <div class="letter-face">${faceSVG(letter, { mood: "happy" })}</div>
            <p>${escapeHTML(letterLines[letter.line] || letterLines[0])}</p>
            <small>${escapeHTML("— " + letter.name + " • " + dayLabel(letter.day))}</small>
        `;
        grid.appendChild(card);
    });
}

/* ===== FOTOĞRAF ===== */

// Son iyileştirilen hastanın hatıra fotoğrafı: { person, name, stars }
let lastPhoto = null;

function offerPhoto(person, stars) {
    lastPhoto = { person, stars };
    $("gPhoto").hidden = false;
}

function svgImage(svg, size) {
    return new Promise((resolve, reject) => {
        const image = new Image(size, size * 1.2);
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Çizim yüklenemedi."));
        image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
}

// Resmi indirir; Android uygulamasında "Kaydet" penceresini açar.
function saveImageData(name, data, done) {
    if (nativeApp()) {
        nativeApp().saveImage(name, data.slice(data.indexOf(",") + 1));
        return;
    }

    const link = document.createElement("a");
    link.href = data;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast(done);
}

async function drawPhoto(canvas, photo) {
    const context = canvas.getContext("2d");
    const size = canvas.width;

    const sky = context.createLinearGradient(0, 0, size, size);
    sky.addColorStop(0, "#4f8cff");
    sky.addColorStop(1, "#6f6bff");
    context.fillStyle = sky;
    context.fillRect(0, 0, size, size);

    context.fillStyle = "#ffffff";
    context.beginPath();
    // Eski tarayıcılarda yuvarlak köşeli dikdörtgen yoktur; düz çizilir.
    if (context.roundRect) context.roundRect(70, 70, size - 140, size - 140, 60);
    else context.rect(70, 70, size - 140, size - 140);
    context.fill();

    const [patient, doctor] = await Promise.all([
        svgImage(faceSVG(photo.person, { mood: "happy" }), 400),
        svgImage(doctorFigure(), 400)
    ]);

    context.drawImage(doctor, 150, 170, 380, 456);
    context.drawImage(patient, 550, 170, 380, 456);

    context.textAlign = "center";
    context.fillStyle = "#17324d";
    context.font = "800 64px 'Segoe UI', Arial, sans-serif";
    context.fillText(t("{0} iyileşti!", photo.person.name), size / 2, 730, size - 200);

    context.font = "600 42px 'Segoe UI', Arial, sans-serif";
    context.fillStyle = "#48689a";
    context.fillText(t("Doktor: {0}", state.doctor.name), size / 2, 800, size - 200);

    context.font = "70px 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
    context.fillText("⭐".repeat(photo.stars), size / 2, 890);

    context.font = "800 40px 'Segoe UI', Arial, sans-serif";
    context.fillStyle = "#4f8cff";
    context.fillText("Doktormust", size / 2, 965);
}

async function savePhoto() {
    if (!appOpen || !lastPhoto) return;

    try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1080;
        await drawPhoto(canvas, lastPhoto);

        sfx("shutter");
        saveImageData(`doktormust-foto-${dayKey()}.png`, canvas.toDataURL("image/png"),
            t("📸 Fotoğraf indirildi."));
    } catch (error) {
        console.warn("Fotoğraf kaydedilemedi.", error);
        toast(t("⚠️ Fotoğraf hazırlanamadı."));
    }
}

/* ===== DOKTORUN GÖRÜNÜŞÜ ===== */

// Ten, saç rengi ve saç biçimi seçenekleri; her düğme küçük bir önizleme gösterir.
function renderDoctorLook() {
    const rows = [
        ["skinGrid", "skin", faceSkins],
        ["hairColorGrid", "hairColor", doctorHairs],
        ["hairStyleGrid", "hairStyle", doctorStyles]
    ];

    for (const [id, key, list] of rows) {
        $(id).innerHTML = "";

        list.forEach((value, index) => {
            const active = state.doctor[key] === index;
            const button = document.createElement("button");

            button.className = "look-btn";
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
            button.setAttribute("aria-label", `${index + 1}`);

            if (key === "hairStyle") {
                button.innerHTML = doctorSVG({ ...state.doctor, accessory: 0, hairStyle: index }, state.decor.coat);
            } else {
                button.style.background = value;
            }

            button.onclick = () => {
                if (!appOpen) return;
                state.doctor[key] = index;
                playSound("tap");
                commit();
            };

            $(id).appendChild(button);
        });
    }
}

/* ===== ÇİZİLMİŞ KLİNİK EŞYALARI ===== */

// Klinik eşyaları da emoji yerine çizilir (64 × 64). Listede olmayan eşya emojisiyle görünür.
const itemArt = {
    desk: `<rect fill="#b7793f" x="5" y="24" width="54" height="9" rx="3"/><rect fill="#8a5a2b" x="9" y="33" width="7" height="25"/>` +
        `<rect fill="#8a5a2b" x="48" y="33" width="7" height="25"/><rect fill="#d39a5d" x="28" y="33" width="20" height="13" rx="2"/>` +
        `<circle fill="#8a5a2b" cx="38" cy="39.5" r="2"/>`,
    computer: `<rect fill="#334155" x="7" y="9" width="50" height="34" rx="5"/><rect fill="#bfe3ff" x="11" y="13" width="42" height="26" rx="2"/>` +
        `<path fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linejoin="round" d="M13 27H23L27 18L32 35L36 24L39 27H51"/>` +
        `<rect fill="#64748b" x="28" y="43" width="8" height="8"/><rect fill="#334155" x="17" y="50" width="30" height="6" rx="3"/>`,
    plant: `<path fill="none" stroke="#2f9e5b" stroke-width="3" d="M32 42V22"/>` +
        `<ellipse fill="#34c38f" cx="22" cy="24" rx="11" ry="6" transform="rotate(-35 22 24)"/>` +
        `<ellipse fill="#2fb380" cx="42" cy="22" rx="11" ry="6" transform="rotate(35 42 22)"/>` +
        `<ellipse fill="#4ad3a0" cx="32" cy="13" rx="6" ry="10"/><path fill="#d9774a" d="M19 40H45L41 58H23Z"/>` +
        `<rect fill="#c2613a" x="17" y="38" width="30" height="6" rx="3"/>`,
    chair: `<rect fill="#7fb2ff" x="13" y="8" width="38" height="30" rx="10"/><rect fill="#4f8cff" x="11" y="34" width="42" height="12" rx="5"/>` +
        `<rect fill="#48536b" x="15" y="46" width="5" height="12"/><rect fill="#48536b" x="44" y="46" width="5" height="12"/>` +
        `<rect fill="#4f8cff" x="7" y="26" width="7" height="18" rx="3.5"/><rect fill="#4f8cff" x="50" y="26" width="7" height="18" rx="3.5"/>`,
    stethoscope: `<path fill="none" stroke="#48536b" stroke-width="4" stroke-linecap="round" d="M18 8V24Q18 38 30 38Q42 38 42 24V8"/>` +
        `<path fill="none" stroke="#48536b" stroke-width="4" stroke-linecap="round" d="M30 38V46Q30 56 42 56Q50 56 50 46"/>` +
        `<circle fill="#48536b" cx="50" cy="42" r="7"/><circle fill="#cfd8e6" cx="50" cy="42" r="3.4"/>` +
        `<circle fill="#4f8cff" cx="18" cy="8" r="3.4"/><circle fill="#4f8cff" cx="42" cy="8" r="3.4"/>`,
    trophy: `<path fill="none" stroke="#e0a800" stroke-width="4" d="M20 14H10Q10 28 22 28M44 14H54Q54 28 42 28"/>` +
        `<path fill="#f5b301" d="M18 8H46V22Q46 38 32 40Q18 38 18 22Z"/><rect fill="#e0a800" x="28" y="40" width="8" height="9"/>` +
        `<rect fill="#8a5a2b" x="19" y="49" width="26" height="9" rx="3"/><path fill="#fff" opacity=".5" d="M23 12H28V26Q23 22 23 12Z"/>`,
    bed: `<rect fill="#8a5a2b" x="3" y="14" width="6" height="42" rx="2"/><rect fill="#8a5a2b" x="55" y="30" width="6" height="26" rx="2"/>` +
        `<rect fill="#b7793f" x="5" y="38" width="54" height="8"/><rect fill="#f8fafc" x="9" y="28" width="48" height="11" rx="4"/>` +
        `<rect fill="#bfe3ff" x="11" y="21" width="17" height="10" rx="5"/><path fill="#4f8cff" d="M29 26H57V39H29Z"/>` +
        `<path fill="#7fb2ff" d="M29 26H57V30H29Z"/>`,
    pet: `<ellipse fill="#8d5524" cx="13" cy="28" rx="8" ry="15" transform="rotate(14 13 28)"/>` +
        `<ellipse fill="#8d5524" cx="51" cy="28" rx="8" ry="15" transform="rotate(-14 51 28)"/>` +
        `<circle fill="#c68642" cx="32" cy="32" r="21"/><ellipse fill="#f3dcb8" cx="32" cy="41" rx="11" ry="8.5"/>` +
        `<circle fill="#3b2a26" cx="24" cy="29" r="3"/><circle fill="#3b2a26" cx="40" cy="29" r="3"/>` +
        `<path fill="#3b2a26" d="M28 36H36L32 41Z"/><path fill="#ff7a90" d="M29 45Q32 52 35 45Z"/>`,
    robot: `<path fill="none" stroke="#64748b" stroke-width="3" d="M32 4V12"/><circle fill="#ef4444" cx="32" cy="4" r="3.4"/>` +
        `<rect fill="#cbd5e1" x="14" y="11" width="36" height="24" rx="8"/><circle fill="#22d3ee" cx="24" cy="23" r="4.5"/>` +
        `<circle fill="#22d3ee" cx="40" cy="23" r="4.5"/><rect fill="#94a3b8" x="18" y="37" width="28" height="20" rx="5"/>` +
        `<path fill="#ef4444" d="M29 41H35V44.5H38.5V50.5H35V54H29V50.5H25.5V44.5H29Z"/>` +
        `<rect fill="#94a3b8" x="8" y="39" width="7" height="13" rx="3.5"/><rect fill="#94a3b8" x="49" y="39" width="7" height="13" rx="3.5"/>`,
    microscope: `<rect fill="#334155" x="12" y="52" width="40" height="7" rx="3"/><path fill="none" stroke="#334155" stroke-width="6" stroke-linecap="round" d="M44 52Q54 34 38 22"/>` +
        `<rect fill="#64748b" x="24" y="6" width="12" height="26" rx="3" transform="rotate(-24 30 19)"/>` +
        `<rect fill="#4f8cff" x="20" y="4" width="12" height="7" rx="2" transform="rotate(-24 26 7)"/>` +
        `<rect fill="#94a3b8" x="18" y="40" width="24" height="5" rx="2"/><rect fill="#64748b" x="27" y="45" width="6" height="8"/>`,
    xray: `<rect fill="#0f172a" x="9" y="5" width="46" height="54" rx="6"/><rect fill="#1e3a5f" x="13" y="9" width="38" height="46" rx="3"/>` +
        `<g fill="none" stroke="#e2f1ff" stroke-width="2.6" stroke-linecap="round"><path d="M32 13V51"/>` +
        `<path d="M32 20Q22 20 20 28M32 20Q42 20 44 28M32 28Q22 28 20 36M32 28Q42 28 44 36M32 36Q24 36 22 43M32 36Q40 36 42 43"/></g>`,
    ambulance: `<rect fill="#3b82f6" x="27" y="13" width="9" height="6" rx="2"/><rect fill="#f8fafc" stroke="#cbd5e1" x="3" y="18" width="58" height="28" rx="6"/>` +
        `<rect fill="#ef4444" x="3" y="36" width="58" height="5"/><path fill="#bfe3ff" d="M43 22H55Q58 22 58 26V33H43Z"/>` +
        `<path fill="#ef4444" d="M17 21H24V25H28V32H24V36H17V32H13V25H17Z"/>` +
        `<circle fill="#1f2937" cx="17" cy="48" r="7.5"/><circle fill="#94a3b8" cx="17" cy="48" r="3"/>` +
        `<circle fill="#1f2937" cx="47" cy="48" r="7.5"/><circle fill="#94a3b8" cx="47" cy="48" r="3"/>`,
    teddy: `<circle fill="#a9744a" cx="19" cy="12" r="7.5"/><circle fill="#a9744a" cx="45" cy="12" r="7.5"/>` +
        `<circle fill="#e3b78c" cx="19" cy="12" r="3.6"/><circle fill="#e3b78c" cx="45" cy="12" r="3.6"/>` +
        `<ellipse fill="#a9744a" cx="32" cy="45" rx="15" ry="14"/><ellipse fill="#e3b78c" cx="32" cy="47" rx="8" ry="8.5"/>` +
        `<circle fill="#a9744a" cx="14" cy="42" r="6"/><circle fill="#a9744a" cx="50" cy="42" r="6"/>` +
        `<circle fill="#b9814f" cx="32" cy="23" r="16"/><ellipse fill="#e3b78c" cx="32" cy="28" rx="7.5" ry="6"/>` +
        `<circle fill="#3b2a26" cx="26" cy="20" r="2.3"/><circle fill="#3b2a26" cx="38" cy="20" r="2.3"/><ellipse fill="#3b2a26" cx="32" cy="26" rx="2.6" ry="2"/>`,
    aquarium: `<rect fill="#dff3ff" stroke="#64748b" stroke-width="2.5" x="5" y="11" width="54" height="42" rx="6"/>` +
        `<path fill="#8fd3ff" d="M7 21Q20 17 32 21T57 21V47Q57 51 53 51H11Q7 51 7 47Z"/><path fill="#f3d9a4" d="M7 45H57V47Q57 51 53 51H11Q7 51 7 47Z"/>` +
        `<path fill="#ff8f4d" d="M22 33Q30 25 39 33Q30 41 22 33Z"/><path fill="#ff8f4d" d="M39 33L46 27V39Z"/><circle fill="#1f2937" cx="27" cy="32" r="1.5"/>` +
        `<circle fill="#fff" opacity=".8" cx="46" cy="24" r="2.2"/><circle fill="#fff" opacity=".8" cx="50" cy="31" r="1.5"/>` +
        `<path fill="none" stroke="#34c38f" stroke-width="2.5" stroke-linecap="round" d="M14 46Q11 38 15 31M18 46Q21 40 18 35"/>` +
        `<rect fill="#64748b" x="9" y="53" width="46" height="5" rx="2"/>`
};

function itemArtHTML(item) {
    return own(itemArt, item.id)
        ? `<svg class="art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${itemArt[item.id]}</svg>`
        : escapeHTML(item.emoji);
}
