const PAM = require('authenticate-pam');
const user = process.argv[2];
const pass = process.argv[3];
if (!user || !pass) { console.error('usage: node test-pam.js USER PASS'); process.exit(2); }
PAM.authenticate(user, pass, function(err) { if (err) { console.error('PAM auth failed'); process.exit(1); } else { console.log('PAM auth success'); process.exit(0); } });
