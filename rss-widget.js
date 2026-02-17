class RssTicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.rssUrl = '';
  }

  static get observedAttributes() { return ['rss-url']; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'rss-url' && newVal) {
      this.rssUrl = newVal;
      this.fetchFeed();
    }
  }

  async fetchFeed() {
    try {
      const response = await fetch(this.rssUrl);
      const text = await response.text();
      const xml = new window.DOMParser().parseFromString(text, "text/xml");
      const items = Array.from(xml.querySelectorAll("item")).map(i => i.querySelector("title").textContent);
      this.render(items.join(' +++ '));
    } catch (e) {
      this.render("Fehler beim Laden des Feeds.");
    }
  }

  render(content) {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: flex; align-items: center; width: 100%; overflow: hidden; background: transparent; font-family: sans-serif; color: inherit; }
        .ticker-wrap { width: 100%; overflow: hidden; white-space: nowrap; }
        .ticker { display: inline-block; padding-left: 100%; animation: marquee 30s linear infinite; font-size: 14px; font-weight: 500; }
        @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }
      </style>
      <div class="ticker-wrap">
        <div class="ticker">📢 ${content}</div>
      </div>
    `;
  }
}
customElements.define('rss-ticker-widget', RssTicker);
