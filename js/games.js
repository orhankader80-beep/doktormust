"use strict";

/* ===== MİNİ OYUNLAR ===== */

const quizQuestions = [
    {
        question: t("Ece'nin oyun kartındaki termometre 38,5°C gösteriyor. Hangi simge eşleşir?"),
        choices: [t("🤒 Ateş"), t("🤧 Burun akıntısı"), t("🦴 Kol kartı")],
        correct: t("🤒 Ateş")
    },
    {
        question: t("Arda'nın kartında hapşırma ve burun akıntısı çizilmiş. Hangi simge eşleşir?"),
        choices: [t("🤧 Nezle kartı"), t("🦴 Kol kartı"), t("🤢 Mide kartı")],
        correct: t("🤧 Nezle kartı")
    },
    {
        question: t("Defne'nin kartında kol resmi bulunuyor. Hangi simge eşleşir?"),
        choices: [t("🦴 Kol kartı"), t("🤧 Nezle kartı"), t("😴 Uyku kartı")],
        correct: t("🦴 Kol kartı")
    },
    {
        question: t("Rapor \"M kodlu vaka\" diyor. Bu oyunda hangi kart seçilir?"),
        choices: [t("🧪 Mide Bakım Kartı"), t("🦴 Alçı Kartı"), t("🍎 Vitamin Kartı")],
        correct: t("🧪 Mide Bakım Kartı")
    },
    {
        question: t("Rapor \"K kodlu vaka\" diyor. Bu oyunda hangi kart seçilir?"),
        choices: [t("🦴 Alçı Kartı"), t("🍊 Dinlenme Kartı"), t("🧪 Mide Bakım Kartı")],
        correct: t("🦴 Alçı Kartı")
    },
    {
        question: t("Yemekten önce ne yapmalıyız?"),
        choices: [t("🧼 Ellerimizi yıkarız"), t("📺 Televizyonu açarız"), t("🏃 Koşmaya çıkarız")],
        correct: t("🧼 Ellerimizi yıkarız")
    },
    {
        question: t("Dişlerimizi günde en az kaç kez fırçalamalıyız?"),
        choices: [t("🪥 2 kez"), t("Haftada 1 kez"), t("Yalnızca bayramlarda")],
        correct: t("🪥 2 kez")
    },
    {
        question: t("Hapşırırken ne yapmalıyız?"),
        choices: [t("🤧 Mendille ya da dirseğimizle kapatırız"), t("Arkadaşımıza doğru hapşırırız"), t("Hiçbir şey yapmayız")],
        correct: t("🤧 Mendille ya da dirseğimizle kapatırız")
    },
    {
        question: t("Doktor kalbi dinlemek için hangi aleti kullanır?"),
        choices: [t("🩺 Stetoskop"), t("🔬 Mikroskop"), t("🌡️ Termometre")],
        correct: t("🩺 Stetoskop")
    },
    {
        question: t("Vücut sıcaklığını hangi alet ölçer?"),
        choices: [t("🌡️ Termometre"), t("🩺 Stetoskop"), t("🔭 Teleskop")],
        correct: t("🌡️ Termometre")
    },
    {
        question: t("Mikropları görebilmek için hangi alet kullanılır?"),
        choices: [t("🔬 Mikroskop"), t("📏 Cetvel"), t("🩺 Stetoskop")],
        correct: t("🔬 Mikroskop")
    },
    {
        question: t("Bisiklete binerken başımızı ne korur?"),
        choices: [t("⛑️ Kask"), t("🧣 Atkı"), t("🕶️ Gözlük")],
        correct: t("⛑️ Kask")
    },
    {
        question: t("Susadığımızda vücudumuz için en iyi içecek hangisidir?"),
        choices: [t("💧 Su"), t("🥤 Gazlı içecek"), t("🍭 Şekerli şurup")],
        correct: t("💧 Su")
    },
    {
        question: t("Fenerle bakınca 🦠 mikrop lekesi gördün. Bu oyunda hangi kart seçilir?"),
        choices: [t("💊 Antibiyotik Kartı"), t("🍎 Vitamin Kartı"), t("🦴 Alçı Kartı")],
        correct: t("💊 Antibiyotik Kartı")
    },
    {
        question: t("Elle muayenede şişlik buldun. Bu oyunda hangi kart seçilir?"),
        choices: [t("🦴 Alçı Kartı"), t("🍊 Dinlenme Kartı"), t("🧪 Mide Bakım Kartı")],
        correct: t("🦴 Alçı Kartı")
    },
    {
        question: t("Stetoskopta karın guruldaması duydun. Bu oyunda hangi kart seçilir?"),
        choices: [t("🧪 Mide Bakım Kartı"), t("🩹 Ağrı Bakım Kartı"), t("💊 Antibiyotik Kartı")],
        correct: t("🧪 Mide Bakım Kartı")
    },
    {
        question: t("Türkiye'de acil durumda ambulans için hangi numara aranır?"),
        choices: ["📞 112", "📞 123", "📞 999"],
        correct: "📞 112"
    },
    {
        question: t("Ellerimizi sabunla en az kaç saniye yıkamalıyız?"),
        choices: [t("🧼 20 saniye"), t("2 saniye"), t("5 saniye")],
        correct: t("🧼 20 saniye")
    },
    {
        question: t("İlaçları bize kim vermelidir?"),
        choices: [t("👩‍⚕️ Doktorun söylediği şekilde bir büyüğümüz"), t("Kendimiz, istediğimiz zaman"), t("Arkadaşımız")],
        correct: t("👩‍⚕️ Doktorun söylediği şekilde bir büyüğümüz")
    }
];

