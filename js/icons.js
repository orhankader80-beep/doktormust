"use strict";

/* ===== OYUNA ÖZEL SİMGELER ===== */

// Yeni emojiler eski telefonlarda boş kutu olarak görünür. Aşağıdaki simgeler oyuna özel
// çizimlerle gösterilir: metindeki emoji yerinde kalır (kodun metin karşılaştırmaları
// bozulmaz), yalnızca görünümü çizimle değişir. Çizimler 64×64'lük SVG parçalarıdır.
const iconArt = {
    "🩺": '<path d="M18 8v18a12 12 0 0 0 24 0V8" fill="none" stroke="#4f8cff" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="8" r="3.5" fill="#48689a"/><circle cx="42" cy="8" r="3.5" fill="#48689a"/><path d="M30 38v6a12 12 0 0 0 24 0v-5" fill="none" stroke="#48689a" stroke-width="4.5" stroke-linecap="round"/><circle cx="54" cy="32" r="6.5" fill="#e5edf7" stroke="#48689a" stroke-width="4"/>',
    "🩹": '<g transform="rotate(-35 32 32)"><rect x="6" y="20" width="52" height="24" rx="12" fill="#f4b183"/><rect x="22" y="20" width="20" height="24" fill="#fbe0c8"/><g fill="#d98f5c"><circle cx="13" cy="28" r="1.8"/><circle cx="13" cy="36" r="1.8"/><circle cx="51" cy="28" r="1.8"/><circle cx="51" cy="36" r="1.8"/></g></g>',
    "🩸": '<path d="M32 6C22 22 14 30 14 40a18 18 0 0 0 36 0C50 30 42 22 32 6Z" fill="#e11d48"/><path d="M24 40a8 8 0 0 0 6 8" fill="none" stroke="#fda4af" stroke-width="3.5" stroke-linecap="round"/>',
    "🩻": '<rect x="8" y="6" width="48" height="52" rx="8" fill="#12305a"/><circle cx="32" cy="21" r="8" fill="none" stroke="#d6e8ff" stroke-width="3.5"/><path d="M32 29v21M22 36c6-3 14-3 20 0M22 44c6-3 14-3 20 0" fill="none" stroke="#d6e8ff" stroke-width="3.5" stroke-linecap="round"/>',
    "🫀": '<path d="M30 14V5M38 16l5-9" stroke="#b4232a" stroke-width="5" stroke-linecap="round"/><path d="M32 57C14 45 8 35 8 25a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 10-6 20-24 32Z" fill="#e5484d"/><path d="M17 26a7 7 0 0 1 7-7" fill="none" stroke="#ffb3b6" stroke-width="3.5" stroke-linecap="round"/>',
    "🫁": '<path d="M32 6v22" stroke="#b4232a" stroke-width="4.5" stroke-linecap="round"/><path d="M28 22c-10 0-19 12-19 26 0 6 4 9 9 9 7 0 10-4 10-10Z" fill="#f48a98"/><path d="M36 22c10 0 19 12 19 26 0 6-4 9-9 9-7 0-10-4-10-10Z" fill="#f48a98"/>',
    "🪥": '<g transform="rotate(-40 32 32)"><rect x="2" y="29" width="44" height="7" rx="3.5" fill="#4f8cff"/><rect x="42" y="27" width="20" height="10" rx="3" fill="#2f6de0"/><g fill="#dfeaff" stroke="#9db8e6" stroke-width="1"><rect x="44" y="15" width="4" height="12" rx="1.5"/><rect x="50" y="15" width="4" height="12" rx="1.5"/><rect x="56" y="15" width="4" height="12" rx="1.5"/></g></g>',
    "🪟": '<rect x="8" y="8" width="48" height="48" rx="6" fill="#9ad7ff" stroke="#8a5a2b" stroke-width="5"/><path d="M32 8v48M8 32h48" stroke="#8a5a2b" stroke-width="4"/>',
    "🪙": '<circle cx="32" cy="32" r="25" fill="#f5b301"/><circle cx="32" cy="32" r="18" fill="none" stroke="#c98a00" stroke-width="3"/><path d="M32 20l3.6 7.4 8.1 1.1-5.9 5.7 1.4 8.1L32 38.5l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.1Z" fill="#c98a00"/>',
    "🛝": '<path d="M12 56V14h12v42" fill="none" stroke="#8a5a2b" stroke-width="4"/><path d="M12 26h12M12 36h12M12 46h12" stroke="#8a5a2b" stroke-width="3"/><path d="M24 15c14 2 18 32 34 37" fill="none" stroke="#e5484d" stroke-width="7" stroke-linecap="round"/>',
    "🧍": '<circle cx="32" cy="11" r="7.5" fill="#f4b183"/><rect x="22" y="20" width="20" height="23" rx="7" fill="#4f8cff"/><path d="M27 43v15M37 43v15" stroke="#48689a" stroke-width="6.5" stroke-linecap="round"/>',
    "🪁": '<path d="M32 4 50 26 32 44 14 26Z" fill="#ff6b9a"/><path d="M32 4v40M14 26h36" stroke="#fff" stroke-width="2.5"/><path d="M32 44c-7 6 7 8 0 16" fill="none" stroke="#4f8cff" stroke-width="3" stroke-linecap="round"/>',
    "🤍": '<path d="M32 55C14 43 8 33 8 23a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 10-6 20-24 32Z" fill="#fff" stroke="#cbd3de" stroke-width="3"/>',
    "🥱": '<circle cx="32" cy="32" r="26" fill="#ffcf4a"/><path d="M16 26c3-3 8-3 11 0M37 26c3-3 8-3 11 0" fill="none" stroke="#6b4a12" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="32" cy="44" rx="8" ry="9" fill="#6b4a12"/>',
    "🟫": '<rect x="8" y="8" width="48" height="48" rx="8" fill="#a0673a"/>',
    "🦷": '<path d="M20 7c-8 0-13 6-13 14 0 9 5 13 6 22 1 8 2 14 6 14 6 0 4-13 13-13s7 13 13 13c4 0 5-6 6-14 1-9 6-13 6-22 0-8-5-14-13-14-5 0-7 3-12 3s-7-3-12-3Z" fill="#fff" stroke="#aebccd" stroke-width="3"/>',
    "🦴": '<g transform="rotate(-40 32 32)" fill="#e9dfc8" stroke="#b7a886" stroke-width="2.5"><circle cx="11" cy="25" r="7"/><circle cx="11" cy="39" r="7"/><circle cx="53" cy="25" r="7"/><circle cx="53" cy="39" r="7"/><rect x="11" y="26" width="42" height="12" stroke="none"/><path d="M17 26h30M17 38h30" fill="none"/></g>',
    "🦠": '<g stroke="#3d9a4e" stroke-width="4.5" stroke-linecap="round"><path d="M32 5v10M32 49v10M5 32h10M49 32h10M13 13l7 7M44 44l7 7M51 13l-7 7M20 44l-7 7"/></g><circle cx="32" cy="32" r="18" fill="#58c26a"/><circle cx="26" cy="28" r="4" fill="#2f7d3e"/><circle cx="38" cy="37" r="5" fill="#2f7d3e"/><circle cx="38" cy="24" r="2.5" fill="#2f7d3e"/>',
    "🧪": '<rect x="21" y="5" width="22" height="7" rx="2.5" fill="#8fa5bd"/><path d="M25 12h14v35a7 7 0 0 1-14 0Z" fill="#eef6ff" stroke="#8fa5bd" stroke-width="2.5"/><path d="M25 31h14v16a7 7 0 0 1-14 0Z" fill="#6fd187"/>',
    "🧰": '<path d="M22 22v-6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v6" fill="none" stroke="#9c2227" stroke-width="5"/><rect x="6" y="22" width="52" height="34" rx="6" fill="#e5484d"/><rect x="6" y="34" width="52" height="5" fill="#9c2227"/><rect x="27" y="31" width="10" height="11" rx="2" fill="#ffd166"/>',
    "🧼": '<rect x="8" y="26" width="48" height="27" rx="11" fill="#ff9ecb"/><path d="M18 35h18" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="15" r="7" fill="#d9efff" stroke="#8cc6f5" stroke-width="2"/><circle cx="30" cy="12" r="4.5" fill="#d9efff" stroke="#8cc6f5" stroke-width="2"/>',
    "🧴": '<rect x="26" y="5" width="12" height="9" rx="2" fill="#48689a"/><rect x="29" y="14" width="6" height="7" fill="#48689a"/><rect x="16" y="20" width="32" height="38" rx="8" fill="#7fcbb8"/><rect x="22" y="32" width="20" height="14" rx="3" fill="#fff"/>',
    "🧻": '<rect x="12" y="14" width="30" height="42" rx="4" fill="#f4f1ea" stroke="#c4baa4" stroke-width="2.5"/><path d="M42 30h10v24H42" fill="#f4f1ea" stroke="#c4baa4" stroke-width="2.5"/><ellipse cx="27" cy="14" rx="15" ry="7" fill="#fff" stroke="#c4baa4" stroke-width="2.5"/><ellipse cx="27" cy="14" rx="5" ry="2.5" fill="#b0a48a"/>',
    "🧸": '<circle cx="16" cy="13" r="8" fill="#a96a34"/><circle cx="48" cy="13" r="8" fill="#a96a34"/><ellipse cx="32" cy="48" rx="16" ry="13" fill="#c98a4b"/><circle cx="32" cy="24" r="17" fill="#c98a4b"/><ellipse cx="32" cy="29" rx="7" ry="5.5" fill="#f1d3ae"/><circle cx="25" cy="21" r="2.4" fill="#3b2412"/><circle cx="39" cy="21" r="2.4" fill="#3b2412"/><circle cx="32" cy="27" r="2.2" fill="#3b2412"/>',
    "🥼": '<path d="M20 6 8 17v40h48V17L44 6 32 19Z" fill="#fff" stroke="#aebccd" stroke-width="3" stroke-linejoin="round"/><path d="M32 19v38" stroke="#aebccd" stroke-width="3"/><rect x="38" y="37" width="10" height="8" rx="1.5" fill="none" stroke="#aebccd" stroke-width="2.5"/>',
    "🧱": '<rect x="6" y="14" width="52" height="36" rx="3" fill="#c0563a"/><path d="M6 26h52M6 38h52M24 14v12M42 14v12M15 26v12M33 26v12M50 26v12M24 38v12M42 38v12" stroke="#f1c9b8" stroke-width="2.5"/>',
    "🧊": '<path d="M32 6 54 18v28L32 58 10 46V18Z" fill="#c7e9ff" stroke="#7cc4f2" stroke-width="3" stroke-linejoin="round"/><path d="M10 18l22 12 22-12M32 30v28" fill="none" stroke="#7cc4f2" stroke-width="3"/>'
};

