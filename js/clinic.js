"use strict";

/* ===== ÇIKARTMA ALBÜMÜ ===== */

function renderAlbum() {
    $("albumGrid").innerHTML = "";

    stickerSets.forEach(set => {
        const count = set.stickers
            .filter(sticker => state.stickers.includes(sticker.id)).length;
        const card = document.createElement("div");

        card.className = "card album-set";
        card.innerHTML = `
            <h3>${set.emoji} ${escapeHTML(set.name)}
                <span class="small muted">${count} / ${set.stickers.length}</span></h3>
            <p class="small muted">${state.albumSets.includes(set.id)
                ? t("✅ Sayfa tamamlandı, ödülün alındı!")
                : t("Sayfayı tamamla: +5 💎 ve +100 coin")}</p>
            <div class="sticker-grid"></div>
        `;

        set.stickers.forEach(sticker => {
            const owned = state.stickers.includes(sticker.id);
            const button = document.createElement("button");

            button.className = "sticker " + (owned ? "owned" : "missing");
            button.setAttribute("aria-label",
                owned ? sticker.name : t("Henüz bulunmayan çıkartma"));
            button.innerHTML = `
                <span>${owned ? sticker.emoji : "❔"}</span>
                <small>${owned ? escapeHTML(sticker.name) : "???"}</small>
            `;

            button.onclick = () => {
                if (owned) {
                    showInfo(sticker.emoji, sticker.name, sticker.fact,
                        t("Çıkartma bilgileri geneldir. Merak ettiklerini bir büyüğüne sor."));
                } else {
                    toast(t("🎟️ Bu çıkartma vakalardan ve mini oyunlardan çıkabilir."));
                }
            };

            card.querySelector(".sticker-grid").appendChild(button);
        });

        $("albumGrid").appendChild(card);
    });
}

/* ===== MAĞAZA VE DOKTOR ===== */

function renderStore() {
    $("storeGrid").innerHTML = "";

    storeItems.forEach(item => {
        const owned = state.ownedItems.includes(item.id);
        const locked = !owned && state.level < (item.level || 1);
        const card = document.createElement("div");
        card.className = "card shop-item";

        card.innerHTML = `
            <div class="shop-emoji">${item.emoji}</div>
            <h3>${escapeHTML(item.name)}</h3>
            <p class="effect">${item.effect ? "✨ " + escapeHTML(item.effect) : t("Klinik süsü")}</p>
            <div class="price">${priceLabel(item)}</div>
            <button class="${owned || locked ? "secondary-btn" : "primary-btn"}"
                ${owned || locked ? "disabled" : ""}>
                ${owned ? t("✅ Sahip") : locked ? t("🔒 Seviye ") + item.level : t("Satın Al")}
            </button>
        `;

        card.querySelector("button").onclick = () => buyItem(item.id);
        $("storeGrid").appendChild(card);
    });

    renderStaff();
}

function buyItem(id) {
    if (!appOpen) return;

    const item = storeItems.find(item => item.id === id);
    if (!item || state.ownedItems.includes(id)) return;
    if (state.level < (item.level || 1)) return;
    if (!pay(item)) return;

    state.ownedItems.push(id);
    const saved = commit();
    renderStore();

    playSound("coin");
    if (!currentUser || saved) toast(t("🛍️ Eşya satın alındı!"));
}

function changeFace() {
    if (!appOpen) return;
    state.doctor.face = (state.doctor.face + 1) % 3;
    commit();
}

function priceLabel(item) {
    if (item.gems) return "💎 " + item.gems;
    return item.price ? "🪙 " + item.price : t("ÜCRETSİZ");
}

// Eşya veya aksesuarın ücretini coin ya da elmastan düşer.
function pay(item) {
    if (item.gems) {
        if (state.gems < item.gems) {
            toast(t("💎 Yeterli elmasın yok. Seviye atla, rozet ve günlük ödül topla."));
            return false;
        }

        state.gems -= item.gems;
        return true;
    }

    if (state.coins < (item.price || 0)) {
        toast(t("🪙 Yeterli oyun coinin yok."));
        return false;
    }

    state.coins -= item.price || 0;
    return true;
}

