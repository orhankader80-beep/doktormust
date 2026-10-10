"use strict";

/* ===== ÇİZİLMİŞ KARAKTERLER ===== */

// Hastalar, evcil hayvanlar ve doktor emoji yerine SVG olarak çizilir. Kayıtlarda yine yalnızca
// ad ve emoji tutulur; görünüş (ten, saç, tişört) bu ikisinden hesaplandığı için aynı hasta her
// gelişinde aynı görünür ve eski kayıtlar değişmeden çalışır.

const faceSkins = ["#ffe0c8", "#f8cfa9", "#eab78d", "#cf9566", "#a5704a"];
const faceHairs = ["#2f2320", "#4a2f22", "#6b4226", "#8a5a34", "#1f1f29", "#a8502d"];
const faceShirts = ["#4f8cff", "#ff7a90", "#34c38f", "#f5a524", "#9b7bff", "#22b8cf", "#ff8f4d", "#e66bb0"];
const faceBlond = "#f2c85b";
const faceLine = "#3b2a26";

// Emojiye göre saç biçimi; listede olmayan emojilerde addan seçilir.
const faceStyles = {
    "👦": "short", "👧": "pigtails", "🧒": "bowl", "🧑": "curly", "👱‍♀️": "long", "👱‍♂️": "spiky"
};
const faceStyleList = ["short", "pigtails", "bowl", "curly", "long", "spiky"];

// Adı belli olan hastalarda saç biçimi ada göre seçilir; böylece kız adları kız, erkek adları
// erkek görünür (emoji yalnızca sarı saçı ve ortak adları belirler).
const girlStyles = ["pigtails", "long", "bob"];
const boyStyles = ["short", "bowl", "spiky", "curly"];

// Şikâyet bölgesinin tam boy çizimdeki yeri (SVG birimi: 100 × 196).
const areaSpots = {
    kol: [81, 122], bilek: [84, 134], bacak: [58, 168], karin: [50, 124],
    bas: [50, 24], kulak: [79, 54], dis: [57, 72], bogaz: [50, 84]
};

const petKinds = { "🐱": "cat", "🐶": "dog", "🐰": "rabbit" };

function faceHash(text) {
    let hash = 7;
    for (const char of String(text)) hash = (hash * 31 + char.codePointAt(0)) % 1000003;
    return hash;
}

function isPet(person) {
    return Boolean(person) && own(petKinds, person.emoji);
}

function faceLook(person) {
    const emoji = person && typeof person.emoji === "string" ? person.emoji : "";
    const hash = faceHash((person && person.name) || "") + faceHash(emoji) * 3;
    const blond = emoji.startsWith("👱");
    const name = (person && person.name) || "";
    const known = name !== "" && !sharedNames.includes(name) && namePool.includes(name);
    const girl = known ? girlNames.includes(name) : ["👧", "👱‍♀️"].includes(emoji);
    const styles = girl ? girlStyles : boyStyles;

    return {
        skin: faceSkins[hash % faceSkins.length],
        hair: blond ? faceBlond : faceHairs[(hash >> 3) % faceHairs.length],
        shirt: faceShirts[(hash >> 5) % faceShirts.length],
        style: known ? styles[(hash >> 2) % styles.length]
            : own(faceStyles, emoji) ? faceStyles[emoji] : faceStyleList[hash % faceStyleList.length],
        girl,
        delay: -(hash % 40) / 10
    };
}

// Saçın başın arkasında kalan kısmı.
function faceHairBack(style, color) {
    if (style === "long") {
        return `<path fill="${color}" d="M18 50Q15 13 50 13Q85 13 82 50L85 92Q76 99 70 91L70 50L30 50L30 91Q24 99 15 92Z"/>`;
    }

    if (style === "bob") {
        return `<path fill="${color}" d="M19 50Q16 13 50 13Q84 13 81 50L83 72Q76 79 69 72L69 50L31 50L31 72Q24 79 17 72Z"/>`;
    }

    if (style === "pigtails") {
        return `<circle fill="${color}" cx="15" cy="60" r="10"/><circle fill="${color}" cx="85" cy="60" r="10"/>` +
            `<circle fill="#ff7a90" cx="22" cy="50" r="3.4"/><circle fill="#ff7a90" cx="78" cy="50" r="3.4"/>`;
    }

    if (style === "curly") {
        return `<circle fill="${color}" cx="22" cy="40" r="9"/><circle fill="${color}" cx="78" cy="40" r="9"/>`;
    }

    return "";
}

