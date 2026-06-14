import { AIService } from './src/lib/ai';

async function testAudio() {
  const dummyBase64 = Buffer.from('dummy audio data').toString('base64');
  try {
    const res = await AIService.transcribeAudio('dummy_key', `data:audio/ogg;base64,${dummyBase64}`, 'audio/ogg; codecs=opus');
    console.log(res);
  } catch (err) {
    console.error('Test Error:', err);
  }
}

testAudio();