const gameInfo = {
    quiz: { title: t("Hızlı Muayene"), emoji: "🩺", start: startQuiz },
    germ: { title: t("Mikrop Avı"), emoji: "🦠", start: startGerm },
    memory: { title: t("Hafıza Kartları"), emoji: "🧠", start: startMemory },
    heart: { title: t("Nabız Ritmi"), emoji: "❤️", start: startHeart },
    wash: { title: t("El Yıkama"), emoji: "🧼", start: startWash },
    teeth: { title: t("Diş Fırçalama"), emoji: "🪥", start: startTeeth },
    plate: { title: t("Sağlıklı Tabak"), emoji: "🥗", start: startPlate },
    bandage: { title: t("Yara Bandı"), emoji: "🩹", start: startBandage }
};

function renderGames() {
    $("difficultySeg").innerHTML = "";

    for (const [id, info] of Object.entries(difficulties)) {
        const button = document.createElement("button");
        button.textContent = info.label;
        button.classList.toggle("active", state.difficulty === id);
        button.setAttribute("aria-pressed", String(state.difficulty === id));
        button.onclick = () => {
            if (!appOpen) return;
            state.difficulty = id;
            commit();
            renderGames();
        };
        $("difficultySeg").appendChild(button);
    }

    const records = state.records;
    const memory = records["memory_" + state.difficulty];
    const text = (value, label) => value ? t("🏅 Rekor: ") + label : t("Henüz rekor yok");

    $("rec-quiz").textContent = text(records.quiz, t("{0} / 5 doğru", records.quiz));
    $("rec-germ").textContent = text(records.germ, t("{0} puan", records.germ));
    $("rec-memory").textContent = text(memory, t("{0} hamle", memory));
    $("rec-heart").textContent = text(records.heart, t("{0} / 8 isabet", records.heart));
    $("rec-wash").textContent = text(records.wash, t("{0} / 10 puan", records.wash));
    $("rec-teeth").textContent = text(records.teeth, t("{0} puan", records.teeth));
    $("rec-plate").textContent = text(records.plate, t("{0} yiyecek", records.plate));
    $("rec-bandage").textContent = text(records.bandage, t("{0} / 12 puan", records.bandage));
    $("rec-maze").textContent = text(records.maze, t("{0} sn kala", records.maze));
    $("rec-bones").textContent = text(records.bones, t("{0} / 10 puan", records.bones));
    $("rec-count").textContent = text(records.count, t("{0} / 5 doğru", records.count));
}

function stopGame() {
    gameTimers.forEach(timer => clearInterval(timer));
    gameTimers = [];

    if (gameFrame !== null) cancelAnimationFrame(gameFrame);
    gameFrame = null;
}

function gameStatus(text) {
    $("gameStatus").textContent = text;
}

