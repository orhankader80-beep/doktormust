"use strict";

/* ===== CİHAZ AYARLARI ===== */

// Profillerden bağımsız, bu cihaza ait ayarlar: ebeveyn PIN'i ve günlük hatırlatma.
const DEVICE_KEY = "doktormust_v9_device";

let selectedAvatar = avatars[0];
let gateMode = "math";
let gateForgot = 0;

function readDevice() {
    let saved = {};

    try {
        saved = JSON.parse(localStorage.getItem(DEVICE_KEY) || "{}");
    } catch (error) {
        console.warn("Cihaz ayarları okunamadı.", error);
    }

    const pin = isRecord(saved) && isRecord(saved.pin) ? saved.pin : {};
    const reminder = isRecord(saved) && isRecord(saved.reminder) ? saved.reminder : {};

    return {
        pin: typeof pin.salt === "string" && typeof pin.hash === "string"
            ? { salt: pin.salt, hash: pin.hash } : null,
        reminder: {
            on: reminder.on === true,
            hour: reminderHours.includes(reminder.hour) ? reminder.hour : 17
        }
    };
}

function writeDevice(device) {
    try {
        localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
        return true;
    } catch (error) {
        console.warn("Cihaz ayarları kaydedilemedi.", error);
        return false;
    }
}

/* ===== PAROLASIZ PROFİLLER ===== */

// Çocuk profili: parolası yoktur, giriş ekranında kartına dokunarak açılır.
function isKidProfile(account) {
    return isRecord(account) && account.kid === true &&
        !account.credentials && typeof account.password !== "string";
}

function profileNames() {
    try {
        const database = readDatabase();
        return Object.keys(database).filter(name => isRecord(database[name]))
            .map(name => ({ name, account: database[name] }));
    } catch (error) {
        console.warn("Profiller okunamadı.", error);
        return [];
    }
}

function renderProfiles() {
    const profiles = profileNames();

    $("profileList").innerHTML = "";
    $("profileEmpty").hidden = profiles.length > 0;

    profiles.forEach(({ name, account }) => {
        const saved = isRecord(account.state) ? account.state : {};
        const doctor = isRecord(saved.doctor) ? saved.doctor : {};
        const kid = isKidProfile(account);
        const button = document.createElement("button");

        button.type = "button";
        button.className = "profile-card";
        button.innerHTML = `
            <span>${kid && avatars.includes(doctor.avatar) ? doctor.avatar : kid ? avatars[0] : "🔑"}</span>
            <b>${escapeHTML(name)}</b>
            <small>${escapeHTML(t("Seviye {0}", clamp(number(saved.level,1), 1, 100000)))}</small>
        `;

        button.onclick = () => {
            if (kid) {
                loginProfile(name);
                return;
            }

            // Parolalı hesap: giriş formu adı yazılmış olarak açılır.
            switchAuthView("login");
            $("loginUsername").value = name;
            $("loginPassword").focus();
        };

        $("profileList").appendChild(button);
    });
}

function renderAvatarPick() {
    $("avatarPick").innerHTML = "";

    avatars.forEach(avatar => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "avatar-option";
        button.textContent = avatar;
        button.classList.toggle("active", avatar === selectedAvatar);
        button.setAttribute("aria-pressed", String(avatar === selectedAvatar));
        button.onclick = () => {
            selectedAvatar = avatar;
            renderAvatarPick();
        };

        $("avatarPick").appendChild(button);
    });
}

function loginProfile(name) {
    if (authBusy) return;

    try {
        const database = readDatabase();
        const account = own(database, name) ? database[name] : null;

        if (!isKidProfile(account)) {
            renderProfiles();
            return;
        }

        currentUser = name;
        setSession(name);
        loadAccount(account);
        openApp();
        toast(t("👋 Hoş geldin, Dr. {0}!", name), true);
    } catch (error) {
        console.warn(error);
        toast(t("⚠️ Hesap açılamadı. Kayıtları veya tarayıcı desteğini kontrol et."));
    }
}

