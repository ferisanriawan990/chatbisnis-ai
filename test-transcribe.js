// no dotenv

async function testTranscription() {
  const apiKey = process.env.AI_API_KEY; // or hardcode if needed, but we can just use the .env
  if (!apiKey) {
    console.log("No AI_API_KEY found in .env");
    return;
  }

  // Create a dummy audio buffer (just some random bytes for testing format)
  // Actually, random bytes might fail the whisper format check, but we just want to see if we get HTTP 400 about "file is required" or HTTP 400 "invalid format".
  // If we get "invalid format", it means the file upload worked! If we get "file is required", the FormData is broken.
  const buffer = Buffer.from('RIFF....WAVEfmt ...', 'utf8');
  
  const blob = new Blob([buffer], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');
  formData.append('model', 'whisper-1');

  try {
    const res = await fetch('https://ai.flaz.id/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testTranscription();
