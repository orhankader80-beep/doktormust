"use strict";

/* ===== EBEVEYN UYGULAMASIYLA EŞLEŞME ===== */

// Ebeveyn uygulaması (ebeveyn/ klasöründeki ayrı sayfa) ile oyun arasında sunucu yoktur.
// İkisi, ebeveynin ürettiği 8 harflik "aile anahtarı" ile eşleşir:
//  - Oyun, raporu bir bağlantının içine yazar; ebeveyn o bağlantıyı kendi telefonunda açar.
//  - Ebeveyn uygulaması o güne özel bir "ebeveyn kodu" üretir; çocuk kodu Ayarlar'a yazınca
//    süre sınırı değişir. Kod, aile anahtarıyla imzalıdır; anahtarı bilmeyen kod üretemez.
// Bağlantının # işaretinden sonraki kısmı hiçbir sunucuya gönderilmez.
const FAMILY_URL = "https://orhankader80-beep.github.io/doktormust/ebeveyn/";
const FAMILY_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const FAMILY_EXTRAS = [0, 15, 30, 60];

function cleanFamilyKey(text) {
    return String(text).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validFamilyKey(key) {
    return key.length === 8 && [...key].every(letter => FAMILY_LETTERS.includes(letter));
}

function shownFamilyKey(key) {
    return key.slice(0, 4) + "-" + key.slice(4);
}

async function familySign(key, text) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key + "|" + text));
    return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 6).toUpperCase();
}

// Günün numarası; kodlar yalnızca üretildikleri gün geçerlidir.
function familyDay() {
    return Math.floor(new Date(dayKey() + "T12:00:00").getTime() / 86400000) % 46656;
}

function renderFamily() {
    const paired = validFamilyKey(state.familyKey);

    $("familyStatus").textContent = paired
        ? t("✅ Eşleşti. Aile anahtarı: {0}", shownFamilyKey(state.familyKey))
        : t("Henüz eşleşmedi. Ebeveyn uygulamasında çocuğu ekleyince çıkan aile anahtarını buraya yazın.");
    $("familyForm").hidden = paired;
    $("familySend").hidden = !paired;
    $("familyRemove").hidden = !paired;
    $("familyOpen").hidden = Boolean(nativeApp());
    if (!paired) $("familyLink").hidden = true;
}

function pairFamily(event) {
    event.preventDefault();
    if (!appOpen || !parentUnlocked) return;

    const key = cleanFamilyKey($("familyInput").value);

    if (!validFamilyKey(key)) {
        toast(t("⚠️ Aile anahtarı 8 harf ve rakamdan oluşur. Ebeveyn uygulamasındaki anahtarı aynen yazın."));
        return;
    }

    state.familyKey = key;
    $("familyInput").value = "";
    commit();
    renderFamily();
    toast(t("🔗 Ebeveyn uygulamasıyla eşleşti."));
}

function unpairFamily() {
    if (!appOpen || !parentUnlocked) return;
    if (!confirm(t("Eşleşme kaldırılsın mı? Ebeveyn kodları artık bu profilde çalışmaz."))) return;

    state.familyKey = "";
    commit();
    renderFamily();
}

// Ebeveyn uygulamasında gösterilecek özet. İçinde yalnızca oyun sayıları vardır.
function familyReport() {
    const days = [];
    for (let offset = -6; offset <= 0; offset++) days.push(dayKey(offset));

    const wrong = Object.entries(state.week.wrong)
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([card, count]) => [cardInfo(card) ? cardInfo(card).label : card, count]);

    return {
        v: 1,
        ad: state.doctor.name,
        klinik: clinicTitle(),
        sev: state.level,
        vaka: state.patients,
        yildiz: state.stars,
        tam: state.perfect,
        rozet: state.badges.length,
        cikartma: state.stickers.length,
        gun: state.shift.day,
        sinir: state.limitMinutes,
        log: days.map(day => [day, state.playLog[day] || 0]),
        hafta: { vaka: state.week.cases, tam: state.week.perfect, oyun: state.week.games, yanlis: wrong },
        tarih: new Date().toISOString()
    };
}

