'use strict';

module.exports = {
  async getInkLevels({ homey }) {
    const driver = homey.drivers.getDriver('epson-et2850');
    const devices = driver.getDevices();

    return devices.map(device => ({
      id: device.getData().id,
      name: device.getName(),
      levels: {
        black:   device.getCapabilityValue('ink_level_black'),
        cyan:    device.getCapabilityValue('ink_level_cyan'),
        magenta: device.getCapabilityValue('ink_level_magenta'),
        yellow:  device.getCapabilityValue('ink_level_yellow'),
      },
    }));
  },
};
