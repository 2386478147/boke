export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 如果访问的是 pages.dev 域名，跳转到自定义域名
  if (url.hostname.endsWith('.pages.dev')) {
    url.hostname = 'blog.mikleaf.com';
    return Response.redirect(url.toString(), 301);
  }
  
  return context.next();
}
