"use strict";

/* ===== İLK HASTA REHBERİ ===== */

// Oyunu ilk kez açan oyuncu yazı okumak yerine hemen ilk hastasını iyileştirir:
// rehber sırayla bir aleti, kart seçme düğmesini ve doğru kartı parlatır.
// coach: { id: hasta, step: "tool" | "choose" | "card", tool: parlatılan alet, retry }
let coach = null;

// Hastada normalden farklı bulgu veren ilk alet.
function keyTool(patient) {
    const tools = toolsFor(patient);
    return (tools.find(tool => findingFor(patient, tool.id).alert) || tools[0]).id;
}

function startFirstCase() {
    const patient = state.activePatients.find(other => !other.checkup);

    if (!appOpen || !patient) {
        startTour();
        return;
    }

    // İlk vaka süresizdir.
    patient.emergency = false;

    showScreen("patients");
    openTreatment(patient.id);

    coach = { id: patient.id, step: "tool", tool: keyTool(patient), retry: false };
    $("tmReports").hidden = true;
    $("tmResult").textContent = t("Hastanı dinle, sonra parlayan yerlere dokun.");
    renderCoach();
}

function endCoach() {
    coach = null;
    $("tmCoach").hidden = true;
    document.querySelectorAll(".coach-target")
        .forEach(element => element.classList.remove("coach-target"));
}

function renderCoach() {
    const patient = currentPatient();

    if (!coach || !patient || patient.id !== coach.id) {
        endCoach();
        return;
    }

    document.querySelectorAll(".coach-target")
        .forEach(element => element.classList.remove("coach-target"));

    let target, text;

    if (coach.step === "tool") {
        target = $("tmTools").querySelector(`[data-tool="${coach.tool}"]`);
        text = t("👋 Merhaba Doktor! İlk hastan {0}. Parlayan alete dokun ve muayene et.", patient.name);
    } else if (coach.step === "choose") {
        target = $("treatmentChooseButton");
        text = t("🔎 Bulguyu gördün! ❗ işaretli bulgular önemli ipucudur. Şimdi parlayan düğmeye dokun.");
    } else if (coach.step === "cure") {
        target = $("tmCureButton");
        text = t("✨ Doğru kart! Şimdi parlayan düğmeye dokunarak tedaviyi uygula.");
    } else {
        target = $("tmOptions").querySelector(`[data-card="${patient.correctTreatment}"]`);
        text = coach.retry
            ? t("Olsun! Bulgular parlayan karta uyuyor, onu dene.")
            : t("💊 Bulgular parlayan karta uyuyor. Ona dokun!");
    }

    $("tmCoach").textContent = text;
    $("tmCoach").hidden = false;

    if (target) {
        target.classList.add("coach-target");
        target.scrollIntoView({ block: "nearest" });
    }
}

// Oyuncu bir adımı tamamlayınca rehber sıradakine geçer.
function coachDone(step) {
    if (!coach) return;

    if (step === "tool" && coach.step === "tool") coach.step = "choose";
    if (step === "choose" && coach.step !== "card") coach.step = "card";
    if (step === "wrong") coach.retry = true;
    if (step === "cure") coach.step = "cure";

    renderCoach();
}
