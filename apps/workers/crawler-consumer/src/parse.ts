/**
 * Link extractor using HTMLRewriter (streaming, injection-safe).
 * Resolves relative URLs against baseUrl, handles <base href>, skips non-HTTP.
 */

export async function extractLinks(
  htmlBody: ReadableStream<Uint8Array> | string,
  baseUrl: string
): Promise<string[]> {
  const links: string[] = [];
  let effectiveBase = baseUrl;

  // Create a temporary response to run HTMLRewriter against
  const response = new Response(
    typeof htmlBody === 'string' ? htmlBody : htmlBody,
    { headers: { 'Content-Type': 'text/html' } }
  );

  await new HTMLRewriter()
    // First pass: detect <base href>
    .on('base[href]', {
      element(el) {
        const href = el.getAttribute('href');
        if (href) {
          try {
            effectiveBase = new URL(href, baseUrl).toString();
          } catch {
            // ignore invalid base
          }
        }
      },
    })
    .on('a[href]', {
      element(el) {
        const href = el.getAttribute('href');
        if (!href) return;

        // Skip fragment-only, javascript:, mailto:, tel:
        if (href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('data:')) {
          return;
        }

        try {
          const resolved = new URL(href, effectiveBase);
          // Only HTTP/HTTPS
          if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return;
          // Remove fragment before dedup
          resolved.hash = '';
          links.push(resolved.toString());
        } catch {
          // Malformed URL — skip
        }
      },
    })
    .transform(response)
    .arrayBuffer(); // drain the stream

  // Dedup while preserving order
  return [...new Set(links)];
}
