"use strict";

/* ===== v10: arkadaş fikirleri ===== */

/* ---- Kariyer: stajyerden klinikler başkanına ---- */

const careerSteps = [
    { level: 1, emoji: "🩺", name: t("Stajyer Doktor") },
    { level: 3, emoji: "📋", name: t("Asistan Doktor") },
    { level: 5, emoji: "👩‍⚕️", name: t("Doktor") },
    { level: 8, emoji: "🎓", name: t("Uzman Doktor") },
    { level: 12, emoji: "🏥", name: t("Başhekim") },
    { level: 16, emoji: "👑", name: t("Klinikler Başkanı") }
];

function careerIndex(level = state.level) {
    let index = 0;
    careerSteps.forEach((step, i) => { if (level >= step.level) index = i; });
    return index;
}

// Seviye atlayınca yeni bir ünvana geçildiyse kutlanır (commit içinden çağrılır).
function checkPromotion() {
    const index = careerIndex();
    if (index <= state.career) return null;

    state.career = index;
    return careerSteps[index];
}

function renderCareer() {
    const list = $("careerList");
    const now = careerIndex();
    list.innerHTML = "";

    careerSteps.forEach((step, index) => {
        const item = document.createElement("li");
        item.className = index < now ? "done" : index === now ? "turn" : "";
        item.innerHTML = `<span>${index <= now ? step.emoji : "🔒"}</span><b>${escapeHTML(step.name)}</b>` +
            `<span>${escapeHTML(index === now ? t("Şu an") : t("Seviye {0}", step.level))}</span>`;
        list.appendChild(item);
    });

    const next = careerSteps[now + 1];
    $("careerNext").textContent = next
        ? t("Sıradaki ünvan: {0} ({1}. seviyede)", next.name, next.level)
        : t("👑 Kariyerin zirvesindesin! Bütün kliniklerin başkanı sensin.");
}

/* ---- Hastalığa göre ödül ---- */

// Kolay vakalar az, zor vakalar çok coin değerindedir (yıldızlar ayrıca eklenir).
const caseValues = { dinlenme: 15, vitamin: 15, mide_ilaci: 20, agri_kesici: 20, antibiyotik: 25, alci: 30 };

function caseValue(patient) {
    return patient.ward ? 25 : caseValues[patient.correctTreatment] || 20;
}

/* ---- Başka doktorların yardım çağrısı ---- */

const helperDoctors = ["Ayşe", "Murat", "Zehra", "Kemal", "Selin", "Okan"];

// Genel klinikte bir vaka bitince bazen başka bir doktor zor bir hastayı sana gönderir.
function maybeReferral(patient) {
    if (patient.ward || patient.story || patient.klass || patient.daily || patient.special ||
        patient.boss || patient.referral || state.level < 3 || state.shift.closed) return "";
    if (state.activePatients.some(other => other.referral) || Math.random() > .2) return "";

    const group = ageGroups[state.doctor.age];
    const pool = diseasePool[group.pool].filter(disease => state.level >= (disease.level || 1));
    const caller = pick(helperDoctors);
    const sent = makePatient(pick(pool), group);

    sent.referral = caller;
    sent.emergency = false;
    makeTricky(sent);
    state.activePatients.unshift(sent);

    return t("\n\n📞 Dr. {0} aradı: \"{1} adlı hastamı iyileştiremedim, bana yardım eder misin?\" Hasta kliniğinde seni bekliyor.", caller, sent.name);
}

/* ---- Eve gidip uyumak ---- */

function goHome() {
    if (!appOpen || !state.shift.closed || state.shift.home) return;

    state.shift.home = true;
    commit();
    sfx("sparkle");
    toast(t("🏠 Eve geldin. İyi uykular, Doktor! 😴"));
}

/* ---- Depo ve eczane ---- */

