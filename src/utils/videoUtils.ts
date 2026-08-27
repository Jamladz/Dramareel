export interface VideoUrlInfo {
  type: 'youtube' | 'dailymotion' | 'vimeo' | 'googledrive' | 'iframe' | 'hls' | 'mp4';
  embedUrl?: string;
  originalUrl: string;
  videoId?: string;
  thumbnailUrl?: string;
}

export function cleanVideoUrlInput(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // If user pasted an <iframe> HTML tag, extract src="..."
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return iframeSrcMatch[1];
  }
  return trimmed;
}

export function parseVideoUrl(url: string, autoplay: boolean = true): VideoUrlInfo {
  const safeUrl = cleanVideoUrlInput(url);

  if (!safeUrl) {
    return { type: 'mp4', originalUrl: '' };
  }

  // 1. YouTube Detection
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const ytMatch = safeUrl.match(ytRegExp);
  if (ytMatch && ytMatch[2] && ytMatch[2].length === 11) {
    const videoId = ytMatch[2];
    const autoParam = autoplay ? 1 : 0;
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=${autoParam}&enablejsapi=1&rel=0&playsinline=1&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      originalUrl: safeUrl,
    };
  }

  // 2. Dailymotion Detection
  if (safeUrl.includes('dailymotion.com') || safeUrl.includes('dai.ly')) {
    let videoId = '';
    
    // Check query param video=xarbqda
    const paramMatch = safeUrl.match(/[?&]video=([a-zA-Z0-9]+)/);
    if (paramMatch && paramMatch[1]) {
      videoId = paramMatch[1];
    } else {
      // Check path video/xarbqda or embed/video/xarbqda or dai.ly/xarbqda
      const pathMatch = safeUrl.match(/(?:video\/|dai\.ly\/)([a-zA-Z0-9]+)/);
      if (pathMatch && pathMatch[1]) {
        videoId = pathMatch[1];
      }
    }

    const autoParam = autoplay ? '1' : '0';

    if (videoId) {
      return {
        type: 'dailymotion',
        videoId,
        embedUrl: `https://geo.dailymotion.com/player.html?video=${videoId}&autoplay=${autoParam}&mute=0&controls=0&queue-enable=0&queue-autoplay-next=0&ui-start-screen-info=0&ui-logo=0&sharing-enable=0&endscreen-enable=0`,
        thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${videoId}`,
        originalUrl: safeUrl,
      };
    } else {
      let embedUrl = safeUrl;
      if (!embedUrl.includes('autoplay=')) {
        embedUrl += embedUrl.includes('?') ? `&autoplay=${autoParam}` : `?autoplay=${autoParam}`;
      }
      if (!embedUrl.includes('queue-enable=0')) {
        embedUrl += '&controls=0&queue-enable=0&queue-autoplay-next=0&ui-start-screen-info=0&ui-logo=0&sharing-enable=0&endscreen-enable=0';
      }
      return {
        type: 'dailymotion',
        embedUrl,
        originalUrl: safeUrl,
      };
    }
  }

  // 3. Vimeo Detection
  if (safeUrl.includes('vimeo.com')) {
    const vimeoMatch = safeUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      const videoId = vimeoMatch[1];
      const autoParam = autoplay ? 1 : 0;
      return {
        type: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=${autoParam}&autopause=0`,
        originalUrl: safeUrl,
      };
    }
  }

  // 4. Google Drive Detection
  if (safeUrl.includes('drive.google.com')) {
    const match = safeUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch = safeUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = (match && match[1]) || (idMatch && idMatch[1]);
    if (id) {
      return {
        type: 'googledrive',
        videoId: id,
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        originalUrl: safeUrl,
      };
    }
  }

  // 5. Check for HLS (.m3u8)
  if (safeUrl.includes('.m3u8')) {
    return {
      type: 'hls',
      originalUrl: safeUrl,
    };
  }

  // 6. Generic Embed / Iframe Web Player URLs
  const isDirectVideoFile = /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(safeUrl);
  const isEmbedLikeUrl = safeUrl.includes('player') || safeUrl.includes('embed') || safeUrl.includes('iframe') || safeUrl.includes('.html');

  if (!isDirectVideoFile && isEmbedLikeUrl) {
    const autoParam = autoplay ? '1' : '0';
    let finalEmbed = safeUrl;
    if (!safeUrl.includes('autoplay=')) {
      finalEmbed += safeUrl.includes('?') ? `&autoplay=${autoParam}` : `?autoplay=${autoParam}`;
    }
    return {
      type: 'iframe',
      embedUrl: finalEmbed,
      originalUrl: safeUrl,
    };
  }

  // 7. Default Direct MP4 / Video file
  return {
    type: 'mp4',
    originalUrl: safeUrl,
  };
}

