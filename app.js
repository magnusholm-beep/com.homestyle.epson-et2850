'use strict';

const Homey = require('homey');

class EpsonET2850App extends Homey.App {

  async onInit() {
    this.log('Epson ET-2850 app has started');

    const printImageAction = this.homey.flow.getActionCard('print_image_url');

    printImageAction.registerRunListener(async (args) => {
      const { printer_ip, image_url, copies } = args;

      this.log(`Printing from URL: ${image_url} to ${printer_ip}`);

      try {
        await this.printImageFromUrl(printer_ip, image_url, copies || 1);
        return true;
      } catch (err) {
        this.error('Print failed:', err.message);
        throw new Error(`Print failed: ${err.message}`);
      }
    });
  }

  async printImageFromUrl(printerIp, imageUrl, copies) {
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
        'sides': 'one-sided',
        'media': 'iso_a4_210x297mm',
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