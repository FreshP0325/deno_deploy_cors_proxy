import { serve } from "https://deno.land/std@0.152.0/http/server.ts";
import { CSS, render } from "https://deno.land/x/gfm@0.1.22/mod.ts";

const ALLOWED_DOMAINS = {
  ajax: "ajax.googleapis.com",
  cdnjs: "cdnjs.cloudflare.com",
  zoho: "js.zohocdn.com"
};

function addCorsIfNeeded(response: Response) {
  const headers = new Headers(response.headers);

  if (!headers.has("access-control-allow-origin")) {
    headers.set("access-control-allow-origin", "*");
  }

  return headers;
}

function getFullUrl(url: string) {
  const [domain, path] = url.split("/", 2);
  return `https://${ALLOWED_DOMAINS[domain] || domain}/${path || ""}`;
}

async function handleRequest(request: Request) {
  const { pathname, search } = new URL(request.url);
  const url = getFullUrl(pathname.substring(1) + search);

  console.log("proxy to %s", url);
  const corsHeaders = addCorsIfNeeded(new Response());
  if (request.method.toUpperCase() === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const response = await fetch(url, request);
  const headers = addCorsIfNeeded(response);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  const readme = await Deno.readTextFile("./README.md");
  const body = render(readme);
  const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CORS Proxy</title>
        <style>
          body {
            margin: 0;
            background-color: var(--color-canvas-default);
            color: var(--color-fg-default);
          }
          main {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }
          ${CSS}
        </style>
      </head>
      <body data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
        <main class="markdown-body">
          ${body}
        </main>
      </body>
    </html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=utf-8",
    },
  });
}
