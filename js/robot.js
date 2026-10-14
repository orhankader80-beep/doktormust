"use strict";

/* ===== ROBOT ASİSTAN: ROBİ ===== */

// Robi gerçek bir yapay zekâ değildir: yazılan soruda anahtar kelime arar ve önceden
// yazılmış cevabı verir. İnternete bağlanmaz, yazılanlar hiçbir yere gönderilmez ve
// kaydedilmez.

// Türkçe harfleri sadeleştirir; böylece "çıkartma" ile "cikartma" aynı sayılır.
function plainText(text) {
    return String(text).toLocaleLowerCase("tr")
        .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
        .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
}

const robotJokes = [
    t("İskelet neden kavga etmez? Çünkü cesareti yok, yüreği de yok! 💀"),
    t("Doktor: \"Günde 8 bardak su iç.\" Robot: \"Ben içersem paslanırım!\" 🤖"),
    t("Termometre neden çok havalı? Çünkü derecesi var! 🌡️")
];

// keys: sorunun içinde aranan kelimeler (sadeleştirilmiş Türkçe ve İngilizce).
// answer: metin ya da o anki duruma göre metin üreten işlev. Üstteki konu önce denenir.
const robotTopics = [
    {
        keys: ["hastayim", "agriyor", "agrim", "atesim", "midem bulan", "kotu hissed", "iyi degilim",
            "i am sick", "i'm sick", "it hurts", "i feel bad", "i feel sick"],
        answer: t("Gerçekten kendini iyi hissetmiyorsan lütfen hemen bir büyüğüne söyle. Ben yalnızca bir oyun robotuyum; gerçek hastalıklara doktorlar bakar. 💙")
    },
    {
        keys: ["kimsin", "adin ne", "sen nesin", "yapay zeka", "who are you", "your name", "are you ai"],
        answer: t("Ben Robi, kliniğinin yardımcı robotuyum. Gerçek bir yapay zekâ değilim; yalnızca bana öğretilen cevapları bilirim. 🤖")
    },
    {
        keys: ["kim yapti", "yapan kim", "yapimci", "who made"],
        answer: t("Bu oyunu Mustafa yaptı! 🎉")
    },
    {
        keys: ["ne yapayim", "ne yapmaliyim", "simdi ne", "sirada ne", "what should", "what now", "what next"],
        answer: () => robotNextStep()
    },
    {
        keys: ["bugun", "olay", "today", "event"],
        answer: () => {
            const event = todayEvent();
            return t("Bugünün olayı: {0} {1}. {2}", event.emoji, event.name, event.text);
        }
    },
    {
        // Yalnızca "nasıl" geçen sorular daha belirli konulara (yıldız, coin…) bırakılır.
        keys: ["nasil oyna", "oynanir", "ogret", "how do i play", "how to play"],
        answer: t("Hastalar ekranından bir hasta seç. Önce derdini dinle, sonra aletlerle muayene et. ❗ işaretli bulgulara bak, ipucu tablosuyla karşılaştır ve doğru kartı seç. Sonra tedaviyi kendin uygula!")
    },
    {
        keys: ["yildiz", "star"],
        answer: t("Doğru kartı ilk denemede ve rapor istemeden bulursan 3 yıldız alırsın. Her yanlış kart ve istediğin her rapor bir yıldız götürür.")
    },
    {
        keys: ["coin", "para", "altin", "money"],
        answer: t("Hasta iyileştirerek, mini oyun oynayarak ve günlük ödülü alarak coin kazanırsın. Coinlerle mağazadan eşya ve klinik ekibi alabilirsin.")
    },
    {
        keys: ["elmas", "gem", "diamond"],
        answer: t("Elmaslar seviye atlayınca, rozet kazanınca ve haftanın özel hastasını iyileştirince gelir. Onlarla özel eşyalar alınır.")
    },
    {
        keys: ["cikartma", "album", "sticker"],
        answer: t("Vakalardan ve mini oyunlardan çıkartma çıkar. Albümdeki bir çıkartmaya dokunursan hakkında bilgi okursun. Bazıları Vücut Haritası'ndaki organları açar!")
    },
    {
        keys: ["pati", "kedi", "kopek", "tavsan", "hayvan", "pet", "cat", "dog", "rabbit"],
        answer: t("Pati Kliniği 3. seviyede açılır. Orada kedilere, köpeklere ve tavşanlara bakarsın: patilerini, tüylerini ve karınlarını kontrol et.")
    },
    {
        keys: ["bolum", "dis klinigi", "goz", "cilt", "acil", "kulak burun", "kbb", "beslenme kosesi", "ward", "dental", "eye"],
        answer: t("Uzmanlık bölümleri seviye atladıkça açılır: Diş Kliniği 2, Göz ve Pati Kliniği 3, Cilt ile Kulak Burun Boğaz 4, Çocuk Acil 5, Beslenme Köşesi 6. seviyede. Her bölümün kendi aletleri ve kartları var.")
    },
    {
        keys: ["sabir", "kalp", "patience", "heart"],
        answer: t("Her yanlış kart hastanın bir sabır kalbini götürür. Kalpler biterse hasta gider. Acele etme, önce muayene et!")
    },
    {
        keys: ["tahlil", "rapor", "rontgen", "report", "x-ray", "xray"],
        answer: t("Tahlil raporu vakanın kodunu verir; kodun anlamını Rehber'de bulursun. Görüntüleme raporu seçenekleri iki karta indirir. Her rapor bir yıldız götürür ve bir klinik gününde 3 rapor hakkın var.")
    },
    {
        keys: ["seviye", "xp", "level"],
        answer: () => t("Şu an {0}. seviyedesin. Hasta iyileştirdikçe ve mini oyun oynadıkça XP kazanır, seviye atlarsın.", state.level)
    },
    {
        keys: ["hikaye", "diploma", "story"],
        answer: t("Hikâye Modu'nda 6 bölüm var. Her bölümün sonunda bir baş vaka gelir; bölümü bitirince diplomanı alırsın.")
    },
    {
        keys: ["mektup", "fotograf", "letter", "photo"],
        answer: t("İyileşen hastalar bazen teşekkür mektubu bırakır; mektuplar Dosyalar ekranındaki panoda durur. Vaka bitince hatıra fotoğrafı da kaydedebilirsin.")
    },
    {
        keys: ["saglik", "bilgi", "tavsiye", "health", "tip", "advice"],
        answer: () => t("Sağlık bilgisi: {0}", pick(healthTips))
    },
    {
        keys: ["saka", "fikra", "guldur", "komik", "joke", "funny"],
        answer: () => pick(robotJokes)
    },
    {
        keys: ["mesai", "saat", "kapandi", "kapali", "yeni gun", "clock", "closed", "shift", "new day"],
        answer: () => state.shift.closed
            ? shiftWait() > 0
                ? t("Klinik şu an dinleniyor. Yeni gün {0} sonra başlayabilir; bu arada mini oyun oynayabilirsin.", waitText())
                : t("Klinik şu an kapalı. Klinik ekranında önce \"🏠 Eve Git\", sonra \"⏰ Uyan\" düğmesine basınca hastalar yeniden gelir.")
            : t("Kliniğin saati {0}. Baktığın her hasta saati yarım saat ilerletir; 17:00'de mesai biter, gün sonu primini alırsın ve klinik 15 dakika dinlenir.", clockText())
    },
    {
        keys: ["tesekkur", "sagol", "sag ol", "thank"],
        answer: t("Rica ederim, Doktor! Yardım etmek benim işim. 🤖💙")
    },
    {
        keys: ["merhaba", "selam", "gunaydin", "hello", "hey", "hi"],
        answer: t("Merhaba Doktor! Ben Robi. Bana oyun ve sağlık hakkında soru sorabilirsin.")
    }
];

