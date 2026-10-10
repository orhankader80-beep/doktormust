"use strict";

/* ===== OLAYLAR ===== */

$("auth-login").addEventListener("submit", event => {
    event.preventDefault();
    doLogin();
});

$("auth-register").addEventListener("submit", event => {
    event.preventDefault();
    doRegister();
});

document.querySelectorAll(".age-option").forEach(button => {
    button.addEventListener("click", () => {
        selectedAge = button.dataset.age;

        document.querySelectorAll(".age-option").forEach(option => {
            const active = option.dataset.age === selectedAge;
            option.classList.toggle("active", active);
            option.setAttribute("aria-pressed", String(active));
        });
    });
});

$("auth-profile").addEventListener("submit", event => {
    event.preventDefault();
    createProfile();
});

$("pinForm").addEventListener("submit", event => {
    event.preventDefault();
    savePin();
});

$("gateForm").addEventListener("submit", event => {
    event.preventDefault();
    submitGate();
});

$("petForm").addEventListener("submit", event => {
    event.preventDefault();
    savePetName();
});

// Tarayıcı yükleme teklifini saklar; Ayarlar'daki düğme onu gösterir.
window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    renderInstall();
});

window.addEventListener("appinstalled", () => {
    installPrompt = null;
    renderInstall();
    toast(t("📲 Doktormust bu cihaza yüklendi!"));
});

window.addEventListener("load", registerWorker);
document.addEventListener("pointerdown", wakeAudio);
document.addEventListener("keydown", wakeAudio);

$("clinicEditArea").addEventListener("click", placeItem);
document.addEventListener("pointermove", moveDrag);
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);
window.addEventListener("blur", () => endDrag());

document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
        endDrag();
        return;
    }

    // Klavye odağını açık pencerenin içinde tut.
    if (event.key === "Tab" && activeModal) {
        const dialog = $(activeModal).querySelector(".modal");
        const focusable = [...dialog.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), summary, [tabindex="0"]'
        )].filter(element => element.getClientRects().length > 0);

        if (!focusable.length) {
            event.preventDefault();
            dialog.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const focused = document.activeElement;

        if (event.shiftKey && (focused === first || focused === dialog)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && focused === last) {
            event.preventDefault();
            first.focus();
        }
    }
});

// Android uygulamasında geri tuşu: önce açık pencereyi kapatır, sonra panele döner.
// false dönerse uygulama kapanır.
function handleBack() {
    if (activeModal) {
        closeModal();
        return true;
    }

    if (!appOpen) {
        if (authBusy || !$("auth-home").hidden) return false;
        switchAuthView("home");
        return true;
    }

    if (!$("limitOverlay").hidden || currentScreen === "home") return false;

    showScreen("home");
    return true;
}

/* ===== BAŞLANGIÇ ===== */

function initialize() {
    translatePage();
    startIcons();
    applyReminder();
    $("authLang").textContent = currentLang === "tr" ? "🌐 English" : "🌐 Türkçe";

    screenData.forEach(([id,emoji,label]) => {
        const button = document.createElement("button");
        button.dataset.screen = id;
        button.setAttribute("aria-label", label);
        button.innerHTML = `${emoji} <span>${escapeHTML(label)}</span>`;
        button.onclick = () => showScreen(id);
        $("nav").appendChild(button);
    });

    switchAuthView("home");

    try {
        const database = readDatabase();
        const session = localStorage.getItem(SESSION_KEY);

        if (session && own(database,session) && isRecord(database[session])) {
            currentUser = session;
            loadAccount(database[session]);
            openApp();
        } else if (session) {
            setSession(null);
        }
    } catch (error) {
        storageProblem = true;
        console.warn("Başlangıç kaydı okunamadı.", error);
        toast(t("⚠️ Eski kayıt okunamadı. Kayıt korunuyor; misafir olarak oynayabilirsin."));
    }
}

initialize();