function startGame(kind) {
    if (!appOpen || !own(gameInfo,kind)) return;
    pharmacyTrip = false;
    ambulanceRun = false;

    const info = gameInfo[kind];

    openModal("gameModal");
    lastGameKind = kind;
    keepAwake(true);
    gameRound = { kind, done: false, locked: false };

    $("gameTitle").textContent = info.title;
    $("gameEmoji").textContent = info.emoji;
    $("gameQuestion").textContent = "";
    $("gameOptions").innerHTML = "";
    $("gameOptions").className = "game-options";
    $("gameBoard").innerHTML = "";
    $("gameBoard").className = "game-board";
    $("gameBoard").style.gridTemplateColumns = "repeat(4,minmax(0,1fr))";
    $("gameResult").hidden = true;

    // Önceki oyunun sürükleme dinleyicileri yeni oyuna taşmasın.
    for (const event of ["down", "move", "up", "cancel", "leave"]) {
        $("gameBoard")["onpointer" + event] = null;
    }
    $("gameAgain").hidden = true;
    gameStatus("");

    info.start(gameRound);
}

// recordKey: rekorun tutulduğu alan. lowerIsBetter: az hamle daha iyi.
function finishGame(result) {
    const round = gameRound;
    if (!appOpen || !round || round.done) return;

    round.done = true;
    stopGame();

    const bonus = result.fixedReward ? 1 : difficulties[state.difficulty].bonus;
    // Aynı gün çok oynanınca coin ödülü azalır (rekorlar ve XP etkilenmez).
    const tired = playFactor("games", 10) < 1;
    const coins = Math.round(result.coins * bonus * (tired ? .25 : 1));
    const xp = Math.round(result.xp * bonus);

    const old = state.records[result.recordKey];
    const record = result.score > 0 && (result.lowerIsBetter
        ? old === 0 || result.score < old
        : result.score > old);

    if (record) state.records[result.recordKey] = result.score;

    state.coins += coins;
    addXP(xp);

    let sticker = "";

    if (result.won) {
        state.gamesWon++;
        questProgress("games");
        cupProgress("game");
        state.week.games++;
        sticker = rollSticker(.25);
    }

    const saved = commit();
    renderGames();

    $("gameBoard").querySelectorAll("button").forEach(button => {
        button.disabled = true;
    });

    $("gameResult").hidden = false;
    $("gameAgain").hidden = false;
    $("gameResult").textContent =
        (result.won ? "🎉 " : "🙂 ") + result.text +
        t("\n+{0} coin, +{1} XP", coins, xp) + sticker +
        (tired ? t("\n😴 Bugün çok oynadın; mini oyun coinleri yarın yeniden tam olur.") : "") +
        (record ? t("\n🏅 Yeni rekor!") : "") +
        (currentUser && !saved ? t("\nİlerleme şu anda kalıcı kaydedilemedi.") : "");

    if (record) confetti();
    if (result.won) playSound();

    // Eczane yolculuğu labirentle yapıldıysa sonunda eczane açılır.
    if (round.kind === "maze" && pharmacyTrip) afterTrip(result.won);
    if (round.kind === "maze" && ambulanceRun) afterCall(result.won);
}

/* Hızlı Muayene: 5 soruluk tur */

function startQuiz(round) {
    round.questions = shuffled(quizQuestions).slice(0,5);
    round.index = 0;
    round.score = 0;
    $("gameBoard").innerHTML = "";
    showQuizQuestion();
}

function showQuizQuestion() {
    const round = gameRound;
    if (!round) return;

    const item = round.questions[round.index];
    gameStatus(t("Soru {0} / {1} • Doğru: {2}", round.index + 1, round.questions.length, round.score));
    $("gameQuestion").textContent = item.question;
    $("gameOptions").innerHTML = "";

    shuffled(item.choices).forEach(choice => {
        const button = document.createElement("button");
        button.className = "choice";
        button.textContent = choice;
        button.onclick = () => answerQuiz(choice, button);
        $("gameOptions").appendChild(button);
    });
}

function answerQuiz(choice, button) {
    const round = gameRound;
    if (!appOpen || !round || round.done || round.locked) return;

    round.locked = true;

    const item = round.questions[round.index];
    const right = choice === item.correct;
    if (right) round.score++;
    playSound(right ? "tap" : "bad");

    $("gameOptions").querySelectorAll("button").forEach(option => {
        option.disabled = true;
        if (option.textContent === item.correct) option.textContent = "✅ " + item.correct;
    });

    if (!right) button.textContent = "❌ " + choice;

    gameTimers.push(setTimeout(() => {
        if (gameRound !== round) return;

        round.locked = false;
        round.index++;

        if (round.index < round.questions.length) {
            showQuizQuestion();
            return;
        }

        $("gameOptions").innerHTML = "";
        $("gameQuestion").textContent = t("Tur bitti!");
        gameStatus("");

        finishGame({
            recordKey: round.recordKey || "quiz",
            score: round.score,
            coins: round.score * 8,
            xp: round.score * 6,
            won: round.score >= 3,
            fixedReward: true,
            text: t("{0} / {1} doğru cevap.", round.score, round.questions.length)
        });
    }, 1000));
}