const iconClass = new Map();
let iconPattern = null;

function iconizeText(text) {
    const parent = text.parentElement;
    if (!parent || parent.closest(".ico, script, style, textarea")) return;

    let match;

    while ((match = iconPattern.exec(text.nodeValue))) {
        // Metin düğümü üçe bölünür: öncesi, emoji, sonrası. Emoji bir span içine alınır.
        const emoji = text.splitText(match.index);
        const rest = emoji.splitText(match[0].length);
        const span = document.createElement("span");

        span.className = "ico " + iconClass.get(match[1]);
        emoji.replaceWith(span);
        span.appendChild(emoji);
        text = rest;
    }
}

function iconize(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        iconizeText(node);
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const texts = [];

    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(iconizeText);
}

// Sayfadaki ve sonradan eklenen bütün metinlerde simgeleri çizimle değiştirir.
function startIcons() {
    const rules = [];

    Object.entries(iconArt).forEach(([emoji, art], index) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${art}</svg>`;

        iconClass.set(emoji, "ico-" + index);
        rules.push(`.ico-${index}{background-image:url("data:image/svg+xml,${encodeURIComponent(svg)}")}`);
    });

    const style = document.createElement("style");
    style.textContent = rules.join("\n");
    document.head.appendChild(style);

    // Emojiden sonra gelebilen görünüm seçici (U+FE0F) de simgeyle birlikte sarılır.
    iconPattern = new RegExp(
        "(" + [...iconClass.keys()].join("|") + ")" + String.fromCharCode(0xFE0F) + "?", "u");

    iconize(document.body);

    new MutationObserver(records => {
        for (const record of records) {
            if (record.type === "characterData") iconizeText(record.target);
            else record.addedNodes.forEach(iconize);
        }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
