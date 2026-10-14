"use strict";

/* ===== v11 ===== */

/* ---- 1) Doktoru süslemek: yeni aksesuarlar ---- */

// Aksesuarlar accessories listesine eklenir; çizimleri extraAccessory içindedir (sıra aynı).
accessories.push(
    { emoji: "🧢", name: t("Kasket"), price: 200 },
    { emoji: "🌸", name: t("Çiçek Tacı"), price: 250 },
    { emoji: "🎧", name: t("Kulaklık"), gems: 6 },
    { emoji: "🐰", name: t("Tavşan Kulakları"), gems: 8 },
    { emoji: "⭐", name: t("Yıldız Gözlük"), gems: 10 }
);

function starPoints(cx, cy, outer, inner) {
    const points = [];
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 ? inner : outer;
        const angle = Math.PI / 5 * i - Math.PI / 2;
        points.push((cx + Math.cos(angle) * radius).toFixed(1) + "," + (cy + Math.sin(angle) * radius).toFixed(1));
    }
    return points.join(" ");
}

// faces.js'deki doctorAccessory, kendi listesinde olmayan aksesuarlar için bunu çağırır.
function extraAccessory(index, behind) {
    if (behind) {
        return index === 11
            ? `<g transform="rotate(-14 36 14)"><ellipse fill="#fff" stroke="#e5e7eb" stroke-width="1.5" cx="36" cy="10" rx="8" ry="19"/><ellipse fill="#fbcfe8" cx="36" cy="11" rx="4" ry="13"/></g>` +
              `<g transform="rotate(14 64 14)"><ellipse fill="#fff" stroke="#e5e7eb" stroke-width="1.5" cx="64" cy="10" rx="8" ry="19"/><ellipse fill="#fbcfe8" cx="64" cy="11" rx="4" ry="13"/></g>`
            : "";
    }

    const flower = (x, y, color) => `<g><circle fill="${color}" cx="${x - 3.5}" cy="${y}" r="3.6"/><circle fill="${color}" cx="${x + 3.5}" cy="${y}" r="3.6"/>` +
        `<circle fill="${color}" cx="${x}" cy="${y - 3.5}" r="3.6"/><circle fill="${color}" cx="${x}" cy="${y + 3.5}" r="3.6"/><circle fill="#fde047" cx="${x}" cy="${y}" r="2.6"/></g>`;

    return {
        8: `<path fill="#2563eb" d="M23 31Q25 7 50 7Q75 7 77 31Z"/><path fill="#1d4ed8" d="M50 27Q72 25 91 32L89 37Q70 31 50 32Z"/><circle fill="#93c5fd" cx="50" cy="8" r="3"/>`,
        9: flower(28, 26, "#f472b6") + flower(39, 18, "#a78bfa") + flower(50, 15, "#fb7185") + flower(61, 18, "#a78bfa") + flower(72, 26, "#f472b6"),
        10: `<path fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" d="M20 52Q19 13 50 13Q81 13 80 52"/>` +
            `<rect fill="#ef4444" x="12" y="44" width="13" height="22" rx="6"/><rect fill="#ef4444" x="75" y="44" width="13" height="22" rx="6"/>`,
        11: "",
        12: `<polygon fill="#facc15" stroke="#ca8a04" stroke-width="1.2" points="${starPoints(39, 53, 11, 5)}"/>` +
            `<polygon fill="#facc15" stroke="#ca8a04" stroke-width="1.2" points="${starPoints(61, 53, 11, 5)}"/>` +
            `<path fill="none" stroke="#ca8a04" stroke-width="2" d="M47 53H53"/>` +
            `<circle fill="#1f2937" cx="39" cy="53" r="2.4"/><circle fill="#1f2937" cx="61" cy="53" r="2.4"/>`
    }[index] || "";
}

/* ---- 2) Mevsim hastalıkları ---- */

