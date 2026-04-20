'use strict';

const Homey = require('homey');
const { validateInput, detectContentType } = require('./lib/utils');

const JOB_POLL_INTERVAL_MS = 2000;
const JOB_POLL_TIMEOUT_MS = 60000;
const FETCH_TIMEOUT_MS = 30000;
const MAX_REDIRECTS = 5;

class EpsonET2850App extends Homey.App {

  async onInit() {
    this.log('Epson ET-2850 app has started');
    // The ipp library ignores rejectUnauthorized passed to the Printer constructor.
    // Epson printers use self-signed certs, so we disable verification for this process.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const _emit = process.emitWarning.bind(process);
    process.emitWarning = (warning, ...args) => {
      if (typeof warning === 'string' && warning.includes('NODE_TLS_REJECT_UNAUTHORIZED')) return;
      _emit(warning, ...args);
    };
    this._registerManualAction();
    this._registerDeviceAction();
  }

  _registerManualAction() {
    const action = this.homey.flow.getActionCard('print_image_url');
    action.registerRunListener(async (args) => {
      const { printer_ip, image_url, copies, paper_size, sides, color_mode } = args;
      this.log(`Printing ${image_url} → ${printer_ip}`);
      try {
        validateInput(printer_ip, image_url);
        await this.printImageFromUrl(printer_ip, image_url, copies || 1, paper_size, sides, color_mode);
        return true;
      } catch (err) {
        this.error('Print failed:', err.message);
        throw new Error(`Print failed: ${err.message}`);
      }
    });
  }

  _registerDeviceAction() {
    const action = this.homey.flow.getActionCard('print_image_url_device');
    action.registerRunListener(async (args) => {
      const { device, image_url, copies, paper_size, sides, color_mode } = args;
      const printerIp = device.getSetting('address');
      this.log(`Printing ${image_url} → ${device.getName()} (${printerIp})`);
      try {
        validateInput(printerIp, image_url);
        await this.printImageFromUrl(printerIp, image_url, copies || 1, paper_size, sides, color_mode);
        return true;
      } catch (err) {
        this.error('Print failed:', err.message);
        throw new Error(`Print failed: ${err.message}`);
      }
    });
  }

  async printImageFromUrl(printerIp, imageUrl, copies, paperSize, sides, colorMode) {
    const ipp = require('ipp');

    const { buffer: imageBuffer, contentType } = await this.fetchImageBuffer(imageUrl);

    const printerUrl = `ipps://${printerIp}:631/ipp/print`;
    const printer = new ipp.Printer(printerUrl);

    const msg = {
      'operation-attributes-tag': {
        'requesting-user-name': 'Homey',
        'job-name': 'Homey Print Job',
        'document-format': contentType,
      },
      'job-attributes-tag': {
        'copies': copies,
        'sides': sides || 'one-sided',
        'media': paperSize || 'iso_a4_210x297mm',
        'print-color-mode': colorMode || 'color',
      },
      data: imageBuffer,
    };

    await new Promise((resolve, reject) => {
      printer.execute('Print-Job', msg, (err, res) => {
        if (err) return reject(err);

        const statusCode = res?.['status-code'] ?? res?.['statusCode'];
        const id = res?.['job-attributes-tag']?.['job-id'];
        this.log('Print job submitted — status:', statusCode, 'id:', id);

        if (statusCode === 'successful-ok' ||
            statusCode === 'successful-ok-ignored-or-substituted-attributes') {
          resolve(id);
        } else {
          reject(new Error(`Printer returned status: ${statusCode}`));
        }
      });
    });
  }

  async pollJobStatus(printer, jobId) {
    const deadline = Date.now() + JOB_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, JOB_POLL_INTERVAL_MS));

      const jobState = await new Promise((resolve, reject) => {
        printer.execute('Get-Job-Attributes', {
          'operation-attributes-tag': {
            'requesting-user-name': 'Homey',
            'job-id': jobId,
            'requested-attributes': ['job-state'],
          },
        }, (err, res) => {
          if (err) return reject(err);
          resolve(res?.['job-attributes-tag']?.['job-state']);
        });
      });

      this.log('Job state:', jobState);

      // IPP job states: 3=pending, 4=pending-held, 5=processing, 6=processing-stopped,
      // 7=canceled, 8=aborted, 9=completed
      if (jobState === 9 || jobState === 'completed') return;
      if (jobState === 8 || jobState === 'aborted') throw new Error(this.homey.__('error.job_aborted'));
      if (jobState === 7 || jobState === 'canceled') throw new Error(this.homey.__('error.job_canceled'));
    }

    throw new Error(this.homey.__('error.job_timeout'));
  }

  fetchImageBuffer(url, redirectsLeft = MAX_REDIRECTS) {
    return new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? require('https') : require('http');

      const req = lib.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectsLeft === 0) return reject(new Error(this.homey.__('error.too_many_redirects')));
          return this.fetchImageBuffer(res.headers.location, redirectsLeft - 1).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to fetch image, HTTP status: ${res.statusCode}`));
        }

        const contentType = detectContentType(res.headers['content-type'], url);

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
        res.on('error', reject);
      });

      req.setTimeout(FETCH_TIMEOUT_MS, () => {
        req.destroy(new Error(this.homey.__('error.fetch_timeout')));
      });

      req.on('error', reject);
    });
  }

}

module.exports = EpsonET2850App;
