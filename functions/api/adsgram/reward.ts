export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userid');
  const secureToken = url.searchParams.get('secure_token');

  // Adsgram Postback Verification
  // 1. You should verify the signature if Adsgram sends one (e.g. url.searchParams.get('sign'))
  // 2. Or simply use a secure_token in the URL that only Adsgram knows.
  const EXPECTED_TOKEN = env.ADSGRAM_SECURE_TOKEN || "DEFAULT_SECURE_TOKEN_REPLACE_ME";

  if (secureToken !== EXPECTED_TOKEN) {
    return new Response('Unauthorized: Invalid secure token', { status: 401 });
  }

  if (!userId) {
    return new Response('Missing userid parameter', { status: 400 });
  }

  const FIREBASE_API_KEY = env.FIREBASE_API_KEY || "AIzaSyB6jUo0n3twSTlo4UOS8EUP5LT5FgGVIP4";
  const PROJECT_ID = "gen-lang-client-0163667078";
  const DB_ID = "ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a";
  const REWARD_POINTS = 30;
  const DAILY_AD_LIMIT = 20;

  try {
    // 1. Authenticate anonymously using Firebase Auth REST API to bypass read/write rules
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    });
    
    if (!authRes.ok) {
      throw new Error('Firebase Auth failed');
    }
    const authData = await authRes.json();
    const idToken = authData.idToken;

    // 2. Fetch User Document
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents/users/${userId}`;
    const userRes = await fetch(userDocUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${idToken}` }
    });

    let userData = null;
    if (userRes.ok) {
      userData = await userRes.json();
    } else {
      return new Response('User not found', { status: 404 });
    }

    // 3. Check Daily Limit
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const fields = userData.fields || {};
    const currentPoints = fields.coins ? parseInt(fields.coins.integerValue || '0', 10) : 0;
    
    const dailyAdsStr = fields.dailyAdsDate ? fields.dailyAdsDate.stringValue : '';
    let adsWatchedToday = fields.adsWatchedToday ? parseInt(fields.adsWatchedToday.integerValue || '0', 10) : 0;
    
    if (dailyAdsStr !== todayStr) {
      adsWatchedToday = 0; 
    }

    if (adsWatchedToday >= DAILY_AD_LIMIT) {
      return new Response('Daily limit reached', { status: 403 });
    }

    // 4. Record the task
    const txId = crypto.randomUUID();
    const taskDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents/user_tasks/${txId}`;
    const taskData = {
      fields: {
        telegramId: { stringValue: userId },
        type: { stringValue: 'adsgram_reward' },
        reward: { integerValue: REWARD_POINTS.toString() },
        createdAt: { timestampValue: now.toISOString() },
        status: { stringValue: 'completed' }
      }
    };

    await fetch(taskDocUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    // 5. Update user points and ad count
    const updateMask = [
      'coins', 
      'adsWatchedToday', 
      'dailyAdsDate'
    ].map(field => `updateMask.fieldPaths=${field}`).join('&');

    const updatedUserFields = {
      fields: {
        ...fields,
        coins: { integerValue: (currentPoints + REWARD_POINTS).toString() },
        adsWatchedToday: { integerValue: (adsWatchedToday + 1).toString() },
        dailyAdsDate: { stringValue: todayStr }
      }
    };

    const updateRes = await fetch(`${userDocUrl}?${updateMask}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedUserFields)
    });

    if (!updateRes.ok) {
      throw new Error('Failed to update user');
    }

    return new Response(JSON.stringify({ success: true, points: REWARD_POINTS }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