/* i18n-off */
// Mevsime göre gelen ek vakalar (kartlar ve bulgular genel klinikle aynı kurallara uyar).
const seasonCases = {
    winter: [
        { problem: "🥶 Kış Nezlesi", correctTreatment: "dinlenme", area: "bogaz", says: ["Kar topu oynadım, şimdi burnum akıyor ve biraz sıcağım var. ⛄", "Okulda herkes nezle, ben de hapşırıp duruyorum. 🤧"] },
        { problem: "🤒 Kış Ateşi", correctTreatment: "antibiyotik", area: "bogaz", says: ["Soğukta atkısız gezdim, şimdi boğazım yanıyor ve ateşim var. 🧣", "Yutkunamıyorum, alnım da yanıyor. ❄️"] },
        { problem: "⛸️ Buzda Kayma", correctTreatment: "alci", area: "bilek", says: ["Buzda kaydım, bileğim şişti ve basamıyorum! 😣", "Kızakla düştüm, bileğim çok acıyor. 🛷"] }
    ],
    spring: [
        { problem: "🌸 Bahar Hapşırığı", correctTreatment: "dinlenme", area: "bogaz", says: ["Parkta çiçekler açtı, ben de durmadan hapşırıyorum. 🌼", "Gözlerim sulanıyor, burnum akıyor, biraz da sıcağım var. 🌷"] },
        { problem: "🚲 Bisiklet Düşmesi", correctTreatment: "agri_kesici", area: "bacak", says: ["Bisikletten düştüm, bacağım acıyor ama şişmedi. 🚲", "Bahçede koşarken dizimi çarptım. 🌱"] }
    ],
    summer: [
        { problem: "☀️ Güneş Yanığı", correctTreatment: "agri_kesici", area: "kol", says: ["Plajda şapkasız kaldım, kolum kıpkırmızı ve acıyor. 🏖️", "Güneşte çok oynadım, kollarım yanıyor. ☀️"] },
        { problem: "🦟 Böcek Isırığı", correctTreatment: "agri_kesici", area: "bacak", says: ["Kampta bir böcek ısırdı, bacağım kaşınıyor ve acıyor. 🦟", "Bahçede arı soktu sandım, bacağım sızlıyor. 🐝"] },
        { problem: "🍦 Yaz Karın Ağrısı", correctTreatment: "mide_ilaci", area: "karin", says: ["Sıcakta üç dondurma yedim, karnım guruldayıp duruyor. 🍦", "Piknikte çok yedim, karnım ağrıyor. 🧺"] }
    ],
    autumn: [
        { problem: "🍂 Okul Yorgunluğu", correctTreatment: "vitamin", area: "", says: ["Okullar açıldı, hep uykum var. Meyve de yemiyorum. 🍂", "Derste gözlerim kapanıyor, kahvaltıda sadece kurabiye yedim. 🍪"] },
        { problem: "🌧️ Yağmur Nezlesi", correctTreatment: "dinlenme", area: "bogaz", says: ["Yağmurda ıslandım, şimdi burnum tıkalı ve biraz sıcağım var. ☔", "Şemsiyemi unuttum, hapşırıyorum. 🌧️"] }
    ]
};
/* i18n-on */

const seasonInfo = {
    winter: { emoji: "❄️", name: t("Kış"), text: t("Kış geldi: nezle ve kaygan buz vakaları arttı!") },
    spring: { emoji: "🌸", name: t("İlkbahar"), text: t("İlkbahar: çiçekler açtı, hapşıranlar ve bisikletten düşenler geliyor!") },
    summer: { emoji: "☀️", name: t("Yaz"), text: t("Yaz: güneş yanığı ve böcek ısırığı vakalarına dikkat!") },
    autumn: { emoji: "🍂", name: t("Sonbahar"), text: t("Sonbahar: okullar açıldı, yorgunluk ve yağmur nezlesi vakaları arttı!") }
};

function seasonNow() {
    const month = new Date().getMonth() + 1;
    return month === 12 || month <= 2 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "autumn";
}

// Genel klinikteki yeni hastaların bir kısmı mevsimin vakalarından seçilir.
function seasonalDisease(pool) {
    return Math.random() < .3 ? pick(seasonCases[seasonNow()]) : pick(pool);
}

/* ---- 3) Ambulans görevi ---- */

let ambulanceRun = false;

function maybeAmbulance(patient) {
    if (patient.ward || patient.story || patient.klass || patient.daily || state.level < 2 ||
        state.shift.closed || state.callPending || Math.random() > .12) return "";

    state.callPending = true;
    return t("\n\n🚑 ACİL ÇAĞRI! Parkta bir çocuk düştü. Klinik ekranındaki \"🚑 Acil Çağrı\" düğmesine bas ve ambulansla git!");
}

function answerCall() {
    if (!appOpen || !state.callPending) return;
    if (state.shift.closed) {
        toast(t("🌙 Klinik kapalı; çağrıya başka bir ambulans gitti."));
        state.callPending = false;
        commit();
        return;
    }

    sfx("siren");
    startGame("maze");
    ambulanceRun = true;          // startGame sıfırlar; bu yüzden ondan sonra kurulur
    $("gameTitle").textContent = t("Acil Çağrı");
    $("gameEmoji").textContent = "🚑";
}

// Labirent bitince yaralı çocuk kliniğe gelir; hızlı gidildiyse kurtarma ödülü vardır.
function afterCall(won) {
    ambulanceRun = false;
    state.callPending = false;

    const group = ageGroups[state.doctor.age];
    const pool = diseasePool[group.pool].filter(disease => ["alci", "agri_kesici"].includes(disease.correctTreatment));
    const patient = makePatient(pick(pool.length ? pool : diseasePool[group.pool]), group);

    patient.emergency = true;
    patient.timeLeft = 45;
    patient.rescue = won;
    state.activePatients.unshift(patient);
    commit();

    setTimeout(() => {
        if (!appOpen) return;
        closeModal();
        toast(won ? t("🚑 Zamanında yetiştin! {0} kliniğe geldi; hemen tedavi et!", patient.name)
            : t("🚑 Biraz geç kaldın ama {0} kliniğe geldi. Hemen tedavi et!", patient.name));
        if (findPatient(patient.id)) openTreatment(patient.id);
    }, isStill() ? 300 : 1400);
}

