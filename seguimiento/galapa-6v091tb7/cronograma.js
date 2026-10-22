/* Cronograma de obra de NMH Engineering.
   Lee cronograma-ejecutado.xlsx (misma carpeta) y dibuja los indicadores, la curva de avance y el Gantt.
   En la hoja: número = avance ejecutado del ítem en la semana; P = semana programada. */
(function () {
  "use strict";

  var FILE = "cronograma-ejecutado.xlsx";
  var DEFAULT_META = 0.45;
  var DEFAULT_META_DATE = Date.UTC(2026, 10, 7);
  var DAY = 86400000;
  var WEEK = 7 * DAY;
  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var ACRONIMOS = { AC: 1, DC: 1, AWG: 1, ASTM: 1, BMS: 1, DPS: 1, GFCI: 1, IMC: 1, EMT: 1, LED: 1, PSI: 1, PVC: 1, CPVC: 1,
    SCH: 1, SMAW: 1, ABC: 1, RETIE: 1, RETILAP: 1, NSR: 1, NTC: 1, UPS: 1, PEAD: 1, HDPE: 1, MPPT: 1, TV: 1 };
  var ESPECIALES = { MPA: "MPa", PINTUCO: "Pintuco", KW: "kW", KWP: "kWp" };

  var $ = function (id) { return document.getElementById(id); };
  var pct1 = new Intl.NumberFormat("es-CO", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var pct0 = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 0 });
  var num1 = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var D; // datos calculados

  // ---------------- utilidades ----------------
  function norm(s) {
    return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toUpperCase().replace(/\s+/g, " ").trim();
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function svgEl(tag, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function pct(v, digits) { return (digits === 0 ? pct0 : pct1).format(v); }
  function pp(v) { return num1.format(v * 100) + " puntos"; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dm(t) { var d = new Date(t); return pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1); }
  function dmy(t) { return dm(t) + "/" + new Date(t).getUTCFullYear(); }
  function clip(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; }

  /** Convierte un nombre en mayúsculas a tipo oración, conservando siglas y medidas. */
  function smartCase(s) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    var letters = s.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, "");
    var upper = letters.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, "").length;
    if (!letters.length || upper / letters.length < 0.7) return s;
    var out = s.replace(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9#./"'-]+/g, function (w) {
      var core = w.replace(/[.,;:]+$/, "");
      var tail = w.slice(core.length);
      if (/\d/.test(core)) return w;
      var parts = core.split("/");
      if (parts.every(function (p) { return ACRONIMOS[norm(p)]; })) return w;
      if (ESPECIALES[norm(core)]) return ESPECIALES[norm(core)] + tail;
      return w.toLowerCase();
    });
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  function serialToUTC(n) { return (Math.floor(n) - 25569) * DAY; }
  function toDate(v, year) {
    if (v == null || v === "") return null;
    if (v instanceof Date) return Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
    if (typeof v === "number") return v > 20000 && v < 80000 ? serialToUTC(v) : null;
    var m = /^\s*(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\s*$/.exec(String(v));
    if (!m) return null;
    var y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : year;
    if (!y) return null;
    return Date.UTC(y, +m[2] - 1, +m[1]);
  }
  function toNum(v) {
    if (typeof v === "number" && isFinite(v)) return v;
    if (typeof v !== "string") return null;
    var s = v.trim();
    var isPct = /%$/.test(s);
    s = s.replace(/%$/, "").trim().replace(/\s/g, "");
    if (!/^-?\d+([.,]\d+)?$/.test(s)) return null;
    var n = parseFloat(s.replace(",", "."));
    return isPct ? n / 100 : n;
  }
  function asFraction(n) {
    if (n == null || !(n > 0)) return null;
    return n > 1.0001 && n <= 100 ? n / 100 : n;
  }

  // ---------------- lectura del Excel ----------------
  function parse(wb) {
    var sheetName = wb.SheetNames.filter(function (n) { return /EJECUTAD/.test(norm(n)); })[0] || wb.SheetNames[0];
    var ws = wb.Sheets[sheetName];
    if (!ws || !ws["!ref"]) throw new Error("La hoja del cronograma está vacía.");
    var range = XLSX.utils.decode_range(ws["!ref"]);
    function cell(r, c) { return ws[XLSX.utils.encode_cell({ r: r, c: c })]; }
    function val(r, c) { var x = cell(r, c); return x && x.v !== undefined ? x.v : null; }
    function txt(r, c) {
      var x = cell(r, c);
      if (!x || x.v == null) return "";
      if (x.t === "s" || x.t === "str") return String(x.v);
      return x.w != null ? String(x.w) : String(x.v);
    }

    // Encabezado: fila con la celda ÍTEM
    var hr = -1, cItem = -1;
    for (var r = range.s.r; r <= Math.min(range.e.r, 80) && hr < 0; r++) {
      for (var c = range.s.c; c <= Math.min(range.e.c, 60); c++) {
        if (norm(txt(r, c)) === "ITEM") { hr = r; cItem = c; break; }
      }
    }
    if (hr < 0) throw new Error("No se encontró la fila de encabezados (la celda «ÍTEM»).");
    var cAct = -1, cW = -1, cDur = -1, wcols = [];
    for (c = range.s.c; c <= range.e.c; c++) {
      var h = norm(txt(hr, c));
      if (!h) continue;
      if (cAct < 0 && /^(ACTIVIDAD|DESCRIPCION)/.test(h)) cAct = c;
      else if (cW < 0 && /INC|PESO/.test(h)) cW = c;
      else if (cDur < 0 && /^DUR/.test(h)) cDur = c;
      else if (/^S\s*\d+/.test(h)) wcols.push(c);
    }
    if (cAct < 0) cAct = cItem + 1;
    if (!wcols.length) throw new Error("No se encontraron las columnas de semanas (S1, S2, …).");

    // Fechas de inicio de semana (fila anterior al encabezado)
    var raw = wcols.map(function (c) { return val(hr - 1, c); });
    var year = null;
    raw.forEach(function (v) { var t = typeof v === "number" ? toDate(v) : null; if (t && !year) year = new Date(t).getUTCFullYear(); });
    var starts = raw.map(function (v) { return toDate(v, year || new Date().getFullYear()); });
    var firstKnown = starts.findIndex(function (t) { return t != null; });
    if (firstKnown < 0) throw new Error("No se encontraron las fechas de las semanas sobre los encabezados S1, S2, ….");
    for (var i = 0; i < starts.length; i++) if (starts[i] == null) starts[i] = starts[firstKnown] + (i - firstKnown) * WEEK;
    var n = wcols.length;
    var ends = starts.map(function (t, i) { return i + 1 < n ? starts[i + 1] : t + WEEK; });

    // Ajustes encima de la tabla
    var cfg = { project: "", cut: null, meta: null, metaDate: null };
    function right(r, c, kind) {
      for (var cc = c + 1; cc <= Math.min(range.e.c, c + 18); cc++) {
        var x = cell(r, cc);
        if (!x || x.v == null || x.v === "") continue;
        if (kind === "text") return txt(r, cc);
        if (kind === "date") return toDate(x.v, year);
        if (kind === "num") return toNum(x.v);
      }
      return null;
    }
    for (r = range.s.r; r < hr; r++) {
      for (c = range.s.c; c <= range.e.c; c++) {
        var lab = norm(txt(r, c));
        if (!lab) continue;
        if (/^FECHA DE CORTE/.test(lab)) cfg.cut = right(r, c, "date");
        else if (/^FECHA (DE (LA )?)?META/.test(lab)) cfg.metaDate = right(r, c, "date");
        else if (/^META/.test(lab)) cfg.meta = right(r, c, "num");
        else if (/^PROYECTO$|^PROYECTO /.test(lab)) cfg.project = right(r, c, "text") || "";
      }
    }

    // Capítulos, ítems y línea base
    var chapters = [], items = [], cur = null, baseCum = null, baseWeek = null;
    for (r = hr + 1; r <= range.e.r; r++) {
      var code = txt(r, cItem).trim();
      if (/^\d+$/.test(code)) {
        cur = { code: code, name: smartCase(txt(r, cAct)), items: [], open: true };
        chapters.push(cur);
        continue;
      }
      if (/^\d+(\.\d+)+$/.test(code)) {
        if (!cur) { cur = { code: "", name: "Actividades", items: [], open: true }; chapters.push(cur); }
        var cells = wcols.map(function (c) {
          var v = val(r, c);
          if (typeof v === "string" && norm(v) === "P") return { p: 1 };
          var f = asFraction(toNum(v));
          return f ? { x: f } : null;
        });
        var it = {
          code: code, name: smartCase(txt(r, cAct)), ch: cur,
          wRaw: cW >= 0 ? toNum(val(r, cW)) : null,
          dur: cDur >= 0 ? toNum(val(r, cDur)) : null,
          cells: cells
        };
        cur.items.push(it);
        items.push(it);
        continue;
      }
      var label = norm(txt(r, cItem) + " " + txt(r, cAct) + " " + txt(r, cAct + 1));
      if (/PROGRAMAD/.test(label)) {
        var vals = wcols.map(function (c) { return asFraction(toNum(val(r, c))) || 0; });
        if (/ACUM/.test(label)) baseCum = vals;
        else if (/SEMANAL|PARCIAL/.test(label)) baseWeek = vals;
      }
    }
    if (!items.length) throw new Error("No se encontraron ítems (códigos como 1.1, 1.2, …) en la columna ÍTEM.");
    if (!baseCum && baseWeek) {
      var a = 0;
      baseCum = baseWeek.map(function (v) { a += v; return a; });
    }
    if (baseCum && !baseCum.some(function (v) { return v > 0; })) baseCum = null;

    return { sheet: sheetName, n: n, starts: starts, ends: ends, cfg: cfg, chapters: chapters, items: items, baseCum: baseCum };
  }

  // ---------------- cálculos ----------------
  function compute(P) {
    var n = P.n, items = P.items;
    var tot = items.reduce(function (s, it) { return s + (it.wRaw > 0 ? it.wRaw : 0); }, 0);
    var equal = !(tot > 0);
    items.forEach(function (it) { it.w = equal ? 1 / items.length : (it.wRaw > 0 ? it.wRaw / tot : 0); });

    function weekOf(t) {
      if (t == null) return -1;
      if (t < P.starts[0]) return -1;
      for (var k = n - 1; k >= 0; k--) if (t >= P.starts[k]) return k;
      return -1;
    }
    function xOf(t) {
      if (t <= P.starts[0]) return 0;
      for (var k = 0; k < n; k++) {
        if (t < P.ends[k]) return k + (t - P.starts[k]) / (P.ends[k] - P.starts[k]);
      }
      return n;
    }

    var lastExe = -1;
    items.forEach(function (it) {
      it.exe = 0;
      it.cells.forEach(function (c, k) { if (c && c.x) { it.exe += c.x; if (k > lastExe) lastExe = k; } });
    });
    var cut = Math.max(lastExe, Math.min(weekOf(P.cfg.cut), n - 1));
    var cutEndT = cut >= 0 ? P.ends[cut] : P.starts[0];

    // Avance ejecutado acumulado por semana
    var weekExe = new Array(n).fill(0);
    items.forEach(function (it) { it.cells.forEach(function (c, k) { if (c && c.x) weekExe[k] += it.w * c.x; }); });
    var E = [], acc = 0;
    for (var k = 0; k < n; k++) { acc += weekExe[k]; E.push(acc); }
    var eCut = cut >= 0 ? E[cut] : 0;

    // Proyección: lo que falta de cada ítem se reparte en sus semanas P posteriores al corte
    var add = new Array(n).fill(0), unplanned = 0, unplannedItems = 0, overItems = 0;
    items.forEach(function (it) {
      var rem = Math.max(0, 1 - it.exe);
      if (it.exe > 1.0001) overItems++;
      var fut = [];
      for (var k = cut + 1; k < n; k++) if (it.cells[k] && it.cells[k].p) fut.push(k);
      it.futureP = fut.length;
      if (rem > 1e-9 && !fut.length) { unplanned += it.w * rem; unplannedItems++; }
      fut.forEach(function (k) { add[k] += it.w * rem / fut.length; });
      if (it.exe < 0.9999) it.cells.forEach(function (c, k) { if (c && c.p && k <= cut) c.late = 1; });
    });
    var proj = new Array(n).fill(null), pa = eCut, hasProj = false;
    for (k = cut + 1; k < n; k++) { pa += add[k]; proj[k] = pa; if (add[k] > 0) hasProj = true; }

    // Capítulos
    P.chapters.forEach(function (ch) {
      ch.w = ch.items.reduce(function (s, it) { return s + it.w; }, 0);
      ch.exe = ch.w > 0 ? ch.items.reduce(function (s, it) { return s + it.w * it.exe; }, 0) / ch.w : 0;
      ch.cells = [];
      for (var k = 0; k < n; k++) {
        var x = 0, p = 0, l = 0, share = 0;
        ch.items.forEach(function (it) {
          var c = it.cells[k];
          if (!c) return;
          if (c.x) { x++; share += it.w * c.x; } else if (c.late) l++; else if (c.p) p++;
        });
        ch.cells.push({ x: x, p: p, l: l, share: ch.w > 0 ? share / ch.w : 0 });
      }
    });

    var meta = asFraction(P.cfg.meta);
    if (meta == null) meta = DEFAULT_META;
    var metaDate = P.cfg.metaDate || DEFAULT_META_DATE;
    var metaT = metaDate + DAY; // al final del día de la meta
    var metaX = xOf(metaT), cutX = cut + 1;

    // Interpolación lineal entre puntos [x, valor]; los acumulados se ubican al final de cada semana.
    function interp(pts, x) {
      if (!pts.length) return null;
      if (x <= pts[0][0]) return pts[0][1];
      for (var i = 1; i < pts.length; i++) {
        if (x <= pts[i][0]) {
          var a = pts[i - 1], b = pts[i];
          return a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) || 1);
        }
      }
      return pts[pts.length - 1][1];
    }
    var projPts = [[cutX, eCut]];
    for (k = cut + 1; k < n; k++) projPts.push([k + 1, proj[k]]);
    var projMeta = metaX > cutX && hasProj ? interp(projPts, metaX) : null;
    var baseCutV = P.baseCum && cut >= 0 ? P.baseCum[cut] : null;
    var weeksToMeta = (metaT - cutEndT) / WEEK;

    var done = 0, running = 0, notStarted = 0;
    items.forEach(function (it) {
      if (it.exe >= 0.9999) done++; else if (it.exe > 0) running++; else notStarted++;
    });

    return {
      n: n, cut: cut, cutX: cutX, cutEndT: cutEndT, E: E, eCut: eCut, proj: proj, hasProj: hasProj,
      unplanned: unplanned, unplannedItems: unplannedItems, overItems: overItems, equal: equal,
      meta: meta, metaDate: metaDate, metaX: metaX, projMeta: projMeta, baseCutV: baseCutV,
      weeksToMeta: weeksToMeta, done: done, running: running, notStarted: notStarted, xOf: xOf
    };
  }

  // ---------------- indicadores ----------------
  function kpi(label, value, sub, key) {
    var box = el("div", "kpi");
    box.appendChild(el("p", "k", label));
    var v = el("p", "v");
    if (key) v.appendChild(el("i", key));
    v.appendChild(document.createTextNode(value));
    box.appendChild(v);
    if (sub) {
      var s = el("p", "s");
      sub.forEach(function (part) {
        if (typeof part === "string") s.appendChild(document.createTextNode(part));
        else s.appendChild(el("strong", null, part.b));
      });
      box.appendChild(s);
    }
    return box;
  }

  function renderKpis() {
    var C = D.C, P = D.P, box = $("kpis");
    box.textContent = "";
    var cutTxt = C.cut >= 0 ? "semana " + (C.cut + 1) + ", del " + dm(P.starts[C.cut]) + " al " + dm(C.cutEndT - DAY) : "sin avance registrado";
    box.appendChild(kpi("Avance ejecutado", pct(C.eCut), ["Al corte: " + cutTxt + "."], "k-exe"));
    if (C.baseCutV != null) {
      var diff = C.eCut - C.baseCutV;
      box.appendChild(kpi("Avance programado al corte", pct(C.baseCutV),
        ["Diferencia: ", { b: (diff >= 0 ? "+" : "−") + pp(Math.abs(diff)) }, "."], "k-prg"));
    }
    var falta = C.meta - C.eCut;
    var subMeta = falta > 0
      ? ["Faltan ", { b: pp(falta) }, C.weeksToMeta > 0 ? ": " + num1.format(falta * 100 / C.weeksToMeta) + " puntos por semana desde el corte." : "."]
      : ["Meta alcanzada al corte."];
    box.appendChild(kpi("Meta al " + dmy(C.metaDate), pct(C.meta, 0), subMeta, "k-meta"));
    if (C.projMeta != null) {
      box.appendChild(kpi("Proyección al " + dm(C.metaDate), pct(C.projMeta),
        [C.projMeta >= C.meta ? "Si se cumplen las semanas P, se alcanza la meta." : "Con las semanas P actuales, queda por debajo de la meta."], "k-proj"));
    }
  }

  // ---------------- curva de avance ----------------
  var tip = null;
  function showTip(nodes, x, y) {
    tip.textContent = "";
    nodes.forEach(function (nd) { tip.appendChild(nd); });
    tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = x + 14, top = y + 14;
    if (left + w > window.innerWidth - 8) left = Math.max(8, x - w - 14);
    if (top + h > window.innerHeight - 8) top = Math.max(8, y - h - 14);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; }
  function tipRow(value, label, color, dashed) {
    var r = el("div", "t-r");
    var k = el("span", "t-k");
    k.style.borderTopColor = color || "transparent";
    if (dashed) k.style.borderTopStyle = "dashed";
    r.appendChild(k);
    r.appendChild(el("b", null, value));
    r.appendChild(el("span", null, label));
    return r;
  }

  function renderCurve() {
    var C = D.C, P = D.P, n = C.n, host = $("curva");
    var css = getComputedStyle(document.documentElement);
    var col = { exe: css.getPropertyValue("--exe").trim(), prg: css.getPropertyValue("--prg").trim(), fg: css.getPropertyValue("--fg").trim() };
    var W = Math.max(300, host.clientWidth - 12);
    var narrow = W < 560;
    var H = narrow ? 280 : 340;
    var m = { l: 46, r: narrow ? 14 : 24, t: 26, b: 34 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b;
    function X(x) { return m.l + (x / n) * pw; }
    function Y(v) { return m.t + (1 - Math.min(Math.max(v, 0), 1.05)) * ph; }

    host.textContent = "";
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", tabindex: "0",
      "aria-label": "Curva de avance. Ejecutado " + pct(C.eCut) + " al corte. Meta " + pct(C.meta, 0) + " al " + dmy(C.metaDate) + ". Use las flechas para recorrer las semanas." });
    var ax = svgEl("g", { "class": "ax" });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      ax.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }));
      var t = svgEl("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end" });
      t.textContent = pct(v, 0);
      ax.appendChild(t);
    });
    // Meses en el eje X
    var d0 = new Date(P.starts[0]), lastT = P.ends[n - 1];
    var mt = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1);
    for (; mt < lastT; mt = Date.UTC(new Date(mt).getUTCFullYear(), new Date(mt).getUTCMonth() + 1, 1)) {
      var mx = X(C.xOf(mt));
      ax.appendChild(svgEl("line", { x1: mx, x2: mx, y1: H - m.b, y2: H - m.b + 6 }));
      var lt = svgEl("text", { x: mx + 4, y: H - m.b + 20 });
      lt.textContent = MESES[new Date(mt).getUTCMonth()];
      ax.appendChild(lt);
    }
    ax.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }));
    svg.appendChild(ax);

    function path(pts, cls) {
      if (pts.length < 2) return;
      svg.appendChild(svgEl("path", { "class": "ln " + cls, d: pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join("") }));
    }
    // Corte y guía de la meta
    if (C.cut >= 0) {
      svg.appendChild(svgEl("line", { "class": "cutline", x1: X(C.cutX), x2: X(C.cutX), y1: m.t - 6, y2: H - m.b }));
      var ct = svgEl("text", { "class": "lbl-m", x: X(C.cutX), y: m.t - 12, "text-anchor": "middle" });
      ct.textContent = "Corte " + dm(C.cutEndT - DAY);
      svg.appendChild(ct);
    }
    svg.appendChild(svgEl("line", { "class": "guide", x1: m.l, x2: X(C.metaX), y1: Y(C.meta), y2: Y(C.meta) }));
    svg.appendChild(svgEl("line", { "class": "guide", x1: X(C.metaX), x2: X(C.metaX), y1: Y(C.meta), y2: H - m.b }));

    var base = [[0, 0]], exe = [[0, 0]], proj = [];
    if (P.baseCum) P.baseCum.forEach(function (v, k) { base.push([k + 1, v]); });
    for (var k = 0; k <= C.cut; k++) exe.push([k + 1, C.E[k]]);
    if (C.hasProj) { proj.push([C.cutX, C.eCut]); for (k = C.cut + 1; k < n; k++) proj.push([k + 1, C.proj[k]]); }
    if (P.baseCum) path(base, "prg");
    path(proj, "proj");
    if (C.metaX > C.cutX) path([[C.cutX, C.eCut], [C.metaX, C.meta]], "obj");
    path(exe, "exe");

    // Punto final del ejecutado y meta, con etiquetas directas
    var ex = X(C.cutX), ey = Y(C.eCut);
    svg.appendChild(svgEl("circle", { "class": "dot-exe", cx: ex, cy: ey, r: 5 }));
    var el1 = svgEl("text", { "class": "lbl", x: ex + 9, y: ey + 20 });
    el1.textContent = pct(C.eCut);
    svg.appendChild(el1);
    var mxp = X(C.metaX), myp = Y(C.meta), s = 7;
    svg.appendChild(svgEl("path", { "class": "dia", d: "M" + mxp + " " + (myp - s) + "L" + (mxp + s) + " " + myp + "L" + mxp + " " + (myp + s) + "L" + (mxp - s) + " " + myp + "Z" }));
    var anchorEnd = mxp + 12 + 90 > W - m.r;
    var lx = anchorEnd ? W - m.r : mxp + 12;
    var ml = svgEl("text", { "class": "lbl", x: lx, y: myp + 22, "text-anchor": anchorEnd ? "end" : "start" });
    ml.textContent = "Meta " + pct(C.meta, 0);
    svg.appendChild(ml);
    var md = svgEl("text", { "class": "lbl-m", x: lx, y: myp + 38, "text-anchor": anchorEnd ? "end" : "start" });
    md.textContent = dmy(C.metaDate);
    svg.appendChild(md);

    // Capa de lectura: línea vertical que se ajusta a la semana más cercana
    var xh = svgEl("line", { "class": "xh", x1: 0, x2: 0, y1: m.t, y2: H - m.b, visibility: "hidden" });
    var dots = svgEl("g", { visibility: "hidden" });
    svg.appendChild(xh);
    svg.appendChild(dots);
    var hit = svgEl("rect", { x: m.l, y: m.t - 10, width: pw, height: ph + 10, fill: "transparent" });
    svg.appendChild(hit);
    host.appendChild(svg);

    function objAt(x) {
      if (!(C.metaX > C.cutX) || x < C.cutX || x > C.metaX) return null;
      return C.eCut + (C.meta - C.eCut) * (x - C.cutX) / (C.metaX - C.cutX);
    }
    var curK = null;
    function readout(kk, cx, cy) {
      curK = kk;
      var px = X(kk);
      xh.setAttribute("x1", px); xh.setAttribute("x2", px);
      xh.setAttribute("visibility", "visible");
      dots.textContent = "";
      var rows = [];
      var head = el("div", "t-h", kk === 0 ? "Inicio · " + dm(P.starts[0]) : "Semana " + kk + " · " + dm(P.starts[kk - 1]) + " al " + dm(P.ends[kk - 1] - DAY));
      rows.push(head);
      function dot(v, color) { dots.appendChild(svgEl("circle", { "class": "xh-dot", cx: px, cy: Y(v), r: 4, fill: color })); }
      if (kk === 0) rows.push(tipRow(pct(0), "Ejecutado", col.exe));
      else if (kk - 1 <= C.cut) { rows.push(tipRow(pct(C.E[kk - 1]), "Ejecutado", col.exe)); dot(C.E[kk - 1], col.exe); }
      else if (C.hasProj) { rows.push(tipRow(pct(C.proj[kk - 1]), "Proyección según P", col.exe, true)); dot(C.proj[kk - 1], col.exe); }
      if (P.baseCum) { var b = kk === 0 ? 0 : P.baseCum[kk - 1]; rows.push(tipRow(pct(b), "Programado (línea base)", col.prg)); dot(b, col.prg); }
      var o = objAt(kk);
      if (o != null && kk > C.cutX) rows.push(tipRow(pct(o), "Línea objetivo", col.fg, true));
      dots.setAttribute("visibility", "visible");
      var box = svg.getBoundingClientRect();
      showTip(rows, cx != null ? cx : box.left + px * box.width / W, cy != null ? cy : box.top + m.t * box.height / H);
    }
    function clear() { xh.setAttribute("visibility", "hidden"); dots.setAttribute("visibility", "hidden"); hideTip(); curK = null; }
    function fromEvent(e) {
      var box = svg.getBoundingClientRect();
      var sx = (e.clientX - box.left) * W / box.width;
      return Math.max(0, Math.min(n, Math.round((sx - m.l) / pw * n)));
    }
    svg.addEventListener("pointermove", function (e) { readout(fromEvent(e), e.clientX, e.clientY); });
    svg.addEventListener("pointerdown", function (e) { readout(fromEvent(e), e.clientX, e.clientY); });
    svg.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") clear(); });
    svg.addEventListener("blur", clear);
    svg.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      var k0 = curK == null ? C.cutX : curK;
      if (e.key === "ArrowRight") k0 = Math.min(n, k0 + 1);
      if (e.key === "ArrowLeft") k0 = Math.max(0, k0 - 1);
      if (e.key === "Home") k0 = 0;
      if (e.key === "End") k0 = n;
      readout(k0);
    });
  }

  function renderCurveTable() {
    var C = D.C, P = D.P, t = $("curva-tabla");
    t.textContent = "";
    var thead = el("thead"), hr = el("tr");
    ["Semana", "Del", "Programado", "Ejecutado", "Proyección P"].forEach(function (h) { var th = el("th", null, h); th.scope = "col"; hr.appendChild(th); });
    thead.appendChild(hr);
    t.appendChild(thead);
    var tb = el("tbody");
    for (var k = 0; k < C.n; k++) {
      var tr = el("tr");
      tr.appendChild(el("td", null, "S" + (k + 1)));
      tr.appendChild(el("td", null, dm(P.starts[k]) + " al " + dm(P.ends[k] - DAY)));
      tr.appendChild(el("td", null, P.baseCum ? pct(P.baseCum[k]) : "—"));
      tr.appendChild(el("td", null, k <= C.cut ? pct(C.E[k]) : "—"));
      tr.appendChild(el("td", null, k > C.cut && C.hasProj ? pct(C.proj[k]) : "—"));
      tb.appendChild(tr);
    }
    t.appendChild(tb);
  }

  function renderNote() {
    var C = D.C, note = $("curva-nota");
    note.textContent = "";
    var parts = [];
    if (C.unplanned > 0.00005) {
      parts.push([{ b: pct(C.unplanned) }, " del alcance total (" + C.unplannedItems + (C.unplannedItems === 1 ? " ítem" : " ítems") + ") está pendiente y no tiene semanas P después del corte; por eso la proyección no llega al 100%."]);
    }
    if (!C.hasProj) parts.push(["No hay semanas P después del corte, así que no se dibuja la proyección."]);
    if (C.equal) parts.push(["La hoja no tiene la columna de pesos (% INC.): todos los ítems pesan lo mismo."]);
    if (C.overItems) parts.push([{ b: String(C.overItems) }, C.overItems === 1 ? " ítem suma más de 100 % de avance; revise la columna Σ del Excel." : " ítems suman más de 100 % de avance; revise la columna Σ del Excel."]);
    parts.forEach(function (p, i) {
      if (i) note.appendChild(document.createTextNode(" "));
      p.forEach(function (x) { note.appendChild(typeof x === "string" ? document.createTextNode(x) : el("strong", null, x.b)); });
    });
    note.hidden = !parts.length;
  }

  // ---------------- Gantt ----------------
  var G = { q: "", ch: "", st: "", values: false, rows: [] };

  function weekLabel(k) { return "Semana " + (k + 1) + " · " + dm(D.P.starts[k]) + " al " + dm(D.P.ends[k] - DAY); }

  function itemSummary(it) {
    var x = [], p = [];
    it.cells.forEach(function (c, k) { if (c && c.x) x.push("S" + (k + 1)); else if (c && c.p) p.push("S" + (k + 1)); });
    return "Avance del ítem " + pct(it.exe, 0) + ". " +
      (x.length ? "Ejecutado en " + x.join(", ") + ". " : "") +
      (p.length ? "Programado en " + p.join(", ") + "." : "");
  }

  function buildGantt() {
    var P = D.P, C = D.C, n = C.n, host = $("gantt");
    host.textContent = "";
    var style = document.getElementById("g-cols") || document.head.appendChild(el("style"));
    style.id = "g-cols";
    style.textContent = ".g-row{grid-template-columns:var(--lw) repeat(" + n + ",var(--cw))}.g-inner{width:calc(var(--lw) + " + n + " * var(--cw))}";

    var inner = el("div", "g-inner");
    var head = el("div", "g-head");
    // Meses
    var months = el("div", "g-row g-months");
    months.appendChild(el("div", "g-left", "Ítem y actividad"));
    var monthStartK = {};
    var k = 0;
    while (k < n) {
      var mo = new Date(P.starts[k]).getUTCMonth(), span = 0, k0 = k;
      while (k < n && new Date(P.starts[k]).getUTCMonth() === mo) { k++; span++; }
      monthStartK[k0] = 1;
      var mc = el("div", null, span >= 2 ? MESES[mo] : "");
      mc.style.gridColumn = "span " + span;
      mc.title = MESES[mo] + " " + new Date(P.starts[k0]).getUTCFullYear();
      months.appendChild(mc);
    }
    head.appendChild(months);
    var days = el("div", "g-row g-days");
    days.appendChild(el("div", "g-left"));
    for (k = 0; k < n; k++) {
      var dc = el("div", null, String(new Date(P.starts[k]).getUTCDate()));
      dc.title = weekLabel(k);
      days.appendChild(dc);
    }
    head.appendChild(days);
    inner.appendChild(head);

    var body = el("div", "g-body");
    G.rows = [];
    P.chapters.forEach(function (ch) {
      var row = el("div", "g-row chap");
      var left = el("div", "g-left");
      var btn = el("button", "g-toggle");
      btn.type = "button";
      btn.setAttribute("aria-expanded", "true");
      btn.appendChild(el("span", "g-caret"));
      btn.lastChild.setAttribute("aria-hidden", "true");
      btn.appendChild(el("span", "g-code", ch.code));
      btn.appendChild(el("span", "g-name", ch.name));
      btn.appendChild(el("span", "g-pct" + (ch.exe > 0 ? "" : " zero"), pct(ch.exe, 0)));
      btn.appendChild(el("span", "vh", ". Peso en el alcance total " + pct(ch.w) + ". Avance del capítulo " + pct(ch.exe, 0) + "."));
      btn.addEventListener("click", function () { ch.open = !ch.open; applyFilters(); });
      left.appendChild(btn);
      left.dataset.tipChap = String(P.chapters.indexOf(ch));
      row.appendChild(left);
      ch.cells.forEach(function (c, k) {
        var cls = c.x ? " x" : c.l ? " l" : c.p ? " p" : "";
        var cell = el("div", "g-c" + cls + (monthStartK[k] ? " m0" : ""));
        if (cls) cell.appendChild(el("i"));
        cell.dataset.k = k;
        row.appendChild(cell);
      });
      row.dataset.chap = String(P.chapters.indexOf(ch));
      body.appendChild(row);
      ch.row = row;
      ch.btn = btn;
      ch.items.forEach(function (it) {
        var r = el("div", "g-row item");
        var l = el("div", "g-left");
        l.appendChild(el("span", "g-code", it.code));
        l.appendChild(el("span", "g-name", it.name));
        var pc = el("span", "g-pct" + (it.exe > 0 ? "" : " zero"), pct(Math.min(it.exe, 9.99), 0));
        if (it.exe > 1.0001) pc.className += " warn";
        l.appendChild(pc);
        l.appendChild(el("span", "vh", ". " + itemSummary(it)));
        l.dataset.tipItem = String(P.items.indexOf(it));
        r.appendChild(l);
        it.cells.forEach(function (c, k) {
          var cls = c ? (c.x ? " x" : c.late ? " l" : " p") : "";
          var cell = el("div", "g-c" + cls + (monthStartK[k] ? " m0" : ""));
          if (c) {
            cell.appendChild(el("i"));
            cell.appendChild(el("b", null, c.x ? String(Math.round(c.x * 100)) : "P"));
          }
          cell.dataset.k = k;
          r.appendChild(cell);
        });
        r.dataset.item = String(P.items.indexOf(it));
        body.appendChild(r);
        it.row = r;
        it.key = norm(it.code + " " + it.name);
      });
      ch.key = norm(ch.code + " " + ch.name);
    });
    // Líneas de corte y meta
    function vline(x, cls) {
      var v = el("div", "g-vline" + (cls ? " " + cls : ""));
      v.style.left = "calc(var(--lw) + " + x.toFixed(4) + " * var(--cw) - 1px)";
      body.appendChild(v);
      return v;
    }
    function mark(x, cls, text, title) {
      var mk = el("div", "g-mark" + (cls ? " " + cls : ""), text);
      mk.style.left = "calc(var(--lw) + " + x.toFixed(4) + " * var(--cw))";
      mk.title = title;
      days.appendChild(mk);
    }
    if (C.cut >= 0) { vline(C.cutX); mark(C.cutX, "", "Corte", "Corte: " + dmy(C.cutEndT - DAY)); }
    if (C.metaX > 0 && C.metaX <= n) { vline(C.metaX, "meta"); mark(C.metaX, "meta", "Meta", "Meta " + pct(C.meta, 0) + " al " + dmy(C.metaDate)); }
    inner.appendChild(body);
    var empty = el("p", "g-empty", "No hay ítems que coincidan con el filtro.");
    empty.hidden = true;
    inner.appendChild(empty);
    G.empty = empty;
    host.appendChild(inner);

    // Detalle al pasar el cursor o tocar
    function detail(target, x, y) {
      var c = target.closest(".g-c, .g-left");
      if (!c || !host.contains(c)) { hideTip(); return; }
      var row = c.closest(".g-row");
      var rows = [];
      if (row.dataset.item != null) {
        var it = P.items[+row.dataset.item];
        rows.push(el("div", "t-h", it.code + " · " + clip(it.name, 160)));
        if (c.classList.contains("g-c")) {
          var kk = +c.dataset.k, cell = it.cells[kk];
          rows.push(el("div", "t-s", weekLabel(kk)));
          if (cell && cell.x) rows.push(tipRow(pct(cell.x, 0), "ejecutado en la semana", getVar("--exe")));
          else if (cell && cell.late) rows.push(tipRow("P", "programado antes del corte; el ítem no está terminado", getVar("--late")));
          else if (cell && cell.p) rows.push(tipRow("P", "semana programada", getVar("--prg")));
          else rows.push(el("div", "t-s", "Sin actividad en esta semana."));
        }
        rows.push(tipRow(pct(it.exe, 0), "avance acumulado del ítem"));
        rows.push(tipRow(pct(it.w, 2), "peso en el alcance total"));
        if (it.dur) rows.push(tipRow(String(Math.round(it.dur)), "días de duración"));
      } else if (row.dataset.chap != null) {
        var ch = P.chapters[+row.dataset.chap];
        rows.push(el("div", "t-h", (ch.code ? "Capítulo " + ch.code + " · " : "") + clip(ch.name, 140)));
        if (c.classList.contains("g-c")) {
          var k2 = +c.dataset.k, s = ch.cells[k2];
          rows.push(el("div", "t-s", weekLabel(k2)));
          if (s.x) rows.push(tipRow(pct(s.share), "del capítulo ejecutado en la semana (" + s.x + (s.x === 1 ? " ítem)" : " ítems)"), getVar("--exe")));
          if (s.p) rows.push(tipRow(String(s.p), s.p === 1 ? "ítem programado" : "ítems programados", getVar("--prg")));
          if (s.l) rows.push(tipRow(String(s.l), s.l === 1 ? "ítem programado antes del corte, sin terminar" : "ítems programados antes del corte, sin terminar", getVar("--late")));
          if (!s.x && !s.p && !s.l) rows.push(el("div", "t-s", "Sin actividad en esta semana."));
        }
        rows.push(tipRow(pct(ch.exe, 0), "avance del capítulo"));
        rows.push(tipRow(pct(ch.w), "peso en el alcance total"));
      } else { hideTip(); return; }
      showTip(rows, x, y);
    }
    host.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") detail(e.target, e.clientX, e.clientY); });
    host.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hideTip(); });
    host.addEventListener("click", function (e) {
      if (e.target.closest(".g-toggle")) return;
      var b = e.target.getBoundingClientRect();
      detail(e.target, e.clientX || b.left, e.clientY || b.bottom);
    });
    host.addEventListener("scroll", hideTip, { passive: true });
  }

  function getVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function applyFilters() {
    var P = D.P, q = norm(G.q), shown = 0, any = false;
    var filtering = !!(q || G.st);
    P.chapters.forEach(function (ch) {
      var inCh = !G.ch || G.ch === ch.code;
      var chMatch = q && ch.key.indexOf(q) >= 0;
      var visibleItems = 0;
      ch.items.forEach(function (it) {
        var ok = inCh;
        if (ok && q && !chMatch) ok = it.key.indexOf(q) >= 0;
        if (ok && G.st === "avance") ok = it.exe > 0;
        if (ok && G.st === "pendiente") ok = it.exe < 0.9999;
        if (ok && G.st === "terminado") ok = it.exe >= 0.9999;
        it.match = ok;
        if (ok) visibleItems++;
      });
      var showCh = inCh && (visibleItems > 0 || (!filtering));
      ch.row.hidden = !showCh;
      var open = filtering ? true : ch.open;
      ch.btn.setAttribute("aria-expanded", String(open));
      ch.items.forEach(function (it) { it.row.hidden = !(showCh && open && it.match); });
      if (showCh) any = true;
      shown += visibleItems;
    });
    G.empty.hidden = any;
    var C = D.C;
    $("g-cuenta").textContent = filtering || G.ch
      ? "Mostrando " + shown + " de " + P.items.length + " ítems."
      : P.items.length + " ítems: " + C.done + " terminados, " + C.running + " en ejecución y " + C.notStarted + " sin iniciar.";
  }

  function wireToolbar() {
    var sel = $("f-capitulo");
    while (sel.options.length > 1) sel.remove(1);
    D.P.chapters.forEach(function (ch) {
      var o = el("option", null, (ch.code ? ch.code + ". " : "") + clip(ch.name, 60));
      o.value = ch.code;
      sel.appendChild(o);
    });
    if (wireToolbar.done) return;
    wireToolbar.done = true;
    var t;
    $("f-buscar").addEventListener("input", function (e) { clearTimeout(t); var v = e.target.value; t = setTimeout(function () { G.q = v; applyFilters(); }, 120); });
    sel.addEventListener("change", function (e) { G.ch = e.target.value; applyFilters(); });
    $("f-estado").addEventListener("change", function (e) { G.st = e.target.value; applyFilters(); });
    $("f-expandir").addEventListener("click", function () { D.P.chapters.forEach(function (c) { c.open = true; }); applyFilters(); });
    $("f-contraer").addEventListener("click", function () { D.P.chapters.forEach(function (c) { c.open = false; }); applyFilters(); });
    $("f-valores").addEventListener("change", function (e) { $("gantt").classList.toggle("show-values", e.target.checked); });
  }

  // ---------------- carga ----------------
  function titleCase(s) {
    var low = { de: 1, del: 1, la: 1, las: 1, el: 1, los: 1, y: 1, e: 1, en: 1, a: 1, para: 1 };
    return s.toLowerCase().replace(/[^\s—–-]+/g, function (w, i) {
      return i > 0 && low[w] ? w : w.charAt(0).toUpperCase() + w.slice(1);
    });
  }

  function renderHeader(lastModified) {
    var P = D.P, C = D.C;
    var name = (P.cfg.project || "").trim();
    var nice = name ? (name === name.toUpperCase() ? titleCase(name) : name) : "Cronograma de obra";
    $("titulo").textContent = nice;
    document.title = (name ? nice + " · " : "") + "Cronograma de obra | NMH Engineering";
    var lede = "Programación semanal y avance ejecutado del " + dmy(P.starts[0]) + " al " + dmy(P.ends[C.n - 1] - DAY) + ". ";
    lede += C.cut >= 0 ? "Corte: " + dmy(C.cutEndT - DAY) + "." : "Aún no hay avance registrado.";
    $("resumen").textContent = lede;
    var up = $("actualizado");
    up.textContent = "";
    if (lastModified) {
      var d = new Date(lastModified);
      if (!isNaN(d)) {
        var when = d.toLocaleString("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        up.textContent = "Archivo actualizado el " + when + (/\.$/.test(when) ? "" : ".");
      }
    }
  }

  function showError(msg) {
    document.body.dataset.state = "error";
    $("resumen").textContent = "No fue posible mostrar el cronograma.";
    var box = $("aviso");
    box.textContent = "";
    var n = el("div", "notice");
    n.appendChild(el("p", null, msg));
    n.appendChild(el("p", null, "Si acaba de subir el archivo, espere uno o dos minutos y vuelva a intentarlo."));
    var b = el("button", "btn btn-line", "Volver a intentar");
    b.type = "button";
    b.addEventListener("click", function () { box.hidden = true; load(); });
    n.appendChild(b);
    box.appendChild(n);
    box.hidden = false;
  }

  function renderAll(lastModified) {
    renderHeader(lastModified);
    renderKpis();
    renderCurve();
    renderCurveTable();
    renderNote();
    buildGantt();
    wireToolbar();
    applyFilters();
  }

  function load() {
    document.body.dataset.state = "loading";
    $("resumen").textContent = "Cargando el cronograma…";
    if (typeof XLSX === "undefined") {
      showError("No se pudo cargar el lector de Excel. Revise la conexión a internet.");
      return;
    }
    var lastModified = null;
    fetch(FILE + "?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("No se encontró el archivo del cronograma (" + FILE + ").");
        lastModified = r.headers.get("Last-Modified");
        return r.arrayBuffer();
      })
      .then(function (buf) {
        var wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: false });
        var P = parse(wb);
        D = { P: P, C: compute(P) };
        document.body.dataset.state = "ready";
        renderAll(lastModified || (wb.Props && wb.Props.ModifiedDate));
      })
      .catch(function (err) {
        console.error(err);
        showError(err && err.message ? err.message : "Error al leer el archivo.");
      });
  }

  function init() {
    tip = $("tip");
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
    document.addEventListener("pointerdown", function (e) {
      if (!e.target.closest || (!e.target.closest("#gantt") && !e.target.closest("#curva"))) hideTip();
    });
    var w = 0, rt;
    window.addEventListener("resize", function () {
      if (!D) return;
      clearTimeout(rt);
      rt = setTimeout(function () { var nw = $("curva").clientWidth; if (nw !== w) { w = nw; renderCurve(); } }, 150);
    });
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", function () { if (D) renderCurve(); });
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
