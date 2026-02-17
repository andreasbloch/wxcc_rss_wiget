(function() {
  class RssWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.logs = [];
    }

    addLog(msg) {
      this.logs.push(`${new Date().toLocaleTimeString()}: ${msg}`);
      this.render();
    }

    connectedCallback() {
      this.addLog("Widget im DOM verbunden.");
      this.fetchData();
    }

    async fetchData() {
      const rssUrl = "https://www.tagesschau.de";
      const apiUrl = "https://api.rss2json.com" + encodeURIComponent(rssUrl);
      
      this.addLog(`Starte Fetch auf: ${apiUrl}`);

      try {
        const response = await fetch(apiUrl);
        this.addLog(`HTTP Status: ${response.status}`);
        
        const data = await response.json();
        if (data.status === 'ok') {
          this.addLog(`Daten erfolgreich geladen. Items: ${data.items.length}`);
          this.render(data.items[0]);
        } else {
          this.addLog(`API Fehler: ${data.message}`);
        }
      } catch (error) {
        this.addLog(`KRITISCHER FEHLER: ${error.message}`);
      }
    }

    render(item = null) {
      this.shadowRoot.innerHTML = `
        <div style="padding: 20px; font-family: monospace; background: #1e1e1e; color: #adadad; border-radius: 8px;">
          <h2 style="color: #00ff00; margin-top: 0;">🛠 Axians Debug Mode</h2>
          <div style="background: #000; padding: 10px; border: 1px solid #333; margin-bottom: 20px; font-size: 12px;">
            ${this.logs.map(log => `<div>${log}</div>`).join('')}
          </div>
          ${item ? `
            <div style="background: white; color: black; padding: 15px; border-radius: 4px;">
              <h3 style="margin: 0;">${item.title}</h3>
              <p>${item.description.substring(0, 100)}...</p>
            </div>
          ` : '<div style="color: yellow;">Warte auf Daten...</div>'}
        </div>
      `;
    }
  }

  if (!customElements.get('rss-widget-item')) {
    customElements.define('rss-widget-item', RssWidget);
    console.log("RSS-Widget erfolgreich registriert als rss-widget-item");
}
})();