// Her tedavi depodan bir malzeme harcar; biten malzeme eczaneden alınır.
const supplies = [
    { id: "syrup", emoji: "🥄", name: t("Şurup"), price: 8 },
    { id: "tea", emoji: "🍵", name: t("Ihlamur"), price: 5 },
    { id: "cold", emoji: "🧊", name: t("Soğuk Kompres"), price: 6 },
    { id: "fruit", emoji: "🍎", name: t("Meyve Tabağı"), price: 6 },
    { id: "cast", emoji: "🩹", name: t("Alçı Sargısı"), price: 12 },
    { id: "kit", emoji: "🧰", name: t("Bölüm Malzemesi"), price: 10 }
];

const STOCK_MAX = 30;
const STOCK_START = 15;
const supplyFor = { antibiyotik: "syrup", mide_ilaci: "syrup", dinlenme: "tea", agri_kesici: "cold", vitamin: "fruit", alci: "cast" };

function supplyOf(patient) {
    return supplies.find(item => item.id === (patient.ward ? "kit" : supplyFor[patient.correctTreatment] || "kit"));
}

// Doğru karttan sonra tedaviye başlamadan önce çağrılır. Malzeme yoksa false döner.
function useSupply(patient) {
    if (patient.klass || patient.daily) return true;

    const item = supplyOf(patient);

    if (state.stock[item.id] <= 0) {
        $("tmResult").textContent = t("📦 Depoda {0} {1} kalmadı! Klinik ekranındaki \"📦 Depo\" düğmesinden eczaneye gidip almalısın. Hasta seni bekleyecek.", item.emoji, item.name);
        playSound("bad");
        return false;
    }

    state.stock[item.id]--;
    if (state.stock[item.id] === 2) toast(t("📦 {0} {1} azaldı: depoda 2 tane kaldı.", item.emoji, item.name));
    return true;
}

let pharmacyTrip = false;

function openDepot() {
    if (!appOpen) return;
    openV10("📦", t("Klinik Deposu"), renderDepot);
}

function renderDepot(body) {
    body.innerHTML = `
        <p>${escapeHTML(t("Her tedavi depodan bir malzeme harcar. Biten malzemeyi eczaneden alırsın."))}</p>
        <ul class="stock-list">${supplies.map(item => {
            const count = state.stock[item.id];
            return `<li class="${count <= 2 ? "low" : ""}"><span>${item.emoji}</span><b>${escapeHTML(item.name)}</b>` +
                `<span>${count} / ${STOCK_MAX}</span></li>`;
        }).join("")}</ul>
        <button class="primary-btn full" id="tripButton">${escapeHTML(t("🚗 Arabaya Bin, Eczaneye Git"))}</button>
        <p class="notice">${escapeHTML(t("Eczaneye giden yol bir labirent: hızlı varırsan eczacı indirim yapar!"))}</p>
    `;

    $("tripButton").onclick = () => {
        startGame("maze");
        pharmacyTrip = true;          // startGame sıfırlar; bu yüzden ondan sonra kurulur
        $("gameTitle").textContent = t("Eczane Yolu");
        $("gameEmoji").textContent = "🚗";
    };
}

// Labirent bitince (kazanılsa da kaybedilse de) eczane açılır; hızlı gelene indirim vardır.
function afterTrip(won) {
    pharmacyTrip = false;
    setTimeout(() => {
        if (!appOpen) return;
        openV10("🏪", t("Eczane"), body => renderPharmacy(body, won));
    }, isStill() ? 300 : 1400);
}

