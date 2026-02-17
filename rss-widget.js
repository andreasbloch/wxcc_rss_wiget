class RssWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  async render() {
    const rssUrl = "https://www.tagesschau.de";
    // Proxy nutzen um CORS/CORB bei der Datenabfrage zu umgehen
    const api = `https://api.rss2json.com{encodeURIComponent(rssUrl)}`;
    
    try {
      const res = await fetch(api);
      const data = await res.json();
      const item = data.items[0]; // Erster Eintrag

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 20px; font-family: sans-serif; background: white; color: black; border-radius: 8px; }
          h2 { color: #005a8b; margin-top: 0; }
          .news-box { border-left: 5px solid #ffcc00; padding-left: 15px; }
          a { color: #005a8b; text-decoration: none; font-weight: bold; }
        </style>
        <div class="news-box">
          <h2>Axians News Feed</h2>
          <p>Aktuellste Meldung:</p>
          <a href="${item.link}" target="_blank">${item.title}</a>
          <p><small>Quelle: Tagesschau</small></p>
        </div>
      `;
    } catch (e) {
      this.shadowRoot.innerHTML = `<p>News konnten nicht geladen werden.</p>`;
    }
  }
}
customElements.define('rss-widget', RssWidget);
