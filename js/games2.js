"use strict";

/* ===== YENİ MİNİ OYUNLAR ===== */

/* Ambulans Yolu: hastayı al, labirentten hastaneye ulaştır */

// size tek sayı olmalıdır. true: duvar, false: yol. Her iki hücre arasında tek yol vardır.
function buildMaze(size) {
    const grid = Array.from({ length: size }, () => Array(size).fill(true));
    const stack = [[1,1]];

    grid[1][1] = false;

    while (stack.length) {
        const [x, y] = stack[stack.length - 1];
        const next = shuffled([[2,0], [-2,0], [0,2], [0,-2]]).find(([dx, dy]) =>
            x + dx > 0 && y + dy > 0 && x + dx < size - 1 && y + dy < size - 1 &&
            grid[y + dy][x + dx]);

        if (!next) {
            stack.pop();
            continue;
        }

        const [dx, dy] = next;
        grid[y + dy / 2][x + dx / 2] = false;
        grid[y + dy][x + dx] = false;
        stack.push([x + dx, y + dy]);
    }

    return grid;
}

function startMaze(round) {
    const size = { kolay: 7, normal: 9, zor: 11 }[state.difficulty];
    const board = $("gameBoard");

    round.size = size;
    round.grid = buildMaze(size);
    round.x = 1;
    round.y = 1;
    round.hospital = [size - 2, size - 2];
    round.patient = Math.random() < .5 ? [size - 2, 1] : [1, size - 2];
    round.carrying = false;
    round.time = { kolay: 40, normal: 55, zor: 75 }[state.difficulty];
    round.status = () => gameStatus(t("⏱️ {0} sn • ", round.time) + (round.carrying
        ? t("Hasta ambulansta, hastaneye!") : t("Önce hastayı al")));

    $("gameQuestion").textContent = t("Ambulansı ok tuşlarıyla, düğmelerle ya da yola dokunarak sür. Önce hastayı al, sonra hastaneye ulaş.");

    board.style.gridTemplateColumns = `repeat(${size},minmax(0,1fr))`;
    board.classList.add("maze");
    round.cells = [];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = document.createElement("div");
            cell.className = "maze-cell" + (round.grid[y][x] ? " wall" : "");
            if (!round.grid[y][x]) cell.onclick = () => driveTo(x, y);
            board.appendChild(cell);
            round.cells.push(cell);
        }
    }

    const pad = document.createElement("div");
    pad.className = "dpad";

    for (const [label, name, area, dx, dy] of [
        ["⬆️", t("Yukarı"), "up", 0, -1], ["⬅️", t("Sola"), "left", -1, 0],
        ["⬇️", t("Aşağı"), "down", 0, 1], ["➡️", t("Sağa"), "right", 1, 0]
    ]) {
        const button = document.createElement("button");
        button.className = "choice";
        button.style.gridArea = area;
        button.textContent = label;
        button.setAttribute("aria-label", name);
        button.onclick = () => drive(dx, dy);
        pad.appendChild(button);
    }

    $("gameOptions").appendChild(pad);

    // Ok tuşları, odak pencerenin neresinde olursa olsun ambulansı sürer.
    $("gameModal").onkeydown = event => {
        const moves = {
            ArrowLeft: [-1,0], ArrowRight: [1,0],
            ArrowUp: [0,-1], ArrowDown: [0,1]
        };

        if (!own(moves,event.key)) return;
        event.preventDefault();
        drive(...moves[event.key]);
    };

    drawMaze(round);
    round.status();

    gameTimers.push(setInterval(() => {
        round.time--;
        round.status();
        if (round.time > 0) return;

        $("gameOptions").innerHTML = "";
        gameStatus("");

        finishGame({
            recordKey: "maze",
            score: 0,
            coins: 5,
            xp: 4,
            won: false,
            text: t("Süre doldu! Ambulans yolda kaldı.")
        });
    }, 1000));
}

function drawMaze(round) {
    const at = ([x, y]) => round.cells[y * round.size + x];

    round.cells.forEach(cell => { cell.textContent = ""; });
    at(round.hospital).textContent = "🏥";
    if (!round.carrying) at(round.patient).textContent = "🤕";
    at([round.x, round.y]).textContent = "🚑";
}

