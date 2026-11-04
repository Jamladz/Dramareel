export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = (await request.json()) as any;
    const { movieId, movieTitle, movieDescription, movieImage, adminToken } = body;

    if (!movieId || !movieTitle || !adminToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (context.waitUntil) {
      context.waitUntil(processNotifications(env, movieId, movieTitle, movieDescription, movieImage, adminToken));
    } else {
      processNotifications(env, movieId, movieTitle, movieDescription, movieImage, adminToken).catch((err) => {
        console.error('Background process error:', err);
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Notification process started' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function processNotifications(
  env: any,
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
        console.error('Failed to fetch users', await res.text());
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
    console.error('Error in background process:', err);
  }
}