const robotChips = [
    t("Nasıl oynanır?"), t("Bugün ne var?"), t("Şimdi ne yapayım?"),
    t("Sağlık bilgisi ver"), t("Şaka yap"), t("Sen kimsin?")
];

// Oyuncunun durumuna göre sıradaki iş önerisi.
function robotNextStep() {
    if (state.shift.closed) {
        return shiftWait() > 0
            ? t("Mesai bitti ve klinik dinleniyor. Bu arada mini oyun oyna, hikâyeye bak ya da kliniğini süsle!")
            : t("Mesai bitti! Klinik ekranından yeni güne başlayabilirsin.");
    }

    if (state.patients < 3) {
        return t("Hastalar ekranına git ve bekleyen bir hastayı muayene et. İlk üç hastadan sonra oyun iyice açılır!");
    }

    const ideas = [
        t("Hikâye Modu'na bak; her bölümün sonunda bir diploma seni bekliyor."),
        t("Mini Oyunlar'da rekorunu kırmayı dene; oradan da çıkartma çıkıyor."),
        t("Kliniğini süsle: farklı eşya yerleştirdikçe her vakadan daha çok coin kazanırsın."),
        t("Albümüne bak; eksik çıkartmaların hangi setten olduğunu görürsün.")
    ];

    if (state.level >= 3) ideas.push(t("Pati Kliniği'ne uğra; minik dostların seni bekliyor!"));
    if (state.level < 3) ideas.push(t("Birkaç hasta daha iyileştir: 2. seviyede Diş Kliniği, 3. seviyede Pati Kliniği açılır."));

    return pick(ideas);
}