function createProfile() {
    if (authBusy) return;

    const name = $("profileName").value.trim();

    if (!name || name.length > 15) {
        toast(t("⚠️ 1 ile 15 karakter arasında bir ad yaz."));
        return;
    }

    try {
        const database = readDatabase();

        if (own(database, name)) {
            toast(t("⚠️ Bu kullanıcı adı zaten kullanılıyor."));
            return;
        }

        const savedState = clone(defaultState);
        savedState.doctor.name = name;
        savedState.doctor.age = selectedAge;
        savedState.doctor.avatar = selectedAvatar;

        const account = { kid: true, state: savedState, clinicItems: clone(defaultClinic) };

        database[name] = account;
        writeDatabase(database);

        currentUser = name;
        setSession(name);
        loadAccount(account);
        $("profileName").value = "";
        openApp();
        toast(t("🎉 Profilin hazır!"), true);
    } catch (error) {
        console.warn(error);
        toast(t("⚠️ Hesap kaydedilemedi. Tarayıcı depolamasını kontrol et."));
    }
}

// Ebeveyn köşesinden profil silme. Açık profil silinirse giriş ekranına dönülür.
function deleteProfile(name) {
    if (!appOpen || !parentUnlocked) return;

    if (!confirm(t("\"{0}\" profili ve tüm ilerlemesi silinsin mi? Bu işlem geri alınamaz.", name))) return;

    try {
        const database = readDatabase();
        if (!own(database, name)) return;

        delete database[name];
        writeDatabase(database);
    } catch (error) {
        console.warn("Profil silinemedi.", error);
        toast(t("⚠️ Profil silinemedi."));
        return;
    }

    if (name === currentUser) {
        // Silinen profil çıkışta yeniden kaydedilmesin.
        currentUser = null;
        logout();
        return;
    }

    renderParentExtras();
    toast(t("🗑️ Profil silindi."));
}

/* ===== EBEVEYN PIN'İ VE KAPISI ===== */

function pinSupported() {
    return Boolean(globalThis.crypto && crypto.subtle);
}

async function hashPin(pin, salt) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pin));
    return hex(new Uint8Array(bytes));
}

async function savePin() {
    if (!appOpen || !parentUnlocked || !pinSupported()) return;

    const pin = $("pinInput").value.trim();

    if (!/^\d{4}$/.test(pin)) {
        toast(t("⚠️ PIN 4 rakamdan oluşmalı."));
        return;
    }

    const salt = hex(crypto.getRandomValues(new Uint8Array(8)));
    const device = readDevice();
    device.pin = { salt, hash: await hashPin(pin, salt) };

    $("pinInput").value = "";
    toast(writeDevice(device) ? t("🔒 Ebeveyn PIN'i kaydedildi.") : t("⚠️ PIN kaydedilemedi."));
    renderParentExtras();
}

function removePin() {
    if (!appOpen || !parentUnlocked) return;

    const device = readDevice();
    device.pin = null;
    writeDevice(device);
    renderParentExtras();
    toast(t("🔓 Ebeveyn PIN'i kaldırıldı."));
}

// Yetişkin kapısı. PIN belirlenmişse PIN sorulur, yoksa küçük bir çarpma sorusu.
// purpose: "parent" ya da "limit". forgot: unutulan PIN'i sıfırlamak için kalan soru sayısı.
function openGate(purpose, forgot = 0) {
    if (!appOpen) return;

    const usePin = Boolean(readDevice().pin) && pinSupported() && !forgot;
    const a = 12 + Math.floor(Math.random() * 8);
    const b = 3 + Math.floor(Math.random() * 7);

    openModal("gateModal");
    gateAnswer = a * b;
    gatePurpose = purpose;
    gateForgot = forgot;
    gateMode = usePin ? "pin" : "math";

    $("gateTitle").textContent = usePin ? t("Ebeveyn PIN'i") : t("Bu bölüm yetişkinler içindir");
    $("gateHelp").textContent = usePin
        ? t("Devam etmek için 4 haneli PIN'i yazın.")
        : forgot
            ? t("PIN'i sıfırlamak için {0} soruyu daha doğru yanıtlayın.", forgot)
            : t("Devam etmek için işlemin sonucunu yazın.");
    $("gateQuestion").textContent = usePin ? "🔒" : `${a} × ${b} = ?`;
    $("gateForgot").hidden = !usePin;
    $("gateInput").type = usePin ? "password" : "text";
    $("gateInput").value = "";
    $("gateInput").focus();
}