// Saçın alnın üstündeki kısmı.
function faceHairFront(style, color) {
    const paths = {
        short: "M21 50Q18 16 50 16Q82 16 79 50Q74 33 58 30Q40 28 30 35Q24 40 21 50Z",
        pigtails: "M21 48Q19 16 50 16Q81 16 79 48Q72 30 50 31Q28 30 21 48Z",
        bob: "M21 50Q19 16 50 16Q81 16 79 50Q74 32 50 31Q40 38 21 50Z",
        bowl: "M22 42Q17 15 50 15Q83 15 78 42Q50 33 22 42Z",
        long: "M21 50Q19 16 50 16Q81 16 79 50Q76 34 62 29Q44 40 21 50Z",
        spiky: "M21 48L24 26L31 33L35 17L43 28L50 13L57 28L65 17L69 33L76 26L79 48Q72 37 50 36Q28 37 21 48Z"
    };

    if (style === "curly") {
        return [[30, 28, 10], [42, 21, 10], [56, 20, 10], [69, 27, 10], [50, 27, 9]]
            .map(([x, y, r]) => `<circle fill="${color}" cx="${x}" cy="${y}" r="${r}"/>`).join("");
    }

    return `<path fill="${color}" d="${paths[style] || paths.short}"/>`;
}

// Yüz ifadesi: gözler, kaşlar ve ağız.
function faceFeatures(mood, open, throat) {
    const stroke = `fill="none" stroke="${faceLine}" stroke-linecap="round" stroke-linejoin="round"`;
    let eyes, brows = "", mouth;

    if (mood === "happy") {
        eyes = `<path ${stroke} stroke-width="3" d="M33 53Q39 46 45 53M55 53Q61 46 67 53"/>`;
        mouth = `<path fill="#a8323e" d="M38 66Q50 82 62 66Z"/><path fill="#ff8c9a" d="M44 72Q50 78 56 72Q50 70 44 72Z"/>`;
    } else if (mood === "hurt") {
        eyes = `<path ${stroke} stroke-width="3" d="M34 49L43 53L34 57M66 49L57 53L66 57"/>`;
        brows = `<path ${stroke} stroke-width="2.4" d="M32 45L44 42M68 45L56 42"/>`;
        mouth = `<ellipse fill="#a8323e" cx="50" cy="71" rx="6" ry="5"/>`;
    } else {
        const lid = mood === "sick" || mood === "worried";

        eyes = `<circle fill="${faceLine}" cx="39" cy="53" r="3.8"/><circle fill="${faceLine}" cx="61" cy="53" r="3.8"/>` +
            `<circle fill="#fff" cx="40.3" cy="51.6" r="1.2"/><circle fill="#fff" cx="62.3" cy="51.6" r="1.2"/>`;

        if (mood === "sick") brows = `<path ${stroke} stroke-width="2.4" d="M32 46L44 42.5M68 46L56 42.5"/>`;
        if (mood === "worried") brows = `<path ${stroke} stroke-width="2.4" d="M33 42L44 45.5M67 42L56 45.5"/>`;
        if (mood === "wide") {
            eyes = `<circle fill="#fff" stroke="${faceLine}" stroke-width="1.6" cx="39" cy="52" r="6"/>` +
                `<circle fill="#fff" stroke="${faceLine}" stroke-width="1.6" cx="61" cy="52" r="6"/>` +
                `<circle fill="${faceLine}" cx="39" cy="52" r="3"/><circle fill="${faceLine}" cx="61" cy="52" r="3"/>`;
        }

        mouth = mood === "ok"
            ? `<path ${stroke} stroke-width="2.8" d="M41 68Q50 77 59 68"/>`
            : mood === "worried"
                ? `<path ${stroke} stroke-width="2.8" d="M42 73Q50 66 58 73"/>`
                : lid
                    ? `<path ${stroke} stroke-width="2.8" d="M41 71Q45.5 67 50 71T59 71"/>`
                    : `<path ${stroke} stroke-width="2.8" d="M43 70H57"/>`;
    }

    // "Aaa" de: fener ya da ağız aynası kullanılırken boğaz görünür.
    if (open) {
        const spots = throat === "germ"
            ? `<circle fill="#7bd66b" cx="46" cy="72" r="1.9"/><circle fill="#7bd66b" cx="54" cy="70" r="1.6"/><circle fill="#7bd66b" cx="51" cy="75.5" r="1.5"/>`
            : "";

        mouth = `<ellipse fill="${throat === "germ" || throat === "red" ? "#d6283d" : "#a8323e"}" cx="50" cy="72" rx="9" ry="8"/>` +
            `<path fill="#ff8c9a" d="M43 76Q50 70 57 76Q50 82 43 76Z"/>` + spots;
    }

    return `<g class="f-brows">${brows}</g><g class="f-eyes">${eyes}</g><g class="f-mouth">${mouth}</g>`;
}

