"use strict";

/* ===== TEMEL YARDIMCILAR ===== */

const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const pick = list => list[Math.floor(Math.random() * list.length)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const number = (value, fallback = 0) =>
    Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[char]);
}

// Android uygulamasının (APK) oyuna sunduğu köprü: sesli okuma ve yedek kaydetme.
// Tarayıcıda açıldığında yoktur ve null döner.
function nativeApp() {
    return window.DoktormustAndroid || null;
}

let idCounter = 0;
function newId() {
    if (globalThis.crypto && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return "item-" + Date.now().toString(36) + "-" + (++idCounter);
}

function shuffled(list) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
