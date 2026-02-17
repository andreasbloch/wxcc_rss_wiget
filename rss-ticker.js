// Datei: rss-ticker.js
class RssTicker extends HTMLElement {
  static get observedAttributes() {
    return ["rss","speed","maxitems","separator","dark","debug","jsonproxy","rss2jsonparams"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = {
      rss: "",
      jsonProxy: "",
      speed: 60,
      maxItems: 15,
      separator: " • ",
      dark: false,
      debug: false,
      rss2jsonParams: ""
    };
    // einfache Render-Entprellung
    this._renderQueued = false;
  }

  // --- Property <-> State Brücke ----------------------------------------
  _toBool(v)   { return (typeof v === "boolean") ? v : String(v) === "true"; }
  _toNum(v,d)  { const n = Number(v); return Number.isFinite(n) ? n : d; }

  // Upgrade-Pattern: bereits gesetzte Properties durch die Setter "schubsen"
  _upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value; // triggert den Setter
    }
  }

  connectedCallback() {
    // Properties upgraden (falls Desktop schon vor definition gesetzt hat)
    ["rss","jsonProxy","speed","maxItems","separator","dark","debug","rss2jsonParams"]
      .forEach(p => this._upgradeProperty(p));
    this._renderSoon();
  }

  attributeChangedCallback(name, _oldVal, val) {
    const map = { maxitems: "maxItems", jsonproxy: "jsonProxy", rss2jsonparams: "rss2jsonParams" };
    const key = map[name] || name;

    switch (key) {
      case "speed":    this.speed    = val; break;
      case "maxItems": this.maxItems = val; break;
      case "dark":     this.dark     = val; break;
      case "debug":    this.debug    = val; break;
      default:         this[key]     = val;
    }
  }

  // --- Getter/Setter für Properties (werden vom Desktop gesetzt) ----------
  get rss()            { return this.state.rss; }
  set rss(v)           { this.state.rss = (v ?? "");           this._renderSoon(); }

  get jsonProxy()      { return this.state.jsonProxy; }
  set jsonProxy(v)     { this.state.jsonProxy = (v ?? "");      this._renderSoon(); }

  get speed()          { return this.state.speed; }
  set speed(v)         { this.state.speed = this._toNum(v,60);  this._renderSoon(); }

  get maxItems()       { return this.state.maxItems; }
  set maxItems(v)      { this.state.maxItems = this._toNum(v,15); this._renderSoon(); }

  get separator()      { return this.state.separator; }
  set separator(v)     { this.state.separator = (v ?? " • ");   this._renderSoon(); }

  get dark()           { return this.state.dark; }
  set dark(v)          { this.state.dark = this._toBool(v);     this._renderSoon(); }

  get debug()          { return this.state.debug; }
  set debug(v)         { this.state.debug = this._toBool(v);    this._renderSoon(); }

  get rss2jsonParams() { return this.state.rss2jsonParams; }
  set rss2jsonParams(v){ this.state.rss2jsonParams = (v ?? ""); this._renderSoon(); }

  // --- Render -------------------------------------------------------------
  log(...args){ if (this.state.debug) console.log("[rss-ticker]", ...args); }
  _renderSoon() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    queueMicrotask(() => { this._renderQueued = false; this.render(); });
  }

  async render() {
    const { speed, maxItems, separator, dark } = this.state;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          height: 32px;
          width: 360px;
          max-width: 640px;
          flex: 0 1 360px;
          font: 12px/32px system-ui, Segoe UI, Roboto, sans-serif;
        }
        .wrap {
          position: relative;
          overflow: hidden;
          height: 32px;
          border-radius: 16px;
          padding: 0 12px;
          box-sizing: border-box;
          background: ${dark ? "#1b1d21" : "#f6f7f9"};
          color: ${dark ? "#e9eaec" : "#1a1c1e"};
          border: 1px solid ${dark ? "#2a2d33" : "#dfe3e8"};
        }
        .track { position: absolute; white-space: nowrap; will-change: transform; animation: scroll linear infinite; }
        .item  { margin-right: 16px; opacity: .95; }
        .item a { color: inherit; text-decoration: none; }
        .item a:hover { text-decoration: underline; }
        @keyframes scroll { from { transform: translateX(10%) } to { transform: translateX(-110%) } }
      </style>
      <div class="wrap" part="container">
        <div class="track" part="track">Lade Meldungen …</div>
      </div>
    `;

    const track = this.shadowRoot.querySelector(".track");

    try {
      const items = await this.loadItems();
      this.log("Items geladen:", items.length, this.state);

      if (!items.length) {
        track.textContent = "Keine Einträge im Feed.";
        return;
      }

      const html = items.map(i => {
        const title = this.escape(i.title);
        const href  = this.escapeAttr(i.link || i.url || "#");
        return `<span class="item">• <a href="${href}" target="_blank" rel="noopener noreferrer">${title}</a></span>`;
      }).join(separator);

      track.innerHTML = html;

      const charCount = track.textContent ? track.textContent.length : 100;
      const seconds = Math.max(20, Number.isFinite(speed) ? speed : 60, Math.round(charCount / 6));
      track.style.animationDuration = `${seconds}s`;
    } catch (e) {
      this.log("Fehler:", e);
      track.textContent = `RSS-Fehler: ${e?.message || e}`;
    }
  }

  async loadItems() {
    const { jsonProxy, rss, maxItems, rss2jsonParams } = this.state;

    // A) bevorzugt: vorkonvertierte JSON-Datei (sicher, kein CORS)
    if (jsonProxy) {
      this.log("jsonProxy:", jsonProxy);
      const res = await fetch(jsonProxy, { cache: "no-store" });
      if (!res.ok) throw new Error(`jsonProxy HTTP ${res.status}`);
      const data = await res.json();
      const items = this.pickItems(data);
      return items.slice(0, maxItems).map(x => ({ title: x.title, link: x.link || x.url || "#" }));
    }

    // B) optionaler Fallback (nur Test): direkter rss2json-Call ohne Key im Client
    if (rss) {
      const base = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rss)}`;
      const url  = rss2jsonParams ? `${base}&${rss2jsonParams}` : base;
      this.log("rss2json (client):", url);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`rss2json HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.message || "rss2json-Fehler");
      const items = Array.isArray(data.items) ? data.items : [];
      return items.slice(0, maxItems).map(x => ({ title: x.title, link: x.link }));
    }

    return [];
  }

  pickItems(data) {
    if (Array.isArray(data?.items))   return data.items;
    if (Array.isArray(data))          return data;
    if (Array.isArray(data?.feed))    return data.feed;
    if (Array.isArray(data?.entries)) return data.entries;
    return [];
  }

  escape(s){
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;"
    }[c]));
  }
  escapeAttr(s){ return String(s || "").replace(/"/g,"&quot;"); }
}

customElements.define("rss-ticker", RssTicker);
``
