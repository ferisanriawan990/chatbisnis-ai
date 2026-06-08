const fs = require('fs');

async function main() {
  const headers = {
    'accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Api-Key': 'ChatBisnisApi2026!'
  };

  console.log("Stopping session...");
  await fetch("http://202.155.157.219:3000/api/sessions/stop", {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'default', logout: true })
  }).catch(()=>null);

  console.log("Starting session...");
  await fetch("http://202.155.157.219:3000/api/sessions/start", {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'default' })
  });

  console.log("Waiting for QR code to be ready (5 seconds)...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("Fetching QR code...");
  const res = await fetch("http://202.155.157.219:3000/api/default/auth/qr", { headers });
  const data = await res.json();

  if (data && data.mimetype && data.data) {
    const html = `
      <html>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f2f5;">
          <div style="background:white; padding:40px; border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.1); text-align:center; font-family:sans-serif;">
            <h1 style="color:#111827; margin-bottom:10px;">Scan QR WhatsApp</h1>
            <p style="color:#6b7280; margin-bottom:30px;">Arahkan kamera WhatsApp Anda ke gambar di bawah ini.</p>
            <img src="data:${data.mimetype};base64,${data.data}" style="width:300px; height:300px; border:2px solid #e5e7eb; border-radius:10px; padding:10px;"/>
            <p style="color:#ef4444; font-weight:bold; margin-top:20px;">QR hangus dalam 60 detik!</p>
          </div>
        </body>
      </html>
    `;
    fs.writeFileSync('qr.html', html);
    console.log("SUCCESS! qr.html created.");
  } else {
    console.log("Failed to get QR:", data);
  }
}

main();
