(function() {
  class RssWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.fetchData();
    }

    async fetchData() {
      const rssUrl = "https://www.tagesschau.de";
      // Nutzt den rss2json Service als Proxy gegen CORS/CORB Probleme
      const apiUrl = "https://api.rss2json.com" + encodeURIComponent(rssUrl);

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const firstItem = data.items[0];
        this.render(firstItem, data.feed.title);
      } catch (error) {
        console.error("RSS Widget Error:", error);
        this.renderError();
      }
    }

    render(item, feedTitle) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; height: 100%; background: #f4f4f7; }
          .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid #005a8b; }
          h2 { color: #005a8b; margin-top: 0; font-size: 1.2rem; }
          p { color: #333; line-height: 1.5; }
          a { display: inline-block; margin-top: 15px; color: #005a8b; font-weight: bold; text-decoration: none; border: 1px solid #005a8b; padding: 8px 15px; border-radius: 4px; }
          a:hover { background: #005a8b; color: white; }
          .source { font-size: 0.8rem; color: #666; margin-bottom: 10px; text-transform: uppercase; }
        </style>
        <div class="card">
          <div class="source">${feedTitle}</div>
          <h2>${item.title}</h2>
          <p>${item.description.substring(0, 200)}...</p>
          <a href="${item.link}" target="_blank">Vollständigen Artikel lesen</a>
        </div>
      `;
    }

    renderError() {
      this.shadowRoot.innerHTML = `<p style="padding: 20px; color: red;">News konnten nicht geladen werden. Bitte prüfen Sie die Internetverbindung.</p>`;
    }
  }

  // Sicherstellen, dass das Element nur einmal registriert wird
  if (!customElements.get('rss-widget')) {
    customElements.define('rss-widget', RssWidget);
  }
})();
