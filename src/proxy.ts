import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('comif_auth')?.value;
  const { pathname } = request.nextUrl;

  // Si l'utilisateur essaie d'accéder à la page de login, on le laisse passer
  if (pathname.startsWith('/login') || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/logo.png')) {
    return NextResponse.next();
  }

  // Si pas de cookie du tout, redirection vers login
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si on essaie d'accéder à l'espace admin, il faut le cookie "admin"
  if (pathname.startsWith('/admin') && authCookie !== 'admin') {
    return NextResponse.redirect(new URL('/login?error=admin', request.url));
  }

  // Si le cookie est "bar" ou "admin", on autorise l'accès à l'accueil et au POS
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|login).*)',
  ],
};
