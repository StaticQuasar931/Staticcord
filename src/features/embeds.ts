const gifHosts = ['giphy.com', 'tenor.com', 'imgur.com'];

export function detectEmbeds(content) {
  const urls = extractUrls(content);
  return urls.map((url) => buildEmbed(url)).filter(Boolean);
}

function extractUrls(text) {
  const regex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(regex);
  return matches ? matches.slice(0, 4) : [];
}

function buildEmbed(url) {
  try {
    const parsed = new URL(url);
    if (gifHosts.includes(parsed.hostname)) {
      return { type: 'gif', url, title: 'GIF preview' };
    }
    if (/\.(png|jpg|jpeg|webp|gif)$/i.test(parsed.pathname)) {
      return { type: 'image', url, title: 'Image preview' };
    }
    return { type: 'link', url, title: url };
  } catch (error) {
    return null;
  }
}
