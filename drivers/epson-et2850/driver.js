'use strict';

const { Driver } = require('homey');

class EpsonET2850Driver extends Driver {

  async onInit() {
    this.log('Epson ET-2850 driver initialized');
  }

  async onPairListDevices() {
    const discoveryStrategy = this.homey.discovery.getStrategy('epson_et2850');
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    return Object.values(discoveryResults).map(result => ({
      name: result.txt?.ty || result.name || 'Epson ET-2850',
      data: { id: result.id },
      store: { address: result.address },
    }));
  }

}

module.exports = EpsonET2850Driver;
