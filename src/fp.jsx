import { useState, useEffect, useRef, useCallback } from "react";

const L = {
  github:   "https://github.com/Saro-21",
  linkedin: "https://linkedin.com/in/sarabhoji-m-29aab3381",
  email:    "mailto:sarabhoji21@gmail.com",
  phone:    "tel:+918939706162",
  maps:     "https://maps.google.com?q=Thiruvallur+Tamil+Nadu",
};
const goto = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
const xopen = href => {
  try {
    if (href.startsWith("tel:")) {
      window.location.href = href;
    } else if (href.startsWith("mailto:")) {
      const a = document.createElement("a");
      a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  } catch(e) {
    if (href.startsWith("mailto:")) {
      const email = href.replace("mailto:","").split("?")[0];
      navigator.clipboard?.writeText(email).then(()=>alert("📋 Email copied: " + email)).catch(()=>alert("Email: " + email));
    }
  }
};

/* ── PCB CANVAS ── */
function PCBCanvas() {
  const ref = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    // Trace grid
    const COLS = Math.ceil(W / 60), ROWS = Math.ceil(H / 60);
    const nodes = [];
    for (let r = 0; r <= ROWS; r++) for (let col = 0; col <= COLS; col++) {
      if (Math.random() > 0.35) nodes.push({ x: col * 60, y: r * 60, active: Math.random() > 0.7, pulse: Math.random() * Math.PI * 2 });
    }
    const edges = [];
    nodes.forEach((n, i) => {
      nodes.forEach((m, j) => {
        if (i >= j) return;
        const dx = m.x - n.x, dy = m.y - n.y;
        if ((Math.abs(dx) === 60 && dy === 0) || (Math.abs(dy) === 60 && dx === 0)) {
          if (Math.random() > 0.25) edges.push({ a: n, b: m, flow: 0, dir: Math.random() > 0.5 ? 1 : -1, speed: 0.008 + Math.random() * 0.015, active: Math.random() > 0.4 });
        }
      });
    });
    const packets = [];
    const spawnPacket = () => {
      const e = edges.filter(e => e.active)[Math.floor(Math.random() * edges.filter(e => e.active).length)];
      if (e) packets.push({ edge: e, t: 0, speed: 0.012 + Math.random() * 0.018 });
    };
    const spawnInterval = setInterval(spawnPacket, 200);
    let raf, frame = 0;
    const draw = () => {
      frame++;
      ctx.fillStyle = "rgba(0,10,0,0.15)";
      ctx.fillRect(0, 0, W, H);
      const mx = mouse.current.x, my = mouse.current.y;
      // Draw traces
      edges.forEach(e => {
        if (!e.active) return;
        const dist = Math.min(
          Math.hypot(mx - e.a.x, my - e.a.y),
          Math.hypot(mx - e.b.x, my - e.b.y)
        );
        const bright = dist < 150 ? 1 - dist / 150 : 0;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.strokeStyle = `rgba(${Math.floor(184 + bright * 40)},${Math.floor(115 + bright * 60)},${Math.floor(51 + bright * 20)},${0.18 + bright * 0.3})`;
        ctx.lineWidth = 1 + bright;
        ctx.stroke();
      });
      // Draw nodes (vias/pads)
      nodes.forEach(n => {
        n.pulse += 0.04;
        const dist = Math.hypot(mx - n.x, my - n.y);
        const bright = dist < 100 ? 1 - dist / 100 : 0;
        if (!n.active && bright < 0.1) return;
        const alpha = (n.active ? 0.4 + 0.2 * Math.sin(n.pulse) : 0) + bright * 0.6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.5 + bright * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,65,${alpha})`;
        if (bright > 0.3) { ctx.shadowColor = "#00FF41"; ctx.shadowBlur = 8; }
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      // Draw data packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += p.speed;
        if (p.t > 1) { packets.splice(i, 1); continue; }
        const x = p.edge.a.x + (p.edge.b.x - p.edge.a.x) * p.t;
        const y = p.edge.a.y + (p.edge.b.y - p.edge.a.y) * p.t;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#00FF41";
        ctx.shadowColor = "#00FF41";
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        // trail
        const tx2 = p.edge.a.x + (p.edge.b.x - p.edge.a.x) * Math.max(0, p.t - 0.12);
        const ty2 = p.edge.a.y + (p.edge.b.y - p.edge.a.y) * Math.max(0, p.t - 0.12);
        ctx.beginPath();
        ctx.moveTo(tx2, ty2);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "rgba(0,255,65,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    const onMouse = e => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);
    return () => { cancelAnimationFrame(raf); clearInterval(spawnInterval); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMouse); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.85 }} />;
}

/* ── CROSSHAIR CURSOR ── */
function CrosshairCursor() {
  const h = useRef(null), v = useRef(null), dot = useRef(null), label = useRef(null);
  const pos = useRef({ x: 0, y: 0 }), lpos = useRef({ x: 0, y: 0 });
  const [clicks, setClicks] = useState([]);
  useEffect(() => {
    const move = e => { pos.current = { x: e.clientX, y: e.clientY }; };
    const click = e => {
      const id = Date.now();
      setClicks(c => [...c, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setClicks(c => c.filter(x => x.id !== id)), 600);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);
    let raf;
    const loop = () => {
      lpos.current.x += (pos.current.x - lpos.current.x) * 0.12;
      lpos.current.y += (pos.current.y - lpos.current.y) * 0.12;
      const x = lpos.current.x, y = lpos.current.y;
      if (h.current) h.current.style.top = y + "px";
      if (v.current) v.current.style.left = x + "px";
      if (dot.current) { dot.current.style.left = pos.current.x + "px"; dot.current.style.top = pos.current.y + "px"; }
      if (label.current) { label.current.style.left = (pos.current.x + 16) + "px"; label.current.style.top = (pos.current.y + 16) + "px"; label.current.textContent = `${Math.round(pos.current.x)},${Math.round(pos.current.y)}`; }
      raf = requestAnimationFrame(loop);
    };
    loop();
    const over = e => { if (e.target.closest("button,a,[data-h]")) { dot.current?.classList.add("xdot--big"); } };
    const out  = e => { if (e.target.closest("button,a,[data-h]")) { dot.current?.classList.remove("xdot--big"); } };
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("click", click); cancelAnimationFrame(raf); document.removeEventListener("mouseover", over); document.removeEventListener("mouseout", out); };
  }, []);
  return (<>
    <div ref={h} className="xh" />
    <div ref={v} className="xv" />
    <div ref={dot} className="xdot" />
    <div ref={label} className="xlabel" />
    {clicks.map(c => <div key={c.id} className="xclick" style={{ left: c.x, top: c.y }} />)}
  </>);
}

/* ── BOOT SEQUENCE ── */
function Boot({ onDone }) {
  const [lines, setLines] = useState([]);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const LOG = [
    "> INITIALIZING SARABHOJI_PCB_OS v8.96...",
    "> POWER-ON SELF-TEST (POST)............. OK",
    "> LOADING AI_CORE.bin.................. OK",
    "> MOUNTING /sys/projects/URBANSCAN..... OK",
    "> MOUNTING /sys/projects/NUTRIBUS...... OK",
    "> IMPORTING tensorflow==2.x, pytorch... OK",
    "> AZURE CLOUD NODE HANDSHAKE........... OK",
    "> SCANNING 37 DISTRICT NODES........... OK",
    "> CGPA REGISTER: 0x8.96................ VALID",
    "> ALL SYSTEMS NOMINAL. BOOTING UI...",
  ];
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setLines(l => [...l, LOG[i]]);
      setPct(Math.round(((i + 1) / LOG.length) * 100));
      i++;
      if (i >= LOG.length) {
        clearInterval(t);
        setTimeout(() => { setDone(true); setTimeout(onDone, 400); }, 500);
      }
    }, 160);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`boot ${done ? "boot--exit" : ""}`}>
      <div className="boot__scanline" />
      <div className="boot__content">
        <div className="boot__cpu">
          <div className="boot__cpu-die">
            <div className="boot__cpu-label">SARABHOJI-AI</div>
            <div className="boot__cpu-sub">28nm · VIT FABRICATION · 2022</div>
            {[0,1,2,3].map(i => <div key={i} className={`boot__cpu-pin boot__cpu-pin--${i}`} />)}
          </div>
        </div>
        <div className="boot__log">
          {lines.map((l, i) => <div key={i} className="boot__line">{l}</div>)}
        </div>
        <div className="boot__progress">
          <div className="boot__progress-bar" style={{ width: pct + "%" }} />
          <div className="boot__progress-labels">
            <span>LOADING PORTFOLIO</span>
            <span>{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TYPEWRITER ── */
function TW({ words }) {
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const w = words[idx];
    const t = setTimeout(() => {
      if (!del) { setTxt(w.slice(0, txt.length + 1)); if (txt.length + 1 === w.length) setTimeout(() => setDel(true), 1500); }
      else { setTxt(w.slice(0, txt.length - 1)); if (txt.length === 0) { setDel(false); setIdx(i => (i + 1) % words.length); } }
    }, del ? 38 : 78);
    return () => clearTimeout(t);
  }, [txt, del, idx, words]);
  return <span>{txt}<span className="tw-c">_</span></span>;
}

/* ── COUNTER ── */
function Cnt({ to, sfx = "" }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; ob.disconnect();
      const n = parseFloat(to);
      if (isNaN(n)) { setV(to); return; }
      let t0 = null;
      const step = ts => { if (!t0) t0 = ts; const p = Math.min((ts - t0) / 1300, 1); setV((n * p).toFixed(n % 1 ? 2 : 0)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [to]);
  return <span ref={ref}>{v}{sfx}</span>;
}

/* ── 3D TILT ── */
function Tilt({ children, className = "", style = {} }) {
  const ref = useRef(null);
  const mv = useCallback(e => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -14;
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  }, []);
  const lv = useCallback(() => { if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)"; }, []);
  return <div ref={ref} className={className} style={{ ...style, transition: "transform .3s ease" }} onMouseMove={mv} onMouseLeave={lv}>{children}</div>;
}

/* ── NAV ── */
function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [volt, setVolt] = useState("3.3V");
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setVolt((3.28 + Math.random() * 0.06).toFixed(2) + "V");
    };
    tick(); const ti = setInterval(tick, 1000);
    const sc = () => setSolid(window.scrollY > 60);
    window.addEventListener("scroll", sc);
    return () => { clearInterval(ti); window.removeEventListener("scroll", sc); };
  }, []);
  const nav = id => { goto(id); setOpen(false); };
  return (
    <nav className={`nav ${solid ? "nav--solid" : ""}`}>
      <button type="button" className="nav__logo" onClick={() => nav("hero")}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="24" rx="2" fill="none" stroke="#B87333" strokeWidth="1.5"/>
          <rect x="8" y="8" width="16" height="16" rx="1" fill="rgba(0,255,65,0.08)" stroke="rgba(0,255,65,0.3)" strokeWidth="1"/>
          <text x="16" y="20" textAnchor="middle" fill="#00FF41" fontSize="9" fontFamily="Share Tech Mono,monospace" fontWeight="bold">SM</text>
          {[0,1,2,3].map(i => <rect key={i} x={i < 2 ? (i === 0 ? 0 : 28) : (8 + i * 4)} y={i < 2 ? 13 : (i === 2 ? 0 : 28)} width={i < 2 ? 4 : 6} height={i < 2 ? 6 : 4} rx="1" fill="#B87333"/>)}
        </svg>
        <span className="nav__logo-text">SARABHOJI<span className="nav__logo-dot">.</span>M</span>
      </button>
      <ul className={`nav__list ${open ? "nav__list--open" : ""}`}>
        {[["U1","SURFACE","hero"],["U2","SYSTEMS","projects"],["U3","ARSENAL","skills"],["U4","IDENTITY","about"],["U5","SIGNAL","contact"]].map(([ref, l, id]) => (
          <li key={id}><button type="button" className="nav__link" onClick={() => nav(id)}>
            <span className="nav__link-ref">{ref}</span>{l}
          </button></li>
        ))}
        <li><button type="button" className="nav__hire" onClick={() => nav("contact")}>
          <span className="nav__hire-led" />HIRE
        </button></li>
      </ul>
      <div className="nav__status">
        <span className="nav__volt">{volt}</span>
        <span className="nav__clock">{time}</span>
        <button type="button" className="nav__ham" onClick={() => setOpen(o => !o)}>{open ? "✕" : "≡"}</button>
      </div>
    </nav>
  );
}

/* ── CV MODAL ── */
function CVModal({ onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__corner modal__corner--tl"/><div className="modal__corner modal__corner--tr"/>
        <div className="modal__corner modal__corner--bl"/><div className="modal__corner modal__corner--br"/>
        <div className="modal__hd">
          <span className="modal__ref">J1 · RESUME ACCESS</span>
          <button type="button" className="modal__cls" onClick={onClose}>✕</button>
        </div>
        {[
          { ref:"P1", label:"DOWNLOAD RESUME", sub:"Sarabhoji_Resume.docx → downloads DOCX",  href: "/Sarabhoji_Resume.docx", isPdf: true },
          { ref:"P2", label:"SEND ME AN EMAIL",     sub:"sarabhoji21@gmail.com",             href: "mailto:sarabhoji21@gmail.com?subject=Hiring%20Inquiry%20-%20Portfolio&body=Hi%20Sarabhoji%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20would%20like%20to%20connect." },
          { ref:"P3", label:"LINKEDIN PROFILE",     sub:"sarabhoji-m-29aab3381",             href: L.linkedin },
          { ref:"P4", label:"GITHUB PROFILE",       sub:"github.com/Saro-21",               href: L.github },
        ].map(r => (
          <button key={r.ref} type="button" className="modal__row" onClick={() => xopen(r.href)}>
            <span className="modal__row-ref">{r.ref}</span>
            <div className="modal__row-body">
              <span className="modal__row-l">{r.label}</span>
              <span className="modal__row-s">{r.sub}</span>
            </div>
            <span className="modal__row-arr">{r.isPdf ? "↓" : "→"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── HERO ── */
function Hero() {
  const [cvOpen, setCvOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero__bg-copper" />
      <div className="hero__corner hero__corner--tl" />
      <div className="hero__corner hero__corner--tr" />
      <div className="hero__corner hero__corner--bl" />
      <div className="hero__corner hero__corner--br" />
      {/* Scan line */}
      <div className="hero__scanline" />

      <div className="hero__left">
        <div className="hero__pcb-label">
          <span className="hero__led hero__led--green" />
          <span className="hero__pcb-ref">U1 · MAIN PROCESSOR · REV 2.8.96</span>
        </div>

        <h1 className="hero__name">
          <span className="hero__name-row">
            {"SARABHOJI ".split("").map((c, i) => (
              <span key={i} className="hero__letter" style={{ animationDelay: `${i * 0.055}s`, color: c === " " ? "transparent" : undefined }}>{c === " " ? "\u00A0" : c}</span>
            ))}
            <span className="hero__letter hero__name-m" style={{ animationDelay: "0.55s" }}>M</span>
            <span className="hero__letter hero__name-dot" style={{ animationDelay: "0.6s" }}>.</span>
          </span>
        </h1>

        <div className="hero__role">
          <span className="hero__role-pin">PIN_OUT:</span>
          <TW words={["AI/ML ENGINEER", "FULL-STACK DEV", "DATA SCIENTIST", "CLOUD ARCHITECT", "SYSTEMS BUILDER"]} />
        </div>

        <p className="hero__desc">
          Architecting intelligent systems at the <strong>silicon level</strong>. CGPA <strong>8.96</strong> · VIT · Tamil Nadu. From raw data to production-grade AI — end-to-end.
        </p>

        <div className="hero__spec-table">
          {[
            ["PROCESS", "B.Tech AI & DS"],
            ["FABRICATION", "VIT, Thiruvallur"],
            ["CLOCK_SPEED", "CGPA 8.96"],
            ["STATUS", "SEEKING_ROLE"],
          ].map(([k, v]) => (
            <div key={k} className="hero__spec-row">
              <span className="hero__spec-key">{k}</span>
              <span className="hero__spec-sep">:</span>
              <span className="hero__spec-val">{v}</span>
            </div>
          ))}
        </div>

        <div className="hero__chips-row">
          {["Python", "TensorFlow", "PyTorch", "React", "Node.js", "FastAPI", "Azure", "MongoDB"].map(c => (
            <span key={c} className="ic-chip">{c}</span>
          ))}
        </div>

        <div className="hero__actions">
          <button type="button" className="btn-pcb btn-pcb--primary" onClick={() => goto("projects")}>
            <span className="btn-pcb__trace" /><span className="btn-pcb__text">VIEW SYSTEMS</span><span className="btn-pcb__arrow">→</span>
          </button>
          <button type="button" className="btn-pcb btn-pcb--outline" onClick={() => setCvOpen(true)}>
            <span className="btn-pcb__text">DATASHEET</span><span className="btn-pcb__arrow">↓</span>
          </button>
          <button type="button" className="btn-pcb btn-pcb--ghost" onClick={() => xopen(L.email)}>
            <span className="btn-pcb__trace" />
            <span className="btn-pcb__text">✉ TX/RX</span>
          </button>
        </div>

        <div className="hero__io-row">
          {[{l:"GH",h:L.github},{l:"LI",h:L.linkedin},{l:"✉",h:L.email},{l:"☎",h:L.phone}].map(s => (
            <button key={s.l} type="button" className="io-pin" onClick={() => xopen(s.h)}>{s.l}</button>
          ))}
        </div>
      </div>

      <div className="hero__right">
        {/* IC CHIP PHOTO PACKAGE */}
        <div className="ic-pkg" style={{ transform: `translateY(${scrollY * 0.08}px)` }}>
          {/* Top pins */}
          <div className="ic-pkg__pins ic-pkg__pins--top">
            {Array.from({length:8},(_,i)=><div key={i} className="ic-pkg__pin"/>)}
          </div>
          {/* Left pins */}
          <div className="ic-pkg__pins ic-pkg__pins--left">
            {Array.from({length:6},(_,i)=><div key={i} className="ic-pkg__pin ic-pkg__pin--side"/>)}
          </div>
          {/* Right pins */}
          <div className="ic-pkg__pins ic-pkg__pins--right">
            {Array.from({length:6},(_,i)=><div key={i} className="ic-pkg__pin ic-pkg__pin--side"/>)}
          </div>
          {/* Bottom pins */}
          <div className="ic-pkg__pins ic-pkg__pins--bottom">
            {Array.from({length:8},(_,i)=><div key={i} className="ic-pkg__pin"/>)}
          </div>

          {/* Main chip body */}
          <div className="ic-pkg__body">
            {/* Notch mark top-left */}
            <div className="ic-pkg__notch"/>
            {/* Part number label */}
            <div className="ic-pkg__partno">
              <span>SARABHOJI-AI</span>
              <span>SM-8.96 · VIT · 2026</span>
              <span>AI/ML DEVELOPER</span>
            </div>
            {/* Die window with photo */}
            <div className="ic-pkg__die-window">
              <div className="ic-pkg__die-frame">
                {/* Scanline overlay */}
                <div className="ic-pkg__scanlines"/>
                {/* Photo — replace src with your actual photo URL */}
                <img
                  src="/photo.jpg"
                  alt="Sarabhoji M"
                  className="ic-pkg__photo"
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                />
                {/* Fallback initials if photo fails */}
                <div className="ic-pkg__photo-fallback" style={{display:'none'}}>SM</div>
                {/* Corner markers */}
                <div className="ic-pkg__die-corner ic-pkg__die-corner--tl"/>
                <div className="ic-pkg__die-corner ic-pkg__die-corner--tr"/>
                <div className="ic-pkg__die-corner ic-pkg__die-corner--bl"/>
                <div className="ic-pkg__die-corner ic-pkg__die-corner--br"/>
                {/* Glow overlay */}
                <div className="ic-pkg__die-glow"/>
              </div>
            </div>
            {/* Substrate traces */}
            <div className="ic-pkg__traces">
              {Array.from({length:6},(_,i)=><div key={i} className="ic-pkg__trace-line" style={{opacity:0.3+i*0.05,width:`${30+i*8}%`}}/>)}
            </div>
          </div>

          {/* Floating metric chips */}
          <div className="ic-metrics">
            {[
              {v:"95%+",l:"ML ACC",pos:"tl",c:"#00FF41"},
              {v:"8.96",l:"CGPA",pos:"tr",c:"#B87333"},
              {v:"37",l:"DIST",pos:"bl",c:"#00B4FF"},
              {v:"2",l:"SYS",pos:"br",c:"#FFD166"},
            ].map(m=>(
              <div key={m.l} className={`ic-metric ic-metric--${m.pos}`} style={{"--mc":m.c}}>
                <span className="ic-metric__v">{m.v}</span>
                <span className="ic-metric__l">{m.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Depth bar */}
      <div className="hero__depth">
        <div className="hero__depth-fill" style={{ height: Math.min(scrollY / 3, 100) + "%" }} />
      </div>

      <button type="button" className="hero__scroll" onClick={() => goto("projects")}>
        <span className="hero__scroll-text">SCROLL</span>
        <div className="hero__scroll-arrow">↓</div>
      </button>

      {cvOpen && <CVModal onClose={() => setCvOpen(false)} />}
    </section>
  );
}

/* ── TICKER ── */
function Ticker() {
  const ITEMS = [
    ["95%+","ML MODEL ACCURACY"],["8.96","CGPA SCORE"],["37","DISTRICTS MONITORED"],
    ["2","LIVE SYSTEMS"],["<9s","WEBSOCKET LATENCY"],["6+","TECH DOMAINS"],
    ["10","INCIDENT CATEGORIES"],["VIT","INSTITUTION"],
  ];
  return (
    <div className="ticker">
      <span className="ticker__prefix">◆ SYSTEM_METRICS:</span>
      <div className="ticker__tape">
        {[...ITEMS, ...ITEMS].map(([v, l], i) => (
          <span key={i} className="ticker__item">
            <span className="ticker__v">{v}</span>
            <span className="ticker__l">{l}</span>
            <span className="ticker__sep">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── PROJECTS ── */
const PROJS = [
  {
    id:"URB",ref:"U2",num:"01",icon:"🛰",
    title:"URBANSCAN",tagline:"AI Smart City Surveillance",
    period:"MAY–JUN 2026",badge:"DEPLOYED",
    tech:["HTML","CSS","JavaScript","Python","Node.js","Express.js","WebSocket","NLP"],
    metrics:[["95%+","AI Accuracy"],["37","Districts"],["<9s","Latency"],["10","Categories"]],
    desc:"Full-stack real-time surveillance dashboard detecting graffiti vandalism across all 37 Tamil Nadu districts. NLP-powered anomaly classification, interactive SVG geospatial mapping, paginated incident history, 4-format export: CSV, JSON, GeoJSON, PDF.",
    color:"#00FF41",glow:"rgba(0,255,65,.2)",
    github:L.github,demo:L.github,
  },
  {
    id:"NTB",ref:"U3",num:"02",icon:"🍱",
    title:"NUTRI-BUS",tagline:"Smart Commuter Meal Platform",
    period:"JUL–AUG 2025",badge:"LIVE",
    tech:["Mobile App","Web Platform","REST API","DBMS","Cloud Logistics","Analytics"],
    metrics:[["3","Stakeholder Layers"],["∞","Scalable Orders"],["Live","Schedule Sync"],["Multi","City Coverage"]],
    desc:"Food-tech transportation ecosystem enabling commuters to access fresh meals during travel. Coordinates real-time bus schedules with cloud kitchen dispatch. Revenue model: per-meal, subscriptions, enterprise partnerships.",
    color:"#B87333",glow:"rgba(184,115,51,.2)",
    github:L.github,demo:L.github,
  },
];

function Projects() {
  const [active, setActive] = useState(null);
  return (
    <section className="section" id="projects">
      <div className="section__inner">
        <div className="sec-head">
          <span className="sec-ref">COMPONENT · U2 · SYSTEMS</span>
          <h2 className="sec-title">DEPLOYED<br /><span className="sec-title--etch">PROJECTS</span></h2>
          <div className="sec-trace" />
        </div>
        <div className="proj-grid">
          {PROJS.map((p, i) => (
            <Tilt key={p.id} className={`pcard ${active === p.id ? "pcard--open" : ""}`}
              style={{"--pc": p.color,"--pg": p.glow,"--pi": i}}>
              <div className="pcard__pcb-corner pcard__pcb-corner--tl" />
              <div className="pcard__pcb-corner pcard__pcb-corner--tr" />
              <div className="pcard__aura" />
              <div className="pcard__hd">
                <span className="pcard__ref">{p.ref}</span>
                <span className="pcard__icon">{p.icon}</span>
                <div style={{flex:1}}/>
                <span className="pcard__badge" style={{color:p.color,borderColor:`${p.color}44`,background:`${p.color}11`}}>{p.badge}</span>
                <span className="pcard__period">{p.period}</span>
              </div>
              <h3 className="pcard__title" style={{color:p.color}}>{p.title}</h3>
              <p className="pcard__tagline">{p.tagline}</p>
              <div className="pcard__metrics">
                {p.metrics.map(([v, l]) => (
                  <div key={l} className="pm">
                    <div className="pm__v" style={{color:p.color}}><Cnt to={v}/></div>
                    <div className="pm__l">{l}</div>
                  </div>
                ))}
              </div>
              <div className="pcard__tags">{p.tech.map(t => <span key={t} className="ptag">{t}</span>)}</div>
              <button type="button" className="pcard__toggle"
                style={{color:p.color,borderColor:`${p.color}33`}}
                onClick={() => setActive(active === p.id ? null : p.id)}>
                {active === p.id ? "[-] COLLAPSE" : "[+] INSPECT"}
              </button>
              {active === p.id && (
                <div className="pcard__expand">
                  <div className="pcard__divider" style={{background:p.color}}/>
                  <p className="pcard__desc">{p.desc}</p>
                  <div className="pcard__acts">
                    <button type="button" className="pact" style={{"--pc":p.color}} onClick={() => xopen(p.github)}>◎ GITHUB →</button>
                    <button type="button" className="pact pact--ghost" onClick={() => xopen(p.demo)}>↗ LIVE DEMO</button>
                  </div>
                </div>
              )}
            </Tilt>
          ))}
        </div>
        <div className="proj-tl">
          <div className="ptl-node"><span className="ptl-via"/><span className="ptl-yr">JUL 2025</span><span className="ptl-nm">NUTRI-BUS SHIPPED</span></div>
          <div className="ptl-trace"/>
          <div className="ptl-node"><span className="ptl-via ptl-via--hot"/><span className="ptl-yr">MAY 2026</span><span className="ptl-nm">URBANSCAN LIVE · 37 NODES</span></div>
        </div>
      </div>
    </section>
  );
}

/* ── SKILLS ── */
const SGROUPS = [
  {k:"LANG",  name:"Languages",   color:"#00FF41",items:["Python","Java","C++","JavaScript"],pcts:[92,85,82,88]},
  {k:"ML_AI", name:"ML / AI",     color:"#FF6B35",items:["TensorFlow","PyTorch","Scikit-learn","Keras","LLMs","Groq","LLaMA"],pcts:[90,88,85,82,78,75,80]},
  {k:"DATA",  name:"Data & Viz",  color:"#FFD166",items:["Pandas","NumPy","Matplotlib","Seaborn","Plotly","PowerBI"],pcts:[92,90,85,83,80,78]},
  {k:"DB",    name:"Databases",   color:"#00B4FF",items:["MySQL","MongoDB","PostgreSQL","Vector DBs"],pcts:[88,85,87,75]},
  {k:"CLOUD", name:"DevOps/Cloud",color:"#B87333",items:["Git","Docker","Azure","FastAPI","Streamlit","Jupyter"],pcts:[90,80,82,88,85,87]},
  {k:"WEB",   name:"Web Dev",     color:"#C084FC",items:["HTML5","CSS3","React","Flask","Django"],pcts:[88,87,82,85,80]},
];

function Skills() {
  const [tab, setTab] = useState(0);
  const cur = SGROUPS[tab];
  const CERTS = [
    {ref:"C1",title:"PostgreSQL Certification",org:"Hasavaji Educates",date:"Aug 2025",color:"#00B4FF",href:L.linkedin},
    {ref:"C2",title:"Fundamentals of Data Science & Analytics",org:"Hasavaji Educates",date:"Feb 2026",color:"#C084FC",href:L.linkedin},
    {ref:"A1",title:"Award of Appreciation — Outstanding Contributions",org:"VIT",date:"2025",color:"#FFD166",href:L.linkedin},
  ];
  return (
    <section className="section section--dark" id="skills">
      <div className="section__inner">
        <div className="sec-head">
          <span className="sec-ref">COMPONENT · U3 · TECH MATRIX</span>
          <h2 className="sec-title">SKILL<br /><span className="sec-title--etch">ARSENAL</span></h2>
          <div className="sec-trace" />
        </div>
        <div className="skills-layout">
          <div className="skill-sel">
            {SGROUPS.map((g, i) => (
              <button key={g.k} type="button" className={`ssel ${tab === i ? "ssel--on" : ""}`}
                style={{"--sc":g.color}} onClick={() => setTab(i)}>
                <span className="ssel__led" />
                <span className="ssel__ref">IC{i+1}</span>
                <span className="ssel__name">{g.name}</span>
              </button>
            ))}
          </div>
          <div className="skill-panel">
            <div className="skill-panel__hd" style={{borderColor:`${cur.color}44`}}>
              <span className="skill-panel__ref">{cur.k}</span>
              <span className="skill-panel__slash">//</span>
              <span className="skill-panel__name" style={{color:cur.color}}>{cur.name}</span>
              <span className="skill-panel__cnt">{cur.items.length} MODULES</span>
            </div>
            {cur.items.map((s, i) => (
              <div key={s} className="srow" style={{animationDelay:`${i*.06}s`,"--sc":cur.color}}>
                <span className="srow__pin">◆</span>
                <span className="srow__name">{s}</span>
                <div className="srow__track">
                  <div className="srow__fill" style={{width:`${cur.pcts[i] || 80}%`}} />
                </div>
                <span className="srow__pct">{cur.pcts[i] || 80}%</span>
              </div>
            ))}
          </div>
          {/* PCB schematic art */}
          <div className="schematic">
            <svg viewBox="0 0 200 220" className="sch-svg">
              {/* IC packages */}
              {SGROUPS.map((g, i) => {
                const col = i % 2, row = Math.floor(i / 2);
                const x = 20 + col * 100, y = 20 + row * 65;
                return (
                  <g key={g.k} onClick={() => setTab(i)} style={{cursor:"none"}}>
                    <rect x={x} y={y} width={70} height={40} rx="2" fill={tab===i?`${g.color}22`:"rgba(0,20,0,0.8)"} stroke={tab===i?g.color:"#B87333"} strokeWidth={tab===i?1.5:0.8}/>
                    <text x={x+8} y={y+12} fill="rgba(184,115,51,0.6)" fontSize="6" fontFamily="Share Tech Mono,monospace">IC{i+1}</text>
                    <text x={x+35} y={y+23} textAnchor="middle" fill={tab===i?g.color:"rgba(0,255,65,0.5)"} fontSize="7" fontFamily="Share Tech Mono,monospace">{g.k}</text>
                    {[0,1,2].map(p => <rect key={p} x={x-4} y={y+8+p*8} width={4} height={3} rx={0.5} fill="#B87333"/>)}
                    {[0,1,2].map(p => <rect key={p} x={x+70} y={y+8+p*8} width={4} height={3} rx={0.5} fill="#B87333"/>)}
                    {tab===i && <rect x={x} y={y} width={70} height={40} rx="2" fill="none" stroke={g.color} strokeWidth="1" opacity="0.4"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite"/></rect>}
                  </g>
                );
              })}
              {/* Traces between ICs */}
              <line x1="90" y1="40" x2="120" y2="40" stroke="rgba(184,115,51,.4)" strokeWidth="0.8"/>
              <line x1="90" y1="105" x2="120" y2="105" stroke="rgba(184,115,51,.4)" strokeWidth="0.8"/>
              <line x1="90" y1="170" x2="120" y2="170" stroke="rgba(184,115,51,.4)" strokeWidth="0.8"/>
              <line x1="55" y1="60" x2="55" y2="85" stroke="rgba(184,115,51,.4)" strokeWidth="0.8"/>
              <line x1="155" y1="60" x2="155" y2="85" stroke="rgba(184,115,51,.4)" strokeWidth="0.8"/>
              <line x1="55" y1="125" x2="55" y2="150" stroke="rgba(184,115,51,.4)" strokeWidth="0.8"/>
              <line x1="155" y1="125" x2="155" y2="150" stroke="rgba(184,115,51,.4)" strokeWidth="0.8"/>
              {/* GND symbol */}
              <line x1="100" y1="200" x2="100" y2="212" stroke="#00FF41" strokeWidth="0.8"/>
              <line x1="94" y1="212" x2="106" y2="212" stroke="#00FF41" strokeWidth="0.8"/>
              <line x1="97" y1="215" x2="103" y2="215" stroke="#00FF41" strokeWidth="0.6"/>
              <line x1="100" y1="218" x2="100" y2="218" stroke="#00FF41" strokeWidth="0.4"/>
              <text x="100" y="198" textAnchor="middle" fill="rgba(0,255,65,0.4)" fontSize="5" fontFamily="Share Tech Mono,monospace">GND</text>
            </svg>
          </div>
        </div>
        {/* Certs */}
        <div className="certs">
          <span className="sec-ref" style={{marginBottom:"20px",display:"block"}}>VERIFIED · CREDENTIALS</span>
          <div className="certs-grid">
            {CERTS.map(c => (
              <Tilt key={c.ref}>
                <button type="button" className="cert" style={{"--cc":c.color}} onClick={() => xopen(c.href)}>
                  <div className="cert__stripe"/>
                  <div className="cert__hd">
                    <span className="cert__ref">{c.ref}</span>
                    <span className="cert__arr">↗</span>
                  </div>
                  <span className="cert__title">{c.title}</span>
                  <span className="cert__org">{c.org} · {c.date}</span>
                </button>
              </Tilt>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── ABOUT ── */
function About() {
  const [hov, setHov] = useState(null);
  const CONTACTS = [
    {id:"em",icon:"✉",label:"TX_EMAIL",val:"sarabhoji21@gmail.com",href:L.email},
    {id:"li",icon:"◎",label:"TX_LINKEDIN",val:"sarabhoji-m-29aab3381",href:L.linkedin},
    {id:"gh",icon:"⌥",label:"TX_GITHUB",val:"Saro-21",href:L.github},
    {id:"ph",icon:"☎",label:"TX_PHONE",val:"+91 8939706162",href:L.phone},
  ];
  const JOURNEY = [
    {yr:"2022",ev:"B.Tech AI & DS Enrolled",pl:"VIT, Thiruvallur",c:"#00FF41"},
    {yr:"Aug 2025",ev:"PostgreSQL Certified",pl:"Hasavaji Educates",c:"#00B4FF"},
    {yr:"Jul–Aug 2025",ev:"NUTRI-BUS Shipped",pl:"Full-stack food-tech",c:"#B87333"},
    {yr:"Feb 2026",ev:"Data Science Certified",pl:"Hasavaji Educates",c:"#C084FC"},
    {yr:"May–Jun 2026",ev:"URBANSCAN Deployed",pl:"Live · 37 Tamil Nadu districts",c:"#00FF41"},
    {yr:"Sep 2028",ev:"Expected Graduation",pl:"B.Tech AI & Data Science",c:"#FFD166"},
  ];
  return (
    <section className="section" id="about">
      <div className="section__inner">
        <div className="sec-head">
          <span className="sec-ref">COMPONENT · U4 · OPERATOR ID</span>
          <h2 className="sec-title">WHO<br /><span className="sec-title--etch">AM I</span></h2>
          <div className="sec-trace" />
        </div>
        <div className="about-layout">
          <div className="about-left">
            {/* ID card styled as PCB */}
            <Tilt className="id-pcb">
              <div className="id-pcb__border-trace"/>
              <div className="id-pcb__hd">
                <span className="id-pcb__ref">U4 · OPERATOR_ID</span>
                <span className="id-pcb__rev">REV 8.96</span>
              </div>
              <div className="id-pcb__die">
                <div className="id-pcb__die-inner">
                  <div className="id-pcb__initials">SM</div>
                  <div className="id-pcb__ring r1"/><div className="id-pcb__ring r2"/><div className="id-pcb__ring r3"/>
                </div>
              </div>
              <div className="id-pcb__name">SARABHOJI M</div>
              <div className="id-pcb__role">AI / ML DEVELOPER</div>
              <div className="id-pcb__table">
                {[["CGPA","8.96"],["CITY","THIRUVALLUR"],["GRAD","SEP 2028"],["STATUS","OPEN_TO_WORK"],["DOMAIN","AI · DATA · WEB"]].map(([k,v])=>(
                  <div key={k} className="id-pcb__row">
                    <span className="id-pcb__k">{k}</span>
                    <span className="id-pcb__v">{v}</span>
                  </div>
                ))}
              </div>
              <div className="id-pcb__barcode">
                <div className="id-pcb__bars">{Array.from({length:28},(_,i)=><div key={i} className="id-pcb__bar" style={{height:`${8+Math.sin(i*1.3)*6}px`}}/>)}</div>
              </div>
              <div className="id-pcb__glow"/>
            </Tilt>
            {/* Contact links */}
            <div className="about-links">
              {CONTACTS.map(c => (
                <button key={c.id} type="button" className="alink"
                  onMouseEnter={() => setHov(c.id)} onMouseLeave={() => setHov(null)}
                  onClick={() => xopen(c.href)}>
                  <span className="alink__led" style={{background: hov===c.id?"#00FF41":"#B87333",boxShadow:hov===c.id?"0 0 8px #00FF41":"none"}}/>
                  <span className="alink__label">{c.label}</span>
                  <span className="alink__sep">:</span>
                  <span className="alink__val">{c.val}</span>
                  <span className="alink__status">{hov===c.id?"◉ ON":"○ OFF"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="about-right">
            <div className="about-bio">
              <div className="about-bio__hd">// BIOGRAPHY.txt</div>
              <p className="about-bio__lead">
                I'm <strong>Sarabhoji M</strong> — a B.Tech AI & Data Science engineer at Velammal Institute of Technology, maintaining a CGPA of <span className="hl">8.96</span>.
              </p>
              <p className="about-bio__body">
                I architect intelligent systems end-to-end — from raw data pipelines to real-time WebSocket dashboards monitoring <span className="hl">37 Tamil Nadu districts</span>. My URBANSCAN platform achieves <span className="hl">95%+ AI accuracy</span>; NUTRI-BUS bridges live bus networks with cloud kitchen logistics at city scale.
              </p>
              <p className="about-bio__body">
                Proficient across the full ML lifecycle: Pandas/NumPy for data engineering, TensorFlow & PyTorch for model training, LLM integration via Groq/LLaMA, cloud deployment on <span className="hl">Azure</span>, and FastAPI & Django for backend systems. I ship production-grade code, not prototypes.
              </p>
            </div>
            <div className="journey">
              <div className="journey__hd">// JOURNEY.log</div>
              {JOURNEY.map((j, i) => (
                <div key={i} className="jnode">
                  <div className="jnode__spine">
                    <div className="jnode__via" style={{background:j.c,boxShadow:`0 0 10px ${j.c}88`}}/>
                    {i < JOURNEY.length-1 && <div className="jnode__trace"/>}
                  </div>
                  <div className="jnode__body">
                    <span className="jnode__yr" style={{color:j.c}}>{j.yr}</span>
                    <span className="jnode__ev">{j.ev}</span>
                    <span className="jnode__pl">{j.pl}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="about-btns">
              <button type="button" className="btn-pcb btn-pcb--primary" onClick={() => goto("contact")}>
                <span className="btn-pcb__trace"/><span className="btn-pcb__text">OPEN CHANNEL</span><span className="btn-pcb__arrow">→</span>
              </button>
              <button type="button" className="btn-pcb btn-pcb--outline" onClick={() => xopen(L.github)}>
                <span className="btn-pcb__text">GITHUB ↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CONTACT ── */
function Contact() {
  const [form, setForm] = useState({name:"",email:"",subject:"",message:""});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("IDLE");
  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:""})); };
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "REQUIRED";
    if (!form.email.trim()) e.email = "REQUIRED";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "INVALID";
    if (!form.message.trim()) e.message = "REQUIRED";
    return e;
  };
  const send = async () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    setStatus("TX");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY || "YOUR_API_KEY_HERE"
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("TX_FAILED");
      setStatus("ACK"); setForm({name:"",email:"",subject:"",message:""});
    } catch(err) {
      console.error(err);
      setStatus("ERROR");
      alert("Transmission failed. Please try another channel.");
    }
    setTimeout(() => setStatus("IDLE"), 5000);
  };
  const CHS = [
    {icon:"✉",k:"EMAIL",v:"sarabhoji21@gmail.com",href:L.email},
    {icon:"☎",k:"PHONE",v:"+91 8939706162",href:L.phone},
    {icon:"📍",k:"LOCATION",v:"Thiruvallur, TN",href:L.maps},
    {icon:"◎",k:"LINKEDIN",v:"sarabhoji-m-29aab3381",href:L.linkedin},
    {icon:"⌥",k:"GITHUB",v:"Saro-21",href:L.github},
  ];
  return (
    <section className="section section--dark" id="contact">
      <div className="section__inner">
        <div className="sec-head">
          <span className="sec-ref">COMPONENT · U5 · TRANSCEIVER</span>
          <h2 className="sec-title">OPEN<br /><span className="sec-title--etch">CHANNEL</span></h2>
          <div className="sec-trace" />
        </div>
        <div className="contact-layout">
          <div className="contact-info">
            <div className="contact-status">
              <span className="contact-status__led"/>
              <span className="contact-status__text">RX_READY · AWAITING TRANSMISSION</span>
            </div>
            <p className="contact-info__desc">Open to internships, research, freelance, and full-time. ACK guaranteed within 24h.</p>
            <div className="contact-chs">
              {CHS.map(c => (
                <button key={c.k} type="button" className="ch" onClick={() => xopen(c.href)}>
                  <span className="ch__icon">{c.icon}</span>
                  <span className="ch__k">{c.k}</span>
                  <span className="ch__sep">::</span>
                  <span className="ch__v">{c.v}</span>
                  <span className="ch__arr">→</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cform">
            <div className="cform__hd">
              <span className="cform__ref">TX_FORM · COMPOSE MESSAGE</span>
              <div className={`cform__status-led ${status==="TX"?"cform__status-led--blink":""} ${status==="ACK"?"cform__status-led--green":""}`}/>
            </div>
            <div className="cform__row">
              <div className="cfield">
                <label className="cfield__lbl">NAME {errors.name&&<span className="cfield__err">· {errors.name}</span>}</label>
                <input className={`cfield__inp ${errors.name?"cfield__inp--err":""}`} value={form.name} onChange={set("name")} placeholder="operator_name"/>
              </div>
              <div className="cfield">
                <label className="cfield__lbl">EMAIL {errors.email&&<span className="cfield__err">· {errors.email}</span>}</label>
                <input type="email" className={`cfield__inp ${errors.email?"cfield__inp--err":""}`} value={form.email} onChange={set("email")} placeholder="signal_address"/>
              </div>
            </div>
            <div className="cfield">
              <label className="cfield__lbl">SUBJECT</label>
              <input className="cfield__inp" value={form.subject} onChange={set("subject")} placeholder="TX_SUBJECT"/>
            </div>
            <div className="cfield">
              <label className="cfield__lbl">MESSAGE {errors.message&&<span className="cfield__err">· {errors.message}</span>}</label>
              <textarea rows={5} className={`cfield__inp cfield__ta ${errors.message?"cfield__inp--err":""}`} value={form.message} onChange={set("message")} placeholder="// message_body..."/>
            </div>
            <button type="button"
              className={`btn-tx ${status==="TX"?"btn-tx--sending":""} ${status==="ACK"?"btn-tx--ack":""}`}
              onClick={send} disabled={status==="TX"}>
              <span className="btn-tx__trace"/>
              {status==="IDLE" && <><span>TRANSMIT →</span><span className="btn-tx__led"/></>}
              {status==="TX"   && <><span>TRANSMITTING...</span><span className="btn-tx__led btn-tx__led--blink"/></>}
              {status==="ACK"  && <><span>✓ MESSAGE ACK'D</span><span className="btn-tx__led btn-tx__led--green"/></>}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ── */
function Footer() {
  const [top, setTop] = useState(false);
  useEffect(() => { const fn = () => setTop(window.scrollY > 500); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);
  return (
    <footer className="footer">
      <div className="footer__trace-top"/>
      <div className="footer__inner">
        <button type="button" className="footer__brand" onClick={() => goto("hero")}>
          <span className="footer__brand-led"/>◈ SARABHOJI.M
        </button>
        <div className="footer__nav">
          {[["SURFACE","hero"],["SYSTEMS","projects"],["ARSENAL","skills"],["IDENTITY","about"],["SIGNAL","contact"]].map(([l,id])=>(
            <button key={id} type="button" className="footer__link" onClick={() => goto(id)}>{l}</button>
          ))}
        </div>
        <div className="footer__socials">
          {[{l:"GH",h:L.github},{l:"LI",h:L.linkedin},{l:"✉",h:L.email}].map(s=>(
            <button key={s.l} type="button" className="footer__social" onClick={() => xopen(s.h)}>{s.l}</button>
          ))}
        </div>
        <div className="footer__copy">© 2026 SARABHOJI M · REACT + NODE.JS · DEPLOY: VERCEL</div>
      </div>
      {top && <button type="button" className="back-top" onClick={() => goto("hero")}>↑</button>}
    </footer>
  );
}

/* ── APP ── */
export default function App() {
  const [booted, setBooted] = useState(false);
  return (<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      :root{
        --bg:#000A00;--bg2:#001200;--bg3:#001800;--card:#001000;
        --green:#00FF41;--copper:#B87333;--solder:#E8F4E8;--amber:#FFD166;
        --violet:#C084FC;--cyan:#00B4FF;--orange:#FF6B35;
        --txt:#C8E6C0;--muted:#1A3A1A;--soft:#4A7A4A;
        --fh:'Bebas Neue',sans-serif;--fb:'IBM Plex Sans',sans-serif;--fm:'IBM Plex Mono',monospace;
        --gutter:clamp(20px,5vw,80px);--rad:3px;
      }
      html{scroll-behavior:smooth;cursor:none}
      body{background:var(--bg);color:var(--txt);font-family:var(--fb);overflow-x:hidden;cursor:none}
      button,a{cursor:none;font-family:inherit}button{border:none;background:none;padding:0;color:inherit}
      strong{font-weight:500;color:#fff}

      /* BOOT */
      .boot{position:fixed;inset:0;background:#000500;z-index:9000;display:flex;align-items:center;justify-content:center;transition:opacity .5s,transform .5s}
      .boot--exit{opacity:0;transform:scale(1.04);pointer-events:none}
      .boot__scanline{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,255,65,.015) 0,rgba(0,255,65,.015) 1px,transparent 1px,transparent 3px);pointer-events:none}
      .boot__content{width:min(580px,90vw)}
      .boot__cpu{display:flex;justify-content:center;margin-bottom:32px}
      .boot__cpu-die{position:relative;width:140px;height:100px;background:rgba(0,30,0,.8);border:1.5px solid var(--copper);border-radius:3px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px}
      .boot__cpu-label{font-family:var(--fh);font-size:16px;color:var(--green);letter-spacing:.15em;text-shadow:0 0 10px var(--green)}
      .boot__cpu-sub{font-family:var(--fm);font-size:8px;color:var(--soft);letter-spacing:.1em}
      .boot__cpu-pin{position:absolute;background:var(--copper);border-radius:1px}
      .boot__cpu-pin--0{width:4px;height:6px;top:-6px;left:24px}
      .boot__cpu-pin--1{width:4px;height:6px;top:-6px;right:24px}
      .boot__cpu-pin--2{width:6px;height:4px;bottom:-4px;left:24px}
      .boot__cpu-pin--3{width:6px;height:4px;bottom:-4px;right:24px}
      .boot__log{font-family:var(--fm);font-size:12px;color:var(--green);display:flex;flex-direction:column;gap:3px;margin-bottom:24px;min-height:160px}
      .boot__line{animation:fadeIn .1s ease both;opacity:.85}
      .boot__line::before{content:"";color:var(--copper)}
      .boot__progress{position:relative}
      .boot__progress-bar{height:2px;background:var(--green);box-shadow:0 0 8px var(--green);transition:width .15s;border-radius:1px}
      .boot__progress-labels{display:flex;justify-content:space-between;font-family:var(--fm);font-size:10px;color:var(--soft);margin-top:6px}

      /* CROSSHAIR CURSOR */
      .xh{position:fixed;left:0;right:0;height:1px;background:rgba(0,255,65,.12);pointer-events:none;z-index:9998;transform:translateY(-50%)}
      .xv{position:fixed;top:0;bottom:0;width:1px;background:rgba(0,255,65,.12);pointer-events:none;z-index:9998;transform:translateX(-50%)}
      .xdot{position:fixed;width:8px;height:8px;background:var(--green);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);box-shadow:0 0 8px var(--green);transition:width .15s,height .15s}
      .xdot--big{width:16px;height:16px;border-radius:50%;background:transparent;border:1.5px solid var(--green)}
      .xlabel{position:fixed;font-family:var(--fm);font-size:9px;color:rgba(0,255,65,.5);pointer-events:none;z-index:9997;letter-spacing:.05em}
      .xclick{position:fixed;width:4px;height:4px;background:var(--green);border-radius:50%;pointer-events:none;z-index:9996;transform:translate(-50%,-50%);animation:clickRing .6s ease-out forwards}

      /* NAV */
      .nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:14px var(--gutter);transition:all .4s}
      .nav--solid{background:rgba(0,10,0,.93);backdrop-filter:blur(12px);border-bottom:1px solid rgba(184,115,51,.25)}
      .nav__logo{display:flex;align-items:center;gap:10px;transition:opacity .2s}
      .nav__logo:hover{opacity:.75}
      .nav__logo-text{font-family:var(--fh);font-size:18px;color:var(--txt);letter-spacing:.14em}
      .nav__logo-dot{color:var(--copper)}
      .nav__list{display:flex;align-items:center;gap:3px;list-style:none}
      .nav__link{font-family:var(--fm);font-size:11px;color:var(--soft);padding:6px 14px;border-radius:var(--rad);letter-spacing:.1em;transition:all .2s;display:flex;align-items:center;gap:5px}
      .nav__link:hover{color:var(--green);background:rgba(0,255,65,.05)}
      .nav__link-ref{color:var(--copper);font-size:9px}
      .nav__hire{font-family:var(--fm);font-size:11px;background:transparent;border:1px solid var(--copper);color:var(--copper);padding:6px 16px;border-radius:var(--rad);letter-spacing:.1em;display:flex;align-items:center;gap:8px;overflow:hidden;position:relative;transition:all .2s}
      .nav__hire::before{content:'';position:absolute;inset:0;background:var(--copper);transform:translateX(-101%);transition:transform .25s}
      .nav__hire:hover::before{transform:translateX(0)}
      .nav__hire:hover{color:#000}
      .nav__hire span{position:relative;z-index:1}
      .nav__hire-led{width:6px;height:6px;border-radius:50%;background:var(--green);animation:ledBlink 1.2s ease infinite;position:relative;z-index:1}
      .nav__status{display:flex;align-items:center;gap:12px}
      .nav__volt{font-family:var(--fm);font-size:10px;color:var(--copper)}
      .nav__clock{font-family:var(--fm);font-size:10px;color:var(--soft)}
      .nav__ham{display:none;font-size:20px;color:var(--green);padding:4px}

      /* HERO */
      .hero{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:40px;padding:100px var(--gutter) 60px;position:relative;overflow:hidden}
      .hero__bg-copper{position:absolute;inset:0;background:radial-gradient(ellipse at 60% 50%,rgba(184,115,51,.04),transparent 60%);pointer-events:none}
      .hero__corner{position:absolute;width:24px;height:24px;pointer-events:none}
      .hero__corner--tl{top:20px;left:20px;border-top:1px solid var(--copper);border-left:1px solid var(--copper)}
      .hero__corner--tr{top:20px;right:20px;border-top:1px solid var(--copper);border-right:1px solid var(--copper)}
      .hero__corner--bl{bottom:20px;left:20px;border-bottom:1px solid var(--copper);border-left:1px solid var(--copper)}
      .hero__corner--br{bottom:20px;right:20px;border-bottom:1px solid var(--copper);border-right:1px solid var(--copper)}
      .hero__scanline{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,255,65,.012) 0,rgba(0,255,65,.012) 1px,transparent 1px,transparent 4px);pointer-events:none}
      .hero__left{position:relative;z-index:1}
      .hero__pcb-label{display:flex;align-items:center;gap:10px;font-family:var(--fm);font-size:10px;color:var(--copper);letter-spacing:.14em;margin-bottom:24px;animation:fadeUp .5s ease both}
      .hero__led{width:7px;height:7px;border-radius:50%;flex-shrink:0}
      .hero__led--green{background:var(--green);box-shadow:0 0 10px var(--green);animation:ledBlink 2s ease infinite}
      .hero__name{font-family:var(--fh);font-size:clamp(52px,8vw,108px);line-height:.92;letter-spacing:.04em;margin-bottom:18px}
      .hero__name-row{display:block;color:var(--solder);white-space:nowrap}
      .hero__name-row--copper{color:var(--copper);text-shadow:0 0 40px rgba(184,115,51,.4)}
      .hero__name-row--dim{color:rgba(255,255,255,.15);font-size:.65em}
      .hero__name-m{color:var(--copper);text-shadow:0 0 30px rgba(184,115,51,.5)}
      .hero__name-dot{color:var(--green)}
      .hero__letter{display:inline-block;animation:dropIn .6s cubic-bezier(.34,1.56,.64,1) both}
      .hero__role{font-family:var(--fm);font-size:clamp(12px,2vw,17px);color:var(--soft);letter-spacing:.12em;margin-bottom:22px;animation:fadeUp .7s .3s ease both;display:flex;align-items:center;gap:8px}
      .hero__role-pin{color:var(--copper)}
      .tw-c{color:var(--green);animation:blink .7s step-end infinite}
      .hero__desc{font-size:14px;font-weight:300;color:var(--soft);line-height:1.9;max-width:460px;margin-bottom:24px;animation:fadeUp .7s .4s ease both}
      .hero__spec-table{font-family:var(--fm);font-size:11px;background:rgba(0,30,0,.6);border:1px solid rgba(184,115,51,.2);border-radius:var(--rad);padding:14px 16px;margin-bottom:22px;animation:fadeUp .7s .45s ease both}
      .hero__spec-row{display:flex;gap:8px;padding:3px 0;border-bottom:1px solid rgba(0,255,65,.05)}
      .hero__spec-row:last-child{border-bottom:none}
      .hero__spec-key{color:var(--copper);min-width:120px;letter-spacing:.06em}
      .hero__spec-sep{color:var(--muted)}
      .hero__spec-val{color:var(--green)}
      .hero__chips-row{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:28px;animation:fadeUp .7s .5s ease both}
      .ic-chip{font-family:var(--fm);font-size:9px;color:var(--soft);border:1px solid rgba(184,115,51,.25);background:rgba(184,115,51,.04);padding:4px 10px;border-radius:2px;letter-spacing:.06em;transition:all .2s;position:relative}
      .ic-chip::before{content:'';position:absolute;left:-3px;top:50%;transform:translateY(-50%);width:3px;height:8px;background:var(--copper);border-radius:1px 0 0 1px}
      .ic-chip::after{content:'';position:absolute;right:-3px;top:50%;transform:translateY(-50%);width:3px;height:8px;background:var(--copper);border-radius:0 1px 1px 0}
      .ic-chip:hover{color:var(--green);border-color:var(--green);background:rgba(0,255,65,.05)}
      .hero__actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;animation:fadeUp .7s .6s ease both}
      .hero__io-row{display:flex;gap:8px;animation:fadeUp .7s .7s ease both}
      .io-pin{width:36px;height:36px;border-radius:2px;background:rgba(184,115,51,.08);border:1px solid rgba(184,115,51,.3);color:var(--soft);font-family:var(--fm);font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .2s;position:relative}
      .io-pin::before{content:'';position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:4px;height:4px;background:var(--copper);border-radius:1px}
      .io-pin:hover{background:rgba(0,255,65,.08);border-color:var(--green);color:var(--green);transform:translateY(-2px)}

      /* IC CHIP PHOTO PACKAGE */
      .hero__right{position:relative;z-index:1;display:flex;align-items:center;justify-content:center}
      .ic-pkg{position:relative;width:340px;height:380px;display:flex;align-items:center;justify-content:center}
      /* Pins */
      .ic-pkg__pins{position:absolute;display:flex;gap:8px}
      .ic-pkg__pins--top{top:0;left:50%;transform:translateX(-50%);flex-direction:row;align-items:flex-start}
      .ic-pkg__pins--bottom{bottom:0;left:50%;transform:translateX(-50%);flex-direction:row;align-items:flex-end}
      .ic-pkg__pins--left{left:0;top:50%;transform:translateY(-50%);flex-direction:column;align-items:flex-start}
      .ic-pkg__pins--right{right:0;top:50%;transform:translateY(-50%);flex-direction:column;align-items:flex-end}
      .ic-pkg__pin{background:var(--copper);border-radius:1px;flex-shrink:0;box-shadow:0 0 4px rgba(184,115,51,.4)}
      .ic-pkg__pins--top .ic-pkg__pin,.ic-pkg__pins--bottom .ic-pkg__pin{width:8px;height:18px}
      .ic-pkg__pin--side{width:18px;height:8px}
      /* Body */
      .ic-pkg__body{position:absolute;inset:22px;background:linear-gradient(145deg,#001800,#000E00);border:2px solid var(--copper);border-radius:4px;overflow:hidden;box-shadow:0 0 40px rgba(184,115,51,.15),inset 0 0 20px rgba(0,0,0,.5);display:flex;flex-direction:column;align-items:center;padding:14px 12px 10px;gap:8px}
      .ic-pkg__notch{position:absolute;top:-1px;left:18px;width:20px;height:10px;background:var(--bg);border-radius:0 0 20px 20px;border:1.5px solid var(--copper);border-top:none}
      .ic-pkg__partno{width:100%;display:flex;flex-direction:column;gap:1px;padding-bottom:8px;border-bottom:1px solid rgba(184,115,51,.2)}
      .ic-pkg__partno span{font-family:var(--fm);letter-spacing:.08em}
      .ic-pkg__partno span:nth-child(1){font-size:11px;color:var(--green);font-weight:500}
      .ic-pkg__partno span:nth-child(2){font-size:9px;color:var(--copper)}
      .ic-pkg__partno span:nth-child(3){font-size:9px;color:var(--soft)}
      /* Die window */
      .ic-pkg__die-window{width:100%;flex:1;position:relative}
      .ic-pkg__die-frame{position:absolute;inset:0;border:1.5px solid rgba(0,255,65,.25);border-radius:2px;overflow:hidden;background:#000}
      .ic-pkg__photo{width:100%;height:100%;object-fit:contain;object-position:center;display:block;filter:saturate(0.7) brightness(0.9) contrast(1.05)}
      .ic-pkg__photo-fallback{width:100%;height:100%;background:rgba(0,30,0,.8);display:flex;align-items:center;justify-content:center;font-family:var(--fh);font-size:52px;color:var(--green);text-shadow:0 0 20px rgba(0,255,65,.5)}
      .ic-pkg__scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.15) 0,rgba(0,0,0,.15) 1px,transparent 1px,transparent 3px);pointer-events:none;z-index:2}
      .ic-pkg__die-glow{position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(0,255,65,.08) 100%);pointer-events:none;z-index:3}
      /* Corner markers */
      .ic-pkg__die-corner{position:absolute;width:10px;height:10px;z-index:4}
      .ic-pkg__die-corner--tl{top:3px;left:3px;border-top:1.5px solid var(--green);border-left:1.5px solid var(--green)}
      .ic-pkg__die-corner--tr{top:3px;right:3px;border-top:1.5px solid var(--green);border-right:1.5px solid var(--green)}
      .ic-pkg__die-corner--bl{bottom:3px;left:3px;border-bottom:1.5px solid var(--green);border-left:1.5px solid var(--green)}
      .ic-pkg__die-corner--br{bottom:3px;right:3px;border-bottom:1.5px solid var(--green);border-right:1.5px solid var(--green)}
      /* Substrate traces */
      .ic-pkg__traces{width:100%;display:flex;flex-direction:column;gap:3px;padding-top:6px;border-top:1px solid rgba(184,115,51,.15)}
      .ic-pkg__trace-line{height:1px;background:linear-gradient(90deg,var(--copper),transparent);border-radius:1px}
      /* Floating metrics */
      .ic-metrics{position:absolute;inset:0;pointer-events:none}
      .ic-metric{position:absolute;background:rgba(0,10,0,.9);border:1px solid var(--mc);border-radius:2px;padding:5px 9px;text-align:center;min-width:52px;box-shadow:0 0 10px rgba(0,0,0,.5)}
      .ic-metric--tl{top:8px;left:0}
      .ic-metric--tr{top:8px;right:0}
      .ic-metric--bl{bottom:8px;left:0}
      .ic-metric--br{bottom:8px;right:0}
      .ic-metric__v{display:block;font-family:var(--fh);font-size:16px;color:var(--mc);line-height:1}
      .ic-metric__l{display:block;font-family:var(--fm);font-size:7px;color:var(--soft);letter-spacing:.06em;margin-top:1px}

      /* Depth bar */
      .hero__depth{position:absolute;right:var(--gutter);top:50%;transform:translateY(-50%);width:2px;height:100px;background:rgba(0,255,65,.08);border-radius:2px;overflow:hidden}
      .hero__depth-fill{width:100%;background:var(--green);box-shadow:0 0 8px var(--green);transition:height .1s;border-radius:2px}
      .hero__scroll{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--fm);font-size:9px;color:var(--soft);letter-spacing:.1em;transition:color .2s}
      .hero__scroll:hover{color:var(--green)}
      .hero__scroll-arrow{font-size:18px;color:var(--green);animation:bounce 2s ease infinite}

      /* BUTTONS */
      .btn-pcb{display:inline-flex;align-items:center;gap:10px;font-family:var(--fm);font-size:11px;letter-spacing:.12em;padding:11px 22px;border-radius:var(--rad);position:relative;overflow:hidden;transition:all .25s}
      .btn-pcb__trace{position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(0,255,65,.15),transparent);transform:translateX(-100%);animation:traceFlow 2.5s infinite}
      .btn-pcb__text,.btn-pcb__arrow{position:relative;z-index:1}
      .btn-pcb--primary{background:var(--green);color:#000;font-weight:600;box-shadow:0 0 20px rgba(0,255,65,.2)}
      .btn-pcb--primary:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,255,65,.35)}
      .btn-pcb--outline{background:transparent;border:1px solid var(--copper);color:var(--copper)}
      .btn-pcb--outline:hover{background:rgba(184,115,51,.08);transform:translateY(-1px)}
      .btn-pcb--ghost{background:transparent;border:1px solid rgba(0,255,65,.3);color:var(--green)}
      .btn-pcb--ghost:hover{border-color:var(--green);background:rgba(0,255,65,.08);color:var(--green);transform:translateY(-1px)}

      /* TICKER */
      .ticker{background:rgba(0,255,65,.04);border-top:1px solid rgba(0,255,65,.08);border-bottom:1px solid rgba(0,255,65,.08);overflow:hidden;position:relative;z-index:1;display:flex;align-items:center}
      .ticker__prefix{font-family:var(--fm);font-size:10px;color:var(--copper);padding:12px 16px;border-right:1px solid rgba(184,115,51,.2);white-space:nowrap;flex-shrink:0;letter-spacing:.08em}
      .ticker__tape{display:flex;animation:tickerScroll 30s linear infinite;padding:12px 0}
      .ticker__item{display:flex;align-items:center;gap:8px;padding:0 20px;flex-shrink:0}
      .ticker__v{font-family:var(--fh);font-size:20px;color:var(--green)}
      .ticker__l{font-family:var(--fm);font-size:9px;color:var(--soft);letter-spacing:.1em;white-space:nowrap}
      .ticker__sep{color:rgba(184,115,51,.4);font-size:12px}

      /* SECTION */
      .section{position:relative;z-index:1}
      .section--dark{background:var(--bg2)}
      .section__inner{padding:80px var(--gutter)}
      .sec-head{margin-bottom:52px}
      .sec-ref{font-family:var(--fm);font-size:9px;color:var(--copper);letter-spacing:.18em;margin-bottom:10px;display:block}
      .sec-title{font-family:var(--fh);font-size:clamp(44px,7vw,88px);line-height:.9;color:var(--txt);letter-spacing:.04em;margin-bottom:14px}
      .sec-title--etch{color:transparent;-webkit-text-stroke:1.5px var(--copper);filter:drop-shadow(0 0 12px rgba(184,115,51,.3))}
      .sec-trace{width:60px;height:2px;background:var(--copper);box-shadow:0 0 8px rgba(184,115,51,.4)}

      /* PROJECTS */
      .proj-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:20px;margin-bottom:52px}
      .pcard{background:rgba(0,12,0,.9);border:1px solid rgba(184,115,51,.18);border-radius:var(--rad);padding:28px;position:relative;overflow:hidden;transition:border-color .3s,transform .2s;animation:fadeUp .6s calc(var(--pi)*0.1s) ease both}
      .pcard:hover{border-color:rgba(184,115,51,.45);transform:translateY(-2px)}
      .pcard--open{border-color:rgba(0,255,65,.3)}
      .pcard__pcb-corner{position:absolute;width:14px;height:14px}
      .pcard__pcb-corner--tl{top:0;left:0;border-top:1px solid var(--copper);border-left:1px solid var(--copper)}
      .pcard__pcb-corner--tr{top:0;right:0;border-top:1px solid var(--copper);border-right:1px solid var(--copper)}
      .pcard__aura{position:absolute;top:-50px;right:-50px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,var(--pc),transparent 70%);opacity:.06;transition:opacity .4s;pointer-events:none}
      .pcard:hover .pcard__aura{opacity:.14}
      .pcard__hd{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}
      .pcard__ref{font-family:var(--fm);font-size:9px;color:var(--copper);letter-spacing:.12em}
      .pcard__icon{font-size:28px;flex-shrink:0}
      .pcard__badge{font-family:var(--fm);font-size:9px;padding:3px 9px;border-radius:1px;letter-spacing:.1em}
      .pcard__period{font-family:var(--fm);font-size:10px;color:var(--soft)}
      .pcard__title{font-family:var(--fh);font-size:40px;line-height:1;letter-spacing:.04em;margin-bottom:6px}
      .pcard__tagline{font-size:13px;color:var(--soft);margin-bottom:18px}
      .pcard__metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid rgba(184,115,51,.12);border-radius:var(--rad);overflow:hidden;margin-bottom:16px}
      .pm{padding:10px 8px;border-right:1px solid rgba(184,115,51,.1);text-align:center}
      .pm:last-child{border-right:none}
      .pm__v{font-family:var(--fh);font-size:18px;display:block;line-height:1}
      .pm__l{font-family:var(--fm);font-size:8px;color:var(--soft);letter-spacing:.06em;display:block;margin-top:3px}
      .pcard__tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px}
      .ptag{font-family:var(--fm);font-size:9px;color:var(--soft);background:rgba(184,115,51,.06);border:1px solid rgba(184,115,51,.15);padding:3px 8px;border-radius:1px;letter-spacing:.04em;transition:all .2s}
      .ptag:hover{color:var(--pc);border-color:var(--pc)}
      .pcard__toggle{font-family:var(--fm);font-size:10px;letter-spacing:.1em;border:1px solid;padding:7px 16px;border-radius:var(--rad);transition:all .2s;background:transparent}
      .pcard__toggle:hover{background:rgba(0,255,65,.05)}
      .pcard__expand{margin-top:18px;animation:fadeUp .3s ease}
      .pcard__divider{height:1px;margin-bottom:14px;max-width:60px}
      .pcard__desc{font-size:13px;color:var(--soft);line-height:1.85;margin-bottom:16px;font-weight:300}
      .pcard__acts{display:flex;gap:8px;flex-wrap:wrap}
      .pact{font-family:var(--fm);font-size:10px;letter-spacing:.1em;padding:8px 16px;border-radius:var(--rad);transition:all .2s;display:inline-flex;align-items:center;gap:6px}
      .pact{background:var(--pc);color:#000;font-weight:600}.pact:hover{opacity:.85;transform:translateY(-1px)}
      .pact--ghost{background:transparent;border:1px solid rgba(255,255,255,.1);color:var(--soft)}.pact--ghost:hover{border-color:rgba(255,255,255,.25);color:var(--txt)}
      /* Timeline */
      .proj-tl{display:flex;align-items:center;padding:20px 0;border-top:1px solid rgba(184,115,51,.1)}
      .ptl-node{display:flex;align-items:center;gap:10px}
      .ptl-via{width:10px;height:10px;border-radius:50%;background:rgba(184,115,51,.4);border:1.5px solid var(--copper);flex-shrink:0}
      .ptl-via--hot{background:var(--green);border-color:var(--green);box-shadow:0 0 12px rgba(0,255,65,.5);animation:ledBlink 1.5s ease infinite}
      .ptl-yr{font-family:var(--fm);font-size:9px;color:var(--copper);letter-spacing:.08em}
      .ptl-nm{font-family:var(--fm);font-size:11px;color:var(--soft)}
      .ptl-trace{flex:1;height:1px;background:linear-gradient(90deg,var(--copper),rgba(184,115,51,.3));margin:0 20px}

      /* SKILLS */
      .skills-layout{display:grid;grid-template-columns:180px 1fr 220px;gap:24px;margin-bottom:52px;align-items:start}
      .skill-sel{display:flex;flex-direction:column;gap:4px}
      .ssel{display:flex;align-items:center;gap:8px;background:rgba(0,20,0,.7);border:1px solid rgba(184,115,51,.15);border-radius:var(--rad);padding:10px 12px;text-align:left;position:relative;overflow:hidden;transition:all .2s}
      .ssel:hover{border-color:rgba(184,115,51,.35);background:rgba(184,115,51,.04)}
      .ssel--on{border-color:var(--sc);background:rgba(0,255,65,.04)}
      .ssel__led{width:5px;height:5px;border-radius:50%;background:var(--muted);flex-shrink:0;transition:all .2s}
      .ssel--on .ssel__led{background:var(--sc);box-shadow:0 0 6px var(--sc)}
      .ssel__ref{font-family:var(--fm);font-size:9px;color:var(--copper)}
      .ssel__name{font-family:var(--fb);font-size:12px;color:var(--soft);flex:1}
      .ssel--on .ssel__name{color:var(--sc)}
      .skill-panel{background:rgba(0,12,0,.8);border:1px solid rgba(184,115,51,.2);border-radius:var(--rad);padding:20px}
      .skill-panel__hd{display:flex;align-items:center;gap:8px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(184,115,51,.12)}
      .skill-panel__ref{font-family:var(--fh);font-size:22px;line-height:1}
      .skill-panel__slash{color:var(--muted);font-family:var(--fm)}
      .skill-panel__name{font-size:14px;color:var(--txt);flex:1}
      .skill-panel__cnt{font-family:var(--fm);font-size:10px;color:var(--soft)}
      .srow{display:flex;align-items:center;gap:10px;margin-bottom:12px;animation:fadeUp .4s ease both}
      .srow__pin{color:var(--sc);font-size:8px;flex-shrink:0}
      .srow__name{font-family:var(--fm);font-size:12px;color:var(--txt);flex:1;letter-spacing:.04em}
      .srow__track{width:80px;height:2px;background:rgba(0,255,65,.08);border-radius:1px;overflow:hidden;flex-shrink:0}
      .srow__fill{height:100%;background:var(--sc);animation:fillBar .9s ease forwards .3s;width:0;box-shadow:0 0 4px var(--sc)}
      .srow__pct{font-family:var(--fm);font-size:9px;color:var(--soft);width:30px;text-align:right;flex-shrink:0}
      .schematic{display:flex;align-items:center;justify-content:center}
      .sch-svg{width:200px;height:220px}
      /* Certs */
      .certs{border-top:1px solid rgba(184,115,51,.1);padding-top:44px}
      .certs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:20px}
      .cert{display:flex;flex-direction:column;gap:7px;background:rgba(0,12,0,.85);border:1px solid rgba(184,115,51,.15);border-radius:var(--rad);padding:18px;text-align:left;width:100%;position:relative;overflow:hidden;transition:all .25s}
      .cert:hover{border-color:var(--cc);transform:translateY(-2px)}
      .cert__stripe{position:absolute;top:0;left:0;right:0;height:2px;background:var(--cc);opacity:.7}
      .cert__hd{display:flex;justify-content:space-between;align-items:center}
      .cert__ref{font-family:var(--fm);font-size:9px;color:var(--cc);letter-spacing:.12em}
      .cert__arr{color:var(--cc);font-size:12px}
      .cert__title{font-size:12px;color:var(--txt);font-weight:500;line-height:1.4}
      .cert__org{font-family:var(--fm);font-size:10px;color:var(--soft)}

      /* ABOUT */
      .about-layout{display:grid;grid-template-columns:300px 1fr;gap:48px;align-items:start}
      .about-left{display:flex;flex-direction:column;gap:16px}
      .id-pcb{background:rgba(0,12,0,.9);border:1px solid var(--copper);border-radius:2px;padding:22px;position:relative;overflow:hidden}
      .id-pcb__border-trace{position:absolute;inset:4px;border:1px dashed rgba(184,115,51,.15);border-radius:1px;pointer-events:none}
      .id-pcb__hd{display:flex;justify-content:space-between;font-family:var(--fm);font-size:9px;letter-spacing:.1em;margin-bottom:18px}
      .id-pcb__ref{color:var(--copper)}.id-pcb__rev{color:var(--soft)}
      .id-pcb__die{display:flex;justify-content:center;margin-bottom:14px}
      .id-pcb__die-inner{position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center}
      .id-pcb__initials{font-family:var(--fh);font-size:28px;color:var(--green);position:relative;z-index:1;text-shadow:0 0 20px rgba(0,255,65,.5)}
      .id-pcb__ring{position:absolute;border-radius:50%;border:1px solid}
      .r1{width:60px;height:60px;border-color:rgba(0,255,65,.2);animation:spinRing 8s linear infinite}
      .r2{width:75px;height:75px;border-color:rgba(184,115,51,.2);border-style:dashed;animation:spinRing 14s linear infinite reverse}
      .r3{width:90px;height:90px;border-color:rgba(0,255,65,.1);animation:spinRing 20s linear infinite}
      .id-pcb__name{font-family:var(--fh);font-size:18px;color:var(--txt);text-align:center;letter-spacing:.12em;margin-bottom:2px}
      .id-pcb__role{font-family:var(--fm);font-size:10px;color:var(--copper);text-align:center;letter-spacing:.14em;margin-bottom:14px}
      .id-pcb__table{display:flex;flex-direction:column;gap:0;margin-bottom:14px}
      .id-pcb__row{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(0,255,65,.05)}
      .id-pcb__row:last-child{border-bottom:none}
      .id-pcb__k{font-family:var(--fm);font-size:9px;color:var(--soft);letter-spacing:.08em}
      .id-pcb__v{font-family:var(--fm);font-size:9px;color:var(--green)}
      .id-pcb__barcode{margin-top:8px;display:flex;justify-content:center}
      .id-pcb__bars{display:flex;align-items:flex-end;gap:1.5px}
      .id-pcb__bar{width:2px;background:var(--copper);opacity:.5;border-radius:1px 1px 0 0}
      .id-pcb__glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,rgba(0,255,65,.06),transparent 60%);pointer-events:none}
      /* About links */
      .about-links{display:flex;flex-direction:column;gap:6px}
      .alink{display:flex;align-items:center;gap:10px;background:rgba(0,20,0,.7);border:1px solid rgba(184,115,51,.15);border-radius:var(--rad);padding:10px 12px;text-align:left;width:100%;transition:all .2s}
      .alink:hover{border-color:rgba(0,255,65,.3);background:rgba(0,255,65,.04);transform:translateX(4px)}
      .alink__led{width:5px;height:5px;border-radius:50%;flex-shrink:0;transition:all .2s}
      .alink__label{font-family:var(--fm);font-size:9px;color:var(--copper);letter-spacing:.08em;min-width:90px}
      .alink__sep{color:var(--muted)}
      .alink__val{font-family:var(--fm);font-size:10px;color:var(--txt);flex:1}
      .alink__status{font-family:var(--fm);font-size:9px;color:var(--soft);flex-shrink:0}
      /* About right */
      .about-bio{background:rgba(0,12,0,.7);border:1px solid rgba(184,115,51,.15);border-radius:var(--rad);padding:24px;margin-bottom:24px}
      .about-bio__hd{font-family:var(--fm);font-size:10px;color:var(--copper);letter-spacing:.1em;margin-bottom:14px}
      .about-bio__lead{font-size:15px;color:var(--txt);line-height:1.75;margin-bottom:14px;font-weight:400}
      .about-bio__body{font-size:13px;color:var(--soft);line-height:1.9;margin-bottom:12px;font-weight:300}
      .hl{color:var(--green);font-weight:500}
      .journey{margin-bottom:28px}
      .journey__hd{font-family:var(--fm);font-size:10px;color:var(--copper);letter-spacing:.1em;margin-bottom:18px}
      .jnode{display:flex;gap:12px;align-items:flex-start}
      .jnode__spine{display:flex;flex-direction:column;align-items:center;width:12px;flex-shrink:0}
      .jnode__via{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:3px}
      .jnode__trace{width:1px;flex:1;min-height:22px;background:rgba(184,115,51,.2);margin:3px 0}
      .jnode__body{display:flex;flex-direction:column;gap:1px;padding-bottom:14px}
      .jnode__yr{font-family:var(--fm);font-size:9px;letter-spacing:.08em}
      .jnode__ev{font-size:13px;color:var(--txt);font-weight:500;margin-top:2px}
      .jnode__pl{font-size:11px;color:var(--soft)}
      .about-btns{display:flex;gap:10px;flex-wrap:wrap}

      /* CONTACT */
      .contact-layout{display:grid;grid-template-columns:1fr 1.5fr;gap:44px}
      .contact-status{display:flex;align-items:center;gap:10px;margin-bottom:16px}
      .contact-status__led{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 10px rgba(0,255,65,.6);animation:ledBlink 1.5s ease infinite;flex-shrink:0}
      .contact-status__text{font-family:var(--fm);font-size:10px;color:var(--green);letter-spacing:.1em}
      .contact-info__desc{font-size:13px;color:var(--soft);line-height:1.8;margin-bottom:22px;font-weight:300}
      .contact-chs{display:flex;flex-direction:column;gap:6px}
      .ch{display:flex;align-items:center;gap:10px;background:rgba(0,20,0,.7);border:1px solid rgba(184,115,51,.15);border-radius:var(--rad);padding:11px 12px;text-align:left;width:100%;transition:all .2s}
      .ch:hover{border-color:rgba(0,255,65,.3);background:rgba(0,255,65,.04);transform:translateX(4px)}
      .ch__icon{font-size:14px;color:var(--copper);width:18px;text-align:center;flex-shrink:0}
      .ch__k{font-family:var(--fm);font-size:9px;color:var(--copper);letter-spacing:.1em;min-width:72px}
      .ch__sep{font-family:var(--fm);font-size:10px;color:var(--muted)}
      .ch__v{font-family:var(--fm);font-size:11px;color:var(--txt);flex:1}
      .ch__arr{color:var(--green);font-size:12px;opacity:0;transition:opacity .2s;flex-shrink:0}
      .ch:hover .ch__arr{opacity:1}
      .cform{background:rgba(0,12,0,.9);border:1px solid rgba(184,115,51,.2);border-radius:var(--rad);padding:26px}
      .cform__hd{display:flex;justify-content:space-between;align-items:center;font-family:var(--fm);font-size:10px;color:var(--copper);letter-spacing:.1em;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid rgba(184,115,51,.12)}
      .cform__status-led{width:7px;height:7px;border-radius:50%;background:var(--soft);transition:all .3s}
      .cform__status-led--blink{background:var(--amber);animation:ledBlink .4s ease infinite}
      .cform__status-led--green{background:var(--green);box-shadow:0 0 8px var(--green)}
      .cform__row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .cfield{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
      .cfield__lbl{font-family:var(--fm);font-size:9px;color:var(--soft);letter-spacing:.12em;display:flex;align-items:center;gap:6px}
      .cfield__err{color:#FF4444;font-size:8px}
      .cfield__inp{background:rgba(0,255,65,.03);border:1px solid rgba(184,115,51,.18);border-radius:var(--rad);padding:10px 13px;color:var(--txt);font-family:var(--fm);font-size:12px;outline:none;resize:none;transition:all .2s;width:100%;letter-spacing:.03em}
      .cfield__inp:focus{border-color:rgba(0,255,65,.4);background:rgba(0,255,65,.05);box-shadow:0 0 16px rgba(0,255,65,.05)}
      .cfield__inp::placeholder{color:var(--muted)}
      .cfield__inp--err{border-color:rgba(255,68,68,.4)}
      .cfield__ta{min-height:110px}
      .btn-tx{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;font-family:var(--fm);font-size:11px;letter-spacing:.12em;padding:13px 20px;border-radius:var(--rad);background:var(--green);color:#000;font-weight:700;position:relative;overflow:hidden;transition:all .25s;box-shadow:0 0 20px rgba(0,255,65,.15)}
      .btn-tx__trace{position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transform:translateX(-100%);animation:traceFlow 2.5s infinite}
      .btn-tx__led{width:7px;height:7px;border-radius:50%;background:#005500;flex-shrink:0;position:relative;z-index:1}
      .btn-tx__led--blink{background:var(--amber);animation:ledBlink .4s ease infinite}
      .btn-tx__led--green{background:#003300;box-shadow:0 0 8px #003300}
      .btn-tx span:not(.btn-tx__trace):not(.btn-tx__led){position:relative;z-index:1}
      .btn-tx:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,255,65,.3)}
      .btn-tx--sending{opacity:.7}
      .btn-tx--ack{background:linear-gradient(135deg,#059669,#047857);box-shadow:0 0 20px rgba(5,150,105,.2)}

      /* FOOTER */
      .footer{position:relative;z-index:1;background:rgba(0,5,0,.9)}
      .footer__trace-top{height:1px;background:linear-gradient(90deg,transparent,var(--copper),transparent)}
      .footer__inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;padding:18px var(--gutter)}
      .footer__brand{font-family:var(--fh);font-size:16px;color:var(--green);letter-spacing:.14em;display:flex;align-items:center;gap:8px;transition:opacity .2s;text-shadow:0 0 16px rgba(0,255,65,.3)}
      .footer__brand:hover{opacity:.7}
      .footer__brand-led{width:6px;height:6px;border-radius:50%;background:var(--green);animation:ledBlink 2s ease infinite}
      .footer__nav{display:flex;gap:4px;flex-wrap:wrap}
      .footer__link{font-family:var(--fm);font-size:10px;color:var(--soft);letter-spacing:.1em;padding:4px 10px;border:1px solid transparent;border-radius:var(--rad);transition:all .2s}
      .footer__link:hover{color:var(--copper);border-color:rgba(184,115,51,.25)}
      .footer__socials{display:flex;gap:6px}
      .footer__social{width:32px;height:32px;border-radius:var(--rad);background:rgba(184,115,51,.06);border:1px solid rgba(184,115,51,.2);color:var(--soft);font-family:var(--fm);font-size:10px;display:flex;align-items:center;justify-content:center;transition:all .2s}
      .footer__social:hover{background:rgba(0,255,65,.08);border-color:var(--green);color:var(--green);transform:translateY(-2px)}
      .footer__copy{font-family:var(--fm);font-size:9px;color:var(--muted);letter-spacing:.06em;width:100%;text-align:center;padding-bottom:12px}
      .back-top{position:fixed;bottom:26px;right:26px;width:42px;height:42px;background:var(--green);color:#000;font-family:var(--fh);font-size:16px;font-weight:700;border-radius:var(--rad);box-shadow:0 0 20px rgba(0,255,65,.35);transition:all .25s;animation:popIn .3s ease;z-index:150;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,255,65,.3)}
      .back-top:hover{transform:translateY(-4px);box-shadow:0 10px 32px rgba(0,255,65,.5)}

      /* MODAL */
      .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
      .modal{background:#000A00;border:1px solid var(--copper);border-radius:var(--rad);padding:28px;width:100%;max-width:420px;position:relative;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1)}
      .modal__corner{position:absolute;width:12px;height:12px}
      .modal__corner--tl{top:-1px;left:-1px;border-top:2px solid var(--green);border-left:2px solid var(--green)}
      .modal__corner--tr{top:-1px;right:-1px;border-top:2px solid var(--green);border-right:2px solid var(--green)}
      .modal__corner--bl{bottom:-1px;left:-1px;border-bottom:2px solid var(--green);border-left:2px solid var(--green)}
      .modal__corner--br{bottom:-1px;right:-1px;border-bottom:2px solid var(--green);border-right:2px solid var(--green)}
      .modal__hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
      .modal__ref{font-family:var(--fm);font-size:11px;color:var(--green);letter-spacing:.12em}
      .modal__cls{font-family:var(--fm);font-size:12px;color:var(--soft);border:1px solid rgba(184,115,51,.2);padding:4px 10px;border-radius:var(--rad);transition:all .2s}
      .modal__cls:hover{border-color:red;color:red}
      .modal__row{display:flex;align-items:center;gap:12px;background:rgba(0,255,65,.03);border:1px solid rgba(184,115,51,.15);border-radius:var(--rad);padding:12px 14px;margin-bottom:7px;width:100%;text-align:left;transition:all .2s}
      .modal__row:hover{border-color:var(--copper);background:rgba(184,115,51,.06);transform:translateX(4px)}
      .modal__row-ref{font-family:var(--fm);font-size:9px;color:var(--copper);min-width:22px;letter-spacing:.06em}
      .modal__row-body{flex:1;display:flex;flex-direction:column;gap:2px}
      .modal__row-l{font-family:var(--fm);font-size:11px;color:var(--txt);letter-spacing:.08em}
      .modal__row-s{font-size:10px;color:var(--soft)}
      .modal__row-arr{color:var(--green);font-size:14px;flex-shrink:0}

      /* KEYFRAMES */
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes dropIn{from{opacity:0;transform:translateY(-24px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
      @keyframes popIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
      @keyframes blink{50%{opacity:0}}
      @keyframes ledBlink{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes spinRing{to{transform:rotate(360deg)}}
      @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
      @keyframes fillBar{to{width:var(--w,100%)}}
      @keyframes traceFlow{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
      @keyframes clickRing{0%{transform:translate(-50%,-50%) scale(0);opacity:1;width:4px;height:4px}100%{transform:translate(-50%,-50%) scale(1);opacity:0;width:40px;height:40px;border-radius:50%;background:transparent;border:1px solid var(--green)}}
      @keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

      /* RESPONSIVE */
      @media(max-width:1100px){.skills-layout{grid-template-columns:160px 1fr}.schematic{display:none}}
      @media(max-width:900px){
        .hero{grid-template-columns:1fr}.hero__right,.hero__depth{display:none}
        .nav__list{display:none;flex-direction:column;position:absolute;top:58px;left:0;right:0;background:rgba(0,8,0,.97);padding:14px;border-bottom:1px solid rgba(184,115,51,.2);z-index:100}
        .nav__list--open{display:flex}
        .nav__ham{display:block}.nav__volt,.nav__clock{display:none}
        .about-layout{grid-template-columns:1fr}
        .contact-layout{grid-template-columns:1fr}
        .skills-layout{grid-template-columns:1fr}
        .cform__row{grid-template-columns:1fr}
        .proj-grid{grid-template-columns:1fr}
        .pcard__metrics{grid-template-columns:repeat(2,1fr)}
      }
      @media(max-width:500px){.hero__name{font-size:60px}.back-top{bottom:14px;right:14px}}
      @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms !important;transition-duration:.01ms !important}}
    `}</style>

    <CrosshairCursor/>
    <PCBCanvas/>
    {!booted && <Boot onDone={() => setBooted(true)} />}
    <Nav/>
    <main>
      <Hero/>
      <Ticker/>
      <Projects/>
      <Skills/>
      <About/>
      <Contact/>
    </main>
    <Footer/>
  </>);
}
