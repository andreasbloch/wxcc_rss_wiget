// Datei: rss-ticker.js
// Hinweis: Diese Datei muss als pure .js ohne <script>...</script>-Wrapper gehostet werden.

class RssTicker extends HTMLElement {
  static get observedAttributes() {
    return ["rss", "speed", "maxitems", "separator", "dark", "jsonproxy"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = {
      rss: "",
      speed: 60,           // Sekunden pro kompletter Durchlauf
      maxItems: 15,
      separator: " • ",
      dark: false,
      jsonProxy: ""
    };
  }

  attributeChangedCallback(name, _oldVal, val) {
    const map = { maxitems: "maxItems", jsonproxy: "jsonProxy" };
    const key = map[name] || name;
    if (key === "speed" || key === "maxItems") {
      this.state[key] = Number(val);
    } else if (key === "dark") {
      this.state[key] = (val === "true");
    } else {
      this.state[key] = val;
    }
    if (this.isConnected) this.render();
  }

  connectedCallback() {
    // Initial aus Attributen lesen
    for (const attr of RssTicker.observedAttributes) {
      if (this.hasAttribute(attr)) {
        this.attributeChangedCallback(attr, null, this.getAttribute(attr));
      }
    }
    this.render();
  }

  async render() {
    const { rss, speed, maxItems, separator, dark, jsonProxy } = this.state;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          height: 32px;
          width: 360px;       /* Arbeitsbreite im Header */
          max-width: 640px;
          flex: 0 1 360px;    /* ggf. flexibles Schrumpfen im Header-Layout */
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
        .track {
          position: absolute;
          white-space: nowrap;
          will-change: transform;
          animation: scroll linear infinite;
        }
        .item { margin-right: 16px; opacity: 0.95; }
        .item a { color: inherit; text-decoration: none; }
        .item a:hover { text-decoration: underline; }

        /* Start leicht im Sichtbereich, damit sofort Text sichtbar ist */
        @keyframes scroll {
          from { transform: translateX(10%); }
          to   { transform: translateX(-110%); }
        }
      </style>
      <div class="wrap" part="container">
        <div class="track" part="track">Lade Meldungen …</div>
      </div>
    `;

    const track = this.shadowRoot.querySelector(".track");

    try {
      const items = await this.loadItems(rss, maxItems, jsonProxy);

      // HTML für Ticker erstellen
      const html = items.map(i => {
        const title = this.escape(i.title);
        const href  = this.escapeAttr(i.link || i.url || "#");
        return `<span class="item">• <a href="${href}" target="_blank" rel="noopener">${title}</a></span>`;
      }).join(separator);

      track.innerHTML = html || "Keine Einträge im Feed.";

      // Dauer dynamisch an Textmenge koppeln (grob 6 Zeichen/Sek.)
      const charCount = track.textContent ? track.textContent.length : 100;
      const seconds = Math.max(20, Number.isFinite(speed) ? speed : 60, Math.round(charCount / 6));
      track.style.animationDuration = `${seconds}s`;
    } catch (e) {
      track.textContent = `RSS-Fehler: ${e?.message || e}`;
    }
  }

  async loadItems(rssUrl, maxItems, jsonProxy) {
    // Variante A: Vorgewärmtes JSON (jsonProxy) – keine CORS-Probleme
    if (jsonProxy) {
      const res = await fetch(jsonProxy, { cache: "no-store" });
      if (!res.ok) throw new Error(`Proxy-Feed ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items
                 : Array.isArray(data)         ? data
                 : Array.isArray(data?.feed)   ? data.feed
                 : [];
      return items.slice(0, maxItems).map(x => ({ title: x.title, link: x.link || x.url || "#" }));
    }

    // Variante B: Externer RSS→JSON-Dienst (z. B. rss2json)
    if (!rssUrl) return [];
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(apiUrl, { cache: "no-store" });
    const data = await res.json();
    if (data.status !== "ok") throw new Error(data.message || "Unbekannter Feed-Fehler");
    return (data.items || []).slice(0, maxItems).map(x => ({ title: x.title, link: x.link }));
  }

  // HTML-Escapes
  escape(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[c]));
  }
  escapeAttr(s) {
    // einfache Attribut-Escapes (keine URLs manipulieren)
    return String(s || "").replace(/"/g, "&quot;");
  }
}

customElements.define("rss-ticker", RssTicker);