// Ağrıyan yerdeki kırmızı çizgiler.
function painMark(x, y) {
    return `<g class="f-pain" fill="none" stroke="#ff4d5e" stroke-width="2.6" stroke-linecap="round">` +
        `<path d="M${x + 5} ${y - 3}L${x + 12} ${y - 8}M${x + 6} ${y + 4}L${x + 14} ${y + 5}M${x + 1} ${y - 7}L${x + 3} ${y - 15}"/></g>`;
}

// Alçı, tedavi sahnesinde dokundukça kol ya da bacak boyunca uzar (level: 0–4).
function castMark(area, level) {
    const [ax, ay, bx, by] = area === "bacak" ? [58.5, 150, 58.5, 184] : [77, 106, 84.5, 137];
    let bands = "";

    for (let i = 0; i < level; i++) {
        const x1 = ax + (bx - ax) * i / 4, y1 = ay + (by - ay) * i / 4;
        const x2 = ax + (bx - ax) * (i + 1) / 4, y2 = ay + (by - ay) * (i + 1) / 4;
        bands += `<path stroke="#cfd8e6" stroke-width="14" d="M${x1} ${y1}L${x2} ${y2}"/>` +
            `<path stroke="#fff" stroke-width="12" d="M${x1} ${y1}L${x2} ${y2}"/>`;
    }

    return `<g fill="none">${bands}</g>`;
}

function heartMark(x, y, bpm, alert) {
    return `<g transform="translate(${x} ${y})"><g class="f-heart" style="animation-duration:${(60 / bpm).toFixed(2)}s">` +
        `<path fill="${alert ? "#ffb020" : "#ff4d6d"}" stroke="#fff" stroke-width="1.5" ` +
        `d="M0 6C-6 1 -8.5 -2 -8.5 -4.5A4.3 4.3 0 0 1 0 -6A4.3 4.3 0 0 1 8.5 -4.5C8.5 -2 6 1 0 6Z"/></g></g>`;
}

