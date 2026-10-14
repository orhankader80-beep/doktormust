"use strict";

/* ===== MÜZİK ===== */

// Web Audio ile çalınan kısa, döngülü bir melodi; ses dosyası gerektirmez.
// melody: [frekans, vuruş] çiftleri, 4 vuruşluk 8 ölçü. bassLine: her ölçünün kök sesi.
const musicBeat = .46;

const melody = [
    [330, 1], [392, 1], [523, 1], [392, 1],
    [440, 1], [523, 1], [392, 2],
    [330, 1], [392, 1], [440, 1], [392, 1],
    [330, 1], [294, 1], [262, 2],
    [294, 1], [330, 1], [392, 1], [330, 1],
    [440, 1], [392, 1], [330, 2],
    [392, 1], [440, 1], [523, 1], [440, 1],
    [392, 1], [330, 1], [262, 2]
];

const bassLine = [131, 175, 131, 131, 196, 110, 175, 131];

let musicTimer = null;
let musicGain = null;
let musicStep = 0;
let musicBeats = 0;
let musicTime = 0;

function musicNote(frequency, time, length, type, volume) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);

    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + .03);
    gain.gain.exponentialRampToValueAtTime(.0001, time + length);

    oscillator.connect(gain);
    gain.connect(musicGain);

    oscillator.start(time);
    oscillator.stop(time + length + .02);
    oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
    };
}

// Notalar yarım saniye önceden planlanır; zamanlayıcı gecikse de ritim bozulmaz.
function scheduleMusic() {
    // Arka plandayken nota biriktirilmez; dönünce melodi kaldığı yerden sürer.
    if (document.hidden || !musicGain || audioContext.state !== "running") return;

    if (musicTime < audioContext.currentTime) musicTime = audioContext.currentTime + .05;

    // Klinikte, evde ve eczanede farklı melodi çalar.
    const track = musicTrack();

    while (musicTime < audioContext.currentTime + .6) {
        const [frequency, beats] = track.melody[musicStep % track.melody.length];

        if (musicBeats % 4 === 0) {
            musicNote(track.bass[musicBeats / 4 % track.bass.length],
                musicTime, track.beat * 3.6, "sine", .03);
        }

        musicNote(frequency, musicTime, track.beat * beats * .92, track.wave, .028);

        musicTime += track.beat * beats;
        musicBeats += beats;
        musicStep++;
    }
}

function startMusic() {
    if (musicTimer !== null || !appOpen || !state.music) return;
    if (!$("limitOverlay").hidden) return;

    try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;

        audioContext = audioContext || new Audio();
        wakeAudio();

        musicGain = audioContext.createGain();
        musicGain.connect(audioContext.destination);

        musicStep = 0;
        musicBeats = 0;
        musicTime = 0;
        musicTimer = setInterval(scheduleMusic, 200);
        scheduleMusic();
    } catch (error) {
        console.warn("Müzik başlatılamadı.", error);
    }
}

function stopMusic() {
    clearInterval(musicTimer);
    musicTimer = null;

    if (!musicGain) return;

    const gain = musicGain;
    musicGain = null;

    try {
        gain.gain.setTargetAtTime(.0001, audioContext.currentTime, .05);
        setTimeout(() => gain.disconnect(), 400);
    } catch (error) {
        console.warn("Müzik durdurulamadı.", error);
    }
}

// Tarayıcılar sesi ilk dokunuşa kadar bekletir; dokunuşta ses yeniden açılır.
function wakeAudio() {
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
    }
}

function toggleMusic() {
    if (!appOpen) return;

    state.music = !state.music;
    commit();

    if (state.music) startMusic();
    else stopMusic();
}
