<!-- Datei: rss-ticker.js -->
<script type="module">
class RssTicker extends HTMLElement {
  static get observedAttributes() {
    return ["rss","speed","maxitems","separator","dark","jsonproxy"];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = {
      rss: "",
      speed: 60,          // Sekunden pro kompletter Durchlauf
      maxItems: 15,
      separator: " • ",
      dark: false,
      jsonProxy: ""
    };
  }

  attributeChangedCallback(name, _old, val) {
    const map = { maxitems: "maxItems", jsonproxy: "jsonProxy" };
    const key = map[name] || name;
    this.state[key] = (key === "speed" || key === "maxItems") ? Number(val) : (key === "dark" ? (val === "true") : val);
    if (this.isConnected) this.render();
  }

  connectedCallback() {
    // Defaults aus attributes lesen
    for (const attr of RssTicker.observedAttributes) {
      if (this.hasAttribute(attr)) this.attributeChangedCallback(attr, null, this.getAttribute(attr));
    }
    this.render();
  }

  async render() {
    const { rss, speed, maxItems, separator, dark, jsonProxy } = this.state;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; height: 32px; max-width: 640px; font: 12px/32px system-ui, Segoe UI, Roboto, sans-serif; }
        .wrap { position: relative; overflow: hidden; height: 32px; border-radius: 16px; padding: 0 12px; box-sizing: border-box;
                background: ${dark ? "#1b1d21" : "#f6f7f9"}; color: ${dark ? "#e9eaec" : "#1a1c1e"}; border: 1px solid ${dark ? "#2a2d33" : "#dfe3e8"}; }
        .track { position: absolute; white-space: nowrap; will-change: transform; animation: scroll linear infinite; }
        .item { margin-right: 16px; opacity: 0.95 }
        .item a { color: inherit; text-decoration: none; }
        .item a:hover { text-decoration: underline; }
        @keyframes scroll { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
      </style>
      <div class="wrap" part="container"><div class="track" part="track">Lade Meldungen …</div></div>
    `;

    const track = this.shadowRoot.querySelector(".track");
    try {
      const items = await this.loadItems(rss, maxItems, jsonProxy);
      const html = items.map(i => `<span class="item">• <a href="${i.link}" target="_blank" rel="noopener">${this.escape(i.title)}</a></span>`).join(separator);
      track.innerHTML = html || "Keine Einträge im Feed.";
      // Animationdauer dynamisch: proportional zur Textlänge
      const charCount = track.textContent?.length || 100;
      const seconds = Math.max(20, speed || 60, Math.round(charCount / 6)); // grob 6 Zeichen/s
      track.style.animationDuration = `${seconds}s`;
    } catch (e) {
      track.textContent = `RSS-Fehler: ${e?.message || e}`;
    }
  }

  async loadItems(rssUrl, maxItems, jsonProxy) {
    if (!rssUrl && !jsonProxy) return [];
    let url = "";
    if (jsonProxy) {
      // jsonProxy liefert bereits JSON (Array/Objekt) im Format { items: [{title, link}, ...] }
      url = jsonProxy;
      const res = await fetch(url);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      return items.slice(0, maxItems).map(x => ({ title: x.title, link: x.link || x.url || "#" }));
    } else {
      // Fallback: öffentlicher RSS→JSON-Dienst (CORS-fähig)
      const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      const res = await fetch(api);
      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.message || "Unbekannter Feed-Fehler");
      return (data.items || []).slice(0, maxItems).map(x => ({ title: x.title, link: x.link }));
    }
  }

  escape(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
  }
}
customElements.define("rss-ticker", RssTicker);
</script>
