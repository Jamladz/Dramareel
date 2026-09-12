export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  FIREBASE_PROJECT_ID: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const url = new URL(request.url);
      if (url.pathname !== '/notify') {
        return new Response('Not Found', { status: 404 });
      }

      const body = await request.json() as any;
      const { movieId, movieTitle, movieDescription, movieImage, adminToken } = body;

      if (!movieId || !movieTitle || !adminToken) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // We process the notifications in the background so the admin doesn't wait
      ctx.waitUntil(processNotifications(env, movieId, movieTitle, movieDescription, movieImage, adminToken));

      return new Response(JSON.stringify({ success: true, message: 'Notification process started' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  },
};

async function processNotifications(env: Env, movieId: string, movieTitle: string, movieDescription: string, movieImage: string, adminToken: string) {
  const projectId = env.FIREBASE_PROJECT_ID || 'ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a';
  const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  
  try {
    // 1. Fetch users from Firestore
    // Note: In a real system with 50k users, pagination (pageToken) is needed. We loop until no more pages.
    let users: any[] = [];
    let nextPageToken = '';
    
    do {
      let queryUrl = `${firestoreBaseUrl}/users?pageSize=1000`;
      if (nextPageToken) queryUrl += `&pageToken=${nextPageToken}`;
      
      const res = await fetch(queryUrl, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) {
        console.error('Failed to fetch users', await res.text());
        break;
      }
      
      const data = await res.json() as any;
      if (data.documents) {
        users = users.concat(data.documents);
      }
      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);

    console.log(`Found ${users.length} users. Filtering for writeAccessGranted and Telegram IDs...`);

    // 2. Filter users who have telegram chat IDs and have granted write access
    const targetUsers = users.filter((doc: any) => {
      const fields = doc.fields || {};
      const tgId = fields.id?.stringValue;
      // Depending on how writeAccessGranted is saved (boolean)
      const writeAccess = fields.writeAccessGranted?.booleanValue;
      return tgId && tgId.startsWith('tg_') && writeAccess === true;
    });

    console.log(`Target users: ${targetUsers.length}`);

    // Telegram API URL
    const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const caption = `🎬 فيلم جديد متاح الآن!\n\n🍿 ${movieTitle}\n\n${movieDescription ? movieDescription + '\n\n' : ''}🔥 شاهد الفيلم الآن مجاناً 👇`;

    // 3. Process in batches to avoid rate limits (Telegram limit is ~30 msgs/sec)
    const batchSize = 25; 
    
    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = targetUsers.slice(i, i + batchSize);
      
      const promises = batch.map(async (userDoc: any) => {
        const fields = userDoc.fields;
        const tgUserId = fields.id.stringValue.replace('tg_', ''); // Real Telegram numeric ID
        const userId = fields.id.stringValue;
        
        // Check if already notified for this movie
        const notifDocPath = `notifications/${movieId}_${userId}`;
        const checkRes = await fetch(`${firestoreBaseUrl}/${notifDocPath}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (checkRes.status === 200) {
          // Already notified
          return;
        }

        // Send Telegram Message
        const inlineKeyboard = {
          inline_keyboard: [[
            { text: '🎬 مشاهدة الفيلم', url: `https://t.me/DramaReel_bot/app?startapp=movie_${movieId}` }
          ]]
        };

        const tgPayload = {
          chat_id: tgUserId,
          photo: movieImage,
          caption: caption,
          reply_markup: JSON.stringify(inlineKeyboard)
        };

        let status = 'failed';
        let errorMsg = '';

        try {
          const tgRes = await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tgPayload)
          });
          const tgData = await tgRes.json() as any;
          
          if (tgData.ok) {
            status = 'sent';
          } else {
            if (tgData.error_code === 403) status = 'blocked';
            else status = 'failed';
            errorMsg = tgData.description || 'Unknown error';
          }
        } catch (err: any) {
          status = 'failed';
          errorMsg = err.message;
        }

        // Save status to Firestore
        const notifPayload = {
          fields: {
            movieId: { stringValue: movieId },
            userId: { stringValue: userId },
            status: { stringValue: status },
            error: { stringValue: errorMsg },
            sentAt: { integerValue: Date.now().toString() }
          }
        };

        await fetch(`${firestoreBaseUrl}/${notifDocPath}?documentId=${movieId}_${userId}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notifPayload)
        });
      });

      await Promise.all(promises);
      // Wait a second between batches to respect Telegram rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (err) {
    console.error('Error in background process:', err);
  }
}
