/**
 * POORVA SHOP — Serial Port Raw Data Tester
 * Tests different baud rates to find what the scale sends
 * Run: node test-serial.js
 */
const { SerialPort } = require('serialport');

const PORT = 'COM3';
const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400];
let currentIdx = 0;
let currentPort = null;
let dataReceived = false;
let testTimeout;

console.log('\n╔═══════════════════════════════════════╗');
console.log('║   SCALE SERIAL TESTER - POORVA SHOP  ║');
console.log('╚═══════════════════════════════════════╝\n');
console.log(`📡 Testing port: ${PORT}`);
console.log('🔌 Make sure scale is ON and connected\n');
console.log('⚡ NOW PRESS THE PRINT BUTTON ON THE SCALE!\n');
console.log('═══════════════════════════════════════════\n');

function testBaud(baudRate) {
  console.log(`\n🔍 Testing @ ${baudRate} baud...`);
  dataReceived = false;

  if (currentPort && currentPort.isOpen) {
    currentPort.close();
  }

  currentPort = new SerialPort({
    path: PORT,
    baudRate: baudRate,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    autoOpen: false,
  });

  currentPort.open((err) => {
    if (err) {
      console.log(`   ❌ Cannot open: ${err.message}`);
      nextBaud();
      return;
    }
    console.log(`   ✅ Port open @ ${baudRate} — Press PRINT on scale NOW!`);
  });

  currentPort.on('data', (data) => {
    dataReceived = true;
    clearTimeout(testTimeout);
    console.log(`\n🎉 DATA RECEIVED @ ${baudRate} BAUD!`);
    console.log('   Raw hex:', data.toString('hex').match(/.{1,2}/g).join(' '));
    console.log('   Raw text:', data.toString('ascii').replace(/[^\x20-\x7E]/g, '?'));
    console.log(`\n✅ CORRECT BAUD RATE = ${baudRate}`);
    console.log(`\n👉 Update bridge/config.json: "baudRate": ${baudRate}`);
    
    // Listen for more data
    currentPort.on('data', (more) => {
      console.log('   More data:', more.toString('ascii').replace(/[^\x20-\x7E]/g, '?'));
    });
    
    // Stop testing other baud rates
    currentIdx = BAUD_RATES.length;
  });

  currentPort.on('error', (err) => {
    console.log(`   ⚠️ Error: ${err.message}`);
  });

  // Wait 8 seconds at each baud rate for data
  testTimeout = setTimeout(() => {
    if (!dataReceived) {
      console.log(`   ⏳ No data @ ${baudRate} — trying next...`);
      nextBaud();
    }
  }, 8000);
}

function nextBaud() {
  if (currentPort && currentPort.isOpen) {
    currentPort.close();
  }
  currentIdx++;
  if (currentIdx < BAUD_RATES.length) {
    testBaud(BAUD_RATES[currentIdx]);
  } else {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  No data received at any baud rate!       ║');
    console.log('║  Possible issues:                         ║');
    console.log('║  1. Wrong COM port (check Device Manager) ║');
    console.log('║  2. Wrong cable (try null modem adapter)  ║');
    console.log('║  3. Scale COM2 not enabled - check manual ║');
    console.log('║  4. Need to press PRINT on scale          ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    process.exit(0);
  }
}

// Start testing
testBaud(BAUD_RATES[currentIdx]);

// Keep alive
process.on('SIGINT', () => {
  console.log('\n\nStopped by user.');
  if (currentPort && currentPort.isOpen) currentPort.close();
  process.exit(0);
});
