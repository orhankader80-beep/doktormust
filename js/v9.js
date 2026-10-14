"use strict";

/* ===== DENGE ===== */

// Aynı işi durmadan tekrarlayarak coin kasmayı önler: bir işin günde "limit" kereden
// sonraki ödülleri dörtte bire iner. Sayaç gerçek günle sıfırlanır.
function playFactor(kind, limit) {
    const today = dayKey();
    if (state.farm.day !== today) state.farm = { day: today, games: 0, duels: 0 };

    state.farm[kind]++;
    return state.farm[kind] <= limit ? 1 : .25;
}

// İki karta indirme (görüntüleme raporu ve Robi'nin son ipucu) hep aynı iki kartı gösterir;
// böylece ikisini birleştirerek ya da oyunu yeniden açarak doğru kart bulunamaz.
// İkinci kart hastanın adından ve sözünden seçilir (kimlik her açılışta değişir).
function hintPair(patient) {
    const others = cardsFor(patient).filter(card => card.id !== patient.correctTreatment);
    const other = others[faceHash(patient.name + patient.speech) % others.length];

    return [patient.correctTreatment, other.id].sort().map(id => cardInfo(id).label);
}

/* ===== ZORLUK ===== */

// Doktor ustalaştıkça genel klinikte zor vakalar görülmeye başlar: sabır azdır ve
// bulgulardan biri yanıltıcı olabilir; karşılığında ödül daha büyüktür.
function trickyChance() {
    return state.level < 4 ? 0 : Math.min(.35, .1 + (state.level - 4) * .05);
}

/* ===== SÜRÜKLEYEREK TEDAVİ ===== */

// Tedavi sahnesinde simge parmakla (ya da fareyle) hastanın üstüne sürüklenir.
// Düğme de durur; sürükleyemeyenler ve klavye kullananlar onunla devam eder.
function setupCureDrag() {
    const token = $("tmCureToken");
    let start = null;

    const reset = () => {
        start = null;
        token.classList.remove("dragging");
        token.style.transform = "";
    };

    token.addEventListener("pointerdown", event => {
        if (!cure || cure.done >= cure.plan.count) return;

        start = { x: event.clientX, y: event.clientY };
        token.classList.add("dragging");
        event.preventDefault();

        try {
            token.setPointerCapture(event.pointerId);
        } catch (error) {
            // Yakalama desteklenmiyorsa sürükleme simgenin üstünde kaldıkça çalışır.
        }
    });

    token.addEventListener("pointermove", event => {
        if (!start) return;
        token.style.transform = `translate(${event.clientX - start.x}px, ${event.clientY - start.y}px) scale(1.15)`;
    });

    token.addEventListener("pointerup", event => {
        if (!start) return;

        const stage = $("tmEmoji").getBoundingClientRect();
        const inside = event.clientX >= stage.left - 24 && event.clientX <= stage.right + 24 &&
            event.clientY >= stage.top - 24 && event.clientY <= stage.bottom + 24;

        reset();

        if (inside) cureTap();
        else toast(t("Simgeyi hastanın üstüne bırak."));
    });

    token.addEventListener("pointercancel", reset);
}

/* ===== İYİLEŞEN HASTA EL SALLAYIP ÇIKAR ===== */

// sceneLeaver: { person, slot } — sonuç penceresi kapanınca sahnede bir kez oynatılır.
let sceneLeaver = null;

function showLeaver() {
    if (!sceneLeaver || activeModal || currentScreen !== "home") return;

    const { person, slot } = sceneLeaver;
    sceneLeaver = null;

    if (isStill() || state.shift.closed) return;

    const [x, y] = slotsNow()[slot] || slotsNow()[0];
    const figure = document.createElement("div");

    // En yakın kenara yürür; böylece doktorun önünden geçmez.
    figure.className = "scene-patient walk-out" + (x < 50 ? " to-left" : "");
    figure.setAttribute("aria-hidden", "true");
    figure.style.left = x + "%";
    figure.style.top = y + "%";
    figure.innerHTML = `<span class="sp-sign">👋</span>` +
        `<span class="walker">${faceSVG(person, { mood: "happy", cheer: true, full: true })}</span>`;

    $("scene").appendChild(figure);
    setTimeout(() => figure.remove(), 3400);
}

/* ===== GÜNÜN VAKASI ===== */

// Her gün herkese aynı zor vaka gelir (vaka o günün tarihinden üretilir; internet gerekmez).
// Günde bir kez oynanır; sonuç kaydedilir ve arkadaşlarla karşılaştırılabilir.
let dayCasePatient = null;

