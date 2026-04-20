'use strict';

const Homey = require('homey');

class EpsonET2850App extends Homey.App {

  async onInit() {
    this.log('Epson ET-2850 app has started');

    const printImageAction = this.homey.flow.getActionCard('print_image_url');

    printImageAction.registerRunListener(async (args) => {
      const { printer_ip, image_url, copies, paper_size, sides, color_mode } = args;

      this.log(`Printing from URL: ${image_url} to ${printer_ip}`);

      try {
        this.validateInput(printer_ip, image_url);
        await this.printImageFromUrl(printer_ip, image_url, copies || 1, paper_size, sides, color_mode);
        return true;
      } catch (err) {
        this.error('Print failed:', err.message);
        throw new Error(`Print failed: ${err.message}`);
      }
    });
  }

  validateInput(printerIp, imageUrl) {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(printerIp) || printerIp.split('.').some(p => parseInt(p, 10) > 255)) {
      throw new Error(`Invalid printer IP address: ${printerIp}`);
    }
    if (!/^https?:\/\/.+/.test(imageUrl)) {
      throw new Error('Invalid image URL: must start with http:// or https://');
    }
  }

  async printImageFromUrl(printerIp, imageUrl, copies, paperSize, sides, colorMode) {
    const ipp = require('ipp');

    const imageBuffer = await this.fetchImageBuffer(imageUrl);
    const contentType = this.detectContentType(imageUrl);

    const printerUrl = `ipps://${printerIp}:631/ipp/print`;
    // rejectUnauthorized: false is scoped to this printer connection only,
    // because Epson printers use self-signed certificates.
    const printer = new ipp.Printer(printerUrl, { rejectUnauthorized: false });

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

    return new Promise((resolve, reject) => {
      printer.execute('Print-Job', msg, (err, res) => {
        if (err) return reject(err);

        const statusCode = res?.['status-code'] ?? res?.['statusCode'];
        this.log('Print job status:', statusCode, '— job id:', res?.['job-attributes-tag']?.['job-id']);

        if (statusCode === 'successful-ok' ||
            statusCode === 'successful-ok-ignored-or-substituted-attributes') {
          resolve(res);
        } else {
          reject(new Error(`Printer returned status: ${statusCode}`));
        }
      });
    });
  }

  fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? require('https') : require('http');

      lib.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to fetch image, HTTP status: ${res.statusCode}`));
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  detectContentType(url) {
    const lower = url.toLowerCase().split('?')[0];
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
  }

}

module.exports = EpsonET2850App;