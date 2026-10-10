"use strict";

/* ===== VERİLER ===== */

const DB_KEY = "doktormust_v9_users";
const SESSION_KEY = "doktormust_v9_session";

const defaultState = {
    doctor: {
        name: t("Doktor"), age: "küçük",
        face: 0, accessory: 0, bg: "#bae6fd", avatar: "🦁"
    },
    xp: 0,
    level: 1,
    coins: 250,
    gems: 10,
    patients: 0,
    badges: [],
    dark: false,
    sound: true,
    music: false,
    clinicEdited: false,
    difficulty: "normal",
    stars: 0,
    perfect: 0,
    emergencies: 0,
    gamesWon: 0,
    tipsSeen: 0,
    checkups: 0,
    weeklyWins: 0,
    tutorialDone: false,
    autoRead: false,
    stickers: [],
    albumSets: [],
    treated: [],
    weekly: { week: "", done: false, failDay: "", patient: null },
    // current: süren bölüm { id, index, stars, patient }; best: bölüm başına en iyi yıldız.
    story: { done: [], best: {}, current: null },
    // Hasta dosyaları: { name, emoji, age, visits, stars, regular, history }.
    files: [],
    organsSeen: [],
    decor: { wall: "plain", floor: "none", view: "park", coat: "#ffffff" },
    petName: "",
    // Ebeveyn köşesi: kart başına doğru/yanlış, görülen bilgiler, günlük süre (saniye).
    cardStats: {},
    tipsShown: [],
    playLog: {},
    limitMinutes: 0,
    limitExtra: { day: "", minutes: 0 },
    vibrate: true,
    diplomaSeen: false,
    // Klinik ekibi, bekleme odası ve uzmanlık bölümleri.
    staff: [],
    queue: [],
    wardPatients: {},
    wardCases: {},
    // Haftalık karne: bu haftanın ve geçen haftanın sayıları.
    week: { key: "", cases: 0, perfect: 0, games: 0, tips: 0, stickers: 0, wrong: {} },
    lastWeek: null,
    records: {
        quiz: 0, germ: 0, heart: 0,
        memory_kolay: 0, memory_normal: 0, memory_zor: 0,
        wash: 0, teeth: 0, plate: 0, bandage: 0,
        maze: 0, bones: 0, count: 0
    },
    daily: {
        lastClaim: "", streak: 0, questDate: "",
        progress: { cases: 0, games: 0, perfect: 0 },
        claimed: []
    },
    ownedItems: ["desk", "computer", "plant", "stethoscope"],
    ownedAccessories: [0, 1, 2, 3],
    activePatients: []
};

const defaultClinic = [
    { id: "a", type: "desk", room: "main", x: 25, y: 68, r: 0 },
    { id: "b", type: "computer", room: "main", x: 25, y: 54, r: 0 },
    { id: "c", type: "plant", room: "main", x: 78, y: 70, r: 0 }
];

// level: gereken seviye, gems: elmas fiyatı, effect: vakalardaki etkisi,
// motion: klinikteki hareket sınıfı.
const storeItems = [
    { id: "desk", emoji: "🪑", name: t("Doktor Masası"), price: 0 },
    { id: "computer", emoji: "💻", name: t("Akıllı Bilgisayar"), price: 150 },
    { id: "plant", emoji: "🌱", name: t("Klinik Bitkisi"), price: 100, motion: "anim-sway" },
    { id: "chair", emoji: "🛋️", name: t("Hasta Koltuğu"), price: 80 },
    { id: "stethoscope", emoji: "🩺", name: t("Profesyonel Stetoskop"), price: 0 },
    { id: "trophy", emoji: "🏆", name: t("Başarı Kupası"), price: 300, effect: t("Her vakada +10 XP") },
    { id: "bed", emoji: "🛏️", name: t("Muayene Yatağı"), price: 400, level: 2, effect: t("3 yıldızlı vakalarda +10 coin") },
    { id: "pet", emoji: "🐶", name: t("Klinik Köpeği"), price: 500, effect: t("Hastalar +1 sabır kalbiyle gelir"), motion: "anim-walk" },
    { id: "robot", emoji: "🤖", name: t("Hemşire Robot"), price: 750, effect: t("Her vakada +10 coin"), motion: "anim-wiggle" },
    { id: "microscope", emoji: "🔬", name: t("Laboratuvar Mikroskobu"), price: 900, level: 3, effect: t("Tahlil raporu ücretsiz olur") },
    { id: "xray", emoji: "🩻", name: t("Röntgen Cihazı"), price: 1000, level: 4, effect: t("Görüntüleme raporu yarı fiyat") },
    { id: "ambulance", emoji: "🚑", name: t("Mini Ambulans"), price: 1200, level: 5, effect: t("2 kat ödüllü acil vakalar gelir") },
    { id: "teddy", emoji: "🧸", name: t("Oyuncak Ayı"), gems: 8 },
    { id: "aquarium", emoji: "🐠", name: t("Klinik Akvaryumu"), gems: 15, motion: "anim-bob" }
];

const badges = [
    ["first", "🌟", t("İlk Adım"), t("İlk vaka kartını tamamla.")],
    ["five", "🩺", t("Usta Doktor"), t("5 vaka kartını tamamla.")],
    ["twentyfive", "👩‍⚕️", t("Tecrübeli Doktor"), t("25 vaka kartını tamamla.")],
    ["perfect10", "⭐", t("Kusursuz"), t("10 vakayı 3 yıldızla bitir.")],
    ["emergency", "🚑", t("Acil Kahramanı"), t("5 acil vakayı tamamla.")],
    ["level3", "🚀", t("Yükseliyor"), t("3. seviyeye ulaş.")],
    ["level5", "🎖️", t("Uzmanlık"), t("5. seviyeye ulaş.")],
    ["level10", "👑", t("Başhekim"), t("10. seviyeye ulaş.")],
    ["rich", "🪙", t("Zengin Doktor"), "500 oyun coini biriktir."],
    ["clinic", "🏥", t("Mimar Doktor"), t("Kliniğinin düzenini değiştir.")],
    ["collector", "🧰", t("Koleksiyoncu"), t("Mağazadaki tüm eşyaları al.")],
    ["streak3", "🔥", t("Düzenli Doktor"), t("3 gün üst üste günlük ödülünü al.")],
    ["streak7", "📅", t("Haftanın Doktoru"), t("7 gün üst üste günlük ödülünü al.")],
    ["gamer", "🎮", t("Oyun Ustası"), "20 mini oyun kazan."],
    ["germ", "🦠", t("Mikrop Avcısı"), t("Mikrop Avı'nda 15 puan yap.")],
    ["wise", "💡", t("Bilgi Kurdu"), t("10 sağlık bilgisi kartı gör.")],
    ["sticker10", "🎟️", t("Çıkartma Toplayıcı"), t("10 farklı çıkartma topla.")],
    ["album", "📒", t("Albüm Ustası"), t("Albümdeki tüm çıkartmaları topla.")],
    ["family", "💚", t("Aile Doktoru"), t("5 kontrol ziyaretini karşıla.")],
    ["weekly", "🌟", t("Haftanın Yıldızı"), t("Haftanın özel hastasını iyileştir.")],
    ["clinicstar", "✨", t("Yıldız Klinik"), t("Klinik puanını 150'ye çıkar.")],
    ["allgames", "🕹️", t("Oyun Kâşifi"), t("Puanlı mini oyunların hepsinde puan al.")],
    ["ch_flu", "🤧", t("Grip Kahramanı"), t("\"Grip Salgını\" bölümünü tamamla.")],
    ["ch_school", "🏫", t("Okul Doktoru"), t("\"Okul Sağlık Taraması\" bölümünü tamamla.")],
    ["ch_park", "🛝", t("Park Kurtarıcısı"), t("\"Oyun Parkı Kazaları\" bölümünü tamamla.")],
    ["ch_party", "🎂", t("Parti Doktoru"), t("\"Doğum Günü Partisi\" bölümünü tamamla.")],
    ["ch_camp", "🏕️", t("Kamp Doktoru"), t("\"Yaz Kampı\" bölümünü tamamla.")],
    ["ch_night", "🌙", t("Gece Nöbetçisi"), t("\"Gece Nöbeti\" bölümünü tamamla.")],
    ["storyall", "📚", t("Hikâye Ustası"), t("Tüm hikâye bölümlerini tamamla.")],
    ["regulars", "🤝", t("Sevilen Doktor"), t("3 hastan düzenli hastan olsun.")],
    ["body", "🧍", t("Vücut Kâşifi"), t("Vücut haritasındaki 8 organın hepsini incele.")],
    ["season", "🎉", t("Özel Gün Koleksiyoncusu"), t("Özel günlere ait bir çıkartma bul.")],
    ["ward_dental", "🦷", t("Diş Hekimi"), t("Diş Kliniği'nde 5 vaka tamamla.")],
    ["ward_eye", "👓", t("Göz Doktoru"), t("Göz Polikliniği'nde 5 vaka tamamla.")],
    ["ward_skin", "🧴", t("Cilt Uzmanı"), t("Cilt ve Alerji bölümünde 5 vaka tamamla.")],
    ["ward_er", "🚑", t("Acil Doktoru"), t("Çocuk Acil'de 5 vaka tamamla.")],
    ["team", "👥", t("Ekip Lideri"), t("Klinik ekibinin tamamını işe al.")],
    ["diploma", "🎓", t("Diplomalı Doktor"), t("Bir bölüm diplomasını görüntüle.")]
];

// İlk dört aksesuar eski sürümde ücretsizdi; herkes sahip sayılır.
const accessories = [
    { emoji: "", name: t("Yok") },
    { emoji: "🕶️", name: t("Gözlük") },
    { emoji: "😷", name: t("Maske") },
    { emoji: "🎓", name: t("Kep") },
    { emoji: "🎩", name: t("Şapka"), price: 300 },
    { emoji: "🎀", name: t("Kurdele"), gems: 5 },
    { emoji: "🦸", name: t("Kahraman"), gems: 12 },
    { emoji: "👑", name: t("Taç"), gems: 20 }
];

const rooms = [
    { id: "main", emoji: "🪟", name: t("Muayene Odası"), level: 1 },
    { id: "lab", emoji: "🧪", name: t("Laboratuvar"), level: 3 },
    { id: "xray", emoji: "🩻", name: t("Röntgen Odası"), level: 5 }
];

const difficulties = {
    kolay: { label: t("🙂 Kolay"), bonus: 1 },
    normal: { label: "😎 Normal", bonus: 1.5 },
    zor: { label: t("🔥 Zor"), bonus: 2 }
};

const quests = [
    { id: "cases", label: t("🧒 3 vaka tamamla"), goal: 3, coins: 60 },
    { id: "games", label: t("🎮 2 mini oyun kazan"), goal: 2, coins: 40 },
    { id: "perfect", label: t("⭐ 1 vakayı 3 yıldızla bitir"), goal: 1, gems: 2 },
    // meta: diğer görevlerin ödülü alındıkça dolar.
    { id: "all", label: t("🎁 Günün 3 görevini de bitir"), goal: 3, gems: 3, meta: true }
];

// Çıkartmalar: [kimlik, simge, ad, genel bilgi].
const stickerSets = [
    {
        id: "body", emoji: "🫀", name: t("Vücudumuz"),
        stickers: [
            ["heart", "🫀", t("Kalp"), t("Kalbin yaklaşık yumruğun büyüklüğündedir ve hiç durmadan kan pompalar.")],
            ["lungs", "🫁", t("Akciğer"), t("Akciğerlerin, aldığın nefesteki oksijeni kanına geçirir.")],
            ["brain", "🧠", t("Beyin"), t("Beynin düşünmeni, hatırlamanı ve hareket etmeni yönetir.")],
            ["tooth", "🦷", t("Diş"), t("Diş minesi vücudundaki en sert maddedir.")],
            ["bone", "🦴", t("Kemik"), t("Yetişkin bir insanın vücudunda 206 kemik vardır.")],
            ["eye", "👁️", t("Göz"), t("Gözlerin ışığı toplar, beynin de onu görüntüye çevirir.")],
            ["ear", "👂", t("Kulak"), t("Kulakların duymanın yanında dengede durmana da yardım eder.")],
            ["muscle", "💪", t("Kas"), t("Vücudunda 600'den fazla kas vardır.")]
        ]
    },
    {
        id: "tools", emoji: "🩺", name: t("Doktor Aletleri"),
        stickers: [
            ["steth", "🩺", t("Stetoskop"), t("Doktorlar kalp ve akciğer seslerini stetoskopla dinler.")],
            ["thermo", "🌡️", t("Termometre"), t("Termometre vücut sıcaklığını ölçer.")],
            ["micro", "🔬", t("Mikroskop"), t("Mikroskop, gözle görülemeyecek kadar küçük şeyleri büyütür.")],
            ["bandage", "🩹", t("Yara Bandı"), t("Yara bandı küçük yaraları temiz tutar ve korur.")],
            ["xray", "🩻", t("Röntgen"), t("Röntgen, kemiklerin fotoğrafını çekmeye yarar.")],
            ["light", "🔦", t("Fener"), t("Doktorlar boğaza ve kulağa ışık tutarak bakar.")],
            ["ambulance", "🚑", t("Ambulans"), t("Ambulans acil durumlarda hastaları hızla hastaneye taşır. Türkiye'de acil numarası 112'dir.")],
            ["vaccine", "💉", t("Aşı"), t("Aşılar vücuduna bazı hastalıklardan korunmayı öğretir.")]
        ]
    },
    {
        id: "life", emoji: "🍎", name: t("Sağlıklı Yaşam"),
        stickers: [
            ["apple", "🍎", t("Elma"), t("Meyveler vücuduna vitamin ve lif verir.")],
            ["carrot", "🥕", t("Havuç"), t("Havuçtaki A vitamini gözlerin için önemlidir.")],
            ["milk", "🥛", t("Süt"), t("Sütteki kalsiyum kemiklerini ve dişlerini güçlendirir.")],
            ["water", "💧", t("Su"), t("Vücudunun yarısından fazlası sudur.")],
            ["soap", "🧼", t("Sabun"), t("Sabun, mikropları ellerinden söküp atar.")],
            ["brush", "🪥", t("Diş Fırçası"), t("Dişlerini günde iki kez, ikişer dakika fırçala.")],
            ["sport", "⚽", t("Spor"), t("Her gün hareket etmek kalbini ve kaslarını güçlendirir.")],
            ["sleep", "😴", t("Uyku"), t("Uyurken vücudun dinlenir ve büyür.")]
        ]
    },
    {
        // Bu sayfadaki çıkartmalar yalnızca kendi özel gününde çıkar (beşinci alan).
        id: "special", emoji: "🎉", name: t("Özel Günler"),
        stickers: [
            ["tree", "🎄", t("Yılbaşı Ağacı"), t("Yeni yılda kendine sağlıklı bir hedef koyabilirsin: her gün bir meyve gibi."), "newyear"],
            ["snowman", "⛄", t("Kardan Adam"), t("Kışın dışarı çıkarken atkı, bere ve eldiven seni sıcak tutar."), "newyear"],
            ["balloon", "🎈", t("Bayram Balonu"), t("23 Nisan 1920'de Türkiye Büyük Millet Meclisi açıldı. Bu gün çocuklara armağan edildi."), "april23"],
            ["kite", "🪁", t("Uçurtma"), t("Açık havada oynamak hem bedenine hem keyfine iyi gelir."), "april23"],
            ["fireworks", "🎆", t("Havai Fişek"), t("Cumhuriyet 29 Ekim 1923'te ilan edildi."), "republic"],
            ["sparkler", "🎇", t("Maytap"), t("Havai fişekleri yalnızca uzaktan izle; yakmak yetişkinlerin işidir."), "republic"],
            ["candy", "🍬", t("Bayram Şekeri"), t("Bayram şekerinden sonra dişlerini fırçalamayı unutma."), "bayram"],
            ["moon", "🌙", t("Hilal"), t("Bayramlarda büyükleri ziyaret etmek ve paylaşmak güzel bir gelenektir."), "bayram"]
        ]
    }
].map(set => ({
    ...set,
    stickers: set.stickers.map(([id, emoji, name, fact, season]) =>
        ({ id: set.id + "_" + id, emoji, name, fact, season }))
}));

const allStickers = stickerSets.flatMap(set => set.stickers);
const coreStickers = allStickers.filter(sticker => !sticker.season);

