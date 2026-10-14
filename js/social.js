"use strict";

/* ===== İKİLİ YARIŞMA ===== */

// Aynı cihazda iki oyuncu: ekranın iki ucunda aynı soru görünür, önce doğru bilen puanı alır.
// Yanlış yanıtlayan o soruda bekler. Oyuncu 0 alttaki, oyuncu 1 üstteki (ters çevrilmiş) taraftır.
let duel = null;

function startDuel() {
    if (!appOpen) return;

    openModal("duelModal");
    duel = {
        questions: shuffled(quizQuestions).slice(0, 7),
        index: 0,
        scores: [0, 0],
        locked: [false, false],
        resolved: false
    };

    $("duelAgain").hidden = true;
    showDuelQuestion();
}

function duelScore() {
    $("duelScore").textContent = t("Soru {0} / {1}", Math.min(duel.index + 1, duel.questions.length),
        duel.questions.length) + ` • 🔵 ${duel.scores[0]} — ${duel.scores[1]} 🔴`;
}

function showDuelQuestion() {
    const item = duel.questions[duel.index];
    const choices = shuffled(item.choices);

    duel.locked = [false, false];
    duel.resolved = false;

    for (const player of [0, 1]) {
        $("duelQ" + player).textContent = item.question;
        $("duelNote" + player).textContent = "";
        $("duelA" + player).innerHTML = "";

        choices.forEach(choice => {
            const button = document.createElement("button");
            button.className = "choice";
            button.textContent = choice;
            button.onclick = () => answerDuel(player, choice, button);
            $("duelA" + player).appendChild(button);
        });
    }

    duelScore();
}

function answerDuel(player, choice, button) {
    if (!duel || duel.resolved || duel.locked[player]) return;

    const item = duel.questions[duel.index];
    const other = 1 - player;

    if (choice === item.correct) {
        duel.scores[player]++;
        duel.resolved = true;
        button.classList.add("right");
        $("duelNote" + player).textContent = t("✅ Doğru! +1 puan");
        $("duelNote" + other).textContent = t("⏳ Rakibin daha hızlıydı.");
        playSound("ok");
    } else {
        duel.locked[player] = true;
        button.classList.add("wrong");
        $("duelA" + player).querySelectorAll("button").forEach(option => { option.disabled = true; });
        $("duelNote" + player).textContent = t("❌ Yanlış! Bu soruda bekle.");
        playSound("bad");

        // İki oyuncu da yanıldıysa doğru yanıt gösterilir ve sıradaki soruya geçilir.
        if (!duel.locked[other]) return;
        duel.resolved = true;

        for (const side of [0, 1]) {
            $("duelNote" + side).textContent = t("Doğru yanıt: {0}", item.correct);
        }
    }

    duelScore();

    const round = duel;
    gameTimers.push(setTimeout(() => {
        if (duel !== round) return;

        duel.index++;
        if (duel.index < duel.questions.length) showDuelQuestion();
        else finishDuel();
    }, 1500));
}

function finishDuel() {
    const [first, second] = duel.scores;

    duel.resolved = true;

    for (const player of [0, 1]) {
        const mine = duel.scores[player];
        const theirs = duel.scores[1 - player];

        $("duelQ" + player).textContent = mine > theirs ? t("🏆 Kazandın!")
            : mine < theirs ? t("👏 İyi oyundu!") : t("🤝 Berabere!");
        $("duelA" + player).innerHTML = "";
        $("duelNote" + player).textContent = t("Puanın: {0}", mine);
    }

    // İlk üç yarışmadan sonra o günün ödülü azalır.
    const coins = Math.round(10 * playFactor("duels", 3));

    $("duelScore").textContent = `🔵 ${first} — ${second} 🔴 • ` + t("+{0} coin", coins);
    $("duelAgain").hidden = false;

    state.coins += coins;
    commit();
    playSound("win");
}

/* ===== DİPLOMA ===== */