/* Mikrop Avı: süre bitmeden mikroplara dokun */

function startGerm(round) {
    const speed = { kolay: 950, normal: 750, zor: 550 }[state.difficulty];
    const board = $("gameBoard");

    round.score = 0;
    round.time = 20;
    round.status = () => gameStatus(t("⏱️ {0} sn • Puan: {1}", round.time, round.score));

    $("gameQuestion").textContent =
        t("🦠 mikroplara dokun. Çiçek, yıldız ve elmaya dokunursan puan kaybedersin.");

    for (let i = 0; i < 12; i++) {
        const cell = document.createElement("button");
        cell.className = "game-cell";
        cell.onclick = () => hitGerm(cell);
        board.appendChild(cell);
    }

    const spawn = () => {
        const cells = [...board.children];
        cells.forEach(cell => { cell.textContent = ""; });

        shuffled(cells).slice(0, state.difficulty === "kolay" ? 2 : 3)
            .forEach((cell, index) => {
                cell.textContent = index === 0 || Math.random() < .45
                    ? "🦠" : pick(["🌸", "⭐", "🍎"]);
            });
    };

    spawn();
    round.status();
    gameTimers.push(setInterval(spawn, speed));

    gameTimers.push(setInterval(() => {
        round.time--;
        round.status();

        if (round.time <= 0) {
            [...board.children].forEach(cell => { cell.textContent = ""; });

            finishGame({
                recordKey: "germ",
                score: round.score,
                coins: Math.min(round.score * 2, 40),
                xp: Math.min(round.score, 25),
                won: round.score >= 8,
                text: t("Süre bitti! {0} mikrop yakaladın.", round.score)
            });
        }
    }, 1000));
}

function hitGerm(cell) {
    const round = gameRound;
    if (!round || round.done || !cell.textContent) return;

    if (cell.textContent === "🦠") {
        round.score++;
        playSound("tap");
    } else {
        round.score = Math.max(0, round.score - 1);
        playSound("bad");
    }

    cell.textContent = "";
    round.status();
}

/* Hafıza Kartları: aynı kartları eşleştir */

function startMemory(round) {
    const pairs = { kolay: 4, normal: 6, zor: 8 }[state.difficulty];
    const icons = shuffled(["🩺", "💊", "🩹", "🌡️", "🦷", "🧼", "🍎", "🚑", "🔬", "❤️"])
        .slice(0,pairs);

    round.pairs = pairs;
    round.found = 0;
    round.moves = 0;
    round.open = [];
    round.status = () =>
        gameStatus(t("Hamle: {0} • Eşleşen: {1} / {2}", round.moves, round.found, pairs));

    $("gameQuestion").textContent = t("İki kart aç. Aynıysa açık kalır.");

    shuffled([...icons, ...icons]).forEach(icon => {
        const cell = document.createElement("button");
        cell.className = "game-cell";
        cell.textContent = "❔";
        cell.onclick = () => flipCard(cell, icon);
        $("gameBoard").appendChild(cell);
    });

    round.status();
}

function flipCard(cell, icon) {
    const round = gameRound;
    if (!round || round.done || round.locked) return;
    if (cell.classList.contains("flipped") || cell.classList.contains("done")) return;

    cell.textContent = icon;
    cell.classList.add("flipped");
    round.open.push(cell);
    playSound("tap");

    if (round.open.length < 2) return;

    const [first, second] = round.open;
    round.open = [];
    round.moves++;

    if (first.textContent === second.textContent) {
        for (const card of [first, second]) {
            card.classList.replace("flipped","done");
        }

        round.found++;
        round.status();

        if (round.found === round.pairs) {
            const quick = round.moves <= round.pairs * 2;

            finishGame({
                recordKey: "memory_" + state.difficulty,
                score: round.moves,
                lowerIsBetter: true,
                coins: quick ? 30 : 20,
                xp: quick ? 20 : 14,
                won: true,
                text: t("Tüm kartları {0} hamlede eşleştirdin.", round.moves) +
                    (quick ? t(" Hızlı hafıza bonusu!") : "")
            });
        }

        return;
    }

    round.locked = true;
    round.status();

    gameTimers.push(setTimeout(() => {
        if (gameRound !== round) return;

        for (const card of [first, second]) {
            card.textContent = "❔";
            card.classList.remove("flipped");
        }

        round.locked = false;
    }, 750));
}

