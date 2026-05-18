// Deploy this to Cloudflare Workers (free tier).
// Set two environment variables (Secrets) in the Worker settings:
//   GITHUB_CLIENT_ID     — your GitHub OAuth App Client ID
//   GITHUB_CLIENT_SECRET — your GitHub OAuth App Client Secret

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://volume9architects.in',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id:    env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope:        'repo,user',
        state:        url.searchParams.get('state') || '',
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params}`, 302
      );
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');

      const resp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept':       'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id:     env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri:  `${url.origin}/callback`,
        }),
      });

      const data = await resp.json();

      if (data.error || !data.access_token) {
        return htmlPage('error', data.error || 'OAuth failed');
      }

      return htmlPage('success', JSON.stringify({
        token:    data.access_token,
        provider: 'github',
      }));
    }

    return new Response('Not found', { status: 404 });
  },
};

function htmlPage(status, content) {
  const jsContent = JSON.stringify(content);
  const script = `
(function() {
  var content = ${jsContent};
  function receiveMessage(e) {
    window.opener.postMessage('authorization:github:${status}:' + content, e.origin);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();`;

  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>${script}<\/script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