// Özel günler. dates: her yıl değişen günler için [başlangıç, bitiş] aralıkları.
// Bayram tarihleri yaklaşık olarak 2027 ve 2028 için girilmiştir; sonrası eklenmeli.
const seasons = [
    {
        id: "newyear", emoji: "🎄", name: t("Yılbaşı"), decor: ["🎄", "❄️", "⛄", "🎁", "❄️", "🎄"],
        greet: t("Mutlu yıllar, Doktor! Kliniğin yeni yıl için süslendi."),
        match: (month, day) => (month === 12 && day >= 15) || (month === 1 && day <= 5)
    },
    {
        id: "april23", emoji: "🎈", name: t("23 Nisan"), decor: ["🎈", "🎉", "🪁", "🎈", "🎉", "🪁"],
        greet: t("23 Nisan Ulusal Egemenlik ve Çocuk Bayramı kutlu olsun!"),
        match: (month, day) => month === 4 && day >= 17 && day <= 25
    },
    {
        id: "republic", emoji: "🎆", name: t("29 Ekim"), decor: ["🎆", "❤️", "🤍", "🎇", "❤️", "🤍"],
        greet: t("29 Ekim Cumhuriyet Bayramı kutlu olsun!"),
        match: (month, day) => month === 10 && day >= 24 && day <= 30
    },
    {
        id: "bayram", emoji: "🍬", name: t("Bayram"), decor: ["🍬", "🌙", "🎁", "🍭", "🌙", "🍬"],
        greet: t("İyi bayramlar, Doktor! Şekerden sonra dişlerini fırçalamayı unutma."),
        dates: [
            ["2027-03-08", "2027-03-12"], ["2027-05-15", "2027-05-20"],
            ["2028-02-25", "2028-02-29"], ["2028-05-04", "2028-05-09"]
        ]
    }
];

// Klinik dekoru. level: seçeneğin açıldığı seviye.
const decorOptions = {
    wall: [
        { id: "plain", name: t("Düz") },
        { id: "stripes", name: t("Çizgili") },
        { id: "dots", name: t("Puantiyeli"), level: 2 },
        { id: "checks", name: t("Kareli"), level: 3 },
        { id: "rainbow", name: t("Gökkuşağı"), level: 5 }
    ],
    floor: [
        { id: "none", name: t("Yok") },
        { id: "wood", name: t("Ahşap") },
        { id: "tile", name: t("Karo"), level: 2 },
        { id: "carpet", name: t("Halı"), level: 4 }
    ],
    view: [
        { id: "park", emoji: "🌳", name: "Park" },
        { id: "city", emoji: "🏙️", name: t("Şehir") },
        { id: "sea", emoji: "🌊", name: t("Deniz"), level: 2 },
        { id: "mountain", emoji: "🏔️", name: t("Dağ"), level: 3 },
        { id: "night", emoji: "🌙", name: t("Gece"), level: 4 }
    ]
};

// Ebeveynin seçebileceği günlük süre sınırları (dakika; 0: sınır yok).
const limitChoices = [0, 15, 30, 45, 60];

const coatColors = [
    ["#ffffff", t("Beyaz")], ["#bfdbfe", t("Mavi")], ["#bbf7d0", t("Yeşil")],
    ["#fbcfe8", t("Pembe")], ["#fde68a", t("Sarı")], ["#ddd6fe", t("Mor")]
];

// Vücut haritası. sticker: organı açan çıkartma, x/y: figür üstündeki yer (%).
const organs = [
    {
        id: "brain", sticker: "body_brain", emoji: "🧠", name: t("Beyin"), x: 50, y: 5,
        job: t("Düşünmeni, öğrenmeni, hatırlamanı ve hareket etmeni yönetir."),
        fact: t("Beynin sen uyurken bile çalışır ve gün içinde öğrendiklerini düzenler."),
        care: t("Yeterince uyu; bisiklete ve patene binerken kask tak.")
    },
    {
        id: "eye", sticker: "body_eye", emoji: "👁️", name: t("Göz"), x: 36, y: 12,
        job: t("Işığı toplar ve gördüklerini beynine gönderir."),
        fact: t("Gözlerini günde binlerce kez kırparsın; bu, gözlerini nemli ve temiz tutar."),
        care: t("Ekrana uzun süre baktıysan ara ver ve uzağa bak.")
    },
    {
        id: "ear", sticker: "body_ear", emoji: "👂", name: t("Kulak"), x: 66, y: 12,
        job: t("Sesleri duymanı ve dengede durmanı sağlar."),
        fact: t("Vücudundaki en küçük kemikler kulağının içindedir."),
        care: t("Çok yüksek sesle müzik dinleme; kulağına sivri bir şey sokma.")
    },
    {
        id: "tooth", sticker: "body_tooth", emoji: "🦷", name: t("Diş"), x: 50, y: 19,
        job: t("Yiyecekleri ısırmanı ve çiğnemeni sağlar."),
        fact: t("Çocuklarda 20 süt dişi, yetişkinlerde 32 kalıcı diş bulunur."),
        care: t("Dişlerini günde iki kez fırçala ve şekerli yiyecekleri azalt.")
    },
    {
        id: "lungs", sticker: "body_lungs", emoji: "🫁", name: t("Akciğer"), x: 40, y: 35,
        job: t("Aldığın nefesteki oksijeni kanına geçirir."),
        fact: t("Sol akciğerin sağdakinden biraz küçüktür, çünkü kalbine yer açar."),
        care: t("Temiz havada oyna ve sigara dumanından uzak dur.")
    },
    {
        id: "heart", sticker: "body_heart", emoji: "🫀", name: t("Kalp"), x: 58, y: 37,
        job: t("Kanı tüm vücuduna pompalar."),
        fact: t("Kalbin günde yaklaşık 100.000 kez atar."),
        care: t("Her gün hareket et, oyun oyna ve spor yap.")
    },
    {
        id: "muscle", sticker: "body_muscle", emoji: "💪", name: t("Kas"), x: 20, y: 40,
        job: t("Hareket etmeni, koşmanı ve gülümsemeni sağlar."),
        fact: t("Vücudunda 600'den fazla kas vardır; kalbin de bir kastır."),
        care: t("Spor yap; süt, yumurta ve baklagil gibi besinler kaslarına iyi gelir.")
    },
    {
        id: "bone", sticker: "body_bone", emoji: "🦴", name: t("Kemik"), x: 42, y: 78,
        job: t("Vücudunu ayakta tutar ve organlarını korur."),
        fact: t("Bebeklerde yaklaşık 300 kemik vardır; büyürken bazıları birleşir ve 206 olur."),
        care: t("Süt, yoğurt ve peynir kemiklerini güçlendirir.")
    }
];

// Hikâye bölümleri. cards: bölümde çıkan kartlar, cases: baş vakadan önceki vaka sayısı,
// timed: bütün vakalar süreli. Baş vakada rapor istenemez ve sabır azdır.
const chapters = [
    {
        id: "flu", emoji: "🤧", name: t("Grip Salgını"), cases: 5,
        cards: ["dinlenme", "antibiyotik"],
        intro: t("Okullar açıldı ve kasabada herkes hapşırıyor! Bekleme odası doldu. Kimin yalnızca dinlenmeye, kimin antibiyotik kartına ihtiyacı olduğunu bulmalısın."),
        outro: t("Salgın kontrol altında! Kasaba halkı sana teşekkür ediyor.")
    },
    {
        id: "school", emoji: "🏫", name: t("Okul Sağlık Taraması"), cases: 5,
        cards: ["vitamin", "agri_kesici", "dinlenme"],
        intro: t("Bugün okulda sağlık taraması var. Bütün sınıf sıraya girdi. Kimi yorgun, kiminin bir yeri ağrıyor. Hepsine tek tek bakmalısın."),
        outro: t("Tarama bitti! Müdür sana \"Yılın Okul Doktoru\" belgesi verdi.")
    },
    {
        id: "park", emoji: "🛝", name: t("Oyun Parkı Kazaları"), cases: 5,
        cards: ["alci", "agri_kesici"],
        intro: t("Yeni oyun parkı açıldı ve herkes çok heyecanlı. Biraz fazla heyecanlı! Düşenler, çarpanlar kliniğe geliyor. Şişlik var mı, yok mu? Dikkatli bak."),
        outro: t("Park artık daha güvenli. Çocuklar kask ve dizlik takmaya söz verdi.")
    },
    {
        id: "party", emoji: "🎂", name: t("Doğum Günü Partisi"), cases: 5,
        cards: ["mide_ilaci", "agri_kesici"],
        intro: t("Mahallede büyük bir doğum günü partisi vardı. Pasta, şeker, zıplama şatosu… Şimdi misafirlerin yarısı kliniğinde!"),
        outro: t("Parti tatlı bitti. Herkes bir dahaki sefere pastayı yavaş yemeye karar verdi.")
    },
    {
        id: "camp", emoji: "🏕️", name: t("Yaz Kampı"), cases: 5,
        cards: ["alci", "mide_ilaci", "vitamin", "dinlenme"],
        intro: t("Bu yaz kampın doktoru sensin! Ormanda yürüyüş, gölde yüzme, kamp ateşi… Kampçıların her türlü derdi olabilir."),
        outro: t("Kamp bitti ve herkes evine sağlıkla döndü. Kampçılar sana el yapımı bir madalya verdi.")
    },
    {
        id: "night", emoji: "🌙", name: t("Gece Nöbeti"), cases: 5, timed: true,
        cards: ["antibiyotik", "dinlenme", "agri_kesici", "mide_ilaci", "vitamin", "alci"],
        intro: t("Bu gece nöbetçi doktor sensin. Bütün vakalar acil ve süreli! Sakin ol, aletlerine güven ve hızlı karar ver."),
        outro: t("Güneş doğuyor ve nöbetin bitti. Kasabanın en güvenilir doktoru artık sensin!")
    }
];

