const collections = [
  { id: "ninar", title: "Canções de Ninar", count: 6, icon: "☾", className: "" },
  { id: "natal", title: "Músicas de Natal", count: 6, icon: "✳", className: "natal" },
  { id: "classicas", title: "Clássicas", count: 7, icon: "♬", className: "classicas" },
  { id: "celtas", title: "Músicas Celtas", count: 6, icon: "❋", className: "celtas" },
  { id: "catolicas", title: "Católicas", count: 3, icon: "✧", className: "catolicas" },
  { id: "pascoa", title: "Páscoa", count: 2, icon: "❀", className: "pascoa" },
];

const knownTracks = [
  { title: "Canção de Ninar (Brahms)", credit: "Johannes Brahms · Op. 49 No. 4" },
  { title: "Twinkle Twinkle Little Star", credit: "Tradicional · Mozart (variações)" },
  { title: "Au Clair de la Lune", credit: "Tradicional Francesa" },
  { title: "Rock-a-bye Baby", credit: "Tradicional" },
  { title: "All Through the Night", credit: "Tradicional Galesa" },
  { title: "Summertime (Gershwin)", credit: "George Gershwin · Porgy and Bess" },
];

const instruments = [
  "Piano", "Harpa", "Xilofone", "Violão", "Kalimba", "Handpan", "Violino",
  "Flauta", "Violoncelo", "Trompete", "Saxofone", "Clarinete", "Órgão", "Baixo",
];
const notes = [
  { name: "Dó", frequency: 261.63, key: "A" },
  { name: "Ré", frequency: 293.66, key: "S" },
  { name: "Mi", frequency: 329.63, key: "D" },
  { name: "Fá", frequency: 349.23, key: "F" },
  { name: "Sol", frequency: 392, key: "G" },
  { name: "Lá", frequency: 440, key: "H" },
  { name: "Si", frequency: 493.88, key: "J" },
  { name: "Dó♯", frequency: 277.18, key: "W", black: true },
  { name: "Ré♯", frequency: 311.13, key: "E", black: true },
  { name: "Fá♯", frequency: 369.99, key: "T", black: true },
  { name: "Sol♯", frequency: 415.3, key: "Y", black: true },
  { name: "Lá♯", frequency: 466.16, key: "U", black: true },
];

const app = document.querySelector("#app");
const announcer = document.querySelector("#announcer");
const state = {
  page: "tocar",
  collection: "ninar",
  trackIndex: 0,
  instrument: "Piano",
  playing: false,
  volume: 0.7,
  notesInComposition: [],
  timer: null,
  timerSeconds: 0,
  audio: null,
  playbackTimeout: null,
};

function loadCompositions() {
  try {
    const value = JSON.parse(localStorage.getItem("magicdreams.compositions") ?? "[]");
    if (!Array.isArray(value)) {
      console.warn("O conteúdo de composições salvo neste navegador não tem o formato esperado.");
      return [];
    }
    const valid = value.filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.instrument === "string" &&
      Number.isFinite(item.tempo) &&
      item.tempo >= 40 &&
      item.tempo <= 180 &&
      Array.isArray(item.notes) &&
      item.notes.length > 0 &&
      item.notes.every((note) => note && typeof note.name === "string" && Number.isFinite(note.frequency) && note.frequency > 0)
    );
    if (valid.length !== value.length) {
      console.warn("Composições inválidas no armazenamento local foram ignoradas.");
    }
    return valid;
  } catch (error) {
    console.error("Não foi possível ler as composições salvas.", error);
    return [];
  }
}