function robotAnswer(question) {
    const text = " " + plainText(question).replace(/[?!.,]/g, " ") + " ";
    if (!text.trim()) return t("Bir şey yaz ya da aşağıdaki sorulardan birine dokun.");

    // "hi" gibi kısa kelimeler başka kelimelerin içinde eşleşmesin diye boşlukla aranır.
    const topic = robotTopics.find(item => item.keys.some(key =>
        key.length <= 3 ? text.includes(" " + key + " ") : text.includes(key)));

    if (!topic) {
        return t("Bunu henüz bilmiyorum. 🤖 Bana oyun, yıldızlar, çıkartmalar, bölümler ya da sağlık hakkında soru sorabilirsin.");
    }

    return typeof topic.answer === "function" ? topic.answer() : topic.answer;
}

function robotSay(element, text) {
    element.textContent = text;
    element.hidden = false;
    sfx("beep");
    if (state.autoRead) speak(text);
}

// Ana paneldeki sohbet: yazılan ya da seçilen soruya cevap verir.
function askRobot(question) {
    if (!appOpen) return;

    $("robotAsked").textContent = question.trim() ? "💬 " + question.trim().slice(0, 80) : "";
    $("robotAsked").hidden = !question.trim();
    robotSay($("robotText"), robotAnswer(question));
}

function submitRobot(event) {
    event.preventDefault();
    askRobot($("robotInput").value);
    $("robotInput").value = "";
}

function renderRobot() {
    if ($("robotChips").childElementCount) return;

    $("robotFace").innerHTML = `<svg class="art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${itemArt.robot}</svg>`;

    robotChips.forEach(question => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "toggle";
        button.textContent = question;
        button.onclick = () => askRobot(question);
        $("robotChips").appendChild(button);
    });
}

/* ---- Muayenede ipucu ---- */

// Robi her hastada adım adım yardım eder: önce denenmemiş aleti söyler, sonra önemli
// bulguyu gösterir, en sonda seçenekleri iki karta indirir (bu son ipucu yıldız götürür).
// robotStage: hasta kimliği -> verilen ipucu basamağı (kaydedilmez).
const robotStage = new Map();

function robotHint() {
    const patient = currentPatient();
    if (!appOpen || !patient || cure) return;

    const tools = toolsFor(patient);
    const unused = tools.filter(tool => !patient.exams.includes(tool.id));
    const stage = robotStage.get(patient.id) || 0;
    let text;

    if (unused.length === tools.length) {
        text = t("Önce hastanı dinle, sonra bir aletle başla. \"{0}\" iyi bir ilk adım!", tools[0].name);
    } else if (unused.length) {
        text = t("Henüz \"{0}\" aletini denemedin. Ne kadar çok muayene edersen o kadar çok ipucu bulursun!", unused[0].name);
    } else if (patient.special || patient.boss || patient.daily) {
        text = t("Bu özel bir vaka; burada kartı ben söyleyemem. ❗ işaretli bulgulara ve ipucu tablosuna dikkatle bak!");
    } else if (stage === 0) {
        const alerts = tools.filter(tool => findingFor(patient, tool.id).alert).map(tool => tool.name);

        text = (alerts.length
            ? t("En önemli ipuçları şu aletlerde: {0}. İpucu tablosunda bu işaretleri ara!", alerts.join(", "))
            : t("Bulguların hepsi sakin görünüyor. İpucu tablosunda her şeyi normal olan kartı ara!")) + " " +
            t("Bir ipucu daha istersen seçenekleri iki karta indiririm, ama o zaman en fazla 2 yıldız alırsın.");
        robotStage.set(patient.id, 1);
    } else {
        // Görüntüleme raporuyla aynı iki kart gösterilir; ikisi birleştirilip cevap bulunamaz.
        const pair = hintPair(patient);

        // Güçlü ipucu, görüntüleme raporu gibi sayılır: o vakada en fazla 2 yıldız.
        patient.usedXray = true;
        robotStage.set(patient.id, 2);
        commit();

        text = t("Bence doğru kart şu ikisinden biri: \"{0}\" ya da \"{1}\".", pair[0], pair[1]);
    }

    robotSay($("tmRobotText"), "🤖 " + text);
}