function drive(dx, dy) {
    const round = gameRound;
    if (!round || round.done || round.kind !== "maze") return;

    const x = round.x + dx;
    const y = round.y + dy;
    if (round.grid[y][x]) return;

    round.x = x;
    round.y = y;

    if (!round.carrying && x === round.patient[0] && y === round.patient[1]) {
        round.carrying = true;
        playSound("ok");
    }

    drawMaze(round);
    round.status();

    if (!round.carrying || x !== round.hospital[0] || y !== round.hospital[1]) return;

    $("gameOptions").innerHTML = "";
    gameStatus("");

    finishGame({
        recordKey: "maze",
        score: round.time,
        coins: Math.min(12 + round.time, 40),
        xp: Math.min(8 + Math.floor(round.time / 2), 25),
        won: true,
        text: t("Hasta hastaneye ulaştı! Bitime {0} saniye vardı.", round.time)
    });
}

// Aynı sıra ya da sütundaki, arası açık bir yola dokununca ambulans oraya gider.
function driveTo(x, y) {
    const round = gameRound;
    if (!round || round.done || round.kind !== "maze") return;

    const dx = Math.sign(x - round.x);
    const dy = Math.sign(y - round.y);
    if ((dx !== 0) === (dy !== 0)) return;

    for (let cx = round.x + dx, cy = round.y + dy; cx !== x || cy !== y; cx += dx, cy += dy) {
        if (round.grid[cy][cx]) return;
    }

    while (!round.done && (round.x !== x || round.y !== y)) drive(dx, dy);
}

/* Röntgen Yapbozu: kemikleri iskeletteki yerine yerleştir */

// Parçalar 200×300'lük bir iskelet çiziminin yollarıdır. type: aynı türden parçalar
// (iki kol, iki bacak) birbirinin yerine konabilir. box: yerin dokunma alanı [x, y, en, boy].
const boneParts = [
    {
        id: "skull", type: "skull", name: t("Kafatası"), box: [70, 4, 60, 62],
        shape: '<circle cx="100" cy="30" r="22"/><path d="M90 52 L90 62 L110 62 L110 52"/>'
    },
    {
        id: "ribs", type: "ribs", name: t("Göğüs Kafesi"), box: [60, 72, 80, 58],
        shape: '<ellipse cx="100" cy="84" rx="28" ry="8"/><ellipse cx="100" cy="102" rx="33" ry="8"/><ellipse cx="100" cy="120" rx="28" ry="8"/>'
    },
    {
        id: "spine", type: "spine", name: t("Omurga"), box: [90, 66, 20, 98],
        shape: '<path d="M100 68 L100 162"/>'
    },
    {
        id: "pelvis", type: "pelvis", name: t("Leğen Kemiği"), box: [64, 158, 72, 40],
        shape: '<path d="M70 168 Q100 152 130 168 Q126 194 100 186 Q74 194 70 168 Z"/>'
    },
    {
        id: "armL", type: "arm", name: t("Kol"), box: [26, 70, 36, 110],
        shape: '<path d="M58 78 L44 124 L36 172"/>'
    },
    {
        id: "armR", type: "arm", name: t("Kol"), box: [138, 70, 36, 110],
        shape: '<path d="M142 78 L156 124 L164 172"/>'
    },
    {
        id: "legL", type: "leg", name: t("Bacak"), box: [66, 196, 32, 100],
        shape: '<path d="M86 198 L82 246 L80 292"/>'
    },
    {
        id: "legR", type: "leg", name: t("Bacak"), box: [102, 196, 32, 100],
        shape: '<path d="M114 198 L118 246 L120 292"/>'
    }
];

function startBones(round) {
    const hard = state.difficulty === "zor";
    const loose = state.difficulty === "kolay"
        ? ["skull", "ribs", "pelvis", "armL", "legL"]
        : boneParts.map(part => part.id);
    const board = $("gameBoard");

    round.mistakes = 0;
    round.left = loose.length;
    round.pick = null;
    round.status = () =>
        gameStatus(t("Kalan kemik: {0} • Hata: {1}", round.left, round.mistakes));

    $("gameQuestion").textContent = hard
        ? t("Önce bir kemik seç, sonra iskelette olması gereken yere dokun. Bu zorlukta kemiklerin gölgesi görünmez!")
        : t("Önce bir kemik seç, sonra iskeletteki gölgesine dokun.");

    board.style.gridTemplateColumns = "1fr";
    board.innerHTML = `
        <div class="xray${hard ? " blind" : ""}">
            <svg viewBox="0 0 200 300" role="group" aria-label="${escapeHTML(t("İskelet"))}">
                ${boneParts.map(part => `
                    <g class="bone-slot${loose.includes(part.id) ? "" : " filled"}" data-part="${part.id}">
                        ${part.shape}
                        <circle class="mark" r="8"
                            cx="${part.box[0] + part.box[2] / 2}" cy="${part.box[1] + part.box[3] / 2}"/>
                        <rect class="hit" x="${part.box[0]}" y="${part.box[1]}"
                            width="${part.box[2]}" height="${part.box[3]}"/>
                    </g>
                `).join("")}
            </svg>
        </div>
    `;

    board.querySelectorAll(".bone-slot:not(.filled)").forEach(slot => {
        slot.setAttribute("tabindex", "0");
        slot.setAttribute("role", "button");
        slot.setAttribute("aria-label", t("Boş kemik yeri"));
        slot.onclick = () => placeBone(slot.dataset.part);
        slot.onkeydown = event => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            placeBone(slot.dataset.part);
        };
    });

    $("gameOptions").classList.add("bone-tray");

    shuffled(boneParts.filter(part => loose.includes(part.id))).forEach(part => {
        const [x, y, width, height] = part.box;
        const button = document.createElement("button");

        button.className = "bone-piece";
        button.dataset.part = part.id;
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = `
            <svg viewBox="${x - 6} ${y - 6} ${width + 12} ${height + 12}" aria-hidden="true">${part.shape}</svg>
            <small>${escapeHTML(part.name)}</small>
        `;
        button.onclick = () => pickBone(part.id);
        $("gameOptions").appendChild(button);
    });

    round.status();
}