function renderPharmacy(body, discount) {
    const price = item => Math.max(1, Math.round(item.price * (discount ? .8 : 1)));

    body.innerHTML = `
        <p>${escapeHTML(discount ? t("🎉 Eczacı: \"Çok hızlı geldin! Bugün her şey %20 indirimli.\"") : t("💊 Eczacı: \"Hoş geldin Doktor! Ne lazım?\""))}</p>
        <p class="small muted">${escapeHTML(t("Coin: {0}", state.coins))}</p>
        <ul class="stock-list shop">${supplies.map(item => `
            <li><span>${item.emoji}</span><b>${escapeHTML(item.name)}<small>${escapeHTML(t("Depoda: {0} • Tanesi {1} coin", state.stock[item.id], price(item)))}</small></b>
            <span class="buy"><button class="toggle" data-buy="${item.id}" data-count="1">+1</button><button class="toggle" data-buy="${item.id}" data-count="5">+5</button></span></li>`).join("")}</ul>
        <button class="secondary-btn full" id="fillAll">${escapeHTML(t("🧺 Hepsini Doldur"))}</button>
    `;

    const buy = (item, count) => {
        const room = STOCK_MAX - state.stock[item.id];
        const amount = Math.min(count, room, Math.floor(state.coins / price(item)));

        if (room <= 0) return t("{0} rafı dolu.", item.name);
        if (amount <= 0) return t("🪙 Coinin yetmiyor.");

        state.coins -= amount * price(item);
        state.stock[item.id] += amount;
        return "";
    };

    body.querySelectorAll("[data-buy]").forEach(button => {
        button.onclick = () => {
            const problem = buy(supplies.find(item => item.id === button.dataset.buy), Number(button.dataset.count));
            if (problem) toast(problem); else playSound("coin");
            commit();
            renderPharmacy(body, discount);
        };
    });

    $("fillAll").onclick = () => {
        const before = state.coins;
        supplies.forEach(item => buy(item, STOCK_MAX));
        if (state.coins === before) toast(t("Raflar zaten dolu ya da coinin yetmiyor."));
        else playSound("coin");
        commit();
        renderPharmacy(body, discount);
    };
}

/* ---- Reklam ---- */

const adOptions = [
    { id: "poster", emoji: "🪧", name: t("Afiş"), price: 60, extra: 1, bonus: 5 },
    { id: "radio", emoji: "📻", name: t("Radyo Reklamı"), price: 150, extra: 2, bonus: 10 },
    { id: "tv", emoji: "📺", name: t("Televizyon Reklamı"), price: 300, extra: 3, bonus: 15 }
];

// Reklam yalnızca o klinik gününde geçerlidir.
function activeAd() {
    return state.ad.day === state.shift.day && !state.shift.closed
        ? adOptions.find(option => option.id === state.ad.kind) || null : null;
}

function adExtra() {
    const ad = activeAd();
    return ad ? ad.extra : 0;
}

function openAds() {
    if (!appOpen) return;
    openV10("📣", t("Kliniğinin Reklamı"), renderAds);
}

function renderAds(body) {
    const ad = activeAd();

    body.innerHTML = `
        <p>${escapeHTML(t("Reklam verirsen bugün bekleme odasına daha çok hasta gelir ve her vakadan ek coin kazanırsın."))}</p>
        ${ad ? `<p class="class-winner">${escapeHTML(t("{0} Bugün {1} yayında!", ad.emoji, ad.name))}</p>` : ""}
        <ul class="stock-list shop">${adOptions.map(option => `
            <li><span>${option.emoji}</span><b>${escapeHTML(option.name)}<small>${escapeHTML(t("+{0} bekleyen hasta • her vakada +{1} coin", option.extra, option.bonus))}</small></b>
            <span class="buy"><button class="toggle" data-ad="${option.id}" ${ad || state.shift.closed ? "disabled" : ""}>🪙 ${option.price}</button></span></li>`).join("")}</ul>
        <p class="notice">${escapeHTML(state.shift.closed ? t("Klinik kapalıyken reklam verilemez.") : t("Reklam bu klinik günü bitene kadar sürer."))}</p>
    `;

    body.querySelectorAll("[data-ad]").forEach(button => {
        button.onclick = () => {
            const option = adOptions.find(item => item.id === button.dataset.ad);
            if (activeAd() || state.shift.closed) return;

            if (state.coins < option.price) {
                toast(t("🪙 Coinin yetmiyor."));
                return;
            }

            state.coins -= option.price;
            state.ad = { kind: option.id, day: state.shift.day };
            refillQueue();
            commit();
            confetti();
            sfx("sparkle");
            toast(t("📣 {0} yayında! Hastalar kliniğini duydu.", option.name));
            renderAds(body);
        };
    });
}