/* Nabız Ritmi: işaret yeşil alandayken dokun */

function startHeart(round) {
    const speed = { kolay: 55, normal: 80, zor: 110 }[state.difficulty];
    const board = $("gameBoard");

    round.hits = 0;
    round.tries = 8;
    round.position = 0;
    round.direction = 1;
    round.status = () =>
        gameStatus(t("Kalan deneme: {0} • İsabet: {1}", round.tries, round.hits));

    $("gameQuestion").textContent =
        t("Kırmızı işaret yeşil alanın üstündeyken düğmeye bas.");

    board.style.gridTemplateColumns = "1fr";
    board.innerHTML = `
        <div class="pulse-track">
            <div class="pulse-zone" id="pulseZone"></div>
            <div class="pulse-marker" id="pulseMarker"></div>
        </div>
    `;

    const button = document.createElement("button");
    button.className = "primary-btn";
    button.textContent = t("❤️ Şimdi!");
    button.onclick = hitPulse;
    board.appendChild(button);

    moveZone(round);
    round.status();

    let last = performance.now();

    const step = now => {
        if (gameRound !== round || round.done) return;

        // Sekme arka plandayken biriken süre işareti sıçratmasın.
        const elapsed = Math.min((now - last) / 1000, .05);
        last = now;

        round.position += round.direction * speed * elapsed;

        if (round.position >= 100) {
            round.position = 100;
            round.direction = -1;
        } else if (round.position <= 0) {
            round.position = 0;
            round.direction = 1;
        }

        $("pulseMarker").style.left = round.position + "%";
        gameFrame = requestAnimationFrame(step);
    };

    gameFrame = requestAnimationFrame(step);
}

function moveZone(round) {
    round.zoneWidth = { kolay: 26, normal: 20, zor: 14 }[state.difficulty];
    round.zoneStart = Math.random() * (100 - round.zoneWidth);

    $("pulseZone").style.left = round.zoneStart + "%";
    $("pulseZone").style.width = round.zoneWidth + "%";
}

function hitPulse() {
    const round = gameRound;
    if (!round || round.done) return;

    const hit = round.position >= round.zoneStart &&
        round.position <= round.zoneStart + round.zoneWidth;

    if (hit) round.hits++;
    playSound(hit ? "tap" : "bad");
    round.tries--;

    if (round.tries > 0) {
        moveZone(round);
        round.status();
        return;
    }

    gameStatus("");

    finishGame({
        recordKey: "heart",
        score: round.hits,
        coins: round.hits * 4,
        xp: round.hits * 3,
        won: round.hits >= 5,
        text: `8 denemede ${round.hits} isabet.`
    });
}

/* El Yıkama: adımları doğru sıraya diz */

const washSteps = [
    t("💧 Ellerini suyla ıslat"),
    t("🧴 Sabun al"),
    t("👐 Avuçlarını köpürt"),
    t("🤲 Parmak aralarını ve tırnaklarını ov"),
    t("🚿 Ellerini bol suyla durula"),
    t("🧻 Ellerini kurula"),
    t("🚰 Musluğu kâğıt havluyla kapat")
];

function startWash(round) {
    const picks = {
        kolay: [0,1,4,5], normal: [0,1,2,4,5], zor: [0,1,2,3,4,5,6]
    }[state.difficulty];

    round.steps = picks.map(index => washSteps[index]);
    round.next = 0;
    round.mistakes = 0;
    round.status = () => gameStatus(
        t("Adım: {0} / {1} • Hata: {2}", round.next, round.steps.length, round.mistakes)
    );

    $("gameQuestion").textContent =
        t("Ellerini yıkarken hangi adım önce gelir? Adımlara sırasıyla dokun.");
    $("gameBoard").style.gridTemplateColumns = "1fr";

    shuffled(round.steps).forEach(step => {
        const button = document.createElement("button");
        button.className = "choice";
        button.textContent = step;
        button.onclick = () => pickWashStep(step, button);
        $("gameOptions").appendChild(button);
    });

    round.status();
}

