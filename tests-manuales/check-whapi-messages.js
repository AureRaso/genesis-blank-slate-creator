// Check recent messages from Whapi to see button responses
const WHAPI_TOKEN = 'Oo0UhiZVhcBN8JEeK65D547iNwBKO2oL';
const WHAPI_ENDPOINT = 'https://gate.whapi.cloud';

console.log('📥 Fetching recent messages from Whapi...\n');

fetch(`${WHAPI_ENDPOINT}/messages/list?count=10`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${WHAPI_TOKEN}`,
    'Content-Type': 'application/json',
  }
})
.then(response => response.json())
.then(data => {
  console.log('Recent messages:');
  console.log(JSON.stringify(data, null, 2));

  // Look for interactive messages
  if (data.messages) {
    const interactiveMessages = data.messages.filter(m => m.type === 'interactive');
    console.log('\n📱 Interactive messages found:', interactiveMessages.length);
    if (interactiveMessages.length > 0) {
      console.log('\nInteractive message details:');
      interactiveMessages.forEach(msg => {
        console.log(JSON.stringify(msg, null, 2));
      });
    }
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
