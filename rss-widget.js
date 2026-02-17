/**
 * RSS Widget for Webex Contact Center
 * Version: 1.2.0 - Final Fix
 */
(function() {
  class RssWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      // Standard RSS-Feed von der Tagesschau
      this.rssUrl = "https://www.tagesschau.de/index~rss2.xml";
    }

    connectedCallback() {
      this.renderLoading();
      this.fetchData();
    }

    async fetchData() {
      // Nutze URLSearchParams für absolut sicheres URL-Encoding (löst das "invalid url" Problem)
      const params = new URLSearchParams({
        rss_url: this.rssUrl,
        api_key: "" // Optionaler API Key für rss2json, falls vorhanden
      });
      
      const apiUrl = `https://api.rss2json.com/v1/api.json?{params.toString()}`;
      
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.status === 'ok') {
          this.render(data.items, data.feed.title);
        } else {
          throw new Error(data.message || "API Antwort nicht 'ok'");
        }
      } catch (error) {
        console.error("RSS Widget Error:", error);
        this.renderError(error.message);
      }
    }

    renderLoading() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; height: 100%; width: 100%; font-family: 'Segoe UI', sans-serif; background: #f4f4f7; padding: 20px; box-sizing: border-box; }
          .loading { color: #005a8b; font-size: 16px; font-weight: bold; }
        </style>
        <div class="loading">Nachrichten werden geladen...</div>
      `;
    }

    renderError(msg) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 20px; font-family: 'Segoe UI', sans-serif; }
          .error-box { color: #d93025; background: #fce8e6; border: 1px solid #d93025; border-radius: 4px; padding: 15px; }
        </style>
        <div class="error-box">
          <strong>News Feed - Fehler:</strong><br>
          ${msg}
        </div>
      `;
    }

    render(items, feedTitle) {
      // Wir zeigen die ersten 6 Einträge für ein schönes Grid
      const topItems = items.slice(0, 6);

      this.shadowRoot.innerHTML = `
        <style>
          :host { 
            display: block; 
            height: 100%; 
            width: 100%; 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            background: #f4f4f7; 
            padding: 25px; 
            box-sizing: border-box; 
            overflow-y: auto;
          }
          .header { 
            display: flex; 
            justify-content: space-between;
            align-items: center; 
            margin-bottom: 25px; 
            border-bottom: 3px solid #005a8b;
            padding-bottom: 12px;
          }
          .header h1 { font-size: 22px; color: #005a8b; margin: 0; }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
          
          .card { 
            background: white; 
            border-radius: 4px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
            padding: 20px;
            display: flex;
            flex-direction: column;
            border-left: 4px solid transparent;
            transition: all 0.3s ease;
          }
          .card:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
            border-left-color: #005a8b;
          }
          
          .card-title { 
            font-size: 17px; 
            font-weight: 700; 
            color: #333; 
            margin-bottom: 10px; 
            text-decoration: none;
            line-height: 1.3;
          }
          .card-title:hover { color: #005a8b; }
          
          .card-desc { 
            font-size: 14px; 
            color: #555; 
            line-height: 1.5; 
            margin-bottom: 15px;
            flex-grow: 1;
          }
          
          .btn { 
            align-self: flex-start;
            background: #005a8b; 
            color: white; 
            text-decoration: none; 
            padding: 8px 16px; 
            border-radius: 2px; 
            font-size: 13px; 
            font-weight: 600; 
          }
          .btn:hover { background: #00466d; }
          
          .date { font-size: 11px; color: #aaa; margin-top: 15px; }
        </style>
        
        <div class="header">
          <h1>Collaboration Lab - News</h1>
          <span style="font-size: 12px; color: #666;">Quelle: ${feedTitle}</span>
        </div>

        <div class="grid">
          ${topItems.map(item => `
            <div class="card">
              <a href="${item.link}" target="_blank" class="card-title">${item.title}</a>
              <div class="card-desc">
                ${item.description.replace(/<[^>]*>?/gm, '').substring(0, 160)}...
              </div>
              <a href="${item.link}" target="_blank" class="btn">Mehr lesen</a>
              <div class="date">${new Date(item.pubDate).toLocaleString('de-DE')}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  // WICHTIG: Doppel-Registrierung für maximale Stabilität im Webex Desktop
  const COMP_NAME = 'rss-widget';
  const ITEM_NAME = 'rss-widget-item';

  if (!customElements.get(COMP_NAME)) {
    customElements.define(COMP_NAME, RssWidget);
  }
  if (!customElements.get(ITEM_NAME)) {
    customElements.define(ITEM_NAME, RssWidget);
  }

  console.log("RSS Widget v1.2.0 final registriert.");
})();