function pickWashStep(step, button) {
    const round = gameRound;
    if (!appOpen || !round || round.done) return;

    if (step !== round.steps[round.next]) {
        round.mistakes++;
        playSound("bad");

        button.classList.remove("wrong");
        void button.offsetWidth;
        button.classList.add("wrong");
        gameTimers.push(setTimeout(() => button.classList.remove("wrong"), 450));

        round.status();
        return;
    }

    const focused = document.activeElement === button;

    round.next++;
    playSound("tap");
    button.remove();

    const done = document.createElement("div");
    done.className = "wash-done";
    done.textContent = `${round.next}. ${step}`;
    $("gameBoard").appendChild(done);
    round.status();

    if (round.next < round.steps.length) {
        if (focused) $("gameOptions").querySelector("button").focus();
        return;
    }

    const score = Math.max(1, 10 - round.mistakes * 2);
    gameStatus("");

    finishGame({
        recordKey: "wash",
        score,
        coins: score * 3,
        xp: score * 2,
        won: round.mistakes <= 2,
        text: round.mistakes
            ? t("Elleri {0} hatayla yıkadın. Puanın: {1} / 10.", round.mistakes, score)
            : t("Hiç hata yapmadan tertemiz eller! Puanın: 10 / 10.")
    });

    if (focused) $("gameAgain").focus();
}

/* Diş Fırçalama: lekeli dişleri fırçalayarak temizle */

function startTeeth(round) {
    const dirt = { kolay: 2, normal: 3, zor: 4 }[state.difficulty];
    const board = $("gameBoard");

    round.clean = 0;
    round.time = state.difficulty === "kolay" ? 25 : 20;
    round.status = () =>
        gameStatus(t("⏱️ {0} sn • Temiz diş: {1} / 12", round.time, round.clean));

    $("gameQuestion").textContent =
        t("Parmağını ya da fareyi basılı tutup dişlerin üstünde gezdir. ") +
        t("Lekeler silinene kadar fırçala!");

    board.style.gridTemplateColumns = "repeat(6,minmax(0,1fr))";
    board.classList.add("free");

    for (let i = 0; i < 12; i++) {
        const cell = document.createElement("button");
        cell.className = "game-cell tooth d" + dirt;
        cell.textContent = "🦷";
        cell.dataset.dirt = dirt;
        cell.dataset.rub = 0;
        cell.setAttribute("aria-label", t("Lekeli diş"));

        // Klavye ve tek dokunuş da bir fırça darbesi sayılır.
        cell.onclick = () => brushTooth(cell);
        board.appendChild(cell);
    }

    let last = null;

    board.onpointerdown = event => {
        last = { x: event.clientX, y: event.clientY };
    };

    board.onpointerup = board.onpointercancel = board.onpointerleave = () => {
        last = null;
    };

    board.onpointermove = event => {
        if (!last || gameRound !== round || round.done) return;

        const distance = Math.hypot(event.clientX - last.x, event.clientY - last.y);
        last = { x: event.clientX, y: event.clientY };

        const cell = document.elementFromPoint(event.clientX, event.clientY)
            ?.closest(".tooth");
        if (!cell || !board.contains(cell)) return;

        // Dişin üstünde yeterince yol gidilince bir kat leke silinir.
        const rub = Number(cell.dataset.rub) + distance;
        cell.dataset.rub = rub >= 70 ? 0 : rub;
        if (rub >= 70) brushTooth(cell);
    };

    round.status();

    gameTimers.push(setInterval(() => {
        round.time--;
        round.status();
        if (round.time <= 0) finishTeeth(round);
    }, 1000));
}

function brushTooth(cell) {
    const round = gameRound;
    if (!round || round.done) return;

    const dirt = Number(cell.dataset.dirt);
    if (!dirt) return;

    cell.dataset.dirt = dirt - 1;
    cell.className = "game-cell tooth " + (dirt > 1 ? "d" + (dirt - 1) : "clean");
    if (dirt > 1) return;

    cell.setAttribute("aria-label", t("Temiz diş"));
    round.clean++;
    playSound("tap");
    round.status();

    if (round.clean === 12) finishTeeth(round);
}

