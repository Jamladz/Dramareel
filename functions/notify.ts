export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json() as any;
    const { movieId, movieTitle, movieDescription, movieImage, adminToken } = body;

    if (!movieId || !movieTitle || !adminToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Run the notification dispatch in background
    if (context.waitUntil) {
      context.waitUntil(processNotifications(env, movieId, movieTitle, movieDescription, movieImage, adminToken));
    } else {
      processNotifications(env, movieId, movieTitle, movieDescription, movieImage, adminToken).catch(err => {
        console.error('Background process error:', err);
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Notification process started' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function processNotifications(env: any, movieId: string, movieTitle: string, movieDescription: string, movieImage: string, adminToken: string) {
  const projectId = env.FIREBASE_PROJECT_ID || 'gen-lang-client-0163667078';
  const databaseId = env.FIREBASE_DATABASE_ID || 'ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a';
  const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  
  // Retrieve Bot Token from Env or a fallback placeholder
  const botToken = env.TELEGRAM_BOT_TOKEN || '7249827038:AAEvtM43K5_zPzF9O1E2W_Zg96Y6fM4ZtG8';
  
  try {
    // 1. Fetch users from Firestore
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
      const writeAccess = fields.writeAccessGranted?.booleanValue;
      return tgId && tgId.startsWith('tg_') && writeAccess === true;
    });

    console.log(`Target users for notification: ${targetUsers.length}`);

    // Telegram API URL
    const tgUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const caption = `🎬 فيلم جديد متاح الآن!\n\n🍿 ${movieTitle}\n\n${movieDescription ? movieDescription + '\n\n' : ''}🔥 شاهد الفيلم الآن مجاناً 👇`;

    // 3. Process in batches to avoid rate limits
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
          return; // Already notified
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
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (err) {
    console.error('Error in background process:', err);
  }
}
