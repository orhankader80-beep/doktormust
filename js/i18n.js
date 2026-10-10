"use strict";

/* ===== DİL ===== */

// Türkçe metin anahtardır: t("Merhaba") seçili dilde karşılığı varsa onu,
// yoksa metnin kendisini döndürür. {0}, {1}… yer tutucuları değerlerle dolar.
// Dil değişince sayfa yenilenir; bu yüzden veri tabloları da t() kullanabilir.
const LANG_KEY = "doktormust_lang";
const translations = {};

let currentLang = "tr";

try {
    if (localStorage.getItem(LANG_KEY) === "en") currentLang = "en";
} catch (error) {
    console.warn("Dil ayarı okunamadı.", error);
}

function t(text, ...values) {
    const table = translations[currentLang];
    const found = table && Object.prototype.hasOwnProperty.call(table, text)
        ? table[text] : text;

    return values.length
        ? found.replace(/\{(\d+)\}/g, (match, index) =>
            index < values.length ? values[index] : match)
        : found;
}

// Ondalık sayıyı dile göre yazar: Türkçede virgül, İngilizcede nokta.
function decimal(value, digits = 1) {
    const text = value.toFixed(digits);
    return currentLang === "tr" ? text.replace(".", ",") : text;
}

// Kayıtlardaki "2026-10-08" biçimli günü okunur tarihe çevirir.
function dayLabel(day) {
    return currentLang === "tr" ? day.split("-").reverse().join(".") : day;
}

// index.html içindeki sabit metinleri ve etiketleri seçili dile çevirir.
function translatePage() {
    document.documentElement.lang = currentLang;
    if (currentLang === "tr") return;

    document.title = t(document.title);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
        const raw = node.nodeValue;
        const text = raw.replace(/\s+/g, " ").trim();
        if (!text || node.parentElement.closest("script, style")) continue;

        const translated = t(text);
        if (translated === text) continue;

        // Satır içi boşluklar korunur ("Seviye: <b>1</b>" gibi).
        node.nodeValue = (/^\s/.test(raw) ? " " : "") + translated +
            (/\s$/.test(raw) ? " " : "");
    }

    for (const attribute of ["aria-label", "placeholder", "title"]) {
        document.querySelectorAll(`[${attribute}]`).forEach(element => {
            element.setAttribute(attribute, t(element.getAttribute(attribute)));
        });
    }
}

function setLanguage(lang) {
    if (lang !== "tr" && lang !== "en") return false;
    if (lang === currentLang) return false;

    try {
        localStorage.setItem(LANG_KEY, lang);
    } catch (error) {
        console.warn("Dil ayarı kaydedilemedi.", error);
        return false;
    }

    location.reload();
    return true;
}
