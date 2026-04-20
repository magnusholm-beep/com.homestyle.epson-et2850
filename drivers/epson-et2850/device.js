'use strict';

const { Device } = require('homey');

const POLL_INTERVAL_MS = 30 * 60 * 1000;

const COLOR_TO_CAPABILITY = {
  '#000000': 'ink_level_black',
  '#00ffff': 'ink_level_cyan',
  '#ff00ff': 'ink_level_magenta',
  '#ffff00': 'ink_level_yellow',
};

const PRINTER_STATES = { 3: 'idle', 4: 'processing', 5: 'stopped' };

const MEDIA_NAMES = {
  'iso_a4_210x297mm':    'A4',
  'na_letter_8.5x11in':  'Letter',
  'iso_a5_148x210mm':    'A5',
  'na_index-4x6_4x6in':  '4×6 Photo',
};

class EpsonET2850Device extends Device {

  async onInit() {
    this.log('Epson ET-2850 device ready:', this.getName(), 'at', this.getSetting('address'));

    const requiredCaps = [
      'printer_state', 'alarm_generic', 'queued_jobs', 'media_ready',
      'ink_level_black', 'ink_level_cyan', 'ink_level_magenta', 'ink_level_yellow',
    ];
    for (const cap of requiredCaps) {
      if (!this.hasCapability(cap)) await this.addCapability(cap);
    }

    await this._poll();
    this._pollTimer = this.homey.setInterval(() => this._poll(), POLL_INTERVAL_MS);
  }

  async onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    await this.setSettings({ address: discoveryResult.address });
    await this._poll();
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

  async _poll() {
    const address = this.getSetting('address');
    if (!address) return;

    try {
      const data = await this._fetchPrinterData(address);

      await this.setCapabilityValue('printer_state', data.state);
      await this.setCapabilityValue('alarm_generic',  data.alarm);
      await this.setCapabilityValue('queued_jobs',    data.queuedJobs);
      await this.setCapabilityValue('media_ready',    data.media);

      for (const [cap, val] of Object.entries(data.inkLevels)) {
        await this.setCapabilityValue(cap, val);
      }

      this.log('Status updated — state:', data.state, '| media:', data.media, '| ink:', data.inkLevels);
    } catch (err) {
      this.error('Failed to poll printer:', err.message);
    }
  }

  _fetchPrinterData(address) {
    const ipp = require('ipp');
    const printer = new ipp.Printer(`ipps://${address}:631/ipp/print`);

    return new Promise((resolve, reject) => {
      printer.execute('Get-Printer-Attributes', {
        'operation-attributes-tag': {
          'requesting-user-name': 'Homey',
          'requested-attributes': [
            'printer-state',
            'printer-state-reasons',
            'queued-job-count',
            'media-ready',
            'marker-levels',
            'marker-colors',
            'marker-high-levels',
          ],
        },
      }, (err, res) => {
        if (err) return reject(err);

        const attrs = res?.['printer-attributes-tag'] ?? {};

        // Printer state
        const stateCode = attrs['printer-state'];
        const state = PRINTER_STATES[stateCode] ?? 'idle';

        // Alarm — any reason other than 'none'
        let reasons = attrs['printer-state-reasons'] ?? 'none';
        if (!Array.isArray(reasons)) reasons = [reasons];
        const alarm = reasons.some(r => r !== 'none');

        // Queued jobs
        const queuedJobs = typeof attrs['queued-job-count'] === 'number'
          ? attrs['queued-job-count']
          : 0;

        // Media
        let mediaRaw = attrs['media-ready'];
        if (!mediaRaw) {
          mediaRaw = [];
        } else if (!Array.isArray(mediaRaw)) {
          mediaRaw = [mediaRaw];
        }
        const media = mediaRaw
          .map(m => MEDIA_NAMES[m] ?? m)
          .join(', ') || '—';

        // Ink levels
        let levels    = attrs['marker-levels']      ?? [];
        let colors    = attrs['marker-colors']      ?? [];
        let highLevels = attrs['marker-high-levels'] ?? [];

        if (!Array.isArray(levels))     levels     = [levels];
        if (!Array.isArray(colors))     colors     = [colors];
        if (!Array.isArray(highLevels)) highLevels = [highLevels];

        const inkLevels = {};
        colors.forEach((color, i) => {
          const level    = levels[i];
          const maxLevel = highLevels[i] ?? 100;
          if (typeof level !== 'number' || level < 0) return;
          const cap = COLOR_TO_CAPABILITY[color?.toLowerCase()];
          if (cap) inkLevels[cap] = Math.min(100, Math.max(0, Math.round((level / maxLevel) * 100)));
        });

        resolve({ state, alarm, queuedJobs, media, inkLevels });
      });
    });
  }

}

module.exports = EpsonET2850Device;