// Metni verilen genişliğe sığacak şekilde satırlara böler ve ortalı yazar.
function drawWrapped(context, text, x, y, width, lineHeight) {
    let line = "";

    for (const word of text.split(" ")) {
        const next = line ? line + " " + word : word;

        if (line && context.measureText(next).width > width) {
            context.fillText(line, x, y);
            line = word;
            y += lineHeight;
        } else {
            line = next;
        }
    }

    context.fillText(line, x, y);
    return y;
}

function drawDiploma(canvas, chapter) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const total = (chapter.cases + 1) * 3;

    const paper = context.createLinearGradient(0, 0, width, height);
    paper.addColorStop(0, "#fffdf5");
    paper.addColorStop(1, "#fff3d6");
    context.fillStyle = paper;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "#4f8cff";
    context.lineWidth = 16;
    context.strokeRect(24, 24, width - 48, height - 48);
    context.strokeStyle = "#f5b301";
    context.lineWidth = 4;
    context.strokeRect(48, 48, width - 96, height - 96);

    context.textAlign = "center";
    context.fillStyle = "#4f8cff";
    context.font = "bold 34px Georgia, 'Times New Roman', serif";
    context.fillText("DOKTORMUST", width / 2, 130);

    context.fillStyle = "#17324d";
    context.font = "bold 68px Georgia, 'Times New Roman', serif";
    context.fillText(t("Başarı Diploması"), width / 2, 220);

    context.font = "30px Georgia, 'Times New Roman', serif";
    context.fillText(t("Bu diploma"), width / 2, 300);

    // Uzun adlar sığana kadar küçültülür.
    let size = 76;
    const name = "Dr. " + state.doctor.name;
    do {
        context.font = `bold ${size}px Georgia, 'Times New Roman', serif`;
        size -= 4;
    } while (context.measureText(name).width > width - 220 && size > 28);

    context.fillStyle = "#7166ff";
    context.fillText(name, width / 2, 395);

    context.fillStyle = "#17324d";
    context.font = "30px Georgia, 'Times New Roman', serif";
    drawWrapped(context,
        t("adlı doktora, \"{0}\" bölümünü {1} / {2} yıldızla tamamladığı için verilmiştir.",
            chapter.name, state.story.best[chapter.id], total),
        width / 2, 470, width - 300, 44);

    context.font = "96px serif";
    context.fillText(chapter.emoji + " 🎓", width / 2, 660);

    context.font = "26px Georgia, 'Times New Roman', serif";
    context.textAlign = "left";
    context.fillText(dayLabel(dayKey()), 110, 760);
    context.textAlign = "right";
    context.fillText(t("Doktormust Kliniği"), width - 110, 760);

    context.strokeStyle = "#17324d";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(110, 722);
    context.lineTo(360, 722);
    context.moveTo(width - 360, 722);
    context.lineTo(width - 110, 722);
    context.stroke();
}

function openDiploma(id) {
    const chapter = chapters.find(chapter => chapter.id === id);
    if (!appOpen || !chapter || !state.story.done.includes(id)) return;

    openModal("diplomaModal");
    drawDiploma($("diplomaCanvas"), chapter);
    $("diplomaPrint").hidden = Boolean(nativeApp());

    if (!state.diplomaSeen) {
        state.diplomaSeen = true;
        commit();
    }
}

function saveDiploma() {
    if (activeModal !== "diplomaModal") return;

    const name = `doktormust-diploma-${dayKey()}.png`;
    const data = $("diplomaCanvas").toDataURL("image/png");

    // Android uygulaması resmi kendi "Kaydet" penceresiyle yazar ve onImageSaved ile haber verir.
    if (nativeApp()) {
        nativeApp().saveImage(name, data.slice(data.indexOf(",") + 1));
        return;
    }

    const link = document.createElement("a");
    link.href = data;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast(t("🎓 Diploma indirildi."));
}

function printDiploma() {
    if (activeModal === "diplomaModal") window.print();
}

function onImageSaved(saved) {
    toast(saved ? t("🖼️ Resim kaydedildi.") : t("⚠️ Resim kaydedilemedi."));
}
