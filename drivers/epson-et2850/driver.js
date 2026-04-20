'use strict';

const { Driver } = require('homey');

class EpsonET2850Driver extends Driver {

  async onInit() {
    this.log('Epson ET-2850 driver initialized');

    this.homey.flow.getDeviceTriggerCard('ink_below_threshold')
      .registerRunListener(async (args, state) => {
        return args.ink === state.ink && state.level < args.threshold;
      });

    this.homey.flow.getDeviceTriggerCard('printer_state_changed')
      .registerRunListener(async (args, state) => {
        return args.state === 'any' || args.state === state.state;
      });
  }

  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    return Object.values(discoveryResults).map(result => ({
      name: result.txt?.ty || result.name || 'Epson ET-2850',
      data: { id: result.id },
      store: { address: result.address },
    }));
  }

}

module.exports = EpsonET2850Driver;