// options: mood (sick, worried, hurt, happy, ok, wide, plain), open (ağız açık), marks
// (muayeneyle ortaya çıkan işaretler), bpm (kalp atışı), cheer (sevinç zıplaması),
// full (tam boy; muayene sahnesinde kullanılır).
function faceSVG(person, options = {}) {
    if (isPet(person)) return petSVG(person, options);

    const look = faceLook(person);
    const marks = options.marks || {};
    const mood = options.mood || "plain";
    const full = options.full === true;
    const skin = marks.pale ? "#f3e6da" : look.skin;
    const fever = marks.fever || "";

    const cheeks = marks.pale ? ""
        : `<g class="f-cheeks${fever ? " fever-" + fever : ""}" fill="#ff9aa8" opacity=".5">` +
          `<circle cx="31" cy="63" r="6.5"/><circle cx="69" cy="63" r="6.5"/></g>`;

    const body = full
        ? `<g class="f-legs"><rect fill="${skin}" x="36" y="146" width="11" height="40" rx="5"/>` +
          `<rect fill="${skin}" x="53" y="146" width="11" height="40" rx="5"/>` +
          `<ellipse fill="#48536b" cx="40" cy="188" rx="9.5" ry="5"/><ellipse fill="#48536b" cx="60" cy="188" rx="9.5" ry="5"/>` +
          `<path fill="#3d4f7c" d="M29 130H71L72 157H53L50 146L47 157H28Z"/></g>` +
          `<g class="f-body"><path fill="none" stroke="${skin}" stroke-width="9" stroke-linecap="round" d="M25 102L16 136M75 102L84 136"/>` +
          `<path fill="${look.shirt}" d="M22 104Q22 90 50 89Q78 90 78 104L72 138H28Z"/>` +
          `<path fill="none" stroke="${look.shirt}" stroke-width="12" stroke-linecap="round" d="M26 101L21 113M74 101L79 113"/>` +
          `<path fill="#fff" opacity=".28" d="M40 90Q50 100 60 90Q50 93 40 90Z"/></g>`
        : `<g class="f-body"><path fill="${look.shirt}" d="M16 121Q16 92 50 89Q84 92 84 121Z"/>` +
          `<path fill="#fff" opacity=".28" d="M40 90Q50 100 60 90Q50 93 40 90Z"/></g>`;

    // Ağrı işareti tam boyda şikâyet bölgesinde, büst çizimde omuzda görünür.
    const [px, py] = full && own(areaSpots, marks.area) ? areaSpots[marks.area] : full ? [50, 124] : [72, 96];

    const extras = [
        marks.cast ? castMark(marks.area, marks.cast) : "",
        fever === "high"
            ? `<path class="f-sweat" fill="#6cc3ff" d="M80 30Q86 39 80 42Q74 39 80 30Z"/>` : "",
        marks.nose
            ? `<ellipse fill="#ff8f8f" opacity=".85" cx="50" cy="61" rx="4.2" ry="3.4"/>` +
              `<path class="f-drip" fill="#8fd3ff" d="M53 64Q56 69 53 70.5Q50 69 53 64Z"/>` : "",
        marks.wheeze
            ? `<path class="f-puff" fill="none" stroke="#9db4d6" stroke-width="2.2" stroke-linecap="round" d="M66 70Q70 67 74 70T82 70M67 76Q70 74 73 76T79 76"/>` : "",
        marks.pain ? painMark(px, py) : "",
        marks.tear
            ? `<path class="f-drip" fill="#6cc3ff" d="M33 58Q37 65 33 67Q29 65 33 58Z"/>` : "",
        options.bpm ? heartMark(full ? 60 : 68, full ? 110 : 107, options.bpm, marks.heartAlert) : ""
    ].join("");

    return `<svg class="face mood-${mood}${options.cheer ? " cheer" : ""}${full ? " full" : ""}" ` +
        `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${full ? 196 : 120}" ` +
        `style="--d:${look.delay}s" aria-hidden="true" focusable="false">` +
        faceHairBack(look.style, look.hair) + body +
        `<rect fill="${skin}" x="43" y="76" width="14" height="16" rx="6"/>` +
        `<rect fill="#000" opacity=".1" x="43" y="76" width="14" height="8" rx="4"/>` +
        `<g class="f-head"><circle fill="${skin}" cx="22" cy="54" r="6"/><circle fill="${skin}" cx="78" cy="54" r="6"/>` +
        `<ellipse fill="${skin}" cx="50" cy="50" rx="28" ry="30"/>` +
        faceHairFront(look.style, look.hair) + cheeks +
        faceFeatures(mood, options.open === true, marks.throat || "") +
        (look.girl && mood !== "happy" && mood !== "hurt"
            ? `<path class="f-lash" fill="none" stroke="${faceLine}" stroke-width="1.6" stroke-linecap="round" d="M34.6 50.6L31.6 48.4M35.6 48.6L33.4 45.8M65.4 50.6L68.4 48.4M64.4 48.6L66.6 45.8"/>` : "") +
        `</g>` + extras + `</svg>`;
}

/* ---- Evcil hayvanlar (Pati Kliniği) ---- */

const petFurs = {
    cat: [["#f4a259", "#fde3c4"], ["#9aa0a6", "#e5e7ea"], ["#4a4a52", "#c9c9cf"], ["#e9c9a0", "#fff4e2"]],
    dog: [["#c68642", "#f3dcb8"], ["#8d5524", "#e6c79c"], ["#f1d6a8", "#fff6e3"], ["#6b5444", "#d9c2ad"]],
    rabbit: [["#f4f1ee", "#ffffff"], ["#d9cfc6", "#f7f2ee"], ["#b9a594", "#efe4da"]]
};