const tourSteps = [
    ["👋", t("Hoş geldin, Doktor!"),
        t("Kliniğinde seni bekleyen hastalar var. Onları muayene et, doğru kartı bul ve yıldız topla!")],
    ["💬", t("Hastanı dinle"),
        t("Hastalar menüsünden bir hastaya dokun. Konuşma balonunda derdini anlatır. 🔊 düğmesine basarsan sesli de dinleyebilirsin.")],
    ["🩺", t("Aletlerle muayene et"),
        t("Termometre, stetoskop, fener ve elle muayene sana ipucu verir. ❗ işaretli bulgular önemlidir.")],
    ["💊", t("Doğru kartı seç"),
        t("Bulguları \"İpucu tablosu\" ile karşılaştır ve kartını seç. İlk denemede bulursan 3 yıldız kazanırsın!")],
    ["📒", t("Çıkartma topla"),
        t("Vakalardan ve mini oyunlardan çıkartma çıkar. Albümünü tamamla, kliniğini süsle ve haftanın özel hastasını kaçırma!")]
];

// Genel sağlıklı yaşam bilgileri; teşhis veya tedavi önerisi içermez.
const healthTips = [
    t("Ellerini sabunla en az 20 saniye yıkamak mikropların çoğunu uzaklaştırır."),
    t("Dişlerini sabah ve akşam, günde iki kez fırçalamak dişlerini korur."),
    t("Hapşırırken ağzını mendille ya da dirseğinin içiyle kapat."),
    t("Gün içinde su içmek vücudunun iyi çalışmasına yardım eder."),
    t("Yeterince uyumak hem büyümene hem de dikkatine iyi gelir."),
    t("Renkli sebze ve meyveler vücuduna farklı vitaminler verir."),
    t("Her gün hareket etmek ve oyun oynamak kalbini güçlendirir."),
    t("Bisiklet ve patende kask takmak başını korur."),
    t("İlaçları yalnızca bir büyüğün, doktorun söylediği şekilde verir."),
    t("Ekrana uzun süre baktıysan ara ver ve uzağa bakarak gözlerini dinlendir."),
    t("Güneşli günlerde şapka takmak ve gölgede dinlenmek cildini korur."),
    t("Kendini iyi hissetmediğinde bunu bir büyüğüne söylemek en doğru adımdır.")
];

const treatments = [
    { id: "antibiyotik", label: t("💊 Antibiyotik Kartı") },
    { id: "dinlenme", label: t("🍊 Dinlenme Kartı") },
    { id: "agri_kesici", label: t("🩹 Ağrı Bakım Kartı") },
    { id: "mide_ilaci", label: t("🧪 Mide Bakım Kartı") },
    { id: "vitamin", label: t("🍎 Vitamin Kartı") },
    { id: "alci", label: t("🦴 Alçı Kartı") }
];

// Hasta adları çevrilmez.
/* i18n-off */
const namePool = [
    "Ece", "Arda", "Zeynep", "Mert", "Defne", "Emir",
    "Can", "Ela", "Ali", "Ayşe", "Kerem", "Nil",
    "Burak", "Cemre", "Deniz", "Aslı", "Kaan"
];
/* i18n-on */

const patientEmojis = ["👦", "👧", "🧒", "🧑", "👱‍♀️", "👱‍♂️"];
const colors = ["#dff7ff", "#e8ddff", "#ffe7cf", "#dcfce7", "#fce7f3", "#fef3c7"];

const ageGroups = {
    "küçük": { min: 4, max: 7, pool: "young", label: t("4–7 yaş") },
    "orta": { min: 8, max: 10, pool: "middle", label: t("8–10 yaş") },
    "büyük": { min: 11, max: 14, pool: "older", label: t("11–14 yaş") }
};

// Bunlar gerçek tıbbi karar kuralları değil, kurgusal oyun kartlarıdır.
// "i18n-off" ile "i18n-on" arasındaki metinler kayıtlara Türkçe yazılır ve
// ekranda gösterilirken t(...) ile çevrilir; bu yüzden burada t() kullanılmaz.
/* i18n-off */

