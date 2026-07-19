const run = async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@danceflow.com', password: 'owner123' })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    if (!token) {
      console.log('Login failed', loginData);
      process.exit(1);
    }

    console.log('Logged in successfully. Triggering cron jobs...');

    const triggerRes = await fetch('http://localhost:5000/api/whatsapp/trigger-cron', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const triggerData = await triggerRes.json();
    console.log('Trigger Response:', triggerData);
  } catch (error) {
    console.error('Error:', error);
  }
};

run();