function finishTeeth(round) {
    const all = round.clean === 12;
    const bonus = all ? round.time : 0;

    gameStatus("");

    finishGame({
        recordKey: "teeth",
        score: round.clean + bonus,
        coins: Math.min(round.clean * 2 + bonus, 40),
        xp: Math.min(round.clean + bonus, 25),
        won: all,
        text: all
            ? t("Bütün dişler pırıl pırıl! Kalan {0} saniye bonus puan oldu.", bonus)
            : t("Süre bitti! 12 dişten {0} tanesini temizledin.", round.clean)
    });
}

/* Sağlıklı Tabak: düşen sağlıklı yiyecekleri yakala */

const healthyFoods = ["🍎", "🥕", "🥦", "🍌", "🥛", "🍇", "🐟", "🥚", "🍊", "🥒"];
const junkFoods = ["🍭", "🍩", "🥤", "🍟", "🍬", "🍫"];

function startPlate(round) {
    const speed = { kolay: 24, normal: 32, zor: 42 }[state.difficulty];
    const pace = { kolay: 950, normal: 750, zor: 560 }[state.difficulty];
    const board = $("gameBoard");

    round.score = 0;
    round.time = 25;
    round.items = [];
    round.status = () => gameStatus(t("⏱️ {0} sn • Tabak: {1}", round.time, round.score));

    $("gameQuestion").textContent =
        t("Düşen sağlıklı yiyeceklere dokunup tabağına al. ") +
        t("Şekerleme ve kızartmaya dokunursan puan kaybedersin.");

    board.style.gridTemplateColumns = "1fr";
    board.innerHTML = '<div class="fall-area" id="fallArea"></div>';

    // y: alanın yüksekliğine göre yüzde, speed: saniyede yüzde.
    const spawn = () => {
        const healthy = Math.random() < .6;
        const button = document.createElement("button");
        const item = {
            button, healthy, y: -14,
            speed: speed * (.85 + Math.random() * .4)
        };

        button.className = "fall-item";
        button.textContent = pick(healthy ? healthyFoods : junkFoods);
        button.style.left = 8 + Math.random() * 84 + "%";
        button.style.top = item.y + "%";

        // Hareketli hedefte dokunuş, parmak kalkmadan sayılır.
        button.onpointerdown = event => {
            event.preventDefault();
            catchFood(item);
        };
        button.onclick = () => catchFood(item);

        $("fallArea").appendChild(button);
        round.items.push(item);
    };

    spawn();
    round.status();
    gameTimers.push(setInterval(spawn, pace));

    gameTimers.push(setInterval(() => {
        round.time--;
        round.status();
        if (round.time > 0) return;

        round.items.forEach(item => item.button.remove());
        round.items = [];
        gameStatus("");

        finishGame({
            recordKey: "plate",
            score: round.score,
            coins: Math.min(round.score * 2, 40),
            xp: Math.min(round.score, 25),
            won: round.score >= 10,
            text: t("Süre bitti! Tabağında {0} sağlıklı yiyecek var.", round.score)
        });
    }, 1000));

    let last = performance.now();

    const step = now => {
        if (gameRound !== round || round.done) return;

        // Sekme arka plandayken biriken süre yiyecekleri sıçratmasın.
        const elapsed = Math.min((now - last) / 1000, .05);
        last = now;

        round.items = round.items.filter(item => {
            item.y += item.speed * elapsed;

            if (item.y > 104) {
                item.button.remove();
                return false;
            }

            item.button.style.top = item.y + "%";
            return true;
        });

        gameFrame = requestAnimationFrame(step);
    };

    gameFrame = requestAnimationFrame(step);
}

function catchFood(item) {
    const round = gameRound;
    if (!round || round.done || !round.items.includes(item)) return;

    if (item.healthy) {
        round.score++;
        playSound("tap");
    } else {
        round.score = Math.max(0, round.score - 1);
        playSound("bad");
    }

    item.button.remove();
    round.items = round.items.filter(other => other !== item);
    round.status();
}

/* Yara Bandı: bandı yaranın üstüne yerleştir */

