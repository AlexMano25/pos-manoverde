// ============================================================
// POS Mano Verde - mDNS/Bonjour Service Discovery
// ============================================================

const Bonjour = require('bonjour-service').Bonjour;

let bonjourInstance = null;
let publishedService = null;

// ============================================================
// Start mDNS service publishing
// Makes the POS server discoverable on the local network
// ============================================================
function startMDNS(storeName, port) {
  try {
    bonjourInstance = new Bonjour();

    // Publish the POS service
    publishedService = bonjourInstance.publish({
      name: `POS-${storeName}`,
      type: 'pos',
      protocol: 'tcp',
      port: port,
      txt: {
        store: storeName,
        port: String(port),
        version: '1.0.0',
        type: 'pos-server',
      },
    });

    publishedService.on('up', () => {
      console.log(`[mDNS] Service published: POS-${storeName} on port ${port}`);
      console.log(`[mDNS] Service type: _pos._tcp`);
      console.log(`[mDNS] Clients can discover this server automatically on the local network`);
    });

    publishedService.on('error', (err) => {
      console.error('[mDNS] Service error:', err.message);
    });

    // Also browse for other POS servers on the network (for future multi-store sync)
    const browser = bonjourInstance.find({ type: 'pos' }, (service) => {
      if (service.name !== `POS-${storeName}`) {
        console.log(`[mDNS] Found other POS server: ${service.name} at ${service.host}:${service.port}`);
      }
    });

    browser.on('down', (service) => {
      if (service.name !== `POS-${storeName}`) {
        console.log(`[mDNS] POS server went offline: ${service.name}`);
      }
    });

    return publishedService;
  } catch (err) {
    console.error('[mDNS] Failed to start mDNS service:', err.message);
    console.error('[mDNS] Service discovery will be unavailable. Clients must connect using IP address directly.');
    return null;
  }
}

// ============================================================
// Stop mDNS service
// ============================================================
function stopMDNS() {
  if (publishedService) {
    publishedService.stop(() => {
      console.log('[mDNS] Service unpublished');
    });
  }
  if (bonjourInstance) {
    bonjourInstance.destroy();
    console.log('[mDNS] Bonjour instance destroyed');
  }
}

// ============================================================
// Exports
// ============================================================
module.exports = {
  startMDNS,
  stopMDNS,
};
