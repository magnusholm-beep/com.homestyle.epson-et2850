'use strict';

const { Device } = require('homey');

class EpsonET2850Device extends Device {

  async onInit() {
    this.log('Epson ET-2850 device ready:', this.getName(), 'at', this.getStoreValue('address'));
  }

  async onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    await this.setStoreValue('address', discoveryResult.address);
  }

  async onDiscoveryAddressChanged(discoveryResult) {
    await this.setStoreValue('address', discoveryResult.address);
    this.log('Printer address updated to:', discoveryResult.address);
  }

  async onDiscoveryLastSeenChanged() {}

}

module.exports = EpsonET2850Device;
