const collections = [
  { id: "ninar", title: "Canções de Ninar", count: 6, icon: "☾" },
  { id: "natal", title: "Músicas de Natal", count: 6, icon: "✳" },
  { id: "classicas", title: "Clássicas", count: 7, icon: "♬" },
  { id: "celtas", title: "Músicas Celtas", count: 6, icon: "❋" },
  { id: "catolicas", title: "Católicas", count: 3, icon: "✧" },
  { id: "pascoa", title: "Páscoa", count: 2, icon: "❀" },
];

const tracks = [
  { title: "Canção de Ninar (Brahms)", credit: "Johannes Brahms · Op. 49 No. 4" },
  { title: "Twinkle Twinkle Little Star", credit: "Tradicional · Mozart (variações)" },
  { title: "Au Clair de la Lune", credit: "Tradicional Francesa" },
  { title: "Rock-a-bye Baby", credit: "Tradicional" },
  { title: "All Through the Night", credit: "Tradicional Galesa" },
  { title: "Summertime (Gershwin)", credit: "George Gershwin · Porgy and Bess" },
];

const instruments = ["Piano", "Harpa", "Xilofone", "Violão", "Kalimba", "Handpan", "Violino", "Flauta", "Violoncelo", "Trompete", "Saxofone", "Clarinete", "Órgão", "Baixo"];
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
const demoNotes = [notes[4], notes[2], notes[5], notes[1], notes[3], notes[6], notes[4], notes[0]];
const storageKey = "magicdreams.alpha.compositions";
const app = document.querySelector("#app");
const announcer = document.querySelector("#announcer");
const state = {
  page: "tocar",
  collection: "ninar",
  instrument: "Piano",
  composition: [],
  audio: null,
  masterGain: null,
  demoTimers: [],
  demoLoop: null,
  demoPlaying: false,
  timer: null,
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function announce(message) {
  announcer.textContent = message;
}

function getCollection() {
  return collections.find((item) => item.id === state.collection) ?? collections[0];
}

function getCompositions() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(saved)) throw new TypeError("Formato de composições inválido.");
    return saved.filter((item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.instrument === "string" &&
      Number.isFinite(item.tempo) &&
      Array.isArray(item.notes) &&
      item.notes.every((note) => note && typeof note.name === "string" && Number.isFinite(note.frequency))
    );
  } catch (error) {
    console.error("Não foi possível carregar as composições deste navegador.", error);
    return [];
  }
}

function saveCompositions(compositions) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(compositions));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar as composições neste navegador.", error);
    announce("Não foi possível salvar. Verifique o espaço disponível no navegador.");
    return false;
  }
}

function audioContext() {
  const AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContext) {
    announce("Este navegador não oferece suporte a áudio.");
    return null;
  }
  if (!state.audio) {
    state.audio = new AudioContext();
    state.masterGain = state.audio.createGain();
    state.masterGain.gain.value = 0.55;
    state.masterGain.connect(state.audio.destination);
  }
  if (state.audio.state === "suspended") state.audio.resume();
  return state.audio;
}

function playTone(frequency, duration = 0.34, instrument = state.instrument) {
  const context = audioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = instrument === "Xilofone" || instrument === "Kalimba" ? "sine" : "triangle";
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.16, context.currentTime);
  envelope.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(envelope);
  envelope.connect(state.masterGain);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playSequence(sequence, beat = 300, instrument = state.instrument) {
  sequence.forEach((note, index) => {
    const timer = window.setTimeout(() => playTone(note.frequency, 0.34, instrument), index * beat);
    state.demoTimers.push(timer);
  });
}

function stopDemo() {
  state.demoTimers.forEach(window.clearTimeout);
  state.demoTimers = [];
  state.demoPlaying = false;
  window.clearTimeout(state.demoLoop);
  state.demoLoop = null;
  window.clearTimeout(state.timer);
  state.timer = null;
  render();
}

function startDemo() {
  if (!audioContext()) return;
  state.demoTimers.forEach(window.clearTimeout);
  state.demoTimers = [];
  state.demoPlaying = true;
  render();
  const playLoop = () => {
    if (!state.demoPlaying) return;
    playSequence(demoNotes, 420);
    state.demoLoop = window.setTimeout(playLoop, demoNotes.length * 420);
    state.demoTimers.push(state.demoLoop);
  };
  playLoop();
  announce("Tocando demonstração de áudio sintetizado.");
}

function renderCollections() {
  return collections.map((item) => `
    <button class="collection" type="button" data-collection="${item.id}" aria-pressed="${state.collection === item.id}">
      <span class="collection-art" data-theme="${item.id}" aria-hidden="true">${item.icon}</span>
      <span class="collection-info"><strong>${escapeHtml(item.title)}</strong><span>${item.count} músicas</span></span>
    </button>
  `).join("");
}