function petSVG(person, options = {}) {
    const kind = petKinds[person.emoji];
    const hash = faceHash(person.name || "") + faceHash(person.emoji);
    const [fur, light] = petFurs[kind][hash % petFurs[kind].length];
    const mood = options.mood || "plain";
    const full = options.full === true;
    const stroke = `fill="none" stroke="${faceLine}" stroke-linecap="round" stroke-linejoin="round"`;
    const marks = options.marks || {};

    const ears = kind === "cat"
        ? `<path fill="${fur}" d="M24 38L27 10L46 27ZM76 38L73 10L54 27Z"/><path fill="#ffb3c1" d="M29 31L30 18L40 27ZM71 31L70 18L60 27Z"/>`
        : kind === "dog"
            ? `<ellipse fill="${faceLine}" opacity=".55" cx="21" cy="50" rx="9" ry="19" transform="rotate(12 21 50)"/>` +
              `<ellipse fill="${faceLine}" opacity=".55" cx="79" cy="50" rx="9" ry="19" transform="rotate(-12 79 50)"/>`
            : `<ellipse fill="${fur}" stroke="#d6cbc1" cx="38" cy="16" rx="7.5" ry="19"/><ellipse fill="${fur}" stroke="#d6cbc1" cx="62" cy="16" rx="7.5" ry="19"/>` +
              `<ellipse fill="#ffb3c1" cx="38" cy="17" rx="3.4" ry="13"/><ellipse fill="#ffb3c1" cx="62" cy="17" rx="3.4" ry="13"/>`;

    const eyes = mood === "happy"
        ? `<path ${stroke} stroke-width="3" d="M33 51Q39 44 45 51M55 51Q61 44 67 51"/>`
        : mood === "hurt"
            ? `<path ${stroke} stroke-width="3" d="M34 46L43 50L34 54M66 46L57 50L66 54"/>`
            : `<circle fill="${faceLine}" cx="39" cy="50" r="4"/><circle fill="${faceLine}" cx="61" cy="50" r="4"/>` +
              `<circle fill="#fff" cx="40.4" cy="48.5" r="1.3"/><circle fill="#fff" cx="62.4" cy="48.5" r="1.3"/>` +
              (mood === "sick" || mood === "worried"
                  ? `<path ${stroke} stroke-width="2.2" d="M32 43L44 40M68 43L56 40"/>` : "");

    const mouth = mood === "happy"
        ? `<path fill="#a8323e" d="M43 67Q50 78 57 67Z"/>`
        : mood === "hurt" || options.open
            ? `<ellipse fill="#a8323e" cx="50" cy="70" rx="5" ry="4.5"/>`
            : mood === "ok"
                ? `<path ${stroke} stroke-width="2.4" d="M44 67Q47 71 50 67Q53 71 56 67"/>`
                : `<path ${stroke} stroke-width="2.4" d="M45 70Q50 66 55 70"/>`;

    const whiskers = kind === "dog" ? ""
        : `<path ${stroke} stroke-width="1.2" opacity=".6" d="M36 64L22 61M36 67L22 69M64 64L78 61M64 67L78 69"/>`;

    const body = full
        ? `<path fill="${fur}" d="M76 150Q94 150 90 128Q88 122 84 126Q86 142 72 142Z"/>` +
          `<g class="f-body"><ellipse fill="${fur}" cx="50" cy="130" rx="27" ry="50"/>` +
          `<ellipse fill="${light}" cx="50" cy="142" rx="15" ry="32"/></g>` +
          `<ellipse fill="${light}" stroke="${fur}" stroke-width="2" cx="38" cy="182" rx="10" ry="7"/>` +
          `<ellipse fill="${light}" stroke="${fur}" stroke-width="2" cx="62" cy="182" rx="10" ry="7"/>`
        : `<g class="f-body"><path fill="${fur}" d="M20 121Q20 96 50 92Q80 96 80 121Z"/>` +
          `<path fill="${light}" d="M38 121Q38 102 50 100Q62 102 62 121Z"/></g>`;

    const [px, py] = full ? [38, 178] : [70, 98];

    return `<svg class="face pet mood-${mood}${options.cheer ? " cheer" : ""}${full ? " full" : ""}" ` +
        `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${full ? 196 : 120}" ` +
        `style="--d:${-(hash % 40) / 10}s" aria-hidden="true" focusable="false">` +
        body + `<g class="f-head">` + ears +
        `<ellipse fill="${fur}" cx="50" cy="52" rx="29" ry="27"/>` +
        `<ellipse fill="${light}" cx="50" cy="65" rx="13" ry="10"/>` +
        `<path fill="${kind === "dog" ? faceLine : "#ff8fa3"}" d="M46 59H54L50 64Z"/>` +
        whiskers + `<g class="f-eyes">${eyes}</g><g class="f-mouth">${mouth}</g></g>` +
        (marks.pain ? painMark(px, py) : "") + `</svg>`;
}

