const pdfParse = require('pdf-parse');
const fs = require('fs');
const data = fs.readFileSync('C:/OM SHOP/setup pdf.pdf');
pdfParse(data).then(result => {
  console.log('=== PDF TEXT ===');
  console.log(result.text.substring(0, 8000));
}).catch(err => console.error('Error:', err.message));
