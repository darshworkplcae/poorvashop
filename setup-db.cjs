const https = require('https');
const url = 'https://epssztufyxaltlftrrep.supabase.co/rest/v1/settings?select=*';

const options = {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3N6dHVmeXhhbHRsZnRycmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDc5MTAsImV4cCI6MjEwMjAyMzkxMH0.FJl5bp_9wk2yjJB8tBPKA4aGlfXUonRfDyBcX9nwj0s',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3N6dHVmeXhhbHRsZnRycmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDc5MTAsImV4cCI6MjEwMjAyMzkxMH0.FJl5bp_9wk2yjJB8tBPKA4aGlfXUonRfDyBcX9nwj0s'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Success: Successfully connected to Supabase and retrieved settings table!');
    } else {
      console.log('❌ Failed: Could not get settings table. Status:', res.statusCode);
      if (data.includes('relation') || data.includes('does not exist')) {
        console.log('\n======================================================');
        console.log('  RELATION DOES NOT EXIST');
        console.log('  You need to run the SQL code from supabase-setup.sql');
        console.log('  inside your Supabase project dashboard (SQL Editor).');
        console.log('======================================================');
      } else {
        console.log(data);
      }
    }
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