/* ---- 4) Haftalık turnuva ---- */

const cupGoals = [
    { id: "cases", emoji: "🧒", text: t("Bu hafta {0} vaka tamamla"), goal: 25, test: (kind, patient) => kind === "case" },
    { id: "perfect", emoji: "⭐", text: t("Bu hafta {0} vakayı 3 yıldızla bitir"), goal: 12, test: (kind, patient, stars) => kind === "case" && stars === 3 },
    { id: "ward", emoji: "🏥", text: t("Bu hafta bölümlerde {0} vaka çöz"), goal: 10, test: (kind, patient) => kind === "case" && patient.ward },
    { id: "games", emoji: "🎮", text: t("Bu hafta {0} mini oyun kazan"), goal: 10, test: kind => kind === "game" },
    { id: "hard", emoji: "🧩", text: t("Bu hafta {0} zor, acil ya da çağrı vakası çöz"), goal: 6,
      test: (kind, patient) => kind === "case" && (patient.tricky || patient.referral || patient.emergency || patient.daily) }
];

function currentCup() {
    if (state.cup.week !== state.week.key) state.cup = { ...state.cup, week: state.week.key, progress: 0, done: false };
    return cupGoals[faceHash("cup:" + state.week.key) % cupGoals.length];
}

function cupProgress(kind, patient = {}, stars = 0) {
    if (patient.klass) return;

    const goal = currentCup();
    if (state.cup.done || !goal.test(kind, patient, stars)) return;

    state.cup.progress++;

    if (state.cup.progress >= goal.goal) {
        state.cup.done = true;
        state.cup.total++;
        state.coins += 200;
        state.gems += 5;
        confetti();
        toast(t("🏆 Haftanın turnuvasını kazandın! +200 coin, +5 💎"), true);
    }
}

function renderCup() {
    const goal = currentCup();
    const progress = Math.min(state.cup.progress, goal.goal);

    $("cupCard").innerHTML = `
        <h3>🏆 ${escapeHTML(t("Haftanın Turnuvası"))}</h3>
        <p>${goal.emoji} ${escapeHTML(t(goal.text, goal.goal))}</p>
        <div class="progress-track"><div class="progress-fill" style="width:${progress / goal.goal * 100}%"></div></div>
        <p class="small muted">${escapeHTML(state.cup.done
            ? t("✅ Bu haftanın kupası senin! Yeni turnuva pazartesi başlar.")
            : t("{0} / {1} • Ödül: 200 coin, 5 💎 ve bir kupa", progress, goal.goal))}
            ${state.cup.total ? " • " + escapeHTML(t("Toplam kupa: {0} 🏆", state.cup.total)) : ""}</p>
    `;
}

/* ---- 5) Yeni mini oyunlar ---- */

/* Diş Avı: mikrop konan dişe dokun */

function startTeethHunt(round) {
    round.score = 0;
    round.time = 20;
    round.germ = -1;

    $("gameQuestion").textContent = t("Mikrop 🦠 konan dişe hemen dokun ve onu temizle!");
    $("gameBoard").style.gridTemplateColumns = "repeat(4,minmax(0,1fr))";
    $("gameBoard").innerHTML = "";

    for (let i = 0; i < 12; i++) {
        const tooth = document.createElement("button");
        tooth.className = "game-cell tooth-cell";
        tooth.textContent = "🦷";
        tooth.setAttribute("aria-label", t("Diş"));
        tooth.onclick = () => hitTooth(i);
        $("gameBoard").appendChild(tooth);
    }

    const status = () => gameStatus(t("⏱️ {0} sn • Temizlenen: {1}", round.time, round.score));
    const speed = { kolay: 1100, normal: 850, zor: 650 }[state.difficulty] || 850;

    const move = () => {
        const cells = $("gameBoard").children;
        if (round.germ >= 0 && cells[round.germ]) cells[round.germ].textContent = "🦷";

        let next = round.germ;
        while (next === round.germ) next = Math.floor(Math.random() * cells.length);
        round.germ = next;
        cells[next].textContent = "🦠";
    };

    status();
    move();
    gameTimers.push(setInterval(move, speed));
    gameTimers.push(setInterval(() => {
        round.time--;
        status();
        if (round.time > 0) return;

        $("gameQuestion").textContent = "";
        finishGame({
            recordKey: "teethhunt",
            score: round.score,
            coins: round.score * 2,
            xp: round.score * 2,
            won: round.score >= 10,
            text: t("{0} mikrobu temizledin! Dişler parlıyor. ✨", round.score)
        });
    }, 1000));
}

function hitTooth(index) {
    const round = gameRound;
    if (!appOpen || !round || round.done || round.kind !== "teethhunt") return;

    const cell = $("gameBoard").children[index];

    // Temizlenen mikrop yeniden konana kadar ikinci dokunuş sayılmaz.
    if (cell && index === round.germ) {
        round.score++;
        round.germ = -1;
        cell.textContent = "✨";
        playSound("tap");
        gameStatus(t("⏱️ {0} sn • Temizlenen: {1}", round.time, round.score));
    }
}