async function familyReportLink() {
    const json = JSON.stringify(familyReport());
    const data = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    return FAMILY_URL + "#r=" + data + "." + await familySign(state.familyKey, data);
}

async function sendFamilyReport() {
    if (!appOpen || !parentUnlocked || !validFamilyKey(state.familyKey)) return;

    const link = await familyReportLink();

    $("familyLink").value = link;
    $("familyLink").hidden = false;

    // Telefonda paylaşma penceresi açılır; yoksa bağlantı panoya kopyalanır.
    try {
        if (navigator.share && !nativeApp()) {
            await navigator.share({ title: t("Doktormust raporu"), text: t("Doktormust raporu: {0}", state.doctor.name), url: link });
            return;
        }
    } catch (error) {
        if (error && error.name === "AbortError") return;
    }

    try {
        await navigator.clipboard.writeText(link);
        toast(t("📋 Rapor bağlantısı kopyalandı. Kendinize gönderip ebeveyn uygulamasında açın."));
    } catch (error) {
        $("familyLink").focus();
        $("familyLink").select();
        toast(t("Bağlantı aşağıdaki kutuda. Kopyalayıp kendinize gönderin."));
    }
}

// Ayarlar'a yazılan ebeveyn kodu: S + sınır + ek süre + gün - imza.
async function applyFamilyCode(event) {
    event.preventDefault();
    if (!appOpen) return;

    const text = String($("familyCode").value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const match = text.match(/^S([0-4])([0-3])([0-9A-Z]{3})([0-9A-F]{6})$/);

    if (!validFamilyKey(state.familyKey)) {
        toast(t("⚠️ Bu profil ebeveyn uygulamasıyla eşleşmemiş. Eşleştirme Ebeveyn Köşesi'nden yapılır."));
        return;
    }

    if (!match) {
        toast(t("⚠️ Kod eksik ya da yanlış yazılmış."));
        return;
    }

    const [, limit, extra, day, sign] = match;
    const body = "S" + limit + extra + day;

    if (await familySign(state.familyKey, body) !== sign) {
        toast(t("⚠️ Bu kod geçerli değil."));
        return;
    }

    if (parseInt(day, 36) !== familyDay()) {
        toast(t("⚠️ Bu kodun süresi dolmuş. Ebeveyn kodları yalnızca üretildikleri gün geçerlidir."));
        return;
    }

    const today = dayKey();
    if (state.familyCodes.day !== today) state.familyCodes = { day: today, list: [] };

    const minutes = FAMILY_EXTRAS[Number(extra)];
    const used = state.familyCodes.list.includes(body);

    state.limitMinutes = limitChoices[Number(limit)];

    // Aynı kod ek süreyi yalnızca bir kez verir.
    if (minutes && !used) {
        const before = state.limitExtra.day === today ? state.limitExtra.minutes : 0;
        state.limitExtra = { day: today, minutes: Math.min(before + minutes, 1440) };
    }

    if (!used) state.familyCodes.list.push(body);
    state.familyCodes.list = state.familyCodes.list.slice(-20);

    $("familyCode").value = "";
    commit();
    checkLimit();
    playSound();

    toast((state.limitMinutes
        ? t("👪 Ebeveyn kodu uygulandı: günlük süre {0} dakika.", state.limitMinutes)
        : t("👪 Ebeveyn kodu uygulandı: süre sınırı kaldırıldı.")) +
        (minutes && !used ? " " + t("Bugün için +{0} dakika eklendi.", minutes) : ""));
}

function setupFamily() {
    $("familyForm").addEventListener("submit", pairFamily);
    $("familyCodeForm").addEventListener("submit", applyFamilyCode);
}