/* ---- Hastanın o anki görünüşü ---- */

// Muayene edilen her alet, karakterin üstünde ilgili işareti ortaya çıkarır.
function patientMarks(patient) {
    const marks = {};
    if (!patient || patient.checkup) return marks;

    marks.area = patient.area || "";
    if (patient.ward) return marks;

    const signs = cardSigns[patient.correctTreatment] || {};
    const used = id => patient.exams.includes(id);

    if (used("temp")) {
        marks.fever = patient.temp >= 385 ? "high" : patient.temp >= 375 ? "mild" : "";
    }

    if (used("steth")) {
        marks.heart = true;
        marks.heartAlert = signs.steth !== "normal";
        marks.wheeze = signs.steth === "wheeze";
    }

    if (used("light")) {
        marks.throat = signs.light === "germ" || signs.light === "red" ? signs.light : "";
        marks.nose = signs.light === "red";
        marks.pale = signs.light === "pale";
    }

    if (used("touch")) {
        marks.pain = signs.touch !== "normal";
        marks.tear = signs.touch === "swollen";
    }

    return marks;
}

function patientFace(patient, options = {}) {
    const marks = { ...patientMarks(patient), ...(options.marks || {}) };

    return faceSVG(patient, {
        mood: patient.checkup ? "happy" : patient.patience <= 1 ? "worried" : "sick",
        bpm: marks.heart ? patient.bpm : 0,
        ...options,
        marks
    });
}

/* ---- Muayene sahnesi ---- */

// Aletin karakterin neresine gittiği (tam boy çizimde x, y) ve o sırada yüzün hali.
const toolSpots = {
    "temp": [50, 72, "plain"], "steth": [52, 110, "plain"], "light": [50, 72, "open"],
    "dental:mirror": [50, 72, "open"], "dental:cold": [50, 72, "open"], "dental:xray": [64, 66, "plain"],
    "eye:chart": [50, 52, "wide"], "eye:light": [40, 52, "wide"], "eye:blink": [50, 52, "wide"],
    "skin:lens": [70, 60, "plain"], "skin:allergy": [81, 122, "plain"], "skin:moist": [30, 60, "plain"],
    "er:bp": [19, 122, "plain"], "er:reflex": [58, 162, "plain"], "er:oto": [79, 54, "plain"],
    "vet:paw": [38, 180, "plain"], "vet:fur": [72, 134, "plain"], "vet:belly": [50, 150, "plain"]
};

let stageTimer = null;
let talkTimer = null;

// Elle muayene, şikâyet bölgesine yapılır.
function areaSpot(patient) {
    return own(areaSpots, patient.area) ? areaSpots[patient.area] : [50, 124];
}

function stageSpot(patient, tool) {
    if (!patient.ward && tool === "touch") return [...areaSpot(patient), "plain"];
    return toolSpots[(patient.ward ? patient.ward + ":" : "") + tool] || toolSpots[tool] || [50, 110, "plain"];
}

function stopStage() {
    clearTimeout(stageTimer);
    clearTimeout(talkTimer);
    stageTimer = null;
    talkTimer = null;
}

// Sahneyi hastanın şimdiki haliyle çizer.
function renderStage(patient, options = {}) {
    const stage = $("tmEmoji");
    const talking = stage.classList.contains("talking");

    stage.className = "modal-emoji stage" + (options.shake ? " shake" : "") + (talking ? " talking" : "");
    stage.innerHTML = patientFace(patient, { full: true, ...options }) +
        `<span class="stage-tool" hidden></span><span class="stage-pop" hidden></span>`;
}

// Bir simgeyi sahnede karakterin belli bir yerine uçurur (x, y: tam boy çizim birimi).
function stageFly(emoji, x, y) {
    const sprite = $("tmEmoji").querySelector(".stage-tool");

    sprite.hidden = true;
    sprite.textContent = emoji;
    sprite.style.setProperty("--x", x + "%");
    sprite.style.setProperty("--y", y / 1.96 + "%");
    void sprite.offsetWidth;                // canlandırma her seferinde baştan başlasın
    sprite.hidden = false;
}

function stagePop(text) {
    const pop = $("tmEmoji").querySelector(".stage-pop");
    pop.textContent = text;
    pop.hidden = false;
}