/* İlaç Eşleştir: bulgu ile oyun kartını eşleştir */

const matchPairs = [
    [t("🤒 Yüksek ateş ve boğazda 🦠"), t("💊 Antibiyotik Kartı")],
    [t("🤧 Hafif ateş ve hırıltı"), t("🍊 Dinlenme Kartı")],
    [t("🤕 Dokununca acıyor, şişlik yok"), t("🩹 Ağrı Bakım Kartı")],
    [t("🫃 Karından guruldama sesi"), t("🧪 Mide Bakım Kartı")],
    [t("😴 Solgun, halsiz, nabız yavaş"), t("🍎 Vitamin Kartı")],
    [t("🦴 Şişlik var, oynatınca acıyor"), t("🦴 Alçı Kartı")]
];

function startMatch(round) {
    round.found = 0;
    round.mistakes = 0;
    round.pick = null;

    $("gameQuestion").textContent = t("Soldan bir bulgu, sağdan ona uyan oyun kartını seç.");
    $("gameBoard").innerHTML = "";
    $("gameOptions").innerHTML = "";
    $("gameOptions").className = "game-options match-grid";

    const left = shuffled(matchPairs.map((pair, index) => [pair[0], index]));
    const right = shuffled(matchPairs.map((pair, index) => [pair[1], index]));

    left.forEach(([text, index], row) => {
        for (const [label, id, side] of [[text, index, "left"], [right[row][0], right[row][1], "right"]]) {
            const button = document.createElement("button");
            button.className = "choice";
            button.textContent = label;
            button.dataset.pair = id;
            button.dataset.side = side;
            button.onclick = () => pickMatch(button);
            $("gameOptions").appendChild(button);
        }
    });

    gameStatus(t("Eşleşen: {0} / 6 • Hata: {1}", 0, 0));
}

function pickMatch(button) {
    const round = gameRound;
    if (!appOpen || !round || round.done || round.kind !== "match" || button.disabled) return;

    if (button.dataset.side === "left") {
        $("gameOptions").querySelectorAll(".picked").forEach(other => other.classList.remove("picked"));
        button.classList.add("picked");
        round.pick = button;
        playSound("tap");
        return;
    }

    if (!round.pick) {
        toast(t("Önce soldan bir bulgu seç."));
        return;
    }

    if (round.pick.dataset.pair === button.dataset.pair) {
        for (const done of [round.pick, button]) {
            done.disabled = true;
            done.classList.remove("picked");
            done.classList.add("matched");
        }
        round.found++;
        playSound("ok");
    } else {
        round.mistakes++;
        playSound("bad");
    }

    round.pick = null;
    $("gameOptions").querySelectorAll(".picked").forEach(other => other.classList.remove("picked"));
    gameStatus(t("Eşleşen: {0} / 6 • Hata: {1}", round.found, round.mistakes));

    if (round.found < matchPairs.length) return;

    const score = Math.max(0, 6 - round.mistakes);
    $("gameQuestion").textContent = "";

    finishGame({
        recordKey: "match",
        score,
        coins: score * 6,
        xp: score * 4,
        won: round.mistakes <= 2,
        text: t("Hepsini eşleştirdin! Hata: {0}. Puanın: {1} / 6.", round.mistakes, score)
    });
}

/* Eczacılık: reçetedeki ürünleri hazırla */

/* i18n-off */
const pharmaCustomers = ["Ayşe Teyze", "Mehmet Amca", "Selin Abla", "Okan Abi", "Zehra Nine", "Murat Dede"];
/* i18n-on */

function newPrescription(round) {
    const items = shuffled(supplies.slice(0, 5)).slice(0, 2 + Math.floor(Math.random() * 2));
    round.recipe = {};
    for (const item of items) round.recipe[item.id] = 1 + Math.floor(Math.random() * 2);
    round.bag = {};
    round.customer = pick(pharmaCustomers);
}

function startPharma(round) {
    round.turn = 0;
    round.turns = 5;
    round.score = 0;
    newPrescription(round);
    renderPharma(round);
}

function renderPharma(round) {
    const list = Object.entries(round.recipe)
        .map(([id, count]) => { const item = supplies.find(s => s.id === id); return `${count} × ${item.emoji} ${item.name}`; });

    $("gameQuestion").textContent = t("📝 {0} reçeteyle geldi: {1}", round.customer, list.join(", "));
    $("gameBoard").style.gridTemplateColumns = "1fr";
    $("gameBoard").innerHTML = `<div class="pharma-bag" id="pharmaBag"></div>`;

    const bag = Object.entries(round.bag).filter(([, count]) => count > 0)
        .map(([id, count]) => { const item = supplies.find(s => s.id === id); return `<span>${item.emoji} × ${count}</span>`; }).join("");
    $("pharmaBag").innerHTML = bag || `<span class="muted">${escapeHTML(t("Poşet boş"))}</span>`;

    $("gameOptions").className = "game-options kit-grid";
    $("gameOptions").innerHTML = "";

    supplies.slice(0, 5).forEach(item => {
        const button = document.createElement("button");
        button.className = "choice";
        button.textContent = item.emoji + " " + item.name;
        button.onclick = () => {
            if (gameRound !== round || round.done || round.locked) return;
            round.bag[item.id] = (round.bag[item.id] || 0) + 1;
            playSound("tap");
            renderPharma(round);
        };
        $("gameOptions").appendChild(button);
    });

    const clear = document.createElement("button");
    clear.className = "secondary-btn";
    clear.textContent = t("🧺 Poşeti boşalt");
    clear.onclick = () => {
        if (gameRound !== round || round.locked) return;
        round.bag = {};
        renderPharma(round);
    };

    const give = document.createElement("button");
    give.className = "primary-btn";
    give.textContent = t("✅ Müşteriye ver");
    give.onclick = () => checkPharma(round);

    $("gameOptions").append(clear, give);
    gameStatus(t("Müşteri: {0} / {1} • Doğru: {2}", round.turn + 1, round.turns, round.score));
}