async function submitGate() {
    if (activeModal !== "gateModal") return;

    const purpose = gatePurpose;
    const value = $("gateInput").value.trim();

    if (gateMode === "pin") {
        const pin = readDevice().pin;
        const right = Boolean(pin) && await hashPin(value, pin.salt) === pin.hash;

        if (activeModal !== "gateModal") return;

        if (!right) {
            $("gateInput").value = "";
            toast(t("❌ PIN yanlış."));
            return;
        }
    } else {
        if (value === "" || Number(value) !== gateAnswer) {
            toast(t("❌ Yanıt doğru değil. Yeni bir soru geldi."));
            openGate(purpose, gateForgot);
            return;
        }

        if (gateForgot > 1) {
            openGate(purpose, gateForgot - 1);
            return;
        }

        if (gateForgot === 1) {
            const device = readDevice();
            device.pin = null;
            writeDevice(device);
            toast(t("🔓 PIN sıfırlandı. Ebeveyn Köşesi'nden yenisini belirleyebilirsiniz."));
        }
    }

    closeModal();

    if (purpose === "limit") {
        openModal("limitModal");
        return;
    }

    parentUnlocked = true;
    showScreen("parent");
}

// PIN unutulduysa art arda üç işlem sorusuyla sıfırlanır.
function forgotPin() {
    if (activeModal === "gateModal") openGate(gatePurpose, 3);
}

/* ===== GÜNLÜK HATIRLATMA (yalnızca Android uygulaması) ===== */

function reminderSupported() {
    const app = nativeApp();
    return Boolean(app && typeof app.setReminder === "function");
}

// Kayıtlı ayarı telefona uygular. Bildirim izni henüz verilmediyse false döner.
function applyReminder() {
    if (!reminderSupported()) return true;

    const { reminder } = readDevice();

    return nativeApp().setReminder(reminder.on, reminder.hour,
        t("🩺 Hastaların seni bekliyor!"), t("Kliniğine uğramak için dokun."));
}

function setReminder(on, hour) {
    if (!appOpen || !parentUnlocked || !reminderHours.includes(hour)) return;

    const device = readDevice();
    device.reminder = { on, hour };
    writeDevice(device);

    if (!applyReminder() && on) {
        toast(t("🔔 Bildirim izni istendi. İzin verince hatırlatma açılır."));
    }

    renderParentExtras();
}

// Android, bildirim izni sorusunun sonucunu buraya bildirir.
function onReminderPermission(granted) {
    if (!granted) {
        const device = readDevice();
        device.reminder.on = false;
        writeDevice(device);
        toast(t("🔕 Bildirim izni verilmedi; hatırlatma kapalı."));
    }

    if (appOpen && currentScreen === "parent") renderParentExtras();
}

/* ===== HAFTALIK KARNE ===== */

function emptyWeek(key = "") {
    return { key, cases: 0, perfect: 0, games: 0, tips: 0, stickers: 0, wrong: {} };
}

function normalizeWeek(saved) {
    if (!isRecord(saved) || typeof saved.key !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(saved.key)) return emptyWeek();

    const week = emptyWeek(saved.key);
    const wrong = isRecord(saved.wrong) ? saved.wrong : {};

    for (const field of ["cases", "perfect", "games", "tips", "stickers"]) {
        week[field] = number(saved[field]);
    }

    for (const card of Object.keys(defaultState.cardStats)) {
        if (own(wrong, card) && number(wrong[card])) week.wrong[card] = number(wrong[card]);
    }

    return week;
}