// Aynı şikâyet farklı kartlara çıkabilir; doğru kartı muayene bulguları belirler.
// area: fener ve elle muayenenin baktığı yer, says: hastanın konuşma balonu.
const diseasePool = {
    young: [
        {
            problem: "🤒 Ateş", correctTreatment: "antibiyotik", area: "bogaz",
            says: [
                "Boğazım yanıyor, yutkunurken çok acıyor. Alnım da sıcacık! 🥵",
                "Üşüyorum ama alnım çok sıcak. Boğazım da acıyor. 😣"
            ]
        },
        {
            problem: "🤒 Ateş", correctTreatment: "dinlenme", area: "bogaz",
            says: [
                "Dün yağmurda oynadım. Bugün burnum akıyor, biraz da sıcağım var. 🤧",
                "Hapşırıp duruyorum, biraz da halsizim. 🤧"
            ]
        },
        {
            problem: "😭 Kulak Ağrısı", correctTreatment: "antibiyotik", area: "kulak",
            says: [
                "Kulağımın içi zonkluyor, gece hiç uyuyamadım. 😭",
                "Kulağım çok acıyor, yanağım da sıcacık oldu. 😢"
            ]
        },
        {
            problem: "🤢 Karın Ağrısı", correctTreatment: "mide_ilaci", area: "karin",
            says: [
                "Dün çok dondurma yedim, karnım guruldayıp duruyor. 😣",
                "Doğum gününde üç dilim pasta yedim, şimdi karnım ağrıyor. 🎂"
            ]
        },
        {
            problem: "😴 Yorgunluk", correctTreatment: "vitamin", area: "",
            says: [
                "Hiç oyun oynamak istemiyorum, hep uykum var. Sebze de pek yemiyorum. 🥱",
                "Parkta hemen yoruluyorum. Meyve yemeyi hiç sevmem. 😴"
            ]
        },
        {
            problem: "😴 Yorgunluk", correctTreatment: "dinlenme", area: "bogaz", level: 2,
            says: [
                "Çok halsizim, burnum da tıkalı. 🤧",
                "Kreşte herkes hapşırıyordu. Şimdi ben de yorgunum. 🤧"
            ]
        },
        {
            problem: "🦷 Diş Ağrısı", correctTreatment: "agri_kesici", area: "dis", level: 3,
            says: [
                "Soğuk bir şey yiyince dişim sızlıyor. 🦷",
                "Elma ısırdım, dişim acıdı. 🍎"
            ]
        },
        {
            problem: "😭 Kulak Ağrısı", correctTreatment: "agri_kesici", area: "kulak", level: 3,
            says: [
                "Havuzda kulağıma su kaçtı, o günden beri sızlıyor. 🏊",
                "Rüzgârda şapkasız gezdim, kulağım sızlıyor. 🌬️"
            ]
        },
        {
            problem: "🤕 Düşme Sonrası Kol Ağrısı", correctTreatment: "alci", area: "kol", level: 5,
            says: [
                "Salıncaktan düştüm, kolumu hiç oynatamıyorum! 😭",
                "Kaydıraktan düştüm, kolum şişti ve çok acıyor! 😭"
            ]
        },
        {
            problem: "🤕 Düşme Sonrası Kol Ağrısı", correctTreatment: "agri_kesici", area: "kol", level: 5,
            says: [
                "Koşarken düştüm. Kolum acıyor ama oynatabiliyorum. 😢",
                "Bisikletten düştüm. Kolum biraz acıyor ama bükebiliyorum. 🚲"
            ]
        }
    ],
    middle: [
        {
            problem: "🤧 Soğuk Algınlığı", correctTreatment: "dinlenme", area: "bogaz",
            says: [
                "Okulda herkes hapşırıyordu, şimdi benim de burnum akıyor. 🤧",
                "Gece üstümü açmışım. Sabahtan beri hapşırıyorum. 🤧"
            ]
        },
        {
            problem: "🤕 Baş Ağrısı", correctTreatment: "agri_kesici", area: "bas",
            says: [
                "Bütün gün tablete baktım, şimdi başım zonkluyor. 📱",
                "Dün gece geç yattım, sabahtan beri başım ağrıyor. 😣"
            ]
        },
        {
            problem: "🤢 Mide Bulantısı", correctTreatment: "mide_ilaci", area: "karin",
            says: [
                "Lunaparkta hem dönme dolaba bindim hem pamuk şeker yedim. Midem bulanıyor. 🎡",
                "Kantinden çok fazla abur cubur aldım, karnım guruldayıp duruyor. 😣"
            ]
        },
        {
            problem: "🤒 Ateş", correctTreatment: "dinlenme", area: "bogaz",
            says: [
                "Biraz sıcağım var, burnum da akıyor. Dün terli terli dışarı çıkmıştım. 🤧",
                "Halsizim ve hapşırıyorum. Annem alnımı biraz sıcak buldu. 🤧"
            ]
        },
        {
            problem: "😴 Halsizlik", correctTreatment: "vitamin", area: "", level: 2,
            says: [
                "Teneffüste hiç koşasım gelmiyor. Öğle yemeğinde hep makarna yiyorum. 🥱",
                "Sabahları yataktan kalkamıyorum, sebzeyi de hiç sevmem. 😴"
            ]
        },
        {
            problem: "🤒 Ateş", correctTreatment: "antibiyotik", area: "bogaz", level: 2,
            says: [
                "Yutkunamıyorum, boğazım çok acıyor ve yanıyorum! 🥵",
                "Titriyorum ama alnım ateş gibi. Boğazım da çok acıyor. 🥵"
            ]
        },
        {
            problem: "😷 Boğaz Ağrısı", correctTreatment: "antibiyotik", area: "bogaz", level: 3,
            says: [
                "Boğazımda sanki diken var, ateşim de çıktı. 😣",
                "Su içerken bile boğazım acıyor, çok da sıcağım var. 🥵"
            ]
        },
        {
            problem: "😷 Boğaz Ağrısı", correctTreatment: "dinlenme", area: "bogaz", level: 3,
            says: [
                "Maçta çok bağırdım. Boğazım hafif acıyor, burnum da akıyor. 📣",
                "Boğazım biraz gıcıklanıyor ve hapşırıyorum. 🤧"
            ]
        },
        {
            problem: "🦴 Bilek Ağrısı", correctTreatment: "alci", area: "bilek", level: 5,
            says: [
                "Basketbolda bileğim döndü. Şişti, üstüne hiç basamıyorum! 🏀",
                "Merdivenden atlarken düştüm, bileğim şişti ve çok acıyor! 😭"
            ]
        },
        {
            problem: "🦴 Bilek Ağrısı", correctTreatment: "agri_kesici", area: "bilek", level: 5,
            says: [
                "İp atlarken bileğim hafif incindi. Yürüyebiliyorum ama acıyor. 😢",
                "Çok koştum, bileğim sızlıyor ama basabiliyorum. 🏃"
            ]
        }
    ],
    older: [
        {
            problem: "🦴 Kol Ağrısı", correctTreatment: "alci", area: "kol",
            says: [
                "Kaykaydan düştüm, kolum şişti ve kıpırdatamıyorum. 🛹",
                "Kaleye çarptım. Kolum şişti, oynatınca çok acıyor. ⚽"
            ]
        },
        {
            problem: "🦵 Bacak Ağrısı", correctTreatment: "agri_kesici", area: "bacak",
            says: [
                "Dünkü antrenmanda çok koştum. Bacağım ağrıyor ama yürüyebiliyorum. ⚽",
                "Uzun bir doğa yürüyüşü yaptık, bacağım sızlıyor. 🥾"
            ]
        },
        {
            problem: "🤧 Öksürük", correctTreatment: "antibiyotik", area: "bogaz",
            says: [
                "Üç gündür öksürüyorum, boğazım yanıyor, ateşim de var. 🥵",
                "Öksürürken boğazım çok acıyor, geceleri terliyorum. 😣"
            ]
        },
        {
            problem: "🥱 Sürekli Uyku Hali", correctTreatment: "vitamin", area: "",
            says: [
                "Derste gözlerim kapanıyor. Kahvaltı yapmıyorum, hep hazır yiyecek yiyorum. 🍟",
                "Hiç enerjim yok. Sebze ve meyveyle aram pek iyi değil. 🥱"
            ]
        },
        {
            problem: "🦵 Bacak Ağrısı", correctTreatment: "alci", area: "bacak", level: 2,
            says: [
                "Maçta sert bir darbe aldım. Bacağım şişti, üstüne basamıyorum. 😣",
                "Ağaçtan düştüm. Bacağım şişti ve çok acıyor. 😭"
            ]
        },
        {
            problem: "🤧 Öksürük", correctTreatment: "dinlenme", area: "bogaz", level: 2,
            says: [
                "Hafif öksürüyorum ve burnum akıyor. Sınıfta herkes nezle. 🤧",
                "Biraz öksürüyorum, hapşırıyorum ve yorgunum. 🤧"
            ]
        },
        {
            problem: "🤢 Mide Yanması", correctTreatment: "mide_ilaci", area: "karin", level: 3,
            says: [
                "Dün gece çok acılı cips yedim. Midem yanıyor ve gurulduyor. 🌶️",
                "Yemeği çok hızlı yedim, üstüne gazlı içecek içtim. Midem ağrıyor. 🥤"
            ]
        },
        {
            problem: "🦴 Kol Ağrısı", correctTreatment: "agri_kesici", area: "kol", level: 3,
            says: [
                "Voleybolda koluma top çarptı. Acıyor ama oynatabiliyorum. 🏐",
                "Ağır çanta taşıdım, kolum ağrıyor ama bükebiliyorum. 🎒"
            ]
        },
        {
            problem: "🤧 Mevsim Nezlesi", correctTreatment: "dinlenme", area: "bogaz", level: 5,
            says: [
                "Havalar değişince hep böyle oluyorum: burnum akıyor ve halsizim. 🤧",
                "Sonbahar gelince hapşırmaya başladım, biraz da sıcağım var. 🍂"
            ]
        }
    ]
};

/* i18n-on */

// signs: kartın kurgusal muayene işaretleri (İpucu tablosunda da görünür).
const guideData = [
    {
        emoji: "💊", name: t("A Kodlu Vaka"), card: "antibiyotik",
        signs: t("🔦 Fenerde 🦠 mikrop lekesi görünür. 🌡️ Ateş çoğunlukla yüksektir.")
    },
    {
        emoji: "🍊", name: t("D Kodlu Vaka"), card: "dinlenme",
        signs: t("🌡️ Ateş biraz yüksektir, 🩺 hafif hırıltı ve 🔦 kızarıklık vardır. Mikrop lekesi yoktur.")
    },
    {
        emoji: "🩹", name: t("B Kodlu Vaka"), card: "agri_kesici",
        signs: t("🖐️ Dokununca acır ama şişlik yoktur.")
    },
    {
        emoji: "🧪", name: t("M Kodlu Vaka"), card: "mide_ilaci",
        signs: t("🩺 Karın guruldar, 🖐️ karın hassastır.")
    },
    {
        emoji: "🍎", name: t("V Kodlu Vaka"), card: "vitamin",
        signs: t("🩺 Kalp yavaş ve sakin atar, 🔦 dil soluk görünür. Ağrı yoktur.")
    },
    {
        emoji: "🦴", name: t("K Kodlu Vaka"), card: "alci",
        signs: t("🖐️ Şişlik vardır, oynatınca çok acır.")
    }
];

const examTools = [
    { id: "temp", emoji: "🌡️", name: t("Termometre") },
    { id: "steth", emoji: "🩺", name: t("Stetoskop") },
    { id: "light", emoji: "🔦", name: t("Fener") },
    { id: "touch", emoji: "🖐️", name: t("Elle Muayene") }
];

// Her kartın kurgusal bulguları. Gerçek tıbbi karar kuralı değildir.
const cardSigns = {
    antibiyotik: { temp: "high", steth: "normal", light: "germ", touch: "normal" },
    dinlenme: { temp: "mild", steth: "wheeze", light: "red", touch: "normal" },
    agri_kesici: { temp: "normal", steth: "normal", light: "normal", touch: "sore" },
    mide_ilaci: { temp: "normal", steth: "rumble", light: "normal", touch: "belly" },
    vitamin: { temp: "normal", steth: "slow", light: "pale", touch: "normal" },
    alci: { temp: "normal", steth: "normal", light: "normal", touch: "swollen" }
};

for (const card of Object.keys(cardSigns)) {
    defaultState.cardStats[card] = { right: 0, wrong: 0 };
}

// Ateş değerleri onda bir derece olarak tutulur (385 = 38,5 °C).
const tempRanges = { high: [385, 394], mild: [376, 381], normal: [364, 371] };
const pulseRanges = { high: [100, 112], mild: [90, 98], normal: [76, 90], slow: [58, 66] };

