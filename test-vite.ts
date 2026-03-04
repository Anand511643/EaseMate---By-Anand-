import { createServer as createViteServer } from 'vite';

async function testVite() {
  console.log('Test: Creating Vite server...');
  try {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    console.log('Test: Vite server created.');
    process.exit(0);
  } catch (err) {
    console.error('Test: Vite Error:', err);
    process.exit(1);
  }
}

testVite();
