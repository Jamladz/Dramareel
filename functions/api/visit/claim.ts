export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    const userId = data.userid;

    if (!userId) {
      return new Response('Missing userid parameter', { status: 400 });
    }

    const FIREBASE_API_KEY = env.FIREBASE_API_KEY || "AIzaSyB6jUo0n3twSTlo4UOS8EUP5LT5FgGVIP4";
    const PROJECT_ID = "gen-lang-client-0163667078";
    const DB_ID = "ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a";
    const REWARD_POINTS = 50; // 50 points for website visit
    const TASK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

    // 1. Authenticate anonymously using Firebase Auth REST API
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

    // 3. Check 24 hours cooldown
    const now = Date.now();
    const fields = userData.fields || {};
    const currentPoints = fields.coins ? parseInt(fields.coins.integerValue || '0', 10) : 0;
    const lastSiteVisitClaim = fields.lastSiteVisitClaim ? parseInt(fields.lastSiteVisitClaim.integerValue || '0', 10) : 0;
    
    if (now - lastSiteVisitClaim < TASK_COOLDOWN_MS) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cooldown active',
        remainingMs: TASK_COOLDOWN_MS - (now - lastSiteVisitClaim)
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Update user points and last claim time
    const updateMask = [
      'coins', 
      'lastSiteVisitClaim'
    ].map(field => `updateMask.fieldPaths=${field}`).join('&');

    const updatedUserFields = {
      fields: {
        ...fields,
        coins: { integerValue: (currentPoints + REWARD_POINTS).toString() },
        lastSiteVisitClaim: { integerValue: now.toString() }
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

    return new Response(JSON.stringify({ 
      success: true, 
      points: REWARD_POINTS,
      newTotal: currentPoints + REWARD_POINTS,
      lastClaim: now
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