function saveCompositions(value) {
  try {
    localStorage.setItem("magicdreams.compositions", JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar as composições neste navegador.", error);
    announce("O navegador não permitiu salvar a composição.");
    return false;
  }
}

function announce(message) {
  announcer.textContent = message;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function getCollection() {
  return collections.find((item) => item.id === state.collection) ?? collections[0];
}

function getAudioContext() {
  const AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContext) {
    announce("Este navegador não oferece suporte a áudio sintetizado.");
    return null;
  }
  state.audio ??= new AudioContext();
  if (state.audio.state === "suspended") state.audio.resume();
  return state.audio;
}

function playTone(frequency, duration = 0.42) {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = state.instrument === "Xilofone" || state.instrument === "Kalimba" ? "sine" : "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(Math.max(0.001, state.volume * 0.16), context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playSequence(sequence, tempo = 360) {
  const context = getAudioContext();
  if (!context) return;
  sequence.forEach((note, index) => {
    const delay = index * tempo;
    window.setTimeout(() => playTone(note.frequency, 0.32), delay);
  });
}

function collectionCard(item) {
  const selected = state.collection === item.id;
  return `
    <button class="theme-card" type="button" data-collection="${item.id}" aria-pressed="${selected}">
      <span class="theme-art ${item.className}" aria-hidden="true">${item.icon}</span>
      ${selected ? '<span class="theme-check" aria-hidden="true">✓</span>' : ""}
      <span class="theme-info"><strong>${escapeHtml(item.title)}</strong><span>${item.count} músicas</span></span>
    </button>`;
}

function renderQueue() {
  if (state.collection !== "ninar") {
    const selected = getCollection();
    return `<div class="empty-state">A página pública informa ${selected.count} músicas em “${escapeHtml(selected.title)}”, mas não exibe os títulos. Importe sua biblioteca autorizada para completar esta coleção.</div>`;
  }
  return `<ol class="track-list">${knownTracks.map((track, index) => `
    <li class="track-row ${state.trackIndex === index ? "current" : ""}">
      <span class="track-index">${index + 1}</span>
      <span class="track-name"><strong>${escapeHtml(track.title)}</strong><span>${escapeHtml(track.credit)}</span></span>
      <button class="track-play" type="button" data-track="${index}" aria-label="Tocar ${escapeHtml(track.title)}">▶</button>
    </li>`).join("")}</ol>`;
}

function renderTocar() {
  const current = knownTracks[state.trackIndex];
  return `
    <div class="toolbar">
      <button class="button" type="button" data-action="timer">◷ <span>${state.timerSeconds ? formatTime(state.timerSeconds) : "Timer"}</span></button>
      <button class="button" type="button" data-action="fullscreen">⛶ <span>Tela cheia</span></button>
    </div>
    <div class="radio-badge">◉ Rádio · 1 tema selecionado</div>
    <section aria-labelledby="radio-title">
      <div class="section-title"><h2 id="radio-title">Escolha os temas para a rádio</h2></div>
      <div class="theme-grid">${collections.map(collectionCard).join("")}</div>
      <p class="unknown-note">Coleções e quantidades reproduzem o que está visível no site público. A lista completa das outras coleções não foi disponibilizada nessa página.</p>
    </section>
    <section class="queue-wrap" aria-label="Rádio e fila de músicas">
      <div class="panel queue">
        <div class="section-title"><h2>Fila da rádio · ${getCollection().count} músicas</h2><span>${escapeHtml(getCollection().title)}</span></div>
        ${renderQueue()}
      </div>
      <div class="panel player-card">
        <div>
          <div class="player-orb" aria-hidden="true">♫</div>
          <h3>${escapeHtml(state.playing ? current.title : "Rádio pronta para tocar")}</h3>
          <p>${escapeHtml(state.playing ? current.credit : `${state.instrument} · ${getCollection().count} músicas`)}</p>
          <div class="playback">
            <button class="round" type="button" data-action="previous" aria-label="Faixa anterior">|◀</button>
            <button class="round play" type="button" data-action="play" aria-label="${state.playing ? "Pausar" : "Tocar"}">${state.playing ? "Ⅱ" : "▶"}</button>
            <button class="round" type="button" data-action="next" aria-label="Próxima faixa">▶|</button>
          </div>
          <label class="volume-row" for="volume">◖
            <input id="volume" type="range" min="0" max="1" step="0.05" value="${state.volume}" aria-label="Volume" />
          </label>
        </div>
        <p class="player-caption">${state.playing ? "Amostra instrumental sintetizada" : "Pronta para tocar"}</p>
      </div>
    </section>
    <section class="panel instrument-panel">
      <div class="section-title"><h2>Instrumento</h2><span>Som sintetizado neste navegador</span></div>
      <div class="instrument-list">${instruments.map((name) => `
        <button class="instrument-chip" type="button" data-instrument="${escapeHtml(name)}" aria-pressed="${state.instrument === name}">${escapeHtml(name)}</button>
      `).join("")}</div>
    </section>
    <p class="disclaimer">Esta migração recria a interface e os controles observados. Não inclui gravações, letras ou partituras do site original. O áudio acima é um tom de demonstração gerado localmente.</p>`;
}

function renderCompor() {
  const saved = loadCompositions();
  const noteButtons = notes.slice(0, 7).map((note, index) => `
    <button class="note-key" type="button" data-compose-note="${index}" aria-label="Adicionar nota ${note.name}">${note.name}<br><small>${note.key}</small></button>
  `).join("");
  return `
    <div class="page-heading"><span class="eyebrow">Criação musical</span><h1>Compor</h1><p>Monte uma pequena sequência, escute a demonstração e guarde suas ideias neste navegador.</p></div>
    <div class="content-grid">
      <section class="panel content-card">
        <h2>Nova composição</h2>
        <form id="composition-form" class="form-grid">
          <label class="field full">Nome<input name="title" maxlength="60" placeholder="Minha melodia" required /></label>
          <label class="field">Instrumento<select name="instrument">${instruments.map((item) => `<option ${item === state.instrument ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></label>
          <label class="field">Andamento (BPM)<input name="tempo" type="number" min="40" max="180" value="90" required /></label>
        </form>
        <div class="note-builder" aria-label="Notas para adicionar">${noteButtons}</div>
        <p id="composition-preview" class="keyboard-legend">Notas: ${state.notesInComposition.map((note) => escapeHtml(note.name)).join(" · ") || "nenhuma adicionada"}</p>
        <div class="toolbar" style="justify-content:flex-start">
          <button class="button" type="button" data-action="clear-notes">Limpar notas</button>
          <button class="button" type="button" data-action="preview-composition">▶ Ouvir</button>
          <button class="button primary" type="submit" form="composition-form">Salvar</button>
        </div>
        <p class="disclaimer">As composições ficam salvas apenas no armazenamento local deste navegador; não são enviadas a um servidor.</p>
      </section>
      <section class="panel content-card"><h2>Minhas composições</h2>${renderSavedCompositions(saved)}</section>
    </div>`;
}

function renderSavedCompositions(saved) {
  if (!saved.length) return '<div class="empty-state">Suas ideias salvas aparecerão aqui.</div>';
  return `<ul class="saved-list">${saved.map((item) => `
    <li class="saved-item"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.instrument)} · ${escapeHtml(item.tempo)} BPM · ${item.notes.length} notas</span></div>
    <button class="button small" type="button" data-play-saved="${escapeHtml(item.id)}">▶ Ouvir</button></li>
  `).join("")}</ul>`;
}

function renderPiano() {
  const keyboardNotes = [notes[0], notes[7], notes[1], notes[8], notes[2], notes[3], notes[9], notes[4], notes[10], notes[5], notes[11], notes[6]];
  const keyMarkup = keyboardNotes.map((note) => `
    <button class="piano-key ${note.black ? "black" : ""}" type="button" data-piano-note="${note.name}" aria-label="Tocar ${note.name}, tecla ${note.key}">${note.name}<br><small>${note.key}</small></button>
  `).join("");
  return `
    <div class="page-heading"><span class="eyebrow">Instrumento interativo</span><h1>Piano</h1><p>Toque as teclas com o mouse, toque ou teclado. O som é sintetizado no dispositivo, sem arquivos de áudio externos.</p></div>
    <section class="panel content-card"><div class="section-title"><h2>Teclado musical</h2><span>Uma oitava</span></div>
      <div class="keyboard" role="group" aria-label="Teclas de piano">${keyMarkup}</div>
      <p class="keyboard-legend">Teclas brancas: A · S · D · F · G · H · J &nbsp;|&nbsp; Teclas pretas: W · E · T · Y · U</p>
      <div class="instrument-list">${instruments.map((name) => `<button class="instrument-chip" type="button" data-instrument="${escapeHtml(name)}" aria-pressed="${state.instrument === name}">${escapeHtml(name)}</button>`).join("")}</div>
    </section>`;
}

function renderBiblioteca() {
  return `
    <div class="page-heading"><span class="eyebrow">Coleções musicais</span><h1>Biblioteca</h1><p>Explore as coleções identificadas no site público. A busca filtra as faixas cuja identificação estava visível.</p></div>
    <label class="visually-hidden" for="library-search">Buscar música</label><input id="library-search" class="search-input" type="search" placeholder="Buscar faixa ou compositor..." />
    <section class="content-grid">${collections.map((item) => `
      <article class="panel content-card">
        <div class="section-title"><h2>${item.icon} ${escapeHtml(item.title)}</h2><span>${item.count} músicas</span></div>
        ${item.id === "ninar"
          ? `<ul class="track-list">${knownTracks.map((track, index) => `<li class="track-row" data-searchable="${escapeHtml(`${track.title} ${track.credit}`.toLowerCase())}"><span class="track-index">${index + 1}</span><span class="track-name"><strong>${escapeHtml(track.title)}</strong><span>${escapeHtml(track.credit)}</span></span><button class="track-play" type="button" data-track="${index}" aria-label="Tocar ${escapeHtml(track.title)}">▶</button></li>`).join("")}</ul>`
          : `<div class="empty-state">A coleção está listada publicamente, mas seus títulos não foram exibidos. Os dados podem ser completados com uma exportação autorizada.</div>`}
      </article>
    `).join("")}</section>`;
}

function renderPartituras() {
  const saved = loadCompositions();
  if (!saved.length) {
    return `<div class="page-heading"><span class="eyebrow">Leitura musical</span><h1>Partituras</h1><p>As partituras originais não estavam disponíveis na página pública consultada.</p></div>
      <section class="panel content-card"><h2>Crie sua primeira partitura</h2><p>As notas de composições criadas neste navegador podem ser exibidas aqui.</p><a class="button primary" href="#/compor">Ir para Compor</a><p class="disclaimer">A pauta abaixo é apenas uma prévia vazia; não representa uma partitura do site original.</p><div class="staff" aria-label="Pauta musical vazia"><div class="staff-note">𝄞</div></div></section>`;
  }
  return `<div class="page-heading"><span class="eyebrow">Leitura musical</span><h1>Partituras</h1><p>Pré-visualização das composições criadas localmente.</p></div>
    <section class="content-grid">${saved.map((item) => `<article class="panel content-card"><div class="section-title"><h2>${escapeHtml(item.title)}</h2><button class="button small" type="button" data-print>Imprimir</button></div><p>${escapeHtml(item.instrument)} · ${escapeHtml(item.tempo)} BPM</p><div class="staff" aria-label="Prévia de pauta para ${escapeHtml(item.title)}"><div class="staff-note">𝄞 ${item.notes.map((note) => `<span>${escapeHtml(note.name)}</span>`).join("")}</div></div><p class="disclaimer">Representação visual simples das notas; não é uma edição musical profissional.</p></article>`).join("")}</section>`;
}

function renderGaleria() {
  return `
    <div class="page-heading"><span class="eyebrow">Inspiração visual</span><h1>Galeria</h1><p>Uma galeria nova de ambientes e temas musicais, criada para esta versão independente.</p></div>
    <section class="gallery-grid" aria-label="Temas visuais">
      ${[
        ["☾", "Noite tranquila", "Canções de ninar"],
        ["✳", "Luzes de Natal", "Músicas de Natal"],
        ["♬", "Salão clássico", "Clássicas"],
        ["❋", "Bosque celta", "Músicas Celtas"],
        ["✧", "Luz serena", "Católicas"],
        ["❀", "Manhã de Páscoa", "Páscoa"],
      ].map(([icon, title, subtitle]) => `<article class="gallery-tile"><span aria-hidden="true">${icon}</span><strong>${title}</strong><small>${subtitle}</small></article>`).join("")}
    </section>
    <p class="disclaimer">Os cartões são ilustrações originais em CSS e não reutilizam as imagens do site Base44.</p>`;
}

function renderNatal() {
  return `
    <section class="panel christmas-hero">
      <span class="eyebrow" style="color:#f3dec2">Coleção especial</span>
      <h1>Uma rádio para o Natal</h1>
      <p>A página pública lista uma coleção de Músicas de Natal com seis faixas. Os títulos não estavam visíveis na extração pública consultada; esta versão preserva a coleção e permite uma demonstração instrumental sintetizada.</p>
      <button class="button" type="button" data-action="play-demo">▶ Ouvir demonstração</button>
    </section>
    <section class="content-grid" style="margin-top:18px">
      <article class="panel content-card"><div class="section-title"><h2>🎄 Músicas de Natal</h2><span>6 músicas</span></div><div class="empty-state">A lista detalhada precisa dos dados exportados da biblioteca original.</div></article>
      <article class="panel content-card"><h2>Som de demonstração</h2><p>Uma pequena sequência de tons gerada no seu navegador, sem reproduzir gravações ou melodias protegidas.</p><p class="disclaimer">O áudio é ilustrativo e não substitui as gravações originais.</p></article>
    </section>`;
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function render() {
  const pages = {
    tocar: renderTocar,
    compor: renderCompor,
    piano: renderPiano,
    biblioteca: renderBiblioteca,
    partituras: renderPartituras,
    galeria: renderGaleria,
    natal: renderNatal,
  };
  const page = pages[state.page] ?? renderTocar;
  app.innerHTML = page();
  document.querySelectorAll("[data-route]").forEach((link) => {
    if (link.dataset.route === state.page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function setPageFromHash() {
  const pageName = location.hash.replace(/^#\/?/, "") || "tocar";
  const pages = new Set(["tocar", "compor", "piano", "biblioteca", "partituras", "galeria", "natal"]);
  state.page = pages.has(pageName) ? pageName : "tocar";
  render();
}

function stopPlayback() {
  state.playing = false;
  if (state.playbackTimeout) window.clearTimeout(state.playbackTimeout);
  state.playbackTimeout = null;
  render();
}

function startPlayback() {
  if (state.collection !== "ninar") {
    announce("Os títulos desta coleção precisam ser importados antes da reprodução.");
    return;
  }
  if (!getAudioContext()) return;
  if (state.playbackTimeout) window.clearTimeout(state.playbackTimeout);
  state.playing = true;
  const scale = [261.63, 329.63, 392, 329.63, 293.66, 349.23];
  const playStep = (step) => {
    if (!state.playing) return;
    playTone(scale[step % scale.length], 0.5);
    state.trackIndex = step % knownTracks.length;
    render();
    state.playbackTimeout = window.setTimeout(() => playStep(step + 1), 1600);
  };
  playStep(state.trackIndex);
  announce("Demonstração instrumental sintetizada iniciada.");
}

function openTimer() {
  const dialog = document.createElement("div");
  dialog.className = "modal-backdrop";
  dialog.id = "timer-modal";
  dialog.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="timer-title">
    <h2 id="timer-title">Timer da rádio</h2>
    <p>Escolha por quanto tempo a demonstração continuará tocando.</p>
    <div class="timer-options">${[5, 15, 30, 60].map((minutes) => `<button class="button timer-option" type="button" data-minutes="${minutes}">${minutes} min</button>`).join("")}</div>
    <div class="toolbar" style="justify-content:space-between"><button class="button" type="button" data-action="cancel-timer">Fechar</button><button class="button" type="button" data-action="stop-timer">Cancelar timer</button></div>
  </section>`;
  document.body.append(dialog);
  dialog.querySelector("[data-minutes]").focus();
}

function setTimer(minutes) {
  window.clearTimeout(state.timer);
  state.timerSeconds = minutes * 60;
  state.timer = window.setInterval(() => {
    state.timerSeconds -= 1;
    if (state.timerSeconds <= 0) {
      window.clearInterval(state.timer);
      state.timer = null;
      state.timerSeconds = 0;
      stopPlayback();
      announce("O timer encerrou a demonstração.");
      return;
    }
    const timerLabel = document.querySelector('[data-action="timer"] span');
    if (timerLabel) timerLabel.textContent = formatTime(state.timerSeconds);
  }, 1000);
  document.querySelector("#timer-modal")?.remove();
  render();
  announce(`Timer definido para ${minutes} minutos.`);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.collection) {
    state.collection = target.dataset.collection;
    state.trackIndex = 0;
    stopPlayback();
  } else if (target.dataset.instrument) {
    state.instrument = target.dataset.instrument;
    render();
    announce(`Instrumento selecionado: ${state.instrument}.`);
  } else if (target.dataset.track !== undefined) {
    state.trackIndex = Number(target.dataset.track);
    if (state.playing) startPlayback();
    else { render(); announce(`Selecionada: ${knownTracks[state.trackIndex].title}.`); }
  } else if (target.dataset.pianoNote) {
    const note = notes.find((item) => item.name === target.dataset.pianoNote);
    if (note) playTone(note.frequency);
  } else if (target.dataset.composeNote !== undefined) {
    const note = notes[Number(target.dataset.composeNote)];
    state.notesInComposition.push(note);
    render();
    announce(`Nota ${note.name} adicionada.`);
  } else if (target.dataset.playSaved) {
    const item = loadCompositions().find((composition) => composition.id === target.dataset.playSaved);
    if (item) playSequence(item.notes);
  } else if (target.dataset.action === "play") {
    if (state.playing) stopPlayback();
    else startPlayback();
  } else if (target.dataset.action === "next" || target.dataset.action === "previous") {
    const direction = target.dataset.action === "next" ? 1 : -1;
    state.trackIndex = (state.trackIndex + direction + knownTracks.length) % knownTracks.length;
    if (state.playing) startPlayback();
    else { render(); announce(`Selecionada: ${knownTracks[state.trackIndex].title}.`); }
  } else if (target.dataset.action === "timer") {
    openTimer();
  } else if (target.dataset.minutes) {
    setTimer(Number(target.dataset.minutes));
  } else if (target.dataset.action === "cancel-timer") {
    document.querySelector("#timer-modal")?.remove();
  } else if (target.dataset.action === "stop-timer") {
    window.clearInterval(state.timer);
    state.timer = null;
    state.timerSeconds = 0;
    document.querySelector("#timer-modal")?.remove();
    render();
    announce("Timer cancelado.");
  } else if (target.dataset.action === "fullscreen") {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch((error) => {
      console.error("Não foi possível abrir a tela cheia.", error);
      announce("Não foi possível abrir a tela cheia neste dispositivo.");
    });
  } else if (target.dataset.action === "clear-notes") {
    state.notesInComposition = [];
    render();
  } else if (target.dataset.action === "preview-composition") {
    playSequence(state.notesInComposition);
  } else if (target.dataset.action === "play-demo") {
    playSequence(notes.slice(0, 7), 280);
    announce("Demonstração sintetizada iniciada.");
  } else if (target.dataset.print !== undefined) {
    window.print();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "volume") {
    state.volume = Number(event.target.value);
  }
  if (event.target.id === "library-search") {
    const query = event.target.value.trim().toLocaleLowerCase("pt-BR");
    app.querySelectorAll("[data-searchable]").forEach((row) => {
      row.hidden = !row.dataset.searchable.includes(query);
    });
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "composition-form") return;
  event.preventDefault();
  const formData = new FormData(event.target);
  if (!state.notesInComposition.length) {
    announce("Adicione pelo menos uma nota antes de salvar.");
    return;
  }
  const saved = loadCompositions();
  const composition = {
    id: crypto.randomUUID(),
    title: String(formData.get("title")).trim(),
    instrument: String(formData.get("instrument")),
    tempo: Number(formData.get("tempo")),
    notes: state.notesInComposition.map(({ name, frequency }) => ({ name, frequency })),
  };
  if (!composition.title || !Number.isFinite(composition.tempo)) {
    announce("Confira o título e o andamento da composição.");
    return;
  }
  if (saveCompositions([composition, ...saved])) {
    state.notesInComposition = [];
    render();
    announce(`Composição ${composition.title} salva neste navegador.`);
  }
});

window.addEventListener("keydown", (event) => {
  if (state.page !== "piano" || event.repeat || event.target.matches("input, select, textarea")) return;
  const note = notes.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
  if (note) {
    event.preventDefault();
    playTone(note.frequency);
    const keyButton = [...app.querySelectorAll("[data-piano-note]")].find((button) => button.dataset.pianoNote === note.name);
    keyButton?.classList.add("active");
    window.setTimeout(() => keyButton?.classList.remove("active"), 180);
  }
});

window.addEventListener("hashchange", setPageFromHash);
setPageFromHash();