function renderAccessories() {
    $("accGrid").innerHTML = "";

    accessories.forEach((accessory, index) => {
        const owned = state.ownedAccessories.includes(index);
        const active = state.doctor.accessory === index;

        const button = document.createElement("button");
        button.className = "acc-btn";
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label",
            accessory.name + (owned ? "" : " — " + priceLabel(accessory)));

        button.innerHTML = `
            <span>${accessory.emoji || "🚫"}</span>
            <small>${owned ? escapeHTML(accessory.name) : priceLabel(accessory)}</small>
        `;

        button.onclick = () => chooseAccessory(index);
        $("accGrid").appendChild(button);
    });
}

function chooseAccessory(index) {
    if (!appOpen) return;

    const accessory = accessories[index];
    if (!accessory) return;

    const buying = !state.ownedAccessories.includes(index);

    if (buying) {
        if (!pay(accessory)) return;
        state.ownedAccessories.push(index);
    }

    state.doctor.accessory = index;
    const saved = commit();
    renderAccessories();

    if (buying && (!currentUser || saved)) toast(t("✨ {0} alındı!", accessory.name), true);
}

function setBg(color) {
    if (!appOpen || !/^#[0-9a-f]{6}$/i.test(color)) return;
    state.doctor.bg = color;
    commit();
}

function renderBadges() {
    $("badgeGrid").innerHTML = badges.map(badge => `
        <div class="card game-card">
            <div class="badge">${state.badges.includes(badge[0]) ? badge[1] : "🔒"}</div>
            <h3>${escapeHTML(badge[2])}</h3>
            <p class="muted">${escapeHTML(badge[3])}</p>
            <p>${state.badges.includes(badge[0]) ? t("✅ Kazanıldı") : t("Henüz kazanılmadı")}</p>
        </div>
    `).join("");
}

/* ===== KLİNİK ===== */

function itemInfo(type) {
    return storeItems.find(item => item.id === type);
}

function updateSelectedStyle() {
    $("clinicEditArea").querySelectorAll(".placed-item").forEach(element => {
        const selected = element.dataset.itemId === selectedClinicItem;
        element.classList.toggle("selected", selected);
        element.setAttribute("aria-pressed", String(selected));
    });
}

function renderClinicTools() {
    $("clinicItems").innerHTML = "";

    storeItems.forEach(item => {
        const owned = state.ownedItems.includes(item.id);
        const button = document.createElement("button");
        button.className = "clinic-item-btn";
        button.classList.toggle("active", selectedClinicType === item.id);

        button.innerHTML = `
            <span>${item.emoji}</span>
            <small>${owned ? "" : "🔒 "}${escapeHTML(item.name)}</small>
        `;

        button.onclick = () => selectClinicType(item.id);
        $("clinicItems").appendChild(button);
    });

    const item = clinicItems.find(item => item.id === selectedClinicItem);

    $("selectedTool").textContent = item
        ? t("✏️ Seçili: ") + itemInfo(item.type).name
        : selectedClinicType
            ? "📍 " + itemInfo(selectedClinicType).name + t(" — kliniğe tıkla")
            : t("👆 Bir eşya seç");
}

function renderClinic() {
    const area = $("clinicEditArea");
    area.querySelectorAll(".placed-item").forEach(element => element.remove());

    renderRoomTabs();

    clinicItems.forEach(item => {
        const info = itemInfo(item.type);
        if (!info || !state.ownedItems.includes(item.type)) return;
        if ((item.room || "main") !== currentRoom) return;

        const element = document.createElement("button");
        element.type = "button";
        element.className = "placed-item";
        element.dataset.itemId = item.id;
        element.setAttribute("aria-label", info.name);

        // Hareket iç simgeye verilir; düğmenin kendi konumu ve dönüşü bozulmaz.
        const emoji = document.createElement("span");
        emoji.textContent = info.emoji;
        if (info.motion) emoji.className = info.motion;
        element.appendChild(emoji);

        // Maskota verilen ad köpeğin altında görünür.
        if (item.type === "pet" && state.petName) {
            const label = document.createElement("small");
            label.className = "pet-name";
            label.textContent = state.petName;
            element.appendChild(label);
            element.setAttribute("aria-label", `${info.name}: ${state.petName}`);
        }

        element.style.left = item.x + "%";
        element.style.top = item.y + "%";
        element.style.transform = `translate(-50%,-50%) rotate(${item.r}deg)`;

        element.addEventListener("pointerdown", event => startDrag(event,item.id));

        element.addEventListener("click", event => {
            event.stopPropagation();
            selectedClinicItem = item.id;
            selectedClinicType = null;
            updateSelectedStyle();
            renderClinicTools();
        });

        element.addEventListener("keydown", event => {
            const moves = {
                ArrowLeft: [-2,0], ArrowRight: [2,0],
                ArrowUp: [0,-2], ArrowDown: [0,2]
            };

            if (!own(moves,event.key)) return;
            event.preventDefault();

            selectedClinicItem = item.id;
            selectedClinicType = null;
            item.x = clamp(item.x + moves[event.key][0],7,93);
            item.y = clamp(item.y + moves[event.key][1],10,90);

            element.style.left = item.x + "%";
            element.style.top = item.y + "%";

            state.clinicEdited = true;
            updateSelectedStyle();
            renderClinicTools();
            commit();
        });

        area.appendChild(element);
    });

    updateSelectedStyle();
    renderClinicTools();
    renderWalkers();
    renderClinicStaff();
    renderDecor();
    renderDecorOptions();
    $("clinicDoctor").textContent = doctorEmoji();
    applyTheme();
}

// Son iyileşen hastalar muayene odasında dolaşır.
function renderWalkers() {
    const area = $("clinicEditArea");
    area.querySelectorAll(".clinic-walker").forEach(element => element.remove());

    if (currentRoom !== "main") return;

    state.treated.slice(-4).forEach((visitor, index) => {
        const walker = document.createElement("div");
        walker.className = "clinic-walker";
        walker.setAttribute("aria-hidden", "true");
        walker.style.left = 15 + index * 23 + "%";
        walker.style.top = 66 + index * 8 + "%";
        walker.style.animationDuration = 9 + index * 2.5 + "s";
        walker.style.animationDelay = -index * 3.7 + "s";

        const emoji = document.createElement("span");
        emoji.textContent = visitor.emoji;
        walker.appendChild(emoji);
        area.appendChild(walker);
    });
}

function renderRoomTabs() {
    $("roomTabs").innerHTML = "";

    rooms.forEach(room => {
        const locked = state.level < room.level;
        const button = document.createElement("button");

        button.textContent = locked
            ? t("🔒 {0} (Seviye {1})", room.name, room.level)
            : `${room.emoji} ${room.name}`;
        button.classList.toggle("active", room.id === currentRoom);
        button.setAttribute("aria-pressed", String(room.id === currentRoom));

        button.onclick = () => {
            if (locked) {
                toast(t("🔒 {0} {1}. seviyede açılır.", room.name, room.level));
                return;
            }

            endDrag();
            currentRoom = room.id;
            selectedClinicItem = null;
            renderClinic();
        };

        $("roomTabs").appendChild(button);
    });

    renderDecor();
}

function selectClinicType(type) {
    if (!appOpen) return;
    const info = itemInfo(type);
    if (!info) return;

    if (!state.ownedItems.includes(type)) {
        showScreen("store");
        toast(t("🛍️ Önce bu eşyayı mağazadan almalısın."));
        return;
    }

    selectedClinicType = type;
    selectedClinicItem = null;
    updateSelectedStyle();
    renderClinicTools();
}

function placeItem(event) {
    if (!appOpen || currentScreen !== "clinic") return;
    if (event.target.closest(".placed-item") || !selectedClinicType) return;
    if (!state.ownedItems.includes(selectedClinicType)) return;

    const area = $("clinicEditArea").getBoundingClientRect();
    if (!area.width || !area.height) return;

    const item = {
        id: newId(),
        type: selectedClinicType,
        room: currentRoom,
        x: clamp((event.clientX - area.left) / area.width * 100,7,93),
        y: clamp((event.clientY - area.top) / area.height * 100,10,90),
        r: 0
    };

    clinicItems.push(item);
    selectedClinicItem = item.id;
    selectedClinicType = null;
    state.clinicEdited = true;
    commit();
    renderClinic();
}

function startDrag(event,id) {
    if (!appOpen || !event.isPrimary || event.button !== 0) return;

    const item = clinicItems.find(item => item.id === id);
    if (!item) return;

    event.preventDefault();
    event.stopPropagation();

    const area = $("clinicEditArea").getBoundingClientRect();
    if (!area.width || !area.height) return;

    selectedClinicItem = id;
    selectedClinicType = null;

    dragging = {
        id,
        pointerId: event.pointerId,
        element: event.currentTarget,
        startX: item.x,
        startY: item.y,
        offsetX: event.clientX - area.left - item.x / 100 * area.width,
        offsetY: event.clientY - area.top - item.y / 100 * area.height
    };

    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    updateSelectedStyle();
    renderClinicTools();
}

function moveDrag(event) {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    const item = clinicItems.find(item => item.id === dragging.id);
    if (!item) return;

    const area = $("clinicEditArea").getBoundingClientRect();
    if (!area.width || !area.height) return;

    item.x = clamp(
        (event.clientX - area.left - dragging.offsetX) / area.width * 100,
        7,93
    );

    item.y = clamp(
        (event.clientY - area.top - dragging.offsetY) / area.height * 100,
        10,90
    );

    dragging.element.style.left = item.x + "%";
    dragging.element.style.top = item.y + "%";
}

function endDrag(event) {
    if (!dragging) return;
    if (event && event.pointerId !== dragging.pointerId) return;

    const previous = dragging;
    dragging = null;

    try {
        if (previous.element.hasPointerCapture?.(previous.pointerId)) {
            previous.element.releasePointerCapture(previous.pointerId);
        }
    } catch (error) {
        console.warn("İşaretçi bırakılırken:", error);
    }

    const item = clinicItems.find(item => item.id === previous.id);
    if (item && (item.x !== previous.startX || item.y !== previous.startY)) {
        state.clinicEdited = true;
        commit();
    }
}

function rotateSelectedItem() {
    if (!appOpen) return;
    endDrag();

    const item = clinicItems.find(item => item.id === selectedClinicItem);
    if (!item) {
        toast(t("👆 Önce kliniğe yerleştirdiğin bir eşyayı seç."));
        return;
    }

    item.r = (item.r + 45) % 360;
    state.clinicEdited = true;
    commit();
    renderClinic();
}

function deleteSelectedItem() {
    if (!appOpen) return;
    endDrag();

    const exists = clinicItems.some(item => item.id === selectedClinicItem);
    if (!exists) {
        toast(t("👆 Önce kliniğe yerleştirdiğin bir eşyayı seç."));
        return;
    }

    clinicItems = clinicItems.filter(item => item.id !== selectedClinicItem);
    selectedClinicItem = null;
    state.clinicEdited = true;

    const saved = commit();
    renderClinic();
    if (!currentUser || saved) toast(t("🗑️ Eşya klinikten kaldırıldı."));
}

function resetClinic() {
    if (!appOpen) return;
    endDrag();

    if (!confirm(t("Tüm odalar başlangıç düzenine dönsün mü? Satın aldığın eşyalar sende kalır."))) return;

    clinicItems = clone(defaultClinic).map(item => ({ ...item, id: newId() }));
    currentRoom = "main";
    selectedClinicItem = null;
    selectedClinicType = null;
    state.clinicEdited = true;

    const saved = commit();
    renderClinic();

    if (!currentUser || saved) toast(t("🔄 Klinik başlangıç düzenine döndü."));
}

function saveClinic() {
    if (!appOpen) return;
    endDrag();

    const saved = commit();
    if (!currentUser) toast(t("💾 Klinik bu misafir oturumu için tutuluyor."));
    else if (saved) toast(t("💾 Klinik kaydedildi!"), true);
}
