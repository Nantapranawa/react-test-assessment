fetch('http://localhost:8000/api/webhooks/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        from: '62811111111',
        to: 'bot',
        timestamp: new Date().toISOString(),
        message: {
            content: {
                type: 'text',
                text: 'Hello from mock webhook! Is socket live?'
            }
        }
    })
}).then(async r => {
    console.log(r.status);
    console.log(await r.text());
});
