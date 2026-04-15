const os = require('os');
const originalNetworkInterfaces = os.networkInterfaces;

// Hijack the OS module to intercept OpenClaw's hardware scan
os.networkInterfaces = function() {
    try {
        return originalNetworkInterfaces();
    } catch (e) {
        // If Android blocks the scan, feed OpenClaw this fake Linux server data!
        return {
            'lo': [{
                address: '127.0.0.1',
                netmask: '255.0.0.0',
                family: 'IPv4',
                mac: '00:00:00:00:00:00',
                internal: true,
                cidr: '127.0.0.1/8'
            }],
            'wlan0': [{
                address: '192.168.1.100',
                netmask: '255.255.255.0',
                family: 'IPv4',
                mac: '02:00:00:00:00:00',
                internal: false,
                cidr: '192.168.1.100/24'
            }]
        };
    }
};

console.log("🏴‍☠️ [MAD SCIENTIST] Android OS Bypass Active! Faking hardware data...");