function checkPharma(round) {
    if (gameRound !== round || round.done || round.locked) return;

    const ids = new Set([...Object.keys(round.recipe), ...Object.keys(round.bag)]);
    const right = [...ids].every(id => (round.recipe[id] || 0) === (round.bag[id] || 0));

    round.locked = true;
    if (right) round.score++;
    playSound(right ? "ok" : "bad");
    gameStatus(right ? t("✅ {0}: \"Teşekkürler, tam istediğim gibi!\"", round.customer)
        : t("❌ {0}: \"Bu reçetedekiyle aynı değil.\"", round.customer));

    gameTimers.push(setTimeout(() => {
        if (gameRound !== round) return;

        round.locked = false;
        round.turn++;

        if (round.turn < round.turns) {
            newPrescription(round);
            renderPharma(round);
            return;
        }

        $("gameOptions").innerHTML = "";
        $("gameQuestion").textContent = "";
        $("gameBoard").innerHTML = "";

        finishGame({
            recordKey: "pharma",
            score: round.score,
            coins: round.score * 10,
            xp: round.score * 6,
            won: round.score >= 4,
            fixedReward: true,
            text: t("{0} müşterinin {1} tanesini doğru hazırladın.", round.turns, round.score)
        });
    }, 1300));
}

gameInfo.teethhunt = { title: t("Diş Avı"), emoji: "🦷", start: startTeethHunt };
gameInfo.match = { title: t("İlaç Eşleştir"), emoji: "💊", start: startMatch };
gameInfo.pharma = { title: t("Eczacılık"), emoji: "🏪", start: startPharma };

for (const key of ["teethhunt", "match", "pharma"]) defaultState.records[key] = 0;

/* ---- 6) Yeni hikâye bölümleri ---- */

chapters.push(
    {
        id: "trip", emoji: "🚌", name: t("Okul Gezisi"), cases: 5,
        cards: ["agri_kesici", "mide_ilaci", "vitamin"],
        intro: t("Sınıf müzeye geziye çıktı ve sen de gezinin doktorusun! Otobüste midesi bulananlar, yürürken ayağını burkanlar, kahvaltı etmeden gelenler… Herkese yetişmelisin."),
        outro: t("Gezi harika geçti! Öğretmen \"Bir dahaki geziye de seni çağıracağız\" dedi.")
    },
    {
        id: "winter", emoji: "⛷️", name: t("Kış Kampı"), cases: 5,
        cards: ["dinlenme", "antibiyotik", "alci"],
        intro: t("Karlı dağlarda kış kampı başladı! Kayak, kızak, kartopu… Üşüyenler, ateşlenenler ve kayarken düşenler kliniğinin kapısında."),
        outro: t("Kamp bitti ve herkes sıcacık evine döndü. Kampçılar sana kardan bir madalya yaptı!")
    },
    {
        id: "opening", emoji: "🏥", name: t("Büyük Hastane Açılışı"), cases: 6,
        cards: ["antibiyotik", "dinlenme", "agri_kesici", "mide_ilaci", "vitamin", "alci"],
        intro: t("Kasabanın yeni hastanesi açılıyor ve açılışı sen yapacaksın! Bütün kasaba orada; her türlü vaka gelebilir. Bu, kariyerinin en büyük günü!"),
        outro: t("Kurdele kesildi, hastane açıldı! Kasaba halkı seni alkışlıyor: Doktormust'un en iyi doktoru sensin!")
    }
);

/* i18n-off */
Object.assign(chapterBosses, {
    trip: { name: "Deniz", emoji: "👧", problem: "👑 Baş Vaka: Gezi Rehberi", speech: "Bütün sınıfa müzeyi ben anlatacaktım ama birden kendimi kötü hissettim. Gezi benim olmadan olmaz! 🥺" },
    winter: { name: "Kaan", emoji: "👦", problem: "👑 Baş Vaka: Kayak Şampiyonu", speech: "Yarın kayak yarışı var ve ben şampiyonum! Ama bugün hiç iyi değilim. Yarışa yetişebilir miyim? ⛷️" },
    opening: { name: "Belediye Başkanı Ela", emoji: "👩", problem: "👑 Baş Vaka: Açılış Konuğu", speech: "Kurdeleyi birlikte kesecektik ama tam açılışta rahatsızlandım. Hastanenin ilk hastası ben olayım! 🎀" }
});
/* i18n-on */

badges.push(
    ["ch_trip", "🚌", t("Gezi Doktoru"), t("\"Okul Gezisi\" bölümünü tamamla.")],
    ["ch_winter", "⛷️", t("Kar Doktoru"), t("\"Kış Kampı\" bölümünü tamamla.")],
    ["ch_opening", "🏥", t("Hastane Kurucusu"), t("\"Büyük Hastane Açılışı\" bölümünü tamamla.")],
    ["cup1", "🏆", t("Turnuva Şampiyonu"), t("Bir haftalık turnuvayı kazan.")],
    ["branch3", "🗺️", t("Şehir Şehir Doktor"), t("Üç şehirde şube aç.")],
    ["retire", "👴", t("Emekli Doktor"), t("Kariyerinin sonunda emekli ol.")]
);

function extraBadgeConditions() {
    return {
        cup1: state.cup.total >= 1,
        branch3: state.branches.length >= 3,
        retire: state.retired.count >= 1
    };
}

/* ---- 7) Müzik: yere göre farklı melodi ---- */

const musicTracks = {
    clinic: { melody, bass: bassLine, beat: musicBeat, wave: "triangle" },
    // Evde uyurken yavaş bir ninni.
    home: {
        melody: [[392, 2], [330, 2], [392, 2], [330, 2], [349, 2], [294, 2], [262, 4],
                 [294, 2], [330, 2], [349, 2], [392, 2], [330, 2], [294, 2], [262, 4]],
        bass: [131, 131, 147, 131, 131, 175, 147, 131], beat: .62, wave: "sine"
    },
    // Eczanede ve şehir haritasında neşeli, hızlı bir ezgi.
    shop: {
        melody: [[523, 1], [659, 1], [784, 1], [659, 1], [587, 1], [698, 1], [880, 2],
                 [784, 1], [659, 1], [523, 1], [587, 1], [659, 1], [523, 1], [392, 2]],
        bass: [131, 175, 196, 131, 175, 196, 131, 196], beat: .34, wave: "triangle"
    }
};

let musicTrackId = "clinic";

function musicTrack() {
    const title = $("v10Title").textContent;
    const id = state.shift.home ? "home"
        : activeModal === "v10Modal" && (title === t("Eczane") || title === t("Şehirler")) ? "shop" : "clinic";

    if (id !== musicTrackId) {
        musicTrackId = id;
        musicStep = 0;
        musicBeats = 0;
    }

    return musicTracks[id];
}

// Ambulans sireni.
sounds.siren = (c, at) => {
    for (const step of [0, .36, .72]) {
        tone(c, at + step, { from: 700, to: 1050, time: .18, type: "triangle", gain: .05 });
        tone(c, at + step + .18, { from: 1050, to: 700, time: .18, type: "triangle", gain: .05 });
    }
};

/* ---- 8) Şehirler ve şubeler ---- */

const cityList = [
    { id: "ankara", emoji: "🏛️", name: "Ankara", price: 1500, level: 6, income: 60 },
    { id: "izmir", emoji: "🌊", name: "İzmir", price: 2000, level: 7, income: 80 },
    { id: "antalya", emoji: "🏖️", name: "Antalya", price: 2500, level: 8, income: 100 },
    { id: "trabzon", emoji: "🌲", name: "Trabzon", price: 3000, level: 9, income: 120 },
    { id: "erzurum", emoji: "🏔️", name: "Erzurum", price: 3500, level: 10, income: 140 },
    { id: "istanbul", emoji: "🌉", name: "İstanbul", price: 5000, level: 12, income: 200 }
];

const BRANCH_MAX = 3;

function branchIncome() {
    return state.branches.reduce((sum, branch) => {
        const city = cityList.find(item => item.id === branch.city);
        return sum + (city ? city.income * branch.level : 0);
    }, 0);
}

function daysSince(day) {
    return Math.round((new Date(dayKey() + "T12:00:00") - new Date(day + "T12:00:00")) / 86400000);
}

// Şube geliri her gün bir kez toplanır; birikme en fazla 3 gündür.
function collectBranches() {
    if (!appOpen || !state.branches.length) return;

    if (state.branchDay === dayKey()) {
        toast(t("💰 Bugünün şube gelirini topladın. Yarın yine gel!"));
        return;
    }

    const days = state.branchDay ? clamp(daysSince(state.branchDay), 1, 3) : 1;
    const total = branchIncome() * days;

    state.coins += total;
    state.branchDay = dayKey();
    commit();
    playSound("coin");
    toast(t("💰 Şubelerinden {0} coin geldi!", total), true);
}

function openCities() {
    if (!appOpen) return;
    openV10("🗺️", t("Şehirler"), renderCities);
}

function renderCities(body) {
    const ready = state.branches.length && state.branchDay !== dayKey();

    body.innerHTML = `
        <p>${escapeHTML(t("Başka şehirlerde şube aç ve oraya bir doktor görevlendir. Şubeler her gün kendi kendine coin kazanır."))}</p>
        ${state.branches.length ? `<button class="primary-btn full" id="collectButton" ${ready ? "" : "disabled"}>${escapeHTML(ready
            ? t("💰 Günlük Geliri Topla ({0} coin)", branchIncome() * (state.branchDay ? clamp(daysSince(state.branchDay), 1, 3) : 1))
            : t("✅ Bugünün geliri toplandı"))}</button>` : ""}
        <ul class="stock-list shop">${cityList.map(city => {
            const branch = state.branches.find(item => item.city === city.id);
            const locked = state.level < city.level;
            const cost = branch ? city.price * branch.level : city.price;

            const info = branch
                ? t("Dr. {0} • {1}. kademe • günde {2} coin", branch.doctor, branch.level, city.income * branch.level)
                : locked ? t("{0}. seviyede açılır", city.level) : t("Günde {0} coin kazandırır", city.income);

            const action = branch
                ? branch.level >= BRANCH_MAX ? `<span class="small">⭐⭐⭐</span>`
                    : `<button class="toggle" data-city="${city.id}" data-act="up">⬆️ ${cost}</button>`
                : `<button class="toggle" data-city="${city.id}" data-act="open" ${locked ? "disabled" : ""}>${locked ? "🔒" : "🏥 " + city.price}</button>`;

            return `<li><span>${city.emoji}</span><b>${escapeHTML(city.name)}<small>${escapeHTML(info)}</small></b><span class="buy">${action}</span></li>`;
        }).join("")}</ul>
        <p class="notice">${escapeHTML(t("Şube gelirini her gün topla; toplamayı unutursan en fazla 3 günlük gelir birikir."))}</p>
    `;

    if ($("collectButton")) $("collectButton").onclick = () => { collectBranches(); renderCities(body); };

    body.querySelectorAll("[data-city]").forEach(button => {
        button.onclick = () => {
            const city = cityList.find(item => item.id === button.dataset.city);
            const branch = state.branches.find(item => item.city === city.id);
            const cost = branch ? city.price * branch.level : city.price;

            if (state.coins < cost) {
                toast(t("🪙 Coinin yetmiyor."));
                return;
            }

            state.coins -= cost;

            if (branch) {
                branch.level++;
                toast(t("⬆️ {0} şuben büyüdü! Artık daha çok coin kazandırır.", city.name), true);
            } else {
                const doctor = pick(helperDoctors);
                state.branches.push({ city: city.id, level: 1, doctor });
                if (!state.branchDay) state.branchDay = dayKey(-1);
                toast(t("🏥 {0} şubesi açıldı! Dr. {1} orada hastalara bakıyor.", city.name, doctor), true);
                confetti();
            }

            commit();
            sfx("sparkle");
            renderCities(body);
        };
    });
}

/* ---- 9) Emeklilik ---- */

// Klinikler Başkanı olunca emekli olunabilir: kariyer baştan başlar ama her emeklilik
// kalıcı bir kazanç bonusu ve 7 klinik gününde bir emekli maaşı getirir.
const PENSION = 2000;

function legacyBonus() {
    return Math.min(.5, state.retired.count * .1);
}

function retire() {
    if (!appOpen || careerIndex() < careerSteps.length - 1) return;
    if (!confirm(t("Emekli olursan kariyerin Stajyer Doktor olarak yeniden başlar (eşyaların, coinlerin, çıkartmaların ve rozetlerin kalır). Her emeklilik kazancını kalıcı olarak %10 artırır ve 7 klinik gününde bir {0} coin emekli maaşı alırsın. Emekli olunsun mu?", PENSION))) return;

    state.retired = { count: state.retired.count + 1, lastPay: state.shift.day };
    state.level = 1;
    state.xp = 0;
    state.career = 0;
    state.coins += 1000;

    commit();
    confetti();
    sfx("yay");
    showInfo("👴", t("Mutlu emeklilikler, Doktor!"),
        t("Uzun ve başarılı bir kariyeri geride bıraktın. Veda hediyesi: +1000 coin.\n\nŞimdi kliniğe yeni nesil bir doktor geliyor: yine Stajyer Doktor olarak başlıyorsun, ama artık her vakada %{0} daha fazla coin kazanıyorsun ve 7 klinik gününde bir {1} coin emekli maaşı alıyorsun.", Math.round(legacyBonus() * 100), PENSION),
        t("Emeklilik sayısı: {0}", state.retired.count));
}

// Yeni klinik günü başlarken çağrılır.
function payPension() {
    if (!state.retired.count || state.shift.day - state.retired.lastPay < 7) return;

    state.retired.lastPay = state.shift.day;
    state.coins += PENSION;
    toast(t("👴 Emekli maaşın yattı: +{0} coin!", PENSION), true);
}