function renderQueue() {
  if (state.collection !== "ninar") {
    return `<p class="empty-state">Esta coleção e sua quantidade aparecem no site público, mas os títulos e as gravações não estavam disponíveis. Importe uma cópia autorizada para completar a biblioteca.</p>`;
  }
  return `<ol class="track-list">${tracks.map((track, index) => `
    <li class="track">
      <span class="track-number">${index + 1}</span>
      <span class="track-copy"><strong>${escapeHtml(track.title)}</strong><span>${escapeHtml(track.credit)}</span></span>
    </li>
  `).join("")}</ol>`;
}

function renderTocar() {
  const collection = getCollection();
  return `
    <section class="panel hero">
      <div>
        <span class="eyebrow">Música para desacelerar</span>
        <h1>Um espaço para ouvir, tocar e criar.</h1>
        <p class="page-intro">Explore coleções, experimente o piano e guarde suas próprias melodias. Esta versão funciona sem conta e sem enviar seus dados.</p>
        <a class="button primary" href="#biblioteca">Explorar biblioteca</a>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="hero-orb">♫</div></div>
    </section>
    <section style="margin-top:30px" aria-labelledby="collections-heading">
      <div class="section-heading"><h2 id="collections-heading">Escolha uma coleção</h2><span>${collections.length} coleções</span></div>
      <div class="collection-grid">${renderCollections()}</div>
      <p class="collection-note">As coleções e quantidades refletem o que foi possível confirmar publicamente. As faixas completas precisam de uma exportação autorizada.</p>
    </section>
    <section class="radio-layout" aria-label="Fila e demonstração">
      <div class="panel queue">
        <div class="section-heading"><h2>${escapeHtml(collection.title)}</h2><span>${collection.count} músicas</span></div>
        ${renderQueue()}
      </div>
      <div class="panel player">
        <div>
          <div class="player-icon" aria-hidden="true">♫</div>
          <h2>${state.demoPlaying ? "Demonstração em andamento" : "Experimente o som"}</h2>
          <p>Áudio sintetizado localmente · não é uma gravação original</p>
          <div class="player-controls">
            <button class="button primary" type="button" data-action="demo">${state.demoPlaying ? "Ⅱ Pausar" : "▶ Ouvir demonstração"}</button>
          </div>
          <label class="volume-control" for="volume">Volume
            <input id="volume" type="range" min="0" max="1" step="0.05" value="${state.masterGain?.gain.value ?? 0.55}" />
          </label>
          <label class="timer-control" for="timer">Parar após
            <select id="timer">
              <option value="0">Não parar automaticamente</option>
              <option value="5">5 minutos</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
            </select>
          </label>
        </div>
        <p class="small-copy">A demonstração usa uma sequência original de tons gerada no seu dispositivo.</p>
      </div>
    </section>
  `;
}

function renderSaved() {
  const saved = getCompositions();
  if (!saved.length) return '<p class="empty-state">Suas composições salvas neste navegador aparecem aqui.</p>';
  return `<ul class="saved-list">${saved.map((item) => `
    <li class="saved-item">
      <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.instrument)} · ${item.tempo} BPM · ${item.notes.length} notas</span></div>
      <button class="button small" type="button" data-play-saved="${escapeHtml(item.id)}">▶ Ouvir</button>
    </li>
  `).join("")}</ul>`;
}