// Hasta konuşurken ağzı oynar.
function stageTalk(text) {
    clearTimeout(talkTimer);
    $("tmEmoji").classList.add("talking");

    talkTimer = setTimeout(() => {
        talkTimer = null;
        $("tmEmoji").classList.remove("talking");
    }, clamp(String(text).length * 55, 1200, 5000));
}

// Alet karaktere doğru uçar; ağız ya da gözler alete göre açılır.
function stageExam(patient, tool) {
    const [x, y, pose] = stageSpot(patient, tool.id);

    stopStage();
    $("tmEmoji").classList.remove("talking");

    // Sahne görünmüyorsa (kısa ekran) canlandırma kaçmasın diye görünür yere kaydırılır.
    $("tmEmoji").scrollIntoView({ block: "nearest" });
    renderStage(patient, pose === "open" ? { open: true, mood: "plain" } : pose === "wide" ? { mood: "wide" } : {});
    stageFly(tool.emoji, x, y);

    sfx("whoosh");
    if (tool.id === "steth" || tool.id === "belly" || tool.id === "bp") sfx("heart", .35);
    if (pose === "open") sfx("aah", .2);
}

// Bulgu çıkınca hasta kısa bir tepki verir, sonra işaretleriyle birlikte normale döner.
function stageReact(patient, tool, alert) {
    const [, , pose] = stageSpot(patient, tool.id);
    const throat = patientMarks(patient).throat;

    stopStage();
    renderStage(patient, alert
        ? { mood: "hurt", shake: true, open: pose === "open" && Boolean(throat), marks: patient.ward ? { pain: true } : {} }
        : { mood: "ok" });
    stagePop(alert ? "❗" : "✅");
    sfx(alert ? "ouch" : "pop");

    stageTimer = setTimeout(() => {
        stageTimer = null;
        if (currentPatient() === patient && !cure) renderStage(patient);
    }, 1100);
}

// Yanlış kart: hasta üzülür.
function stageWrong(patient) {
    stopStage();
    renderStage(patient, { mood: "hurt", shake: true });
    sfx("ouch");

    stageTimer = setTimeout(() => {
        stageTimer = null;
        if (currentPatient() === patient && !cure) renderStage(patient);
    }, 900);
}

/* ---- Doktor ---- */

const doctorHairs = [...faceHairs, faceBlond];
const doctorStyles = ["short", "long", "curly", "bowl", "spiky", "pigtails", "bob"];

// Eski sürümdeki üç hazır yüzün karşılığı (ten, saç rengi, saç biçimi).
const doctorPresets = [[1, 1, 0], [0, 2, 1], [3, 4, 2]];

// Aksesuarlar da çizilir; sıra, accessories listesindeki sırayla aynıdır.
function doctorAccessory(index, behind) {
    const dark = "#1f2937";

    if (behind) {
        return index === 6 ? `<path fill="#e11d48" d="M10 121L20 93Q50 84 80 93L90 121Z"/>` : "";
    }

    return [
        "",
        `<rect fill="${dark}" x="29" y="46" width="18" height="13" rx="5"/><rect fill="${dark}" x="53" y="46" width="18" height="13" rx="5"/>` +
        `<path fill="none" stroke="${dark}" stroke-width="2.4" d="M47 51H53M29 50L22 48M71 50L78 48"/>`,
        `<path fill="#bfe3ff" stroke="#8cc4ee" stroke-width="1.2" d="M30 61Q50 55 70 61L68 76Q50 86 32 76Z"/>` +
        `<path fill="none" stroke="#8cc4ee" stroke-width="1.5" d="M30 62L22 55M70 62L78 55M38 66H62M38 71H62"/>`,
        `<path fill="${dark}" d="M50 4L86 17L50 30L14 17Z"/><path fill="${dark}" d="M31 23V31Q50 39 69 31V23L50 30Z"/>` +
        `<path fill="none" stroke="#f5b301" stroke-width="2" d="M82 18V34"/><circle fill="#f5b301" cx="82" cy="36" r="2.8"/>`,
        `<rect fill="${dark}" x="33" y="-2" width="34" height="24" rx="3"/><rect fill="#b91c1c" x="33" y="15" width="34" height="5"/>` +
        `<rect fill="${dark}" x="21" y="20" width="58" height="6" rx="3"/>`,
        `<path fill="#ff5c8a" d="M64 20L79 11V31ZM64 20L49 11V31Z"/><circle fill="#e11d64" cx="64" cy="21" r="4.2"/>`,
        `<path fill="#e11d48" d="M27 47Q50 41 73 47L71 58Q61 62 50 56Q39 62 29 58Z"/>` +
        `<circle fill="#fff" cx="39" cy="53" r="4.6"/><circle fill="#fff" cx="61" cy="53" r="4.6"/>` +
        `<circle fill="${faceLine}" cx="39" cy="53" r="2.6"/><circle fill="${faceLine}" cx="61" cy="53" r="2.6"/>`,
        `<path fill="#f5b301" stroke="#d99a00" stroke-width="1.2" d="M30 23L32 6L42 16L50 2L58 16L68 6L70 23Z"/>` +
        `<circle fill="#ef4444" cx="50" cy="17" r="2.6"/><circle fill="#3b82f6" cx="38" cy="19" r="1.9"/><circle fill="#3b82f6" cx="62" cy="19" r="1.9"/>`
    ][index] || "";
}