/* ---- Hayvan sahiplenmek ---- */

const PET_MAX = 3;

// Bir günde bakılmayan hayvanın mutluluğu azalır.
function petJoy(pet) {
    const days = Math.max(0, Math.round((new Date(dayKey() + "T12:00:00") - new Date(pet.care + "T12:00:00")) / 86400000));
    return clamp(pet.joy - days * 15, 0, 100);
}

function happyPets() {
    return state.pets.filter(pet => petJoy(pet) >= 50).length;
}

function offerAdopt(patient) {
    const button = $("gAdopt");
    button.hidden = true;

    if (patient.ward !== "vet" || state.pets.length >= PET_MAX ||
        state.pets.some(pet => pet.name === patient.name && pet.emoji === patient.emoji)) return;

    button.textContent = t("🏠 {0} adlı dostu sahiplen", patient.name);
    button.hidden = false;
    button.onclick = () => {
        if (state.pets.length >= PET_MAX) return;

        state.pets.push({ name: patient.name, emoji: patient.emoji, joy: 80, care: dayKey(), fed: "", played: "" });
        button.hidden = true;
        commit();
        confetti();
        sfx("yay");
        toast(t("🐾 {0} artık senin! Klinik ekranındaki \"🐾 Hayvanlarım\" düğmesinden ona bakabilirsin.", patient.name));
    };
}

function openPets() {
    if (!appOpen) return;
    openV10("🐾", t("Hayvanlarım"), renderPets);
}

function renderPets(body) {
    if (!state.pets.length) {
        body.innerHTML = `<p>${escapeHTML(t("Henüz hayvanın yok. Pati Kliniği'nde (3. seviye) iyileştirdiğin bir dostu sahiplenebilirsin!"))}</p>`;
        return;
    }

    const today = dayKey();

    body.innerHTML = `
        <p>${escapeHTML(t("Hayvanlarını her gün besle ve onlarla oyna. Mutlu her hayvan, her vakada +5 coin şans getirir!"))}</p>
        <div class="pet-list">${state.pets.map((pet, index) => {
            const joy = petJoy(pet);
            return `<div class="pet-card">
                <div class="pet-figure">${faceSVG(pet, { mood: joy >= 50 ? "happy" : "plain", cheer: joy >= 80, full: true })}</div>
                <div><b>${escapeHTML(pet.name)}</b>
                    <div class="pet-joy" aria-label="${escapeHTML(t("Mutluluk: {0}", joy))}"><span style="width:${joy}%"></span></div>
                    <p class="small muted">${escapeHTML(joy >= 80 ? t("Çok mutlu! 💖") : joy >= 50 ? t("Mutlu 🙂") : t("Seni özledi 🥺"))}</p>
                    <div class="row">
                        <button class="toggle" data-pet="${index}" data-do="feed" ${pet.fed === today ? "disabled" : ""}>${escapeHTML(pet.fed === today ? t("✅ Karnı tok") : t("🍖 Besle (5 coin)"))}</button>
                        <button class="toggle" data-pet="${index}" data-do="play" ${pet.played === today ? "disabled" : ""}>${escapeHTML(pet.played === today ? t("✅ Oynadınız") : t("🎾 Oyna"))}</button>
                        <button class="toggle" data-pet="${index}" data-do="home">${escapeHTML(t("🏡 Yeni yuva bul"))}</button>
                    </div>
                </div>
            </div>`;
        }).join("")}</div>
        <p class="notice">${escapeHTML(t("En fazla {0} hayvan sahiplenebilirsin.", PET_MAX))}</p>
    `;

    body.querySelectorAll("[data-pet]").forEach(button => {
        button.onclick = () => {
            const pet = state.pets[Number(button.dataset.pet)];
            if (!pet) return;

            if (button.dataset.do === "home") {
                if (!confirm(t("{0} için sevgi dolu yeni bir yuva bulunsun mu? Bu geri alınamaz.", pet.name))) return;
                state.pets = state.pets.filter(other => other !== pet);
                toast(t("🏡 {0} yeni ailesine kavuştu. Teşekkürler, Doktor!", pet.name));
            } else {
                const joy = petJoy(pet);

                if (button.dataset.do === "feed") {
                    if (state.coins < 5) {
                        toast(t("🪙 Coinin yetmiyor."));
                        return;
                    }
                    state.coins -= 5;
                    pet.fed = dayKey();
                    pet.joy = clamp(joy + 25, 0, 100);
                } else {
                    pet.played = dayKey();
                    pet.joy = clamp(joy + 15, 0, 100);
                }

                pet.care = dayKey();
                sfx("yay");
            }

            commit();
            renderPets(body);
        };
    });
}