function renderRetire() {
    const top = careerIndex() >= careerSteps.length - 1;
    const box = $("retireBox");

    box.innerHTML = (state.retired.count
        ? `<p class="small">${escapeHTML(t("👴 {0} kez emekli oldun • Kazanç bonusu: %{1}", state.retired.count, Math.round(legacyBonus() * 100)))}</p>` : "") +
        (top ? `<button class="primary-btn full" id="retireButton">${escapeHTML(t("👴 Emekli Ol"))}</button>` : "");

    if (top) $("retireButton").onclick = retire;
}

/* ---- 10) Telefon: kaydırarak geçiş ve büyük düğmeler ---- */

function setupSwipe() {
    let start = null;

    document.addEventListener("touchstart", event => {
        if (event.touches.length !== 1) { start = null; return; }
        start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });

    document.addEventListener("touchend", event => {
        if (!start || !appOpen || activeModal || document.body.classList.contains("menu-open")) { start = null; return; }

        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        start = null;

        if (Math.abs(dx) < 90 || Math.abs(dy) > 60 || event.target.closest("input, textarea, .clinic-edit-area:not(.scene)")) return;

        const index = dockScreens.indexOf(currentScreen);
        if (index < 0) return;

        const next = dockScreens[index + (dx < 0 ? 1 : -1)];
        if (next) showScreen(next);
    }, { passive: true });
}

function applyBigUI() {
    document.body.classList.toggle("big-ui", state.bigUI === true);
    $("bigUIButton").textContent = state.bigUI ? t("🔘 Büyük düğmeler: Açık") : t("🔘 Büyük düğmeler: Kapalı");
}

function toggleBigUI() {
    if (!appOpen) return;
    state.bigUI = !state.bigUI;
    commit();
}

/* ---- Robi ---- */

// Ambulans soruları artık acil çağrı konusuna gider (ilk yardım konusu 112 ile yakalanır).
for (const topic of robotTopics) {
    if (topic.keys.includes("112")) topic.keys = topic.keys.filter(key => key !== "ambulans" && key !== "ambulance");
}

robotTopics.splice(robotTopics.findIndex(topic => topic.keys.includes("yildiz")), 0,
    {
        keys: ["ambulans", "acil cagri", "siren", "ambulance"],
        answer: t("2. seviyeden sonra bazen acil çağrı gelir. Klinik ekranındaki \"🚑 Acil Çağrı\" düğmesine bas, labirentte ambulansı sür ve yaralı çocuğu kliniğe getir. Hızlı gidersen kurtarma ödülü kazanırsın!")
    },
    {
        keys: ["mevsim", "kis", "yaz", "bahar", "sonbahar", "season"],
        answer: () => t("Şu an {0} {1}. {2}", seasonInfo[seasonNow()].emoji, seasonInfo[seasonNow()].name, seasonInfo[seasonNow()].text)
    },
    {
        keys: ["turnuva", "kupa", "tournament", "cup"],
        answer: () => t("Bu haftanın turnuvası: {0}. Görevler ekranında ilerlemeni görebilirsin; kazanırsan 200 coin, 5 elmas ve bir kupa alırsın!", t(currentCup().text, currentCup().goal))
    },
    {
        keys: ["sehir", "sube", "harita", "city", "branch"],
        answer: t("6. seviyeden sonra \"🗺️ Şehirler\" düğmesinden Ankara, İzmir, İstanbul gibi şehirlerde şube açabilirsin. Şubeler her gün coin kazandırır; geliri toplamayı unutma!")
    },
    {
        keys: ["emekli", "retire"],
        answer: t("Klinikler Başkanı olunca Doktorum ekranından emekli olabilirsin. Kariyer baştan başlar ama her vakada daha çok coin kazanır ve 7 klinik gününde bir emekli maaşı alırsın.")
    },
    {
        keys: ["eczaci", "recete", "pharmacist", "prescription"],
        answer: t("Mini Oyunlar'daki \"Eczacılık\" oyununda müşterilerin reçetelerini okur, doğru ürünleri poşete koyarsın. Beş müşteriye de doğru hazırlarsan rekor senin!")
    },
    {
        keys: ["susle", "aksesuar", "gozluk", "sapka", "accessory"],
        answer: t("Doktorum ekranında doktoruna kasket, çiçek tacı, kulaklık, tavşan kulakları ya da yıldız gözlük takabilirsin. Önlüğünün rengini de değiştirebilirsin!")
    }
);

/* ---- Başlangıç ---- */

function setupV11() {
    setupSwipe();
}

function renderV11() {
    renderCup();
    renderRetire();
    applyBigUI();

    const season = seasonInfo[seasonNow()];
    $("eventBanner").textContent += "  •  " + season.emoji + " " + season.text;

    $("callButton").hidden = !state.callPending || state.shift.closed;

    const text = (value, label) => value ? t("🏅 Rekor: ") + label : t("Henüz rekor yok");
    $("rec-teethhunt").textContent = text(state.records.teethhunt, t("{0} mikrop", state.records.teethhunt));
    $("rec-match").textContent = text(state.records.match, t("{0} / 6 puan", state.records.match));
    $("rec-pharma").textContent = text(state.records.pharma, t("{0} / 5 doğru", state.records.pharma));
}