function pickBone(id) {
    const round = gameRound;
    if (!round || round.done) return;

    round.pick = id;
    playSound("tap");

    $("gameOptions").querySelectorAll(".bone-piece").forEach(button => {
        const active = button.dataset.part === id;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

function placeBone(slotId) {
    const round = gameRound;
    if (!round || round.done) return;

    const slot = $("gameBoard").querySelector(`[data-part="${slotId}"]`);
    if (!slot || slot.classList.contains("filled")) return;

    if (!round.pick) {
        toast(t("🦴 Önce aşağıdan bir kemik seç."));
        return;
    }

    const piece = boneParts.find(part => part.id === round.pick);
    const target = boneParts.find(part => part.id === slotId);

    if (piece.type !== target.type) {
        round.mistakes++;
        playSound("bad");
        slot.classList.add("wrong");
        gameTimers.push(setTimeout(() => slot.classList.remove("wrong"), 450));
        round.status();
        return;
    }

    slot.classList.add("filled");
    slot.removeAttribute("tabindex");
    slot.setAttribute("aria-label", target.name);
    slot.onclick = slot.onkeydown = null;

    $("gameOptions").querySelector(`[data-part="${round.pick}"]`).remove();
    round.pick = null;
    round.left--;
    playSound("tap");
    round.status();

    if (round.left > 0) return;

    const score = Math.max(1, 10 - round.mistakes * 2);
    gameStatus("");

    finishGame({
        recordKey: "bones",
        score,
        coins: score * 3,
        xp: score * 2,
        won: round.mistakes <= 2,
        text: round.mistakes
            ? t("İskelet tamamlandı! Hata: {0}. Puanın: {1} / 10.", round.mistakes, score)
            : t("İskeleti hiç hata yapmadan tamamladın! Puanın: 10 / 10.")
    });
}

/* İlaç Sayma: kutuya istenen sayıda tablet koy */

function startCount(round) {
    round.turn = 0;
    round.turns = 5;
    round.score = 0;

    $("gameBoard").style.gridTemplateColumns = "1fr";
    nextCount(round);
}

function countStatus(round, note = "") {
    gameStatus(t("Tur: {0} / {1} • Doğru: {2}", round.turn + 1, round.turns, round.score) +
        (state.difficulty === "kolay" ? " • " + t("Kutuda: {0}", round.inBox) : "") +
        (note ? " • " + note : ""));
}

function nextCount(round) {
    // Zor seviyede istenen sayı küçük bir toplama işlemidir.
    const first = between({ kolay: [1,5], normal: [3,9], zor: [2,6] }[state.difficulty]);
    const second = state.difficulty === "zor" ? between([1,6]) : 0;

    round.target = first + second;
    round.inBox = 0;
    round.locked = false;

    $("gameQuestion").textContent = (second
        ? t("Kutuya {0} + {1} tablet koy.", first, second)
        : t("Kutuya {0} tablet koy.", first)) + " " +
        t("Bu bir sayma oyunudur; gerçek ilaçlara yalnızca büyükler dokunur.");

    $("gameBoard").innerHTML = `
        <div class="pill-box" id="pillBox"></div>
        <div class="pill-tray" id="pillTray"></div>
    `;

    $("pillBox").setAttribute("aria-label", t("İlaç kutusu"));

    for (let i = 0; i < Math.min(round.target + between([2,4]), 15); i++) {
        const pill = document.createElement("button");
        pill.className = "pill";
        pill.textContent = "💊";
        pill.setAttribute("aria-label", t("Tablet"));
        pill.onclick = () => movePill(pill);
        $("pillTray").appendChild(pill);
    }

    const done = document.createElement("button");
    done.className = "primary-btn";
    done.textContent = t("✅ Tamam, saydım");
    done.onclick = checkCount;

    $("gameOptions").innerHTML = "";
    $("gameOptions").appendChild(done);

    countStatus(round);
}

// Tablete dokununca kutuya girer; kutudaki tablete dokununca geri çıkar.
function movePill(pill) {
    const round = gameRound;
    if (!round || round.done || round.locked) return;

    const inBox = pill.parentElement.id === "pillBox";

    $(inBox ? "pillTray" : "pillBox").appendChild(pill);
    round.inBox += inBox ? -1 : 1;
    pill.focus();
    playSound("tap");
    countStatus(round);
}

function checkCount() {
    const round = gameRound;
    if (!round || round.done || round.locked) return;

    const right = round.inBox === round.target;

    round.locked = true;
    if (right) round.score++;
    playSound(right ? "ok" : "bad");

    countStatus(round, right
        ? t("✅ Doğru!")
        : t("❌ Kutuda {0} tablet vardı, {1} olmalıydı.", round.inBox, round.target));

    gameTimers.push(setTimeout(() => {
        if (gameRound !== round) return;

        round.turn++;

        if (round.turn < round.turns) {
            nextCount(round);
            return;
        }

        $("gameOptions").innerHTML = "";
        $("gameQuestion").textContent = "";
        gameStatus("");

        finishGame({
            recordKey: "count",
            score: round.score,
            coins: round.score * 7,
            xp: round.score * 5,
            won: round.score >= 4,
            text: t("{0} turun {1} tanesinde doğru saydın.", round.turns, round.score)
        });
    }, 1400));
}

/* Nefes Egzersizi: balonla nefes al, ver. Puansızdır. */

function startBreath(round) {
    // [yazı, saniye, balonun büyüklüğü]
    const phases = [
        [t("Burnundan yavaşça nefes al…"), 4, 1.7],
        [t("Nefesini tut…"), 2, 1.7],
        [t("Ağzından yavaşça ver…"), 5, 1]
    ];

    round.cycle = 0;
    round.cycles = 4;
    round.phase = -1;
    round.left = 0;

    $("gameQuestion").textContent =
        t("Balon büyürken nefes al, küçülürken ver. Bu oyunda puan yok; amaç sakinleşmek.");

    $("gameBoard").style.gridTemplateColumns = "1fr";
    $("gameBoard").innerHTML =
        '<div class="breath-stage"><div class="balloon" id="balloon"></div></div>';

    // İlk büyüme de yumuşak başlasın diye başlangıç boyutu önce çizilir.
    void $("balloon").offsetWidth;

    const show = () => gameStatus(
        `${phases[round.phase][0]} ${round.left} • ${round.cycle + 1} / ${round.cycles}`
    );

    const next = () => {
        round.phase++;

        if (round.phase === phases.length) {
            round.phase = 0;
            round.cycle++;
        }

        if (round.cycle === round.cycles) {
            finishBreath(round);
            return;
        }

        const [, seconds, scale] = phases[round.phase];

        round.left = seconds;
        $("balloon").style.transitionDuration = seconds + "s";
        $("balloon").style.transform = `scale(${scale})`;
        show();
    };

    next();

    gameTimers.push(setInterval(() => {
        round.left--;
        if (round.left <= 0) next();
        else show();
    }, 1000));
}

// Puansız bitiş: rekor ya da coin yok, yalnızca küçük bir XP.
function finishBreath(round) {
    if (round.done) return;

    round.done = true;
    stopGame();
    addXP(5);

    const saved = commit();

    gameStatus("");
    $("gameResult").hidden = false;
    $("gameAgain").hidden = false;
    $("gameResult").textContent =
        t("😌 Harika! {0} derin nefes aldın. Umarım şimdi daha sakinsindir.", round.cycles) +
        "\n+5 XP" +
        (currentUser && !saved ? "\n" + t("İlerleme şu anda kalıcı kaydedilemedi.") : "");

    playSound();
}

Object.assign(gameInfo, {
    maze: { title: t("Ambulans Yolu"), emoji: "🚑", start: startMaze },
    bones: { title: t("Röntgen Yapbozu"), emoji: "🩻", start: startBones },
    count: { title: t("İlaç Sayma"), emoji: "💊", start: startCount },
    breath: { title: t("Nefes Egzersizi"), emoji: "🎈", start: startBreath }
});