const findingTexts = {
    temp: {
        high: t("Ateşi yüksek!"),
        mild: t("Ateşi biraz yüksek."),
        normal: t("Ateşi normal.")
    },
    steth: {
        normal: t("Kalp ve nefes sesleri düzenli."),
        wheeze: t("Nefes alırken hafif hırıltı var."),
        rumble: t("Karnından guruldama sesleri geliyor!"),
        slow: t("Kalbi yavaş ve sakin atıyor; hasta halsiz.")
    },
    light: {
        normal: t("Boğazı ve kulakları temiz görünüyor."),
        germ: t("Boğazında 🦠 mikrop lekeleri var!"),
        red: t("Boğazı hafif kızarık ve burnu akıyor; mikrop lekesi yok."),
        pale: t("Dili ve göz kapağının içi soluk görünüyor; mikrop lekesi yok.")
    },
    touch: {
        normal: t("Dokununca hiçbir yeri acımıyor, şişlik yok."),
        sore: t("Dokununca kasları acıyor ama şişlik yok."),
        belly: t("Karnına dokununca hassas ve gergin."),
        swollen: t("Şişlik var! Oynatınca çok acıyor.")
    }
};

// Bulgunun, şikâyet bölgesine özel yazılışları.
const areaTexts = {
    germ: { kulak: t("Kulağının içinde 🦠 mikrop lekeleri var!") },
    sore: {
        kol: t("Koluna dokununca acıyor ama şişlik yok."),
        bacak: t("Bacağına dokununca acıyor ama şişlik yok."),
        bilek: t("Bileğine dokununca acıyor ama şişlik yok."),
        bas: t("Alnına ve şakaklarına dokununca ağrıyor; şişlik yok."),
        dis: t("Yanağına dokununca dişi sızlıyor; şişlik yok."),
        kulak: t("Kulağının arkasına dokununca acıyor; şişlik yok.")
    },
    swollen: {
        kol: t("Kolu şiş! Oynatınca çok acıyor."),
        bacak: t("Bacağı şiş! Üstüne basamıyor."),
        bilek: t("Bileği şiş! Üstüne basamıyor.")
    }
};

const areaNames = ["bogaz", "kulak", "karin", "kol", "bacak", "bilek", "bas", "dis"];

/* i18n-off */

const checkupProblem = "😊 İyileşti";
const specialProblem = "🤔 Gizemli Şikâyet";

// Hikâye bölümlerinin baş vakaları (bölüm kimliğine göre).
const chapterBosses = {
    flu: {
        name: "Efe", emoji: "👦", problem: "👑 Baş Vaka: Takım Kaptanı",
        speech: "Yarın büyük maç var ve ben takım kaptanıyım! Kendimi hiç iyi hissetmiyorum. Ne olur beni iyileştir! 🥺"
    },
    school: {
        name: "Ela", emoji: "👧", problem: "👑 Baş Vaka: Sınıf Başkanı",
        speech: "Bütün sınıfı muayene ettin, sıra bende! Son günlerde kendimi tuhaf hissediyorum ama nedenini bilmiyorum. 🤔"
    },
    park: {
        name: "Kaan", emoji: "🧑", problem: "👑 Baş Vaka: Kaykaycı",
        speech: "Rampadan uçtum ve yere çakıldım! Her yerim acıyor ama en çok neresi, onu sen bul. 😣"
    },
    party: {
        name: "Defne", emoji: "👧", problem: "👑 Baş Vaka: Doğum Günü Çocuğu",
        speech: "Bugün benim doğum günüm! Pastadan da yedim, şatoda da zıpladım. Şimdi hiç iyi değilim. 😢"
    },
    camp: {
        name: "Deniz", emoji: "🧒", problem: "👑 Baş Vaka: Kamp Lideri",
        speech: "Kampın en cesur izcisi benim ama bugün çadırdan çıkamadım. Bana bir bakar mısın? 🏕️"
    },
    night: {
        name: "Nil", emoji: "👧", problem: "👑 Baş Vaka: Gece Yarısı Hastası",
        speech: "Gece yarısı uyandım ve kendimi çok kötü hissediyorum. Annem hemen seni aradı. 🌙"
    }
};

// Eski sürümden gelen hastalar ve kontrol ziyaretleri için konuşmalar.
const fallbackSpeech = {
    antibiyotik: "Çok sıcağım var ve kendimi kötü hissediyorum. 🥵",
    dinlenme: "Biraz halsizim, burnum da akıyor. 🤧",
    agri_kesici: "Bir yerim ağrıyor ama çok kötü değil. 😣",
    mide_ilaci: "Karnım guruldayıp duruyor. 😣",
    vitamin: "Hep uykum var, hiç enerjim yok. 🥱",
    alci: "Düştüm, çok acıyor ve oynatamıyorum! 😭"
};

const checkupSpeech = {
    antibiyotik: "İlaçlarımı büyüklerim tam vaktinde verdi. Şimdi turp gibiyim! 😄",
    dinlenme: "Dediğin gibi dinlendim ve bol su içtim. Artık parkta koşabiliyorum! 🏃",
    agri_kesici: "Ağrım tamamen geçti, yine oyun oynuyorum! 🎈",
    mide_ilaci: "Artık abur cuburu azalttım, karnım hiç ağrımıyor! 😋",
    vitamin: "Her gün meyve ve sebze yiyorum, enerjim yerine geldi! 🍎",
    alci: "Alçım çıktı! Bak, artık rahatça oynatabiliyorum! 💪"
};

const specialSpeech = [
    "Kendimi iyi hissetmiyorum ama neremin ağrıdığını tam anlatamıyorum. Beni dikkatlice muayene eder misin? 🥺",
    "Bir tuhaflık var ama ne olduğunu bilmiyorum. Sen bulursun değil mi doktor? 🥺"
];

/* i18n-on */

const thanksLines = [
    t("Teşekkürler doktor! Şimdiden daha iyiyim. 😊"),
    t("Sen dünyanın en iyi doktorusun! 🌟"),
    t("Hiç korkmadım, çok teşekkür ederim! 💙"),
    t("Annem de çok sevindi, sağ ol doktor! 🤗"),
    t("Büyüyünce ben de senin gibi doktor olacağım! 🩺")
];

// Parolasız çocuk profillerinin seçebileceği avatarlar.
const avatars = ["🦁", "🐼", "🐸", "🦊", "🐰", "🐯", "🐨", "🐵"];

// Günlük hatırlatma için seçilebilen saatler (yalnızca Android uygulamasında).
const reminderHours = [16, 17, 18, 19, 20];

// Klinik ekibi. Mağazadan işe alınır; effect: oyundaki etkisi.
const staffList = [
    {
        id: "cleaner", emoji: "🧹", name: t("Temizlik Görevlisi"), price: 300, level: 2,
        effect: t("Klinik puanına +20 ekler")
    },
    {
        id: "reception", emoji: "💁", name: t("Resepsiyonist"), price: 600, level: 3,
        effect: t("Bekleme odası 4 kişilik olur; her vakada +5 coin randevu ücreti")
    },
    {
        id: "nurse", emoji: "👩‍⚕️", name: t("Hemşire"), price: 900, level: 4,
        effect: t("Hastaların ateşi ölçülmüş olarak gelir")
    }
];