function renderCompor() {
  const noteButtons = notes.slice(0, 7).map((note, index) => `
    <button class="note-button" type="button" data-add-note="${index}" aria-label="Adicionar nota ${note.name}">${note.name}<br><small>${note.key}</small></button>
  `).join("");
  return `
    <header class="page-title"><span class="eyebrow">Criação musical</span><h1>Compor</h1><p class="page-intro">Monte uma sequência, escute sua ideia e salve-a no seu dispositivo.</p></header>
    <div class="two-column">
      <section class="panel card">
        <h2>Nova composição</h2>
        <form id="composition-form">
          <div class="field-grid">
            <label class="field full">Nome<input name="title" maxlength="60" placeholder="Minha melodia" required /></label>
            <label class="field">Instrumento<select name="instrument">${instruments.map((name) => `<option ${name === state.instrument ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></label>
            <label class="field">Andamento<input name="tempo" type="number" min="40" max="180" value="90" required /></label>
          </div>
          <div class="notes" aria-label="Adicionar notas">${noteButtons}</div>
          <p id="composition-preview" class="small-copy">Notas: ${state.composition.map((note) => escapeHtml(note.name)).join(" · ") || "nenhuma adicionada"}</p>
          <div class="button-row">
            <button class="button" type="button" data-action="clear-notes">Limpar</button>
            <button class="button" type="button" data-action="preview-composition">▶ Ouvir</button>
            <button class="button primary" type="submit">Salvar composição</button>
          </div>
        </form>
        <p class="small-copy" style="margin-top:14px">As composições ficam neste navegador, sem serem enviadas a um servidor.</p>
      </section>
      <section class="panel card"><h2>Minhas composições</h2>${renderSaved()}</section>
    </div>
  `;
}

function renderPiano() {
  const keyboard = [notes[0], notes[7], notes[1], notes[8], notes[2], notes[3], notes[9], notes[4], notes[10], notes[5], notes[11], notes[6]];
  return `
    <header class="page-title"><span class="eyebrow">Toque no seu ritmo</span><h1>Piano</h1><p class="page-intro">Use o teclado, mouse ou toque. O som é criado localmente no seu dispositivo.</p></header>
    <section class="panel card">
      <div class="section-heading"><h2>Uma oitava</h2><span>Teclas A–J e W–U</span></div>
      <div class="keyboard-wrap"><div class="keyboard" aria-label="Teclado musical">
        ${keyboard.map((note) => `<button class="piano-key ${note.black ? "black" : ""}" type="button" data-piano="${note.name}" aria-label="${note.name}, tecla ${note.key}">${note.name}<br><small>${note.key}</small></button>`).join("")}
      </div></div>
      <div class="button-row">${instruments.map((name) => `<button class="button small" type="button" data-instrument="${escapeHtml(name)}" aria-pressed="${state.instrument === name}">${escapeHtml(name)}</button>`).join("")}</div>
    </section>
  `;
}

function renderBiblioteca() {
  return `
    <header class="page-title"><span class="eyebrow">Coleções musicais</span><h1>Biblioteca</h1><p class="page-intro">Busque entre as faixas identificadas e veja todas as coleções públicas.</p></header>
    <label class="visually-hidden" for="library-search">Buscar faixa ou compositor</label>
    <input class="search" id="library-search" type="search" placeholder="Buscar faixa ou compositor..." />
    <div class="library-grid">${collections.map((item) => `
      <section class="panel library-card">
        <div class="section-heading"><h2>${item.icon} ${escapeHtml(item.title)}</h2><span>${item.count} músicas</span></div>
        ${item.id === "ninar"
          ? `<ul class="track-list">${tracks.map((track, index) => `<li class="track" data-search="${escapeHtml(`${track.title} ${track.credit}`.toLocaleLowerCase("pt-BR"))}"><span class="track-number">${index + 1}</span><span class="track-copy"><strong>${escapeHtml(track.title)}</strong><span>${escapeHtml(track.credit)}</span></span></li>`).join("")}</ul>`
          : '<p class="empty-state">Os títulos desta coleção não estavam visíveis. Uma exportação autorizada permite completar a lista.</p>'}
      </section>
    `).join("")}</div>
  `;
}

function renderPartituras() {
  const saved = getCompositions();
  if (!saved.length) {
    return `<header class="page-title"><span class="eyebrow">Leitura musical</span><h1>Partituras</h1><p class="page-intro">As partituras originais não estavam disponíveis na página pública.</p></header>
      <section class="panel card"><h2>Suas partituras</h2><p class="empty-state">Crie uma sequência em Compor para vê-la aqui.</p><a class="button primary" href="#compor">Criar composição</a></section>`;
  }
  return `<header class="page-title"><span class="eyebrow">Leitura musical</span><h1>Partituras</h1><p class="page-intro">Visualização simples das suas composições.</p></header>
    <div class="two-column">${saved.map((item) => `
      <article class="panel card">
        <div class="section-heading"><h2>${escapeHtml(item.title)}</h2><button class="button small" type="button" data-print>Imprimir</button></div>
        <p class="small-copy">${escapeHtml(item.instrument)} · ${item.tempo} BPM</p>
        <div class="staff"><div class="staff-notes"><span>𝄞</span>${item.notes.map((note) => `<span>${escapeHtml(note.name)}</span>`).join("")}</div></div>
        <p class="small-copy">Prévia simplificada, não uma edição musical profissional.</p>
      </article>
    `).join("")}</div>`;
}

function renderGaleria() {
  const scenes = [
    ["☾", "Noite tranquila", "Canções de ninar"],
    ["✳", "Luzes de Natal", "Músicas de Natal"],
    ["♬", "Salão clássico", "Clássicas"],
    ["❋", "Bosque sereno", "Músicas Celtas"],
    ["✧", "Luz suave", "Católicas"],
    ["❀", "Manhã de primavera", "Páscoa"],
  ];
  return `<header class="page-title"><span class="eyebrow">Inspiração visual</span><h1>Galeria</h1><p class="page-intro">Cenas originais em CSS inspiradas nas coleções musicais.</p></header>
    <div class="gallery-grid">${scenes.map(([icon, title, caption]) => `<article class="gallery-tile"><span aria-hidden="true">${icon}</span><strong>${title}</strong><small>${caption}</small></article>`).join("")}</div>`;
}

function renderNatal() {
  return `<section class="panel holiday-hero">
      <span class="eyebrow">Coleção especial · 6 músicas</span>
      <h1>Uma pausa musical para o Natal.</h1>
      <p>A coleção aparece no site público, mas os títulos e gravações não estavam disponíveis para migração. Ouça uma breve demonstração original, sintetizada neste dispositivo.</p>
      <button class="button" type="button" data-action="holiday-demo">${state.demoPlaying ? "Ⅱ Parar demonstração" : "▶ Ouvir demonstração"}</button>
    </section>
    <p class="collection-note">Nenhuma gravação ou letra original foi copiada. Adicione somente conteúdo que você tenha autorização para usar.</p>`;
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
  app.innerHTML = (pages[state.page] ?? renderTocar)();
  document.querySelectorAll("[data-route]").forEach((link) => {
    if (link.dataset.route === state.page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function navigate() {
  const requested = location.hash.slice(1) || "tocar";
  const routes = new Set(["tocar", "compor", "piano", "biblioteca", "partituras", "galeria", "natal"]);
  state.page = routes.has(requested) ? requested : "tocar";
  render();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.collection) {
    state.collection = button.dataset.collection;
    render();
  } else if (button.dataset.instrument) {
    state.instrument = button.dataset.instrument;
    render();
  } else if (button.dataset.piano) {
    const note = notes.find((item) => item.name === button.dataset.piano);
    if (note) playTone(note.frequency);
  } else if (button.dataset.addNote !== undefined) {
    state.composition.push(notes[Number(button.dataset.addNote)]);
    render();
  } else if (button.dataset.action === "demo" || button.dataset.action === "holiday-demo") {
    if (state.demoPlaying) stopDemo();
    else startDemo();
  } else if (button.dataset.action === "clear-notes") {
    state.composition = [];
    render();
  } else if (button.dataset.action === "preview-composition") {
    if (!state.composition.length) {
      announce("Adicione uma nota antes de ouvir a composição.");
      return;
    }
    const instrument = document.querySelector('#composition-form [name="instrument"]').value;
    playSequence(state.composition, 350, instrument);
  } else if (button.dataset.playSaved) {
    const composition = getCompositions().find((item) => item.id === button.dataset.playSaved);
    if (composition) playSequence(composition.notes, 300, composition.instrument);
  } else if (button.dataset.print !== undefined) {
    window.print();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "volume" && state.masterGain) {
    state.masterGain.gain.setTargetAtTime(Number(event.target.value), state.audio.currentTime, 0.03);
  }
  if (event.target.id === "library-search") {
    const query = event.target.value.trim().toLocaleLowerCase("pt-BR");
    document.querySelectorAll("[data-search]").forEach((row) => {
      row.hidden = !row.dataset.search.includes(query);
    });
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id !== "timer") return;
  window.clearTimeout(state.timer);
  if (Number(event.target.value) > 0) {
    state.timer = window.setTimeout(() => {
      stopDemo();
      announce("O tempo da demonstração terminou.");
    }, Number(event.target.value) * 60_000);
    announce(`Demonstração programada para parar em ${event.target.value} minutos.`);
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "composition-form") return;
  event.preventDefault();
  if (!state.composition.length) {
    announce("Adicione pelo menos uma nota à composição.");
    return;
  }
  const form = new FormData(event.target);
  const composition = {
    id: crypto.randomUUID(),
    title: String(form.get("title")).trim(),
    instrument: String(form.get("instrument")),
    tempo: Number(form.get("tempo")),
    notes: state.composition.map(({ name, frequency }) => ({ name, frequency })),
  };
  if (!composition.title || !Number.isFinite(composition.tempo) || composition.tempo < 40 || composition.tempo > 180) {
    announce("Confira o nome e o andamento da composição.");
    return;
  }
  if (saveCompositions([composition, ...getCompositions()])) {
    state.composition = [];
    render();
    announce(`Composição ${composition.title} salva neste navegador.`);
  }
});

document.addEventListener("keydown", (event) => {
  if (state.page !== "piano" || event.repeat || event.target.matches("input, select, textarea")) return;
  const note = notes.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
  if (!note) return;
  event.preventDefault();
  playTone(note.frequency);
  const key = document.querySelector(`[data-piano="${CSS.escape(note.name)}"]`);
  key?.classList.add("active");
  window.setTimeout(() => key?.classList.remove("active"), 160);
});

window.addEventListener("hashchange", navigate);
navigate();