/* ---- Ortak pencere ---- */

function openV10(emoji, title, render) {
    openModal("v10Modal");
    $("v10Emoji").textContent = emoji;
    $("v10Title").textContent = title;
    render($("v10Body"));
}

/* ---- Robi ---- */

robotTopics.splice(robotTopics.findIndex(topic => topic.keys.includes("yildiz")), 0,
    {
        keys: ["eve git", "evim", "uyumak", "go home"],
        answer: t("Mesai 17:00'de bitince \"🏠 Eve Git\" düğmesine bas. Evde uyurken klinik 15 dakika dinlenir; sonra \"⏰ Uyan\" deyip yeni güne başlarsın.")
    },
    {
        keys: ["kariyer", "terfi", "unvan", "baskan", "career", "promotion"],
        answer: () => t("Şu anki ünvanın: {0}. Seviye atladıkça Stajyer → Asistan → Doktor → Uzman → Başhekim → Klinikler Başkanı olursun. Kariyer basamaklarını Doktorum ekranında görebilirsin.", rank())
    },
    {
        keys: ["cagri", "yardim iste", "telefon", "referral"],
        answer: t("3. seviyeden sonra başka doktorlar bazen seni arar ve çözemedikleri hastayı gönderir. 📞 işaretli bu hastalar zordur ama 2 kat coin verir!")
    },
    {
        keys: ["depo", "eczane", "malzeme", "ilac bitti", "pharmacy", "stock"],
        answer: () => t("Her tedavi depodan bir malzeme harcar. Klinik ekranındaki \"📦 Depo\" düğmesinden stoklarına bak; biten malzeme için arabana binip eczaneye git. Hızlı varırsan indirim var!")
    },
    {
        keys: ["reklam", "advert"],
        answer: t("\"📣 Reklam\" düğmesinden afiş, radyo ya da televizyon reklamı verebilirsin. O gün daha çok hasta gelir ve her vakadan ek coin kazanırsın.")
    },
    {
        keys: ["sahiplen", "hayvanim", "evcil", "adopt", "my pet"],
        answer: t("Pati Kliniği'nde iyileştirdiğin bir hayvanı sahiplenebilirsin. \"🐾 Hayvanlarım\" düğmesinden onu her gün besle ve onunla oyna; mutlu hayvanlar sana şans getirir!")
    }
);

/* ---- Başlangıç ---- */

// Telefon döndürülünce ya da pencere daralınca oda yeni genişliğe göre yeniden dizilir.
addEventListener("resize", () => {
    if (appOpen && !activeModal) renderScene();
});

function renderV10() {
    renderCareer();
    $("depotButton").classList.toggle("warn", supplies.some(item => state.stock[item.id] <= 2));
}