// Uzmanlık bölümleri. Her bölümün kendi aletleri ve kartları vardır.
// Kart: key = en belirleyici alet, signs = ipucu tablosundaki işaretler,
// findings = her aletin o karttaki bulgusu [metin, normalden farklı mı].
// Bunlar da kurgusal oyun kurallarıdır; gerçek tıbbi karar kuralı değildir.
const wards = [
    {
        id: "dental", emoji: "🦷", name: t("Diş Kliniği"), level: 2,
        intro: t("Dişi ağrıyan, dişleri sararan ya da çapraşık çıkan çocuklar burada. Ayna, soğuk testi ve röntgenle doğru kartı bul."),
        tools: [
            { id: "mirror", emoji: "🔍", name: t("Ağız Aynası") },
            { id: "cold", emoji: "🧊", name: t("Soğuk Testi") },
            { id: "xray", emoji: "🩻", name: t("Diş Röntgeni") }
        ],
        cards: [
            {
                id: "d_fill", label: t("🦷 Dolgu Kartı"), key: "cold",
                signs: t("🔍 Dişte koyu renkli bir çürük oyuğu görünür ve 🧊 soğukta diş sızlar."),
                findings: {
                    mirror: [t("Dişte koyu renkli bir çürük oyuğu var!"), true],
                    cold: [t("Soğuk değince dişi çok sızlıyor!"), true],
                    xray: [t("Röntgende çürük dişin içine doğru ilerlemiş."), true]
                }
            },
            {
                id: "d_clean", label: t("🪥 Diş Temizliği Kartı"), key: "mirror",
                signs: t("🔍 Dişlerde sarı tartar ve kızarık diş eti görünür. Çürük yoktur, 🧊 soğukta sızlamaz."),
                findings: {
                    mirror: [t("Dişlerin üstünde sarı tartar var, diş etleri kızarmış; çürük yok."), true],
                    cold: [t("Soğukta sızlama yok."), false],
                    xray: [t("Röntgen temiz: çürük yok, dişler düzgün dizilmiş."), false]
                }
            },
            {
                id: "d_brace", label: t("😁 Diş Teli Kartı"), key: "xray",
                signs: t("🩻 Röntgende dişler sıkışık ve çapraşık dizilmiştir. Çürük ve tartar yoktur."),
                findings: {
                    mirror: [t("Dişler temiz ama birbirinin üstüne binmiş."), true],
                    cold: [t("Soğukta sızlama yok."), false],
                    xray: [t("Röntgende dişler sıkışık ve çapraşık dizilmiş!"), true]
                }
            }
        ]
    },
    {
        id: "eye", emoji: "👓", name: t("Göz Polikliniği"), level: 3,
        intro: t("Tahtayı göremeyen, gözleri kızaran ya da ekrandan yorulan çocuklar burada. Harf tablosu, fener ve göz kırpma testiyle karar ver."),
        tools: [
            { id: "chart", emoji: "🔤", name: t("Harf Tablosu") },
            { id: "light", emoji: "🔦", name: t("Göz Feneri") },
            { id: "blink", emoji: "⏱️", name: t("Göz Kırpma Testi") }
        ],
        cards: [
            {
                id: "e_glass", label: t("👓 Gözlük Kartı"), key: "chart",
                signs: t("🔤 Harf tablosunun alt satırlarını okuyamaz. Gözler kızarık değildir."),
                findings: {
                    chart: [t("Alt satırlardaki küçük harfleri okuyamıyor!"), true],
                    light: [t("Gözleri berrak, kızarıklık yok."), false],
                    blink: [t("Göz kırpması normal."), false]
                }
            },
            {
                id: "e_drop", label: t("💧 Göz Damlası Kartı"), key: "light",
                signs: t("🔦 Fenerde gözler kızarık ve sulu görünür. Harfleri okuyabilir."),
                findings: {
                    chart: [t("Tüm satırları okuyabiliyor."), false],
                    light: [t("Gözleri kızarmış ve sulanıyor!"), true],
                    blink: [t("Gözleri kaşındığı için sık sık kırpıyor."), true]
                }
            },
            {
                id: "e_rest", label: t("😌 Göz Dinlendirme Kartı"), key: "blink",
                signs: t("⏱️ Çok az göz kırpar, gözleri yorgundur. Harfleri okur, kızarıklık yoktur."),
                findings: {
                    chart: [t("Tüm satırları okuyor ama gözlerini kısıyor."), false],
                    light: [t("Kızarıklık yok, gözleri yorgun bakıyor."), false],
                    blink: [t("Çok az göz kırpıyor; gözleri kurumuş ve yorulmuş!"), true]
                }
            }
        ]
    },
    {
        id: "skin", emoji: "🧴", name: t("Cilt ve Alerji"), level: 4,
        intro: t("Cildi kuruyan, döküntüsü çıkan ya da güneşte yanan çocuklar burada. Büyüteç, alerji testi ve nem ölçerle bak."),
        tools: [
            { id: "lens", emoji: "🔍", name: t("Büyüteç") },
            { id: "allergy", emoji: "🧪", name: t("Alerji Testi") },
            { id: "moist", emoji: "💧", name: t("Nem Ölçer") }
        ],
        cards: [
            {
                id: "s_cream", label: t("🧴 Nemlendirici Krem Kartı"), key: "moist",
                signs: t("💧 Nem ölçer cildin çok kuru olduğunu gösterir. 🧪 Alerji testi temizdir."),
                findings: {
                    lens: [t("Cildi pul pul olmuş ve çatlamış; kabarık döküntü yok."), true],
                    allergy: [t("Alerji testi temiz."), false],
                    moist: [t("Cildi çok kuru!"), true]
                }
            },
            {
                id: "s_allergy", label: t("🌼 Alerji Bakım Kartı"), key: "allergy",
                signs: t("🧪 Alerji testi tepki verir ve 🔍 ciltte kabarık kırmızı döküntüler görünür."),
                findings: {
                    lens: [t("Kabarık, kırmızı ve kaşıntılı döküntüler var!"), true],
                    allergy: [t("Alerji testi tepki verdi!"), true],
                    moist: [t("Cildinin nemi normal."), false]
                }
            },
            {
                id: "s_sun", label: t("🧢 Güneş Koruma Kartı"), key: "lens",
                signs: t("🔍 Cilt düz biçimde kızarmış ve sıcaktır; döküntü yoktur. Alerji testi temiz, nem normaldir."),
                findings: {
                    lens: [t("Omuzları ve burnu düz biçimde kızarmış, dokununca sıcak!"), true],
                    allergy: [t("Alerji testi temiz."), false],
                    moist: [t("Cildinin nemi normal."), false]
                }
            }
        ]
    },
    {
        id: "er", emoji: "🚑", name: t("Çocuk Acil"), level: 5, timed: true,
        intro: t("Acil servise hoş geldin! Buradaki bütün vakalar sürelidir. Tansiyon aleti, refleks çekici ve otoskopla hızlı karar ver."),
        tools: [
            { id: "bp", emoji: "💓", name: t("Tansiyon Aleti") },
            { id: "reflex", emoji: "🔨", name: t("Refleks Çekici") },
            { id: "oto", emoji: "👂", name: t("Otoskop") }
        ],
        cards: [
            {
                id: "r_fluid", label: t("💧 Sıvı Takviyesi Kartı"), key: "bp",
                signs: t("💓 Tansiyon düşük ve nabız hızlıdır; hasta susuz kalmıştır."),
                findings: {
                    bp: [t("Tansiyonu düşük, nabzı hızlı: vücudu susuz kalmış!"), true],
                    reflex: [t("Refleksleri normal."), false],
                    oto: [t("Kulakları temiz."), false]
                }
            },
            {
                id: "r_watch", label: t("🛏️ Gözlem Kartı"), key: "reflex",
                signs: t("🔨 Refleksler yavaştır; hasta sersemlemiştir. Tansiyon normaldir."),
                findings: {
                    bp: [t("Tansiyonu ve nabzı normal."), false],
                    reflex: [t("Refleksleri yavaş, biraz sersemlemiş!"), true],
                    oto: [t("Kulakları temiz."), false]
                }
            },
            {
                id: "r_ear", label: t("👂 Kulak Bakım Kartı"), key: "oto",
                signs: t("👂 Otoskopta kulağın içinde yabancı bir şey görünür."),
                findings: {
                    bp: [t("Tansiyonu ve nabzı normal."), false],
                    reflex: [t("Refleksleri normal."), false],
                    oto: [t("Kulağının içinde yabancı bir şey var!"), true]
                }
            }
        ]
    }
];

/* i18n-off */