function seededRandom(seed) {
    let value = seed >>> 0;

    return () => {
        value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

// fn çalışırken Math.random yerine tohumlu sayı üreteci kullanılır.
function withSeed(seed, fn) {
    const real = Math.random;
    Math.random = seededRandom(seed);

    try {
        return fn();
    } finally {
        Math.random = real;
    }
}

function dayCaseNumber() {
    return Math.floor(new Date(dayKey() + "T12:00:00").getTime() / 86400000);
}

function refreshDayCase() {
    if (state.dailyCase.day !== dayKey()) {
        state.dailyCase = { day: dayKey(), done: false, stars: 0, mistakes: 0 };
        dayCasePatient = null;
    }
}

function makeDayCase() {
    const seed = dayCaseNumber() * 7919 + 13;

    const patient = withSeed(seed, () => {
        const pool = [...diseasePool.young, ...diseasePool.middle, ...diseasePool.older];
        return makePatient(pick(pool), ageGroups["orta"]);
    });

    // Kişiye göre değişen ayrıntılar sabitlenir; böylece vaka herkeste aynı olur.
    patient.daily = true;
    patient.emergency = false;
    patient.exams = [];
    patient.age = 8 + seed % 3;
    withSeed(seed + 1, () => makeTricky(patient));

    // Yarıda bırakılıp yeniden açılırsa yapılan yanlışlar geri gelir.
    patient.mistakes = state.dailyCase.mistakes;
    patient.patience = Math.max(1, 2 - state.dailyCase.mistakes);

    return patient;
}

function openDayCase() {
    if (!appOpen) return;

    refreshDayCase();

    if (state.dailyCase.done) {
        showInfo("🗓️", t("Günün vakası"),
            (state.dailyCase.stars
                ? t("Bugünün vakasını çözdün: {0}", "⭐".repeat(state.dailyCase.stars) + "☆".repeat(3 - state.dailyCase.stars))
                : t("Bugünün vakasında hasta gitti. Yarın yeniden dene!")) +
            "\n\n" + t("Yarın herkese yeni bir vaka gelecek. Arkadaşlarına kaç yıldız aldıklarını sor!"),
            t("Günün vakası herkeste aynıdır ve günde bir kez oynanır."));
        return;
    }

    if (!dayCasePatient) dayCasePatient = makeDayCase();
    openTreatment(dayCasePatient.id);
}

function dayCaseResult(stars) {
    state.dailyCase.done = true;
    state.dailyCase.stars = stars;
    dayCasePatient = null;
}

function renderDayCase() {
    refreshDayCase();

    $("dayCaseButton").textContent = state.dailyCase.done
        ? t("🗓️ Günün Vakası: {0}", state.dailyCase.stars ? "⭐".repeat(state.dailyCase.stars) : "😢")
        : t("🗓️ Günün Vakası");
}

/* ===== SKOR KODU ===== */

// Bu haftanın sayıları 8 harflik bir koda sığar. Kodu arkadaşına sen söylersin; o da kendi
// oyununa yazar. Oyun hiçbir şeyi kendiliğinden göndermez; yazılan adlar yalnızca o cihazda kalır.
const SCORE_LETTERS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";      // I ve O yok: karışmasın
const SCORE_MAX = SCORE_LETTERS.length * SCORE_LETTERS.length - 1;

function scorePart(number, length) {
    let text = "";
    let rest = Math.max(0, Math.floor(number));

    for (let i = 0; i < length; i++) {
        text = SCORE_LETTERS[rest % SCORE_LETTERS.length] + text;
        rest = Math.floor(rest / SCORE_LETTERS.length);
    }

    return text;
}

function scoreNumber(text) {
    let number = 0;
    for (const letter of text) number = number * SCORE_LETTERS.length + SCORE_LETTERS.indexOf(letter);
    return number;
}

function scoreWeek() {
    return faceHash(state.week.key) % (SCORE_MAX + 1);
}

function scoreCheck(body) {
    return scorePart(faceHash("doktormust:" + body) % (SCORE_MAX + 1), 2);
}

function myScoreCode() {
    const body = scorePart(scoreWeek(), 2) + scorePart(Math.min(state.week.cases, SCORE_MAX), 2) +
        scorePart(Math.min(state.week.perfect, SCORE_MAX), 2);

    return body + scoreCheck(body);
}

function openFriends() {
    if (!appOpen) return;
    openModal("friendsModal");
    renderFriends();
}

function addFriendScore(event) {
    event.preventDefault();
    if (!appOpen) return;

    const name = $("friendName").value.trim().slice(0, 14);
    const code = $("friendCode").value.toUpperCase().replace(/[^0-9A-Z]/g, "");

    if (!name) {
        toast(t("Arkadaşının adını yaz."));
        return;
    }

    if (code.length !== 8 || [...code].some(letter => !SCORE_LETTERS.includes(letter)) ||
            scoreCheck(code.slice(0, 6)) !== code.slice(6)) {
        toast(t("⚠️ Bu skor kodu geçerli değil. Harfleri kontrol et."));
        return;
    }

    if (scoreNumber(code.slice(0, 2)) !== scoreWeek()) {
        toast(t("⚠️ Bu kod başka bir haftaya ait. Arkadaşından bu haftanın kodunu iste."));
        return;
    }

    const score = {
        name, week: state.week.key,
        cases: scoreNumber(code.slice(2, 4)), perfect: scoreNumber(code.slice(4, 6))
    };

    state.friends = state.friends
        .filter(friend => friend.name.toLocaleLowerCase("tr") !== name.toLocaleLowerCase("tr"))
        .concat(score).slice(-20);

    $("friendName").value = "";
    $("friendCode").value = "";
    commit();
    playSound();
    toast(t("🤝 {0} tabloya eklendi.", name));
}

function removeFriend(name) {
    state.friends = state.friends.filter(friend => friend.name !== name);
    commit();
}

function renderFriends() {
    const code = myScoreCode();

    $("myScoreCode").textContent = code.slice(0, 4) + "-" + code.slice(4);
    $("myScoreLine").textContent = t("Bu hafta: {0} vaka, {1} tanesi 3 yıldız", state.week.cases, state.week.perfect);

    // Yalnızca bu haftanın kodları gösterilir.
    const rows = state.friends.filter(friend => friend.week === state.week.key)
        .map(friend => ({ ...friend, me: false }))
        .concat({ name: state.doctor.name, cases: state.week.cases, perfect: state.week.perfect, me: true })
        .sort((a, b) => b.perfect - a.perfect || b.cases - a.cases);

    const list = $("friendList");
    list.innerHTML = "";

    rows.forEach((row, index) => {
        const item = document.createElement("li");
        if (row.me) item.className = "turn";

        item.innerHTML = `<span>${["🥇", "🥈", "🥉"][index] || "🎖️"}</span>` +
            `<b>${escapeHTML(row.name)}${row.me ? " " + escapeHTML(t("(sen)")) : ""}</b>` +
            `<span class="friend-score">⭐ ${row.perfect} • ${escapeHTML(t("{0} vaka", row.cases))}</span>`;

        if (!row.me) {
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "toggle";
            remove.textContent = "✕";
            remove.setAttribute("aria-label", t("{0} adlı arkadaşı çıkar", row.name));
            remove.onclick = () => removeFriend(row.name);
            item.lastElementChild.appendChild(remove);
        }

        list.appendChild(item);
    });
}

/* ===== SINIF YARIŞMASI: TAKIMLAR ===== */

const teamNames = [t("Kırmızı Takım"), t("Mavi Takım"), t("Yeşil Takım"), t("Sarı Takım")];
const TEAM_ROUNDS = 3;

// Takım modu: oyuncular yerine takımlar yazılır ve her takım üç tur oynar.
// Her turda takımdan başka biri doktor olur.
function fillTeams(count) {
    if (!classGame || classGame.started) return;

    classGame.players = teamNames.slice(0, count).map(name => ({ name, stars: 0, played: false }));
    classGame.rounds = TEAM_ROUNDS;
    playSound("tap");
    renderClass();
}

/* ===== YENİ BÖLÜMLER ===== */

// Bunlar da kurgusal oyun kurallarıdır; gerçek tıbbi karar kuralı değildir.
wards.push(
    {
        id: "ent", emoji: "👂", name: t("Kulak Burun Boğaz"), level: 4,
        intro: t("Kulağı ağrıyan, burnu tıkanan ya da boğazı yanan çocuklar burada. Kulak feneri, burun ışığı ve dil çubuğuyla doğru kartı bul."),
        tools: [
            { id: "ear", emoji: "🔦", name: t("Kulak Feneri") },
            { id: "nose", emoji: "👃", name: t("Burun Işığı") },
            { id: "throat", emoji: "🥢", name: t("Dil Çubuğu") }
        ],
        cards: [
            {
                id: "n_ear", label: t("💧 Kulak Damlası Kartı"), key: "ear",
                signs: t("🔦 Kulak zarı kızarıktır. Burun açıktır, boğaz normal görünür."),
                findings: {
                    ear: [t("Kulak zarı kıpkırmızı ve şiş!"), true],
                    nose: [t("Burun yolu açık, akıntı yok."), false],
                    throat: [t("Boğaz pembe ve normal görünüyor."), false]
                }
            },
            {
                id: "n_nose", label: t("🌊 Tuzlu Su Spreyi Kartı"), key: "nose",
                signs: t("👃 Burnun içi şiş ve tıkalıdır. Kulak zarı normaldir, boğaz hafif kızarık olabilir."),
                findings: {
                    ear: [t("Kulak zarı parlak ve normal."), false],
                    nose: [t("Burnun içi şişmiş, hava zor geçiyor!"), true],
                    throat: [t("Boğaz hafif kızarmış ama bademcikler şiş değil."), true]
                }
            },
            {
                id: "n_throat", label: t("🍯 Boğaz Pastili Kartı"), key: "throat",
                signs: t("🥢 Bademcikler kızarık ve şiştir. Kulak zarı normaldir, burun açıktır."),
                findings: {
                    ear: [t("Kulak zarı parlak ve normal."), false],
                    nose: [t("Burun yolu açık, akıntı yok."), false],
                    throat: [t("Bademcikler kıpkırmızı ve şişmiş!"), true]
                }
            }
        ]
    },
    {
        id: "diet", emoji: "🥗", name: t("Beslenme Köşesi"), level: 6,
        intro: t("Çabuk yorulan, başı ağrıyan ya da sebzeyi sevmeyen çocuklar burada. Su sayacı, yemek günlüğü ve enerji testiyle doğru kartı bul."),
        tools: [
            { id: "water", emoji: "🚰", name: t("Su Sayacı") },
            { id: "diary", emoji: "📒", name: t("Yemek Günlüğü") },
            { id: "energy", emoji: "🏃", name: t("Enerji Testi") }
        ],
        cards: [
            {
                id: "b_water", label: t("💧 Su Planı Kartı"), key: "water",
                signs: t("🚰 Günde yalnızca bir iki bardak su içer. Yemek günlüğü dengelidir; öğleden sonra başı ağrır."),
                findings: {
                    water: [t("Dün yalnızca 1 bardak su içmiş!"), true],
                    diary: [t("Günlükte sebze, meyve ve kahvaltı var; tabak dengeli."), false],
                    energy: [t("Öğleden sonra başı ağrıyor ve dudakları kuru."), true]
                }
            },
            {
                id: "b_veg", label: t("🥦 Renkli Tabak Kartı"), key: "diary",
                signs: t("📒 Günlükte hiç sebze ve meyve yoktur. Yeterince su içer, enerjisi normaldir."),
                findings: {
                    water: [t("Günde 6 bardak su içiyor, bu çok iyi."), false],
                    diary: [t("Günlükte hiç sebze ve meyve yok; hep hamur işi!"), true],
                    energy: [t("Enerjisi normal: testi rahatça bitirdi."), false]
                }
            },
            {
                id: "b_break", label: t("🍳 Kahvaltı Kartı"), key: "energy",
                signs: t("🏃 Sabahları enerjisi çok düşüktür ve 📒 günlükte kahvaltı yoktur. Yeterince su içer."),
                findings: {
                    water: [t("Günde 6 bardak su içiyor, bu çok iyi."), false],
                    diary: [t("Günlükte kahvaltı hiç yok; okula aç gidiyor."), true],
                    energy: [t("Sabah testinde hemen yoruldu, karnı guruldadı!"), true]
                }
            }
        ]
    }
);

// Yeni bölümlerin listeleri ve kart istatistikleri başlangıç kaydına eklenir.
for (const ward of wards.slice(-2)) {
    defaultState.wardPatients[ward.id] = [];
    defaultState.wardCases[ward.id] = 0;

    for (const card of ward.cards) {
        defaultState.cardStats[card.id] = { right: 0, wrong: 0 };
    }
}

/* i18n-off */
wardCases.ent = [
    {
        problem: "👂 Kulak Ağrısı", card: "n_ear",
        says: [
            "Havuzdan sonra kulağım zonklamaya başladı. 🏊",
            "Kulağıma dokununca çok acıyor, gece uyuyamadım. 😢"
        ]
    },
    {
        problem: "👂 Az Duyma", card: "n_ear",
        says: [
            "Sağ kulağım sanki pamukla tıkalı, bir de sızlıyor. 😣",
            "Öğretmenimi iyi duyamıyorum, kulağımın içi de sıcak. 🥵"
        ]
    },
    {
        problem: "👃 Tıkalı Burun", card: "n_nose",
        says: [
            "Burnum hep tıkalı, ağzımdan nefes alıyorum. 😮‍💨",
            "Gece burnum tıkanınca horluyormuşum. 😴"
        ]
    },
    {
        problem: "🤧 Hapşırık", card: "n_nose",
        says: [
            "Sabahları arka arkaya hapşırıyorum, burnum da kaşınıyor. 🤧",
            "Burnumdan nefes alamıyorum, koku da alamıyorum. 👃"
        ]
    },
    {
        problem: "😖 Boğaz Yanması", card: "n_throat",
        says: [
            "Yutkunurken boğazım yanıyor, sesim de kısıldı. 😖",
            "Boğazımda sanki bir şey var, yemek yerken acıyor. 🍽️"
        ]
    },
    {
        problem: "🗣️ Ses Kısıklığı", card: "n_throat",
        says: [
            "Maçta çok bağırdım, şimdi boğazım acıyor. ⚽",
            "Sabah kalkınca boğazım kupkuru ve acıyor. 🌅"
        ]
    }
];

wardCases.diet = [
    {
        problem: "🤕 Öğleden Sonra Baş Ağrısı", card: "b_water",
        says: [
            "Okulda suluğumu hiç açmıyorum, öğleden sonra başım ağrıyor. 🤕",
            "Su içmeyi hep unutuyorum, dudaklarım çatladı. 👄"
        ]
    },
    {
        problem: "🥤 Hep Gazlı İçecek", card: "b_water",
        says: [
            "Su yerine hep gazlı içecek içiyorum, yine de susuyorum. 🥤",
            "Beden eğitiminden sonra başım dönüyor, hiç su içmemiştim. 🏃"
        ]
    },
    {
        problem: "🥦 Sebze Sevmeme", card: "b_veg",
        says: [
            "Sebze hiç sevmem, hep makarna ve börek yerim. 🍝",
            "Meyveyi en son ne zaman yedim hatırlamıyorum. 🍏"
        ]
    },
    {
        problem: "🍟 Hep Aynı Yemek", card: "b_veg",
        says: [
            "Her gün patates kızartması istiyorum, başka şey yemiyorum. 🍟",
            "Tabağımdaki yeşil şeyleri hep kenara ayırıyorum. 🥬"
        ]
    },
    {
        problem: "🥱 Sabah Yorgunluğu", card: "b_break",
        says: [
            "Sabah geç kalkıyorum, kahvaltı yapmadan okula koşuyorum. 🏫",
            "İlk derste karnım gurulduyor, dersi dinleyemiyorum. 🥱"
        ]
    },
    {
        problem: "😵 Teneffüste Halsizlik", card: "b_break",
        says: [
            "Sabah bir şey yemiyorum, ilk teneffüste halim kalmıyor. 😵",
            "Kahvaltıyı sevmiyorum, öğlene kadar hiçbir şey yemiyorum. 🙅"
        ]
    }
];
/* i18n-on */

Object.assign(toolSpots, {
    "ent:ear": [79, 54, "plain"], "ent:nose": [50, 62, "plain"], "ent:throat": [50, 72, "open"],
    "diet:water": [19, 122, "plain"], "diet:diary": [81, 122, "plain"], "diet:energy": [58, 162, "plain"]
});

Object.assign(wardCureSpots, { ent: [50, 66], diet: "mouth" });

/* ===== YENİ MİNİ OYUNLAR ===== */

/* İlk Yardım Çantası: çantaya girmesi gerekenleri seç */

const kitRight = [
    t("🩹 Yara bandı"), t("🧴 Yara temizleme sıvısı"), t("🧻 Temiz gazlı bez"), t("✂️ Küçük makas"),
    t("🧤 Tek kullanımlık eldiven"), t("🌡️ Ateş ölçer"), t("🧊 Soğuk kompres"), t("📞 Acil numaralar kartı")
];

const kitWrong = [
    t("🍫 Çikolata"), t("🎮 Oyun kolu"), t("🧸 Oyuncak ayı"), t("🖍️ Boya kalemi"),
    t("⚽ Top"), t("🍭 Lolipop"), t("📺 Kumanda"), t("🧦 Çorap")
];

function kitStatus(round) {
    gameStatus(t("Bulunan: {0} / {1} • Hata: {2} / 3", round.found, round.need, round.mistakes));
}

function startKit(round) {
    round.need = 6;
    round.found = 0;
    round.mistakes = 0;

    const right = shuffled(kitRight).slice(0, round.need);
    const items = shuffled([...right, ...shuffled(kitWrong).slice(0, 6)]);

    $("gameQuestion").textContent = t("İlk yardım çantasına girmesi gereken {0} şeyi bul.", round.need);
    $("gameBoard").innerHTML = "";
    $("gameOptions").innerHTML = "";
    $("gameOptions").className = "game-options kit-grid";

    items.forEach(item => {
        const button = document.createElement("button");
        button.className = "choice";
        button.textContent = item;
        button.onclick = () => pickKit(button, right.includes(item));
        $("gameOptions").appendChild(button);
    });

    kitStatus(round);
}

function pickKit(button, right) {
    const round = gameRound;
    if (!appOpen || !round || round.done || round.kind !== "kit") return;

    button.disabled = true;
    button.textContent = (right ? "✅ " : "❌ ") + button.textContent;

    if (right) round.found++;
    else round.mistakes++;

    playSound(right ? "tap" : "bad");
    kitStatus(round);

    if (round.found < round.need && round.mistakes < 3) return;

    const score = Math.max(0, round.found - round.mistakes);

    $("gameQuestion").textContent = "";
    gameStatus("");

    finishGame({
        recordKey: "kit",
        score,
        coins: score * 6,
        xp: score * 4,
        won: round.found === round.need && round.mistakes <= 1,
        text: round.found === round.need
            ? t("Çanta hazır! Hata: {0}. Puanın: {1} / 6.", round.mistakes, score)
            : t("Üç hata oldu. Çantaya {0} doğru şey koydun.", round.found)
    });
}

/* Organ Bilmecesi: 5 soruluk tur (Hızlı Muayene ile aynı düzen) */

const organQuestions = [
    {
        question: t("Hangi organımız kanı bütün vücuda pompalar?"),
        choices: [t("❤️ Kalp"), t("🫁 Akciğer"), t("🧠 Beyin")],
        correct: t("❤️ Kalp")
    },
    {
        question: t("Nefes aldığımızda hava hangi organımıza dolar?"),
        choices: [t("🫁 Akciğer"), t("🫃 Mide"), t("❤️ Kalp")],
        correct: t("🫁 Akciğer")
    },
    {
        question: t("Düşünmemizi ve hatırlamamızı hangi organımız sağlar?"),
        choices: [t("🧠 Beyin"), t("🦴 Kemik"), t("🫁 Akciğer")],
        correct: t("🧠 Beyin")
    },
    {
        question: t("Yediğimiz yemek ilk olarak hangi organımızda sindirilmeye başlar?"),
        choices: [t("🫃 Mide"), t("❤️ Kalp"), t("👂 Kulak")],
        correct: t("🫃 Mide")
    },
    {
        question: t("Vücudumuzu dik tutan ve organlarımızı koruyan nedir?"),
        choices: [t("🦴 İskelet"), t("💇 Saç"), t("💅 Tırnak")],
        correct: t("🦴 İskelet")
    },
    {
        question: t("Kanımızı süzüp temizleyen fasulye biçimli organlar hangileridir?"),
        choices: [t("🫘 Böbrekler"), t("👀 Gözler"), t("🦷 Dişler")],
        correct: t("🫘 Böbrekler")
    },
    {
        question: t("Vücudumuzu dışarıdan saran en büyük organımız hangisidir?"),
        choices: [t("🖐️ Deri"), t("🧠 Beyin"), t("🫃 Mide")],
        correct: t("🖐️ Deri")
    },
    {
        question: t("Kolumuzu bükmemizi ve koşmamızı ne sağlar?"),
        choices: [t("💪 Kaslar"), t("💇 Saç"), t("🦷 Dişler")],
        correct: t("💪 Kaslar")
    },
    {
        question: t("Kalbimiz dinlenirken dakikada yaklaşık kaç kez atar?"),
        choices: [t("💓 70–100 kez"), t("5 kez"), t("1000 kez")],
        correct: t("💓 70–100 kez")
    },
    {
        question: t("Yetişkin bir insanda yaklaşık kaç kemik vardır?"),
        choices: [t("🦴 206"), "20", "2000"],
        correct: t("🦴 206")
    }
];

function startOrgan(round) {
    round.questions = shuffled(organQuestions).slice(0, 5);
    round.recordKey = "organ";
    round.index = 0;
    round.score = 0;
    $("gameBoard").innerHTML = "";
    showQuizQuestion();
}

gameInfo.kit = { title: t("İlk Yardım Çantası"), emoji: "🧰", start: startKit };
gameInfo.organ = { title: t("Organ Bilmecesi"), emoji: "🫀", start: startOrgan };

/* ===== ROBİ'NİN YENİ BİLGİLERİ ===== */

// Belirli konular genel konulardan (örneğin "kalp" = sabır kalbi) önce denenir.
robotTopics.splice(robotTopics.findIndex(topic => topic.keys.includes("yildiz")), 0,
    {
        keys: ["gunun vakasi", "daily case", "case of the day"],
        answer: t("Günün Vakası her gün herkese aynı gelen zor bir vakadır. Günde bir kez oynanır; rapor istenemez. Arkadaşlarınla kaç yıldız aldığınızı karşılaştırabilirsin!")
    },
    {
        keys: ["skor kodu", "arkadas", "score code", "friend"],
        answer: t("Klinik ekranındaki \"Arkadaş Skorları\" penceresinde bu haftanın skor kodun yazar. Kodu arkadaşına söyle; o da kendi oyununa yazınca tabloda görünürsün. Oyun hiçbir şeyi internete göndermez.")
    },
    {
        keys: ["takim", "team"],
        answer: t("Sınıf Yarışması'nda \"2 Takım\", \"3 Takım\" ya da \"4 Takım\" düğmesine basarsan takımlar hazır gelir ve üç tur oynanır. Her turda takımdan başka biri doktor olur.")
    },
    {
        keys: ["zor vaka", "bulmaca", "tricky", "hard case"],
        answer: t("4. seviyeden sonra bazı hastalar 🧩 zor vaka olarak gelir: sabırları azdır ve bulgulardan biri yanıltabilir. Doğru bilirsen daha çok coin ve XP kazanırsın.")
    },
    {
        keys: ["surukle", "drag"],
        answer: t("Doğru kartı bulunca tedaviyi sen uygularsın: simgeyi parmağınla hastanın üstüne sürükle ya da alttaki düğmeye dokun.")
    },
    {
        keys: ["kalp ne", "kalbimiz", "kalbim", "kalp nasil", "heart do", "my heart"],
        answer: t("Kalbin yumruğun kadar bir kastır. Hiç durmadan çalışır ve kanı bütün vücuduna pompalar. Koşunca daha hızlı atar, çünkü kasların daha çok oksijen ister. ❤️")
    },
    {
        keys: ["akciger", "nefes", "lung", "breath"],
        answer: t("İki akciğerin var. Nefes alınca havayla dolarlar ve havadaki oksijeni kana geçirirler. Burnundan yavaşça nefes almak seni sakinleştirir. 🫁")
    },
    {
        keys: ["beyin", "brain"],
        answer: t("Beynin vücudunun yöneticisidir: düşünmeni, hatırlamanı ve hareket etmeni sağlar. Uyurken gün içinde öğrendiklerini düzenler; bu yüzden uyku çok önemlidir. 🧠")
    },
    {
        keys: ["mide ne", "sindirim", "stomach", "digest"],
        answer: t("Yediklerin miden ve bağırsaklarında küçük parçalara ayrılır; vücudun bunları enerjiye çevirir. Yavaş yemek ve iyi çiğnemek midene yardım eder. 🍽️")
    },
    {
        keys: ["kemik", "iskelet", "bone", "skeleton"],
        answer: t("Yetişkin bir insanda yaklaşık 206 kemik vardır. İskeletin seni dik tutar ve organlarını korur. Süt, yoğurt ve güneş ışığı kemiklerini güçlendirir. 🦴")
    },
    {
        keys: ["kan", "damar", "blood"],
        answer: t("Kan, damarlarında dolaşarak vücudunun her yerine oksijen ve besin taşır. Küçük bir kesikte kanın pıhtılaşması yarayı kapatır. 🩸")
    },
    {
        keys: ["bobrek", "kidney"],
        answer: t("Böbreklerin kanını süzen iki küçük filtredir. Yeterince su içmek onların işini kolaylaştırır. 💧")
    },
    {
        keys: ["mikrop", "virus", "bakteri", "germ", "bacteria"],
        answer: t("Mikroplar gözle görülemeyecek kadar küçük canlılardır. Çoğu zararsızdır, bazıları hasta eder. Ellerini sabunla 20 saniye yıkamak onlardan korunmanın en iyi yoludur. 🧼")
    },
    {
        keys: ["asi", "vaccine"],
        answer: t("Aşı, vücuduna bir mikrobu önceden tanıtır; böylece gerçek mikrop gelince vücudun hazır olur. Aşıları doktorlar ve hemşireler yapar. 💉")
    },
    {
        keys: ["burun kana", "nosebleed"],
        answer: t("Burnu kanayan kişi oturur, başını hafifçe öne eğer ve burnunun yumuşak kısmını birkaç dakika sıkar. Başını geriye atmaz. Hemen bir büyüğe haber verilir.")
    },
    {
        keys: ["yanik", "yandim", "burn"],
        answer: t("Küçük bir yanıkta yanan yer birkaç dakika serin (buz gibi değil) suyun altında tutulur ve hemen bir büyüğe haber verilir. Üstüne diş macunu ya da yoğurt sürülmez.")
    },
    {
        keys: ["ilk yardim", "112", "ambulans", "first aid", "ambulance"],
        answer: t("İlk yardımın ilk kuralı: önce kendi güvenliğin, sonra hemen bir büyüğe haber ver. Türkiye'de acil durumda 112 aranır. Arayınca adını, nerede olduğunu ve ne olduğunu söylersin. 📞")
    },
    {
        keys: ["kesik", "yara", "dustum", "cut", "wound"],
        answer: t("Küçük bir sıyrık temiz suyla yıkanır ve üstü temiz bir yara bandıyla kapatılır. Bunu bir büyüğünle birlikte yap. 🩹")
    },
    {
        keys: ["uyku", "uyu", "sleep"],
        answer: t("Senin yaşındaki çocukların gecede 9–11 saat uykuya ihtiyacı vardır. Uyurken vücudun büyür, beynin de öğrendiklerini yerleştirir. 😴")
    },
    {
        keys: ["su ic", "susadim", "water"],
        answer: t("Vücudunun yarısından fazlası sudur. Susamayı beklemeden gün boyu su iç; özellikle oyun ve spordan sonra. 💧")
    },
    {
        keys: ["kahvalti", "sebze", "meyve", "beslen", "breakfast", "vegetable", "fruit"],
        answer: t("Tabağın ne kadar renkli olursa o kadar iyi: sebze, meyve, tahıl ve protein birlikte. Kahvaltı sabah derslerinde enerjini yüksek tutar. 🥗")
    },
    {
        keys: ["spor", "egzersiz", "exercise", "sport"],
        answer: t("Her gün en az bir saat hareket etmek kalbini, kaslarını ve kemiklerini güçlendirir. Koşmak, ip atlamak, bisiklet… Hepsi sayılır! 🏃")
    },
    {
        keys: ["dis firca", "brush"],
        answer: t("Dişlerini günde en az iki kez, ikişer dakika fırçala: sabah kahvaltıdan sonra ve gece yatmadan önce. 🪥")
    },
    {
        keys: ["goz", "ekran", "screen"],
        answer: t("Ekrana uzun süre bakınca gözlerin yorulur. Ara ara uzağa bak ve gözlerini kırp. Göz Polikliniği 3. seviyede açılır. 👀")
    }
);

/* ===== GİZLİLİK ===== */

// Gizlilik politikası oyunun içinde bir pencerede açılır; böylece oyundan çıkılmaz
// (misafir ilerlemesi kaybolmaz, Android'de geri tuşu pencereyi kapatır).
function openPrivacy() {
    if (!appOpen) return;

    $("privacyFrame").src = "gizlilik.html" + (currentLang === "en" ? "#en" : "");
    openModal("privacyModal");
}

/* ===== BAŞLANGIÇ ===== */

function setupV9() {
    setupCureDrag();
    $("friendForm").addEventListener("submit", addFriendScore);
}

function renderV9() {
    renderDayCase();
    if (activeModal === "friendsModal") renderFriends();

    const text = (value, label) => value ? t("🏅 Rekor: ") + label : t("Henüz rekor yok");

    $("rec-kit").textContent = text(state.records.kit, t("{0} / 6 puan", state.records.kit));
    $("rec-organ").textContent = text(state.records.organ, t("{0} / 5 doğru", state.records.organ));
}