// Yeni hafta başladıysa geçen haftanın sayıları saklanır ve sayaçlar sıfırlanır.
function rollWeek() {
    if (state.week.key === weekKey()) return;

    state.lastWeek = state.week.key ? state.week : null;
    state.week = emptyWeek(weekKey());
}

// Haftanın pazartesisinden başlayarak 7 günün oyun süresi (saniye).
function weekSeconds(key) {
    let total = 0;

    for (let offset = 0; offset < 7; offset++) {
        const date = new Date(key + "T12:00:00");
        date.setDate(date.getDate() + offset);

        const day = date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2,"0") + "-" +
            String(date.getDate()).padStart(2,"0");

        total += state.playLog[day] || 0;
    }

    return total;
}

function weekLines(week) {
    const hardest = Object.entries(week.wrong).sort((a, b) => b[1] - a[1])[0];

    return [
        t("Oyun süresi: {0} dk", Math.round(weekSeconds(week.key) / 60)),
        t("Tamamlanan vaka: {0}", week.cases),
        t("3 yıldızlı vaka: {0}", week.perfect),
        t("Kazanılan mini oyun: {0}", week.games),
        t("Yeni sağlık bilgisi: {0}", week.tips),
        t("Yeni çıkartma: {0}", week.stickers),
        hardest
            ? t("En çok zorlandığı kart: {0}", cardInfo(hardest[0]).label)
            : t("Henüz yanlış kart seçilmedi.")
    ].join("\n");
}

/* ===== EBEVEYN KÖŞESİNİN EK KARTLARI ===== */

function renderParentExtras() {
    rollWeek();

    const { week, lastWeek } = state;

    $("weekNow").textContent = weekLines(week);
    $("weekLast").textContent = lastWeek ? weekLines(lastWeek) : t("Geçen haftaya ait kayıt yok.");
    $("weekComment").textContent = !week.cases
        ? t("Bu hafta henüz vaka çözülmedi.")
        : lastWeek && week.cases > lastWeek.cases
            ? t("Bu hafta geçen haftadan daha çok vaka çözdü. 👏")
            : t("Düzenli ve kısa oyun seansları öğrenmeyi pekiştirir.");

    // PIN
    const device = readDevice();

    $("pinCard").hidden = !pinSupported();
    $("pinStatus").textContent = device.pin
        ? t("PIN belirlenmiş. Ebeveyn Köşesi ve süre uzatma PIN ile açılır.")
        : t("PIN belirlenmemiş. Şu anda bu bölüm bir işlem sorusuyla açılıyor.");
    $("pinRemove").hidden = !device.pin;

    // Hatırlatma
    $("reminderCard").hidden = !reminderSupported();
    $("reminderToggle").textContent = device.reminder.on ? t("Açık") : t("Kapalı");
    $("reminderToggle").classList.toggle("on", device.reminder.on);
    $("reminderToggle").setAttribute("aria-pressed", String(device.reminder.on));
    $("reminderToggle").onclick = () => setReminder(!device.reminder.on, device.reminder.hour);
    $("reminderSeg").innerHTML = "";

    reminderHours.forEach(hour => {
        const active = device.reminder.hour === hour;
        const button = document.createElement("button");

        button.textContent = hour + ":00";
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        button.onclick = () => setReminder(device.reminder.on, hour);
        $("reminderSeg").appendChild(button);
    });

    // Profiller
    $("parentProfiles").innerHTML = "";

    profileNames().forEach(({ name, account }) => {
        const row = document.createElement("div");

        row.className = "quest-row";
        row.innerHTML = `
            <span>${escapeHTML(name)} ${isKidProfile(account) ? "" : "🔑"}
                ${name === currentUser ? `<b>${escapeHTML(t("(açık profil)"))}</b>` : ""}</span>
            <button class="danger-btn">${escapeHTML(t("🗑️ Sil"))}</button>
        `;

        row.querySelector("button").onclick = () => deleteProfile(name);
        $("parentProfiles").appendChild(row);
    });
}