// Bölüm vakaları (bölüm kimliğine göre). Şikâyet ve konuşmalar kayıtlara Türkçe yazılır.
const wardCases = {
    dental: [
        {
            problem: "🦷 Şeker Sonrası Diş Ağrısı", card: "d_fill",
            says: [
                "Her gün şeker yiyorum. Dün gece dişim öyle ağrıdı ki uyuyamadım. 😭",
                "Çikolata yerken arka dişime sanki iğne batıyor. 😣"
            ]
        },
        {
            problem: "🦷 Soğukta Sızlayan Diş", card: "d_fill",
            says: [
                "Dondurma yiyince dişim zonkluyor, dişimde siyah bir nokta da var. 🍦",
                "Soğuk su içerken azı dişim çok sızlıyor. 💧"
            ]
        },
        {
            problem: "😬 Kanayan Diş Etleri", card: "d_clean",
            says: [
                "Dişimi fırçalarken diş etim kanıyor. Açıkçası pek sık fırçalamıyorum. 😬",
                "Dişlerim sararmış, sabahları ağzım da kötü kokuyor. 😷"
            ]
        },
        {
            problem: "😷 Ağız Kokusu", card: "d_clean",
            says: [
                "Arkadaşlarım ağzımın koktuğunu söyledi. Akşamları fırçalamayı hep unutuyorum. 😳",
                "Dişlerimin üstü pütür pütür oldu, dilimle hissediyorum. 👅"
            ]
        },
        {
            problem: "😬 Çapraşık Dişler", card: "d_brace",
            says: [
                "Dişlerim birbirinin üstüne çıkmış, aralarını fırçalayamıyorum. 😬",
                "Ön dişlerim yamuk çıktı, gülerken ağzımı kapatıyorum. 🙊"
            ]
        },
        {
            problem: "😮 Yer Bulamayan Diş", card: "d_brace",
            says: [
                "Isırırken üst ve alt dişlerim birbirine tam oturmuyor. 🍎",
                "Yeni çıkan dişime yer kalmamış, yan yan çıkıyor. 😮"
            ]
        }
    ],
    eye: [
        {
            problem: "👀 Tahtayı Görememe", card: "e_glass",
            says: [
                "Arka sırada oturunca tahtadaki yazılar bulanık görünüyor. 🏫",
                "Uzaktaki otobüsün numarasını okuyamıyorum, yaklaşınca görüyorum. 🚌"
            ]
        },
        {
            problem: "📖 Kitaba Çok Yaklaşma", card: "e_glass",
            says: [
                "Kitabı burnumun dibine getirmeden okuyamıyorum. 📖",
                "Televizyonu ancak çok yakından net görüyorum. 📺"
            ]
        },
        {
            problem: "😢 Kızarık Gözler", card: "e_drop",
            says: [
                "Gözlerim kaşınıyor ve sulanıyor, sabah kirpiklerim yapış yapıştı. 😢",
                "Havuzdan sonra gözlerim kıpkırmızı oldu ve yanıyor. 🏊"
            ]
        },
        {
            problem: "😣 Kaşınan Gözler", card: "e_drop",
            says: [
                "Gözlerimi ovuşturmadan duramıyorum, hep sulanıyor. 😣",
                "Gözüme toz kaçtı sanki, kızardı ve batıyor. 🌬️"
            ]
        },
        {
            problem: "😵 Ekran Sonrası Göz Yorgunluğu", card: "e_rest",
            says: [
                "Bütün gün tablette oyun oynadım, gözlerim yanıyor ve yoruldu. 📱",
                "Uzun süre bilgisayara bakınca gözlerim ağrıyor, yazılar kayıyor. 💻"
            ]
        },
        {
            problem: "😴 Yorgun Gözler", card: "e_rest",
            says: [
                "Gece yorganın altında fenerle kitap okudum, gözlerim çok yoruldu. 🔦",
                "Çizgi film maratonu yaptım, şimdi gözlerimi açık tutamıyorum. 📺"
            ]
        }
    ],
    skin: [
        {
            problem: "🧴 Kuru ve Kaşınan Cilt", card: "s_cream",
            says: [
                "Kışın ellerim çatlıyor ve kaşınıyor, bazen acıyor. ❄️",
                "Banyodan sonra cildim gerim gerim geriliyor ve pul pul dökülüyor. 🛁"
            ]
        },
        {
            problem: "🧼 Çatlayan Eller", card: "s_cream",
            says: [
                "Ellerimi sık yıkıyorum ama hiç krem sürmüyorum, kupkuru oldular. 🧼",
                "Rüzgârlı havada yanaklarım kızarıp kuruyor. 🌬️"
            ]
        },
        {
            problem: "🌼 Bahar Döküntüsü", card: "s_allergy",
            says: [
                "Çimlerde yuvarlandım, kollarımda kabarık kırmızı noktalar çıktı. 🌱",
                "Çiçek topladıktan sonra her yerim kaşınmaya başladı. 🌸"
            ]
        },
        {
            problem: "🍓 Kaşıntılı Kabarıklıklar", card: "s_allergy",
            says: [
                "Sivrisinek ısırdı, yeri kocaman şişti ve çok kaşınıyor. 😖",
                "Yeni bir meyve yedim, ağzımın çevresi kızarıp kabardı. 🍓"
            ]
        },
        {
            problem: "☀️ Güneş Yanığı", card: "s_sun",
            says: [
                "Sahilde bütün gün şapkasız oynadım, omuzlarım yanıyor. 🏖️",
                "Güneş kremi sürmeyi unuttum, burnum kıpkırmızı oldu. ☀️"
            ]
        },
        {
            problem: "🌞 Kızaran Yanaklar", card: "s_sun",
            says: [
                "Piknikte öğle güneşinde uyuyakalmışım, yüzüm kızardı. 🌳",
                "Bisiklet turunda kollarım güneşten kızardı ve sıcak. 🚲"
            ]
        }
    ],
    er: [
        {
            problem: "🥵 Güneşte Fenalaşma", card: "r_fluid",
            says: [
                "Güneşin altında saatlerce top oynadım, hiç su içmedim. Başım dönüyor. ☀️",
                "Çok terledim, ağzım kupkuru ve gözlerim kararıyor. 😩"
            ]
        },
        {
            problem: "🤢 Kusma Sonrası Halsizlik", card: "r_fluid",
            says: [
                "Sabahtan beri midem bulanıyor, kustum ve hiçbir şey içemedim. 🤢",
                "Karnım bozuldu, çok halsizim ve dudaklarım kurudu. 😩"
            ]
        },
        {
            problem: "🤕 Başını Çarpma", card: "r_watch",
            says: [
                "Ranzadan düşüp başımı çarptım, şimdi biraz sersemim. 🛏️",
                "Top başıma çarptı, etraf dönüyor gibi geliyor. ⚽"
            ]
        },
        {
            problem: "😵 Düşme Sonrası Sersemlik", card: "r_watch",
            says: [
                "Bisikletten düştüm. Kaskım vardı ama kendimi tuhaf hissediyorum. 🚲",
                "Kayarken başımı buza vurdum, uykum geldi. ⛸️"
            ]
        },
        {
            problem: "👂 Kulağa Kaçan Boncuk", card: "r_ear",
            says: [
                "Oyun oynarken kulağıma boncuk kaçtı, çıkmıyor! 😱",
                "Kulağımda bir şey vızıldıyor, sanırım böcek girdi! 🐞"
            ]
        },
        {
            problem: "🙉 Tıkanan Kulak", card: "r_ear",
            says: [
                "Kulağıma pamuk parçası sıkıştı, o taraftan duyamıyorum. 😟",
                "Kardeşim kulağıma nohut soktu, çıkaramıyoruz! 😩"
            ]
        }
    ]
};

/* i18n-on */

// Bölüm kartlarının istatistikleri ve bölüm listeleri başlangıç kaydına eklenir.
for (const ward of wards) {
    defaultState.wardPatients[ward.id] = [];
    defaultState.wardCases[ward.id] = 0;

    for (const card of ward.cards) {
        defaultState.cardStats[card.id] = { right: 0, wrong: 0 };
    }
}

const screenData = [
    ["home", "🏠", t("Panel"), t("Doktor Paneli")],
    ["clinic", "🏥", t("Klinik"), t("Kliniğim")],
    ["patients", "🧒", t("Hastalar"), t("Hastalarım")],
    ["story", "📚", t("Hikâye"), t("Hikâye Modu")],
    ["wards", "🏨", t("Bölümler"), t("Uzmanlık Bölümleri")],
    ["files", "🗂️", t("Dosyalar"), t("Hasta Dosyaları")],
    ["guide", "📖", t("Rehber"), t("Oyun Rehberi")],
    ["games", "🎮", t("Oyunlar"), t("Mini Oyunlar")],
    ["album", "📒", t("Albüm"), t("Çıkartma Albümü")],
    ["body", "🧍", t("Vücut"), t("Vücut Haritası")],
    ["store", "🛍️", t("Mağaza"), t("Doktor Mağazası")],
    ["doctor", "👨‍⚕️", t("Doktorum"), t("Doktorum")],
    ["badges", "🏆", t("Rozetler"), t("Rozetler")],
    ["parent", "👪", t("Ebeveyn"), t("Ebeveyn Köşesi")],
    ["settings", "⚙️", t("Ayarlar"), t("Ayarlar")]
];

let state = clone(defaultState);
let clinicItems = clone(defaultClinic);
let currentUser = null;
let currentScreen = "home";
let selectedAge = "küçük";
let selectedClinicItem = null;
let selectedClinicType = null;
let currentRoom = "main";
let dragging = null;
let activePatientId = null;
let activeModal = null;
let returnFocus = null;
let gameRound = null;
let lastGameKind = "quiz";
let toastTimer = null;
let toastQueue = [];
let caseTimer = null;
let examTimer = null;
let tourIndex = 0;
let gameTimers = [];
let gameFrame = null;
let pendingLevelUps = 0;
let audioContext = null;
let authBusy = false;
let appOpen = false;
let storageProblem = false;
let parentUnlocked = false;
let seasonPreview = null;
let gateAnswer = 0;
let gatePurpose = "";
let playTimer = null;
let playTicks = 0;
let installPrompt = null;
