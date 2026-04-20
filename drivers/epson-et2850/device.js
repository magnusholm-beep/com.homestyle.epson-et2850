'use strict';

const { Device } = require('homey');

class EpsonET2850Device extends Device {

  async onInit() {
    this.log('Epson ET-2850 device ready:', this.getName(), 'at', this.getSetting('address'));
  }

  async onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    await this.setSettings({ address: discoveryResult.address });
  }

  async onDiscoveryAddressChanged(discoveryResult) {
    await this.setSettings({ address: discoveryResult.address });
    this.log('Printer address updated to:', discoveryResult.address);
  }

  async onDiscoveryLastSeenChanged() {}

  async onSettings({ newSettings, changedKeys }) {
    if (changedKeys.includes('address')) {
      const ip = newSettings.address;
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip) || ip.split('.').some(p => parseInt(p, 10) > 255)) {
        throw new Error(this.homey.__('settings.address_invalid'));
      }
    }
  }

}

module.exports = EpsonET2850Device;