// look: { skin, hairColor, hairStyle, accessory } dizinleri; coat: önlük rengi.
function doctorSVG(look = {}, coat = "#ffffff") {
    const skin = faceSkins[look.skin] || faceSkins[1];
    const hair = doctorHairs[look.hairColor] || doctorHairs[1];
    const style = doctorStyles[look.hairStyle] || "short";
    const accessory = look.accessory || 0;
    const stroke = `fill="none" stroke="${faceLine}" stroke-linecap="round" stroke-linejoin="round"`;

    return `<svg class="face doctor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" aria-hidden="true" focusable="false">` +
        doctorAccessory(accessory, true) + faceHairBack(style, hair) +
        `<g class="f-body"><path fill="${coat}" stroke="#cfd8e6" stroke-width="1.5" d="M12 121Q12 92 50 88Q88 92 88 121Z"/>` +
        `<path fill="#7fb2ff" d="M40 89L50 106L60 89Q50 93 40 89Z"/>` +
        `<path fill="none" stroke="#cfd8e6" stroke-width="1.5" d="M40 89L46 121M60 89L54 121"/>` +
        `<path fill="none" stroke="#48536b" stroke-width="2.6" stroke-linecap="round" d="M36 90Q33 108 44 110Q55 108 66 96"/>` +
        `<circle fill="#48536b" cx="67" cy="96" r="4.6"/><circle fill="#cfd8e6" cx="67" cy="96" r="2.2"/></g>` +
        `<rect fill="${skin}" x="43" y="76" width="14" height="16" rx="6"/>` +
        `<rect fill="#000" opacity=".1" x="43" y="76" width="14" height="8" rx="4"/>` +
        `<g class="f-head"><circle fill="${skin}" cx="22" cy="54" r="6"/><circle fill="${skin}" cx="78" cy="54" r="6"/>` +
        `<ellipse fill="${skin}" cx="50" cy="50" rx="28" ry="30"/>` +
        faceHairFront(style, hair) +
        `<g class="f-cheeks" fill="#ff9aa8" opacity=".5"><circle cx="31" cy="63" r="6.5"/><circle cx="69" cy="63" r="6.5"/></g>` +
        `<g class="f-eyes"><circle fill="${faceLine}" cx="39" cy="53" r="3.8"/><circle fill="${faceLine}" cx="61" cy="53" r="3.8"/>` +
        `<circle fill="#fff" cx="40.3" cy="51.6" r="1.2"/><circle fill="#fff" cx="62.3" cy="51.6" r="1.2"/></g>` +
        `<path ${stroke} stroke-width="2.8" d="M40 67Q50 78 60 67"/>` +
        doctorAccessory(accessory, false) + `</g></svg>`;
}

// Oyuncunun doktoru: seçtiği ten, saç, aksesuar ve önlük rengiyle.
function doctorFigure() {
    return doctorSVG({ ...state.doctor }, state.decor.coat);
}

// Bir kutuya emoji ya da karakter koyar. value: emoji metni ya da { person, ...faceSVG seçenekleri }.
function setFigure(element, value) {
    if (isRecord(value)) {
        const { person, ...options } = value;
        element.classList.add("has-face");
        element.innerHTML = faceSVG(person, options);
        return;
    }

    element.classList.remove("has-face");
    element.textContent = value;
}