function startBandage(round) {
    const board = $("gameBoard");

    round.score = 0;
    round.turn = 0;
    round.turns = 6;
    round.tolerance = { kolay: 40, normal: 30, zor: 30 }[state.difficulty];
    round.status = note => gameStatus(
        t("Yara: {0} / {1} • Puan: {2}", round.turn + 1, round.turns, round.score) +
        (note ? ` • ${note}` : "")
    );

    $("gameQuestion").textContent =
        t("Yara bandını sürükleyip kırmızı yaranın tam üstüne bırak.") +
        (state.difficulty === "zor"
            ? t(" Dikkat: yara kısa süre sonra kaybolur, yerini aklında tut!") : "");

    board.style.gridTemplateColumns = "1fr";
    board.innerHTML = `
        <div class="band-area" id="bandArea">
            <div class="wound" id="wound"></div>
            <button class="band" id="band"
                aria-label="${escapeHTML(t("Yara bandı. Ok tuşlarıyla taşı, Enter ile yapıştır."))}">🩹</button>
        </div>
    `;

    const area = $("bandArea");
    const band = $("band");
    let drag = null;

    band.onpointerdown = event => {
        if (!event.isPrimary || round.locked || round.done) return;

        const rect = area.getBoundingClientRect();
        event.preventDefault();
        band.focus();

        drag = {
            offsetX: event.clientX - rect.left - round.bandX / 100 * rect.width,
            offsetY: event.clientY - rect.top - round.bandY / 100 * rect.height,
            moved: false
        };

        try {
            band.setPointerCapture?.(event.pointerId);
        } catch (error) {
            console.warn("İşaretçi yakalanamadı:", error);
        }
    };

    band.onpointermove = event => {
        if (!drag || round.locked) return;

        const rect = area.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        drag.moved = true;
        moveBand(round,
            (event.clientX - rect.left - drag.offsetX) / rect.width * 100,
            (event.clientY - rect.top - drag.offsetY) / rect.height * 100);
    };

    band.onpointerup = band.onpointercancel = event => {
        const moved = drag && drag.moved;
        drag = null;
        if (moved && event.type === "pointerup") placeBand(round);
    };

    band.onkeydown = event => {
        const moves = {
            ArrowLeft: [-3,0], ArrowRight: [3,0],
            ArrowUp: [0,-4], ArrowDown: [0,4]
        };

        if (own(moves,event.key)) {
            event.preventDefault();
            if (round.locked) return;
            moveBand(round, round.bandX + moves[event.key][0], round.bandY + moves[event.key][1]);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            placeBand(round);
        }
    };

    nextWound(round);
}

function moveBand(round, x, y) {
    round.bandX = clamp(x,4,96);
    round.bandY = clamp(y,6,94);
    $("band").style.left = round.bandX + "%";
    $("band").style.top = round.bandY + "%";
}

function nextWound(round) {
    const turn = round.turn;

    round.locked = false;
    round.woundX = 12 + Math.random() * 76;
    round.woundY = 12 + Math.random() * 50;

    $("wound").style.left = round.woundX + "%";
    $("wound").style.top = round.woundY + "%";
    $("wound").classList.remove("faded");
    moveBand(round,50,86);
    round.status();

    if (state.difficulty !== "zor") return;

    gameTimers.push(setTimeout(() => {
        if (gameRound === round && round.turn === turn && !round.locked) {
            $("wound").classList.add("faded");
        }
    }, 1300));
}

function placeBand(round) {
    if (gameRound !== round || round.done || round.locked) return;

    const rect = $("bandArea").getBoundingClientRect();
    const distance = Math.hypot(
        (round.bandX - round.woundX) / 100 * rect.width,
        (round.bandY - round.woundY) / 100 * rect.height
    );
    const points = distance <= round.tolerance / 2 ? 2
        : distance <= round.tolerance ? 1 : 0;

    round.locked = true;
    round.score += points;
    $("wound").classList.remove("faded");
    playSound(points ? "tap" : "bad");
    round.status([t("😅 Kaçtı"), t("👍 Yakın"), t("🎯 Tam isabet")][points]);

    gameTimers.push(setTimeout(() => {
        if (gameRound !== round) return;

        round.turn++;

        if (round.turn < round.turns) {
            nextWound(round);
            return;
        }

        gameStatus("");

        finishGame({
            recordKey: "bandage",
            score: round.score,
            coins: round.score * 3,
            xp: round.score * 2,
            won: round.score >= 7,
            text: t("{0} yaradan {1} / {2} puan topladın.", round.turns, round.score, round.turns * 2)
        });
    }, 800));
}

function repeatGame() {
    startGame(lastGameKind);
}
