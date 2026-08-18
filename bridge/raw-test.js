/**
 * RAW BYTE TESTER — catches ANY data at ANY baud rate
 * No newline filtering — sees raw bytes as they arrive
 */
const { SerialPort } = require('serialport');

const PORT = 'COM3';
const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400];
let idx = 0;
let port = null;
let found = false;

console.log('\n🔍 RAW SERIAL TESTER - POORVA SHOP');
console.log('====================================');
console.log(`Port: ${PORT}`);
console.log('\n⚡ PRESS PRINT ON SCALE when you see "Listening..."');
console.log('(Testing each baud rate for 6 seconds)\n');

function tryNext() {
  if (found || idx >= BAUD_RATES.length) {
    if (!found) {
      console.log('\n❌ No data at ANY baud rate.');
      console.log('Possible issues:');
      console.log('  1. Wrong cable - try swapping TX/RX (null modem)');
      console.log('  2. Scale COM2 port not outputting - check scale settings');
      console.log('  3. Scale might need a command sent to it first');
      console.log('  4. Wrong port on scale - try the other DB9 port');
    }
    process.exit(0);
    return;
  }

  const baud = BAUD_RATES[idx++];
  if (port && port.isOpen) { try { port.close(); } catch(e){} }

  port = new SerialPort({ path: PORT, baudRate: baud, autoOpen: false });

  port.open(err => {
    if (err) { console.log(`${baud}: ❌ ${err.message}`); setTimeout(tryNext, 500); return; }
    console.log(`${baud} baud — Listening... (press PRINT on scale NOW!)`);
  });

  port.on('data', chunk => {
    found = true;
    console.log(`\n✅✅✅ DATA RECEIVED @ ${baud} BAUD! ✅✅✅`);
    console.log('HEX :', chunk.toString('hex').match(/.{1,2}/g).join(' '));
    console.log('TEXT:', chunk.toString('latin1').replace(/[\x00-\x1F\x7F-\xFF]/g, c =>
      `[${c.charCodeAt(0).toString(16).padStart(2,'0')}]`));
    console.log('\n👉 Update config.json: "baudRate":', baud);
    console.log('Then restart bridge!\n');

    // Keep listening for more
    port.on('data', more => {
      console.log('MORE:', more.toString('latin1').replace(/[\x00-\x1F\x7F-\xFF]/g, c =>
        `[${c.charCodeAt(0).toString(16).padStart(2,'0')}]`));
    });
    setTimeout(() => process.exit(0), 10000);
  });

  port.on('error', e => { console.log(`${baud}: error: ${e.message}`); });

  setTimeout(() => {
    if (!found) {
      if (port.isOpen) { try { port.close(); } catch(e){} }
      tryNext();
    }
  }, 6000);
}

tryNext();
process.on('SIGINT', () => { console.log('\nStopped.'); process.exit(); });
