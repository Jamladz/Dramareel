export interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  ASSETS?: Fetcher;
  TELEGRAM_BOT_TOKEN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_DATABASE_ID?: string;
  FIREBASE_API_KEY?: string;
  ADSGRAM_SECURE_TOKEN?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Dynamic TonConnect Manifest
    if (url.pathname === '/tonconnect-manifest.json') {
      const origin = url.origin;
      return new Response(
        JSON.stringify(
          {
            url: origin,
            name: 'DramaReel VIP',
            iconUrl: 'https://ton.org/download/ton_symbol.png',
            termsOfUseUrl: origin,
            privacyPolicyUrl: origin,
          },
          null,
          2
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }

    // Telegram Movie Notification Endpoint
    if (url.pathname === '/notify' && request.method === 'POST') {
      return handleNotify(request, env, ctx);
    }

    // Monetag 24h Claim Endpoint
    if (url.pathname === '/api/monetag/claim' && request.method === 'POST') {
      return handleRewardClaim(request, env, 'lastMonetagClaim', 100);
    }

    // Website Visit 24h Claim Endpoint
    if (url.pathname === '/api/visit/claim' && request.method === 'POST') {
      return handleRewardClaim(request, env, 'lastSiteVisitClaim', 50);
    }

    // Adsgram Postback Reward Endpoint
    if (url.pathname === '/api/adsgram/reward' && request.method === 'GET') {
      return handleAdsgramReward(request, env);
    }

    // Fallback to static assets (Vite SPA build)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },
};

async function handleNotify(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const body = (await request.json()) as any;
    const { movieId, movieTitle, movieDescription, movieImage, adminToken } = body;

    if (!movieId || !movieTitle || !adminToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const task = processNotifications(env, movieId, movieTitle, movieDescription, movieImage, adminToken);
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(task);
    } else {
      task.catch((err) => console.error('Background notification error:', err));
    }

    return new Response(JSON.stringify({ success: true, message: 'Notification process started' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}

async function processNotifications(
  env: Env,
  movieId: string,
  movieTitle: string,
  movieDescription: string,
  movieImage: string,
  adminToken: string
) {
  const projectId = env.FIREBASE_PROJECT_ID || 'gen-lang-client-0163667078';
  const databaseId = env.FIREBASE_DATABASE_ID || 'ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a';
  const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  const botToken = env.TELEGRAM_BOT_TOKEN || '7249827038:AAEvtM43K5_zPzF9O1E2W_Zg96Y6fM4ZtG8';

  try {
    let users: any[] = [];
    let nextPageToken = '';

    do {
      let queryUrl = `${firestoreBaseUrl}/users?pageSize=1000`;
      if (nextPageToken) queryUrl += `&pageToken=${nextPageToken}`;

      const res = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) {
        console.error('Failed to fetch users:', await res.text());
        break;
      }

      const data = (await res.json()) as any;
      if (data.documents) {
        users = users.concat(data.documents);
      }
      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);

    const targetUsers = users.filter((doc: any) => {
      const fields = doc.fields || {};
      const tgId = fields.id?.stringValue;
      const writeAccess =
        fields.writeAccessGranted?.booleanValue === true ||
        fields.telegramWriteAccessStatus?.stringValue === 'allowed';
      return tgId && tgId.startsWith('tg_') && writeAccess;
    });

    const tgPhotoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const tgMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const caption = `🎬 فيلم جديد متاح الآن!\n\n🍿 ${movieTitle}\n\n${
      movieDescription ? movieDescription + '\n\n' : ''
    }🔥 شاهد الفيلم الآن مجاناً 👇`;

    const batchSize = 25;
    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = targetUsers.slice(i, i + batchSize);

      const promises = batch.map(async (userDoc: any) => {
        const fields = userDoc.fields;
        const userId = fields.id.stringValue;
        const tgUserId = userId.replace('tg_', '');

        const notifDocPath = `notifications/${movieId}_${userId}`;
        const checkRes = await fetch(`${firestoreBaseUrl}/${notifDocPath}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (checkRes.status === 200) {
          return;
        }

        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '🎬 مشاهدة الفيلم',
                url: `https://t.me/DramaReel_bot/app?startapp=movie_${movieId}`,
              },
            ],
          ],
        };

        let status = 'failed';
        let errorMsg = '';

        try {
          let tgData: any = null;

          if (movieImage && movieImage.startsWith('http')) {
            const tgRes = await fetch(tgPhotoUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: tgUserId,
                photo: movieImage,
                caption,
                reply_markup: JSON.stringify(inlineKeyboard),
              }),
            });
            tgData = await tgRes.json();
          }

          // Fallback to sendMessage if photo wasn't sent or failed due to invalid image URL
          if (!tgData || (!tgData.ok && tgData.error_code !== 403)) {
            const fallbackRes = await fetch(tgMessageUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: tgUserId,
                text: caption,
                reply_markup: JSON.stringify(inlineKeyboard),
              }),
            });
            tgData = await fallbackRes.json();
          }

          if (tgData?.ok) {
            status = 'sent';
          } else {
            status = tgData?.error_code === 403 ? 'blocked' : 'failed';
            errorMsg = tgData?.description || 'Unknown error';
          }
        } catch (err: any) {
          status = 'failed';
          errorMsg = err?.message || 'Network error';
        }

        const notifPayload = {
          fields: {
            movieId: { stringValue: movieId },
            userId: { stringValue: userId },
            status: { stringValue: status },
            error: { stringValue: errorMsg },
            sentAt: { integerValue: Date.now().toString() },
          },
        };

        await fetch(`${firestoreBaseUrl}/${notifDocPath}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notifPayload),
        });
      });

      await Promise.all(promises);
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error('Error in background notification process:', err);
  }
}

async function handleRewardClaim(
  request: Request,
  env: Env,
  claimField: 'lastMonetagClaim' | 'lastSiteVisitClaim',
  rewardPoints: number
): Promise<Response> {
  try {
    const data = (await request.json()) as any;
    const userId = data.userid;

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing userid parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const FIREBASE_API_KEY = env.FIREBASE_API_KEY || 'AIzaSyB6jUo0n3twSTlo4UOS8EUP5LT5FgGVIP4';
    const PROJECT_ID = env.FIREBASE_PROJECT_ID || 'gen-lang-client-0163667078';
    const DB_ID = env.FIREBASE_DATABASE_ID || 'ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a';
    const TASK_COOLDOWN_MS = 24 * 60 * 60 * 1000;

    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true }),
      }
    );

    if (!authRes.ok) {
      throw new Error('Firebase Auth failed');
    }
    const authData = (await authRes.json()) as any;
    const idToken = authData.idToken;

    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents/users/${userId}`;
    const userRes = await fetch(userDocUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const userData = (await userRes.json()) as any;
    const now = Date.now();
    const fields = userData.fields || {};
    const currentPoints = fields.coins ? parseInt(fields.coins.integerValue || '0', 10) : 0;
    const lastClaim = fields[claimField] ? parseInt(fields[claimField].integerValue || '0', 10) : 0;

    if (now - lastClaim < TASK_COOLDOWN_MS) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cooldown active',
          remainingMs: TASK_COOLDOWN_MS - (now - lastClaim),
        }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const updateMask = ['coins', claimField].map((field) => `updateMask.fieldPaths=${field}`).join('&');
    const updatedUserFields = {
      fields: {
        ...fields,
        coins: { integerValue: (currentPoints + rewardPoints).toString() },
        [claimField]: { integerValue: now.toString() },
      },
    };

    const updateRes = await fetch(`${userDocUrl}?${updateMask}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUserFields),
    });

    if (!updateRes.ok) {
      throw new Error('Failed to update user');
    }

    return new Response(
      JSON.stringify({
        success: true,
        points: rewardPoints,
        newTotal: currentPoints + rewardPoints,
        lastClaim: now,
      }),
      { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}

async function handleAdsgramReward(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userid');
  const secureToken = url.searchParams.get('secure_token');
  const EXPECTED_TOKEN = env.ADSGRAM_SECURE_TOKEN || 'DEFAULT_SECURE_TOKEN_REPLACE_ME';

  if (secureToken !== EXPECTED_TOKEN) {
    return new Response('Unauthorized: Invalid secure token', { status: 401, headers: CORS_HEADERS });
  }

  if (!userId) {
    return new Response('Missing userid parameter', { status: 400, headers: CORS_HEADERS });
  }

  const FIREBASE_API_KEY = env.FIREBASE_API_KEY || 'AIzaSyB6jUo0n3twSTlo4UOS8EUP5LT5FgGVIP4';
  const PROJECT_ID = env.FIREBASE_PROJECT_ID || 'gen-lang-client-0163667078';
  const DB_ID = env.FIREBASE_DATABASE_ID || 'ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a';
  const REWARD_POINTS = 30;
  const DAILY_AD_LIMIT = 20;

  try {
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true }),
      }
    );

    if (!authRes.ok) {
      throw new Error('Firebase Auth failed');
    }
    const authData = (await authRes.json()) as any;
    const idToken = authData.idToken;

    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents/users/${userId}`;
    const userRes = await fetch(userDocUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!userRes.ok) {
      return new Response('User not found', { status: 404, headers: CORS_HEADERS });
    }
    const userData = (await userRes.json()) as any;

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
      return new Response('Daily limit reached', { status: 403, headers: CORS_HEADERS });
    }

    const txId = crypto.randomUUID();
    const taskDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents/user_tasks/${txId}`;
    const taskData = {
      fields: {
        telegramId: { stringValue: userId },
        type: { stringValue: 'adsgram_reward' },
        reward: { integerValue: REWARD_POINTS.toString() },
        createdAt: { timestampValue: now.toISOString() },
        status: { stringValue: 'completed' },
      },
    };

    await fetch(taskDocUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    const updateMask = ['coins', 'adsWatchedToday', 'dailyAdsDate']
      .map((field) => `updateMask.fieldPaths=${field}`)
      .join('&');

    const updatedUserFields = {
      fields: {
        ...fields,
        coins: { integerValue: (currentPoints + REWARD_POINTS).toString() },
        adsWatchedToday: { integerValue: (adsWatchedToday + 1).toString() },
        dailyAdsDate: { stringValue: todayStr },
      },
    };

    const updateRes = await fetch(`${userDocUrl}?${updateMask}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUserFields),
    });

    if (!updateRes.ok) {
      throw new Error('Failed to update user');
    }

    return new Response(JSON.stringify({ success: true, points: REWARD_POINTS }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    return new Response(err?.message || 'Server error', { status: 500, headers: CORS_HEADERS });
  }
}
