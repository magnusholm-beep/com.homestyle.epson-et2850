'use strict';

const { Device } = require('homey');

const POLL_INTERVAL_MS = 30 * 60 * 1000;

const COLOR_TO_CAPABILITY = {
  '#000000': 'ink_level_black',
  '#00ffff': 'ink_level_cyan',
  '#ff00ff': 'ink_level_magenta',
  '#ffff00': 'ink_level_yellow',
};

class EpsonET2850Device extends Device {

  async onInit() {
    this.log('Epson ET-2850 device ready:', this.getName(), 'at', this.getSetting('address'));
    await this._pollInkLevels();
    this._pollTimer = this.homey.setInterval(() => this._pollInkLevels(), POLL_INTERVAL_MS);
  }

  async onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    await this.setSettings({ address: discoveryResult.address });
    await this._pollInkLevels();
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

  async onDeleted() {
    this.homey.clearInterval(this._pollTimer);
  }

  async _pollInkLevels() {
    const address = this.getSetting('address');
    if (!address) return;

    try {
      const levels = await this._getInkLevels(address);
      for (const [capability, value] of Object.entries(levels)) {
        await this.setCapabilityValue(capability, value);
      }
      this.log('Ink levels updated:', levels);
    } catch (err) {
      this.error('Failed to poll ink levels:', err.message);
    }
  }

  _getInkLevels(address) {
    const ipp = require('ipp');
    const printer = new ipp.Printer(`ipps://${address}:631/ipp/print`);

    return new Promise((resolve, reject) => {
      printer.execute('Get-Printer-Attributes', {
        'operation-attributes-tag': {
          'requesting-user-name': 'Homey',
          'requested-attributes': ['marker-levels', 'marker-colors'],
        },
      }, (err, res) => {
        if (err) return reject(err);

        const attrs = res?.['printer-attributes-tag'];
        let levels = attrs?.['marker-levels'];
        let colors = attrs?.['marker-colors'];

        if (levels === undefined || colors === undefined) {
          return reject(new Error('No marker data in printer response'));
        }

        if (!Array.isArray(levels)) levels = [levels];
        if (!Array.isArray(colors)) colors = [colors];

        const result = {};
        colors.forEach((color, i) => {
          const level = levels[i];
          if (typeof level !== 'number' || level < 0) return;
          const capability = COLOR_TO_CAPABILITY[color?.toLowerCase()];
          if (capability) result[capability] = level;
        });

        resolve(result);
      });
    });
  }

}

module.exports = EpsonET2850Device;
