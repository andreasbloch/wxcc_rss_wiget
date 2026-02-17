/**
 * Axians RSS Widget for Webex Contact Center
 * Version: 1.1.0
 */
(function() {
  class RssWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.rssUrl = "https://www.tagesschau.de/index~rss2.xml";
    }

    connectedCallback() {
      this.renderLoading();
      this.fetchData();
    }

    async fetchData() {
      // Proxy via rss2json um CORS/CORB zu umgehen
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl)}`;
      
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.status === 'ok') {
          this.render(data.items, data.feed.title);
        } else {
          throw new Error(data.message || "API Fehler");
        }
      } catch (error) {
        console.error("Axians RSS Widget Error:", error);
        this.renderError(error.message);
      }
    }

    renderLoading() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; height: 100%; width: 100%; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f7; padding: 20px; box-sizing: border-box; }
          .loading { color: #005a8b; font-weight: bold; }
        </style>
        <div class="loading">Lade aktuelle Nachrichten...</div>
      `;
    }

    renderError(msg) {
      this.shadowRoot.innerHTML = `
        <div style="color: #d93025; padding: 20px; background: #fce8e6; border: 1px solid #d93025; border-radius: 4px;">
          <strong>Fehler beim Laden des Feeds:</strong><br>${msg}
        </div>
      `;
    }

    render(items, feedTitle) {
      // Wir nehmen die ersten 5 Einträge
      const topItems = items.slice(0, 5);

      this.shadowRoot.innerHTML = `
        <style>
          :host { 
            display: block; 
            height: 100%; 
            width: 100%; 
            font-family: 'Segoe UI', sans-serif; 
            background: #f4f4f7; 
            padding: 20px; 
            box-sizing: border-box; 
            overflow-y: auto;
          }
          .header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #005a8b;
            padding-bottom: 10px;
          }
          .header h1 { 
            font-size: 20px; 
            color: #005a8b; 
            margin: 0; 
          }
          .card { 
            background: white; 
            border-radius: 4px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            margin-bottom: 15px; 
            padding: 15px;
            transition: transform 0.2s;
          }
          .card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
          .card-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 8px; 
            display: block;
            text-decoration: none;
          }
          .card-title:hover { color: #005a8b; }
          .card-desc { font-size: 14px; color: #666; line-height: 1.4; }
          .footer { font-size: 12px; color: #999; margin-top: 10px; }
        </style>
        
        <div class="header">
          <h1>📢 ${feedTitle}</h1>
        </div>

        ${topItems.map(item => `
          <div class="card">
            <a href="${item.link}" target="_blank" class="card-title">${item.title}</a>
            <div class="card-desc">${item.description.replace(/<[^>]*>?/gm, '').substring(0, 180)}...</div>
            <div class="footer">Veröffentlicht: ${item.pubDate}</div>
          </div>
        `).join('')}
      `;
    }
  }

  // WICHTIG: Doppel-Registrierung für Webex Agent Desktop
  const COMP_NAME = 'rss-widget';
  const ITEM_NAME = 'rss-widget-item';

  if (!customElements.get(COMP_NAME)) {
    customElements.define(COMP_NAME, RssWidget);
  }
  if (!customElements.get(ITEM_NAME)) {
    customElements.define(ITEM_NAME, RssWidget);
  }

  console.log("Axians RSS Widget v1.1.0 geladen.");
})();
