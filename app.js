(function () {
  const LETTER = [
    "Bristi —",
    "",
    "I don't have a grand speech. I have a page, a photograph, and the fact that your name already sounds like a poem.",
    "",
    "Rain doesn't perform. It just arrives, changes the light, and leaves the afternoon more honest than it found it.",
    "",
    "That's the energy.",
    "",
    "This isn't a birthday thing or a grand gesture. It's a friend making a small weather system because \"just thinking of you\" felt too thin.",
    "",
    "If the rain here ever stops, refresh. That's the deal.",
    "",
    "— a friend"
  ].join("\n");

  const RAIN_WORDS = [
    { id: "petrichor", word: "petrichor", note: "The smell of earth after she arrives." },
    { id: "hush", word: "hush", note: "The minute the city decides to speak more quietly." },
    { id: "silver", word: "silver", note: "The colour rain borrows from the street." },
    { id: "monsoon", word: "monsoon", note: "Not a season. A personality." },
    { id: "drizzle", word: "drizzle", note: "Soft, and somehow still the whole story." },
    { id: "thunder", word: "thunder", note: "Rare. Unforgettable. Worth waiting for." },
    { id: "puddle", word: "puddle", note: "A second sky, if you look down." },
    { id: "window", word: "window", note: "Where most of the good thinking happens." },
    { id: "boat", word: "paper boat", note: "Childhood, folded and still seaworthy." },
    { id: "glow", word: "glow", note: "What lamps do when they notice her." },
    { id: "bristi", word: "বৃষ্টি", note: "The original word. The one that started this." },
    { id: "pause", word: "pause", note: "The space between two raindrops. That's a whole weather." }
  ];

  const STATIONS = [
    { id: "drizzle", freq: "88.1", name: "Soft Drizzle", intensity: 0.38, copy: "A conversation that never has to raise its voice." },
    { id: "window", freq: "91.4", name: "Window Pane", intensity: 0.62, copy: "Rain on glass is just the sky trying handwriting." },
    { id: "night", freq: "96.0", name: "Night Bus", intensity: 0.92, copy: "Streetlights smeared into commas. Keep going." },
    { id: "boat", freq: "102.7", name: "Paper Boat", intensity: 0.48, copy: "Small vessels. Serious journeys." },
    { id: "secret", freq: "104.9", name: "Unlisted", intensity: 0.22, copy: "Off the marked dial. If you found this, you already listen the way she does." }
  ];

  const BOAT_REPLIES = [
    "The puddle received it.",
    "A streetlamp nodded.",
    "The rain agreed to carry that one.",
    "It made it to the other curb.",
    "Somewhere a window fogged, just a little."
  ];

  const state = {
    audioOn: false,
    intensity: STATIONS[0].intensity,
    station: "drizzle",
    caught: [],
    wishes: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem("for-bristi-weather") || "{}");
    if (Array.isArray(saved.caught)) state.caught = saved.caught;
    if (Array.isArray(saved.wishes)) state.wishes = saved.wishes;
  } catch (_) {}

  function persist() {
    try {
      localStorage.setItem("for-bristi-weather", JSON.stringify({ caught: state.caught, wishes: state.wishes }));
    } catch (_) {}
  }

  const canvas = document.getElementById("rain-canvas");
  const ctx = canvas.getContext("2d");
  let drops = [], splashes = [], letters = [], nameDots = [], nameMode = 0, nameTimer = 0;
  let pointer = { x: 0, y: 0, active: false };
  let lastWishLen = state.wishes.length;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resizeRain() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = reduce ? 28 : (w < 700 ? 90 : 170);
    drops = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      len: 10 + Math.random() * 18, speed: 7 + Math.random() * 16,
      width: 0.6 + Math.random() * 1.1, alpha: 0.18 + Math.random() * 0.42,
      wind: (Math.random() - 0.5) * 0.6
    }));
  }

  function sampleTextPoints(text, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.font = "500 " + Math.max(64, Math.floor(w / 7)) + "px \"Cormorant Garamond\", serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, w / 2, h * 0.46);
    const { data } = g.getImageData(0, 0, w, h);
    const pts = [];
    for (let y = 0; y < h; y += 7) {
      for (let x = 0; x < w; x += 7) {
        if (data[(y * w + x) * 4 + 3] > 140) pts.push({ x, y });
      }
    }
    return pts;
  }

  function spawnWish(text) {
    text.slice(0, 48).split("").forEach((ch, i) => {
      letters.push({
        x: window.innerWidth * 0.18 + Math.random() * window.innerWidth * 0.64,
        y: -20 - i * 18, vx: (Math.random() - 0.5) * 0.4,
        vy: 1.6 + Math.random() * 1.4, ch, life: 1
      });
    });
  }

  function tickRain() {
    const w = window.innerWidth, h = window.innerHeight;
    const rain = state.intensity;
    ctx.clearRect(0, 0, w, h);
    if (state.wishes.length !== lastWishLen) {
      const newest = state.wishes[state.wishes.length - 1];
      if (newest) spawnWish(newest);
      lastWishLen = state.wishes.length;
    }
    const wind = pointer.active ? (pointer.x / w - 0.5) * 3.2 : 0.35;
    for (const d of drops) {
      d.y += d.speed * (0.55 + rain);
      d.x += d.wind + wind * 0.35;
      if (d.y > h + 20) {
        d.y = -d.len; d.x = Math.random() * w;
        if (!reduce && Math.random() > 0.72) splashes.push({ x: d.x, y: h - 8 - Math.random() * 18, r: 1, life: 1 });
      }
      if (d.x > w + 10) d.x = 0;
      if (d.x < -10) d.x = w;
      ctx.strokeStyle = "rgba(232,230,224," + (d.alpha * (0.45 + rain * 0.55)) + ")";
      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + wind * 0.8, d.y + d.len);
      ctx.stroke();
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.r += 0.55 + rain; s.life -= 0.018;
      ctx.strokeStyle = "rgba(180,196,210," + (Math.max(0, s.life) * 0.35) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r * 1.7, s.r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (s.life <= 0) splashes.splice(i, 1);
    }
    ctx.font = '500 18px "Cormorant Garamond", serif';
    ctx.textAlign = "center";
    for (let i = letters.length - 1; i >= 0; i--) {
      const L = letters[i];
      L.x += L.vx + wind * 0.2;
      L.y += L.vy * (0.8 + rain);
      L.life -= 0.0018;
      ctx.fillStyle = "rgba(239,236,230," + (Math.max(0, L.life) * 0.85) + ")";
      ctx.fillText(L.ch, L.x, L.y);
      if (L.y > h + 30 || L.life <= 0) letters.splice(i, 1);
    }
    if (!reduce) {
      nameTimer++;
      if (nameMode === 0 && nameTimer > 60 * 14) {
        const pts = sampleTextPoints("BRISTI", w, h);
        nameDots = pts.map(p => ({
          x: Math.random() * w, y: Math.random() * h * 0.4,
          homeX: p.x, homeY: p.y, vx: 0, vy: 0, alpha: 0
        }));
        nameMode = 1; nameTimer = 0;
      } else if (nameMode === 1) {
        for (const n of nameDots) {
          n.x += (n.homeX - n.x) * 0.045;
          n.y += (n.homeY - n.y) * 0.045;
          n.alpha = Math.min(1, n.alpha + 0.02);
          ctx.fillStyle = "rgba(196,210,222," + (n.alpha * 0.8) + ")";
          ctx.fillRect(n.x, n.y, 1.7, 1.7);
        }
        if (nameTimer > 60 * 5) { nameMode = 2; nameTimer = 0; }
      } else if (nameMode === 2) {
        for (const n of nameDots) {
          n.vy += 0.12; n.y += n.vy; n.x += (Math.random() - 0.5) * 0.6; n.alpha *= 0.97;
          ctx.fillStyle = "rgba(196,210,222," + (n.alpha * 0.8) + ")";
          ctx.fillRect(n.x, n.y, 1.6, 1.6);
        }
        if (nameTimer > 60 * 3) { nameMode = 0; nameDots = []; nameTimer = 0; }
      }
    }
    requestAnimationFrame(tickRain);
  }

  window.addEventListener("resize", resizeRain);
  window.addEventListener("pointermove", e => { pointer = { x: e.clientX, y: e.clientY, active: true }; }, { passive: true });
  window.addEventListener("pointerdown", e => { splashes.push({ x: e.clientX, y: e.clientY, r: 2, life: 1 }); }, { passive: true });
  resizeRain();
  requestAnimationFrame(tickRain);

  let audioCtx = null, master = null, filter = null, started = false, dropTimer = null;

  function noiseBuffer(ac, seconds) {
    const length = Math.floor(ac.sampleRate * seconds);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.4;
    }
    return buffer;
  }

  function buildGraph(ac) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac, 3);
    src.loop = true;
    const high = ac.createBiquadFilter();
    high.type = "highpass"; high.frequency.value = 520; high.Q.value = 0.55;
    filter = ac.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 1600; filter.Q.value = 0.65;
    const air = ac.createBiquadFilter();
    air.type = "highshelf"; air.frequency.value = 4200; air.gain.value = 3.2;
    master = ac.createGain(); master.gain.value = 0;
    src.connect(high); high.connect(filter); filter.connect(air); air.connect(master); master.connect(ac.destination);
    src.start();
  }

  function tickDrop() {
    if (!audioCtx || !master) return;
    const drop = audioCtx.createBufferSource();
    drop.buffer = noiseBuffer(audioCtx, 0.18);
    const bp = audioCtx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2400 + Math.random() * 1800; bp.Q.value = 1.1;
    const g = audioCtx.createGain();
    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    drop.connect(bp); bp.connect(g); g.connect(master);
    drop.start(); drop.stop(now + 0.2);
  }

  async function setAudio(on) {
    if (on) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      if (!started) { buildGraph(audioCtx); started = true; }
      if (dropTimer == null) {
        const loop = () => {
          if (Math.random() > 0.45) tickDrop();
          dropTimer = window.setTimeout(loop, 280 + Math.random() * 900);
        };
        loop();
      }
      const now = audioCtx.currentTime;
      const gain = 0.018 + state.intensity * 0.085;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(gain, now + 0.35);
      filter.frequency.linearRampToValueAtTime(1100 + state.intensity * 1400, now + 0.4);
    } else if (master && audioCtx) {
      const now = audioCtx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(0, now + 0.25);
      if (dropTimer != null) { clearTimeout(dropTimer); dropTimer = null; }
    }
  }

  function updateAudioUI() {
    const btn = document.getElementById("audio-btn");
    const label = document.getElementById("audio-label");
    const rainOn = document.getElementById("rain-on-btn");
    btn.setAttribute("aria-pressed", state.audioOn ? "true" : "false");
    btn.setAttribute("aria-label", state.audioOn ? "Mute rain" : "Play rain");
    label.textContent = state.audioOn ? "Rain on" : "Listen";
    if (rainOn) rainOn.hidden = state.audioOn;
  }

  document.getElementById("audio-btn").addEventListener("click", async () => {
    state.audioOn = !state.audioOn;
    await setAudio(state.audioOn);
    updateAudioUI();
  });
  document.getElementById("rain-on-btn").addEventListener("click", async () => {
    state.audioOn = true;
    await setAudio(true);
    updateAudioUI();
  });

  (function () {
    const wrap = document.getElementById("glass-wrap");
    const c = document.getElementById("glass-canvas");
    const g = c.getContext("2d");
    const hint = document.getElementById("glass-hint");
    let drawing = false;

    function paintFog(w, h) {
      g.globalCompositeOperation = "source-over";
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "rgba(18,22,28,0.38)");
      grd.addColorStop(0.55, "rgba(12,14,18,0.5)");
      grd.addColorStop(1, "rgba(8,9,11,0.58)");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(210,220,230,0.28)";
      g.lineWidth = 1.15;
      for (let i = 0; i < 16; i++) {
        const x = (w / 16) * i + (i % 3) * 7;
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 8, h * 0.28, x - 10, h * 0.68, x + 5, h);
        g.stroke();
      }
    }

    function fit() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.floor(rect.width * dpr);
      c.height = Math.floor(rect.height * dpr);
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFog(rect.width, rect.height);
    }

    function wipe(clientX, clientY) {
      const rect = c.getBoundingClientRect();
      const x = clientX - rect.left, y = clientY - rect.top;
      g.globalCompositeOperation = "destination-out";
      const rad = 34;
      const grd = g.createRadialGradient(x, y, 2, x, y, rad);
      grd.addColorStop(0, "rgba(0,0,0,0.9)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      if (hint) hint.hidden = true;
    }

    let acc = 0;
    function refog() {
      if (!reduce) {
        acc++;
        if (acc % 4 === 0) {
          const rect = wrap.getBoundingClientRect();
          g.globalCompositeOperation = "source-over";
          g.fillStyle = "rgba(12,14,18,0.012)";
          g.fillRect(0, 0, rect.width, rect.height);
        }
      }
      requestAnimationFrame(refog);
    }

    fit();
    new ResizeObserver(fit).observe(wrap);
    c.addEventListener("pointerdown", e => { drawing = true; c.setPointerCapture(e.pointerId); wipe(e.clientX, e.clientY); });
    c.addEventListener("pointermove", e => { if (drawing) wipe(e.clientX, e.clientY); });
    c.addEventListener("pointerup", () => { drawing = false; });
    c.addEventListener("pointercancel", () => { drawing = false; });
    requestAnimationFrame(refog);
  })();

  (function () {
    const root = document.getElementById("letter-root");
    const el = document.getElementById("letter-text");
    let started = false, n = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting && !started) {
        started = true;
        if (reduce) { el.textContent = LETTER; return; }
        const id = setInterval(() => {
          n++;
          el.textContent = LETTER.slice(0, n);
          if (n >= LETTER.length) clearInterval(id);
        }, 18);
      }
    }, { threshold: 0.25 });
    io.observe(root);
  })();

  (function () {
    const list = document.getElementById("stations");
    STATIONS.forEach(s => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station" + (s.id === state.station ? " active" : "");
      btn.dataset.id = s.id;
      btn.innerHTML = "<span>" + s.name + "</span><span class=\"freq\">" + s.freq + "</span>";
      btn.addEventListener("click", async () => {
        state.station = s.id;
        state.intensity = s.intensity;
        document.querySelectorAll(".station").forEach(b => b.classList.toggle("active", b.dataset.id === s.id));
        document.getElementById("station-name").textContent = s.name;
        document.getElementById("station-hz").textContent = s.freq + " FM";
        document.getElementById("station-copy").textContent = s.copy;
        if (state.audioOn) await setAudio(true);
      });
      list.appendChild(btn);
    });
  })();

  (function () {
    const stage = document.getElementById("sky-stage");
    const lanes = [8, 26, 44, 62, 78];
    let seq = 0;
    const items = new Map();

    function updateJar() {
      const fill = state.caught.length / RAIN_WORDS.length;
      const jar = document.getElementById("jar-fill");
      jar.setAttribute("y", String(86 - fill * 48));
      jar.setAttribute("height", String(Math.max(fill * 48, 0)));
      document.getElementById("caught-count").textContent = String(state.caught.length);
      if (state.caught.length === RAIN_WORDS.length) {
        document.getElementById("sky-label").textContent = "You caught the whole sky.";
        document.getElementById("sky-label").style.fontFamily = "var(--font-display)";
        document.getElementById("sky-label").style.fontStyle = "italic";
        document.getElementById("sky-label").style.fontSize = "1.25rem";
        document.getElementById("sky-label").style.color = "var(--rain)";
        document.getElementById("sky-label").style.textTransform = "none";
        document.getElementById("sky-label").style.letterSpacing = "normal";
      }
    }
    updateJar();

    function spawn() {
      const remaining = RAIN_WORDS.filter(w => !state.caught.includes(w.id));
      if (!remaining.length) return;
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      seq++;
      const key = seq;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sky-word";
      btn.textContent = pick.word;
      btn.style.left = lanes[seq % lanes.length] + "%";
      btn.style.animation = "word-fall " + (8 + (seq % 3)) + "s linear forwards";
      btn.addEventListener("click", () => {
        if (!state.caught.includes(pick.id)) {
          state.caught.push(pick.id);
          persist();
          const note = document.getElementById("sky-note");
          note.hidden = false;
          note.textContent = pick.note;
          document.getElementById("sky-label").hidden = true;
          updateJar();
        }
        btn.remove();
        items.delete(key);
      });
      btn.addEventListener("animationend", () => { btn.remove(); items.delete(key); });
      stage.appendChild(btn);
      items.set(key, btn);
      if (items.size > 5) {
        const first = items.keys().next().value;
        const el = items.get(first);
        if (el) el.remove();
        items.delete(first);
      }
    }
    spawn();
    setInterval(spawn, 2200);
  })();

  (function () {
    const form = document.getElementById("boat-form");
    const note = document.getElementById("boat-note");
    const send = document.getElementById("boat-send");
    const reset = document.getElementById("boat-reset");
    const reply = document.getElementById("boat-reply");
    const svg = document.getElementById("boat-svg");
    let sent = false;

    form.addEventListener("submit", e => {
      e.preventDefault();
      if (sent || !note.value.trim()) return;
      sent = true;
      note.disabled = true;
      send.disabled = true;
      svg.classList.add("sailed");
      reset.hidden = false;
      const pick = BOAT_REPLIES[Math.floor(Math.random() * BOAT_REPLIES.length)];
      setTimeout(() => {
        reply.hidden = false;
        reply.textContent = pick;
      }, 1600);
    });
    reset.addEventListener("click", () => {
      sent = false;
      note.disabled = false;
      note.value = "";
      send.disabled = false;
      svg.classList.remove("sailed");
      reset.hidden = true;
      reply.hidden = true;
    });
  })();

  document.getElementById("wish-form").addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("wish");
    const t = input.value.trim();
    if (!t) return;
    state.wishes.push(t);
    if (state.wishes.length > 8) state.wishes = state.wishes.slice(-8);
    persist();
    input.value = "";
  });

  updateAudioUI();
})();
