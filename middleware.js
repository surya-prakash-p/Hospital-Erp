import { NextResponse } from 'next/server';

// Route permissions mapping
const ROUTE_PERMISSIONS = [
  { path: '/admin-dashboard', allowed: ['Hospital Admin', 'System Manager'] },
  { path: '/consultation', allowed: ['Doctor', 'Hospital Admin', 'System Manager'] },
  { path: '/doctors', allowed: ['Doctor', 'Hospital Admin', 'System Manager'] },
  { path: '/pharmacy', allowed: ['Pharmacist', 'Doctor', 'Hospital Admin', 'System Manager'] },
  { path: '/inventory', allowed: ['Pharmacist', 'Store Manager', 'Doctor', 'Hospital Admin', 'System Manager'] },
  { path: '/lab', allowed: ['Lab Technician', 'Doctor', 'Hospital Admin', 'System Manager'] },
  { path: '/reception', allowed: ['Receptionist', 'Doctor', 'Hospital Admin', 'System Manager'] },
  { path: '/appointments', allowed: ['Receptionist', 'Doctor', 'Hospital Admin', 'System Manager'] },
  { path: '/patient-registry', allowed: ['Receptionist', 'Doctor', 'Nurse', 'Hospital Admin', 'System Manager'] },
  { path: '/billing', allowed: ['Billing Clerk', 'Hospital Admin', 'System Manager'] },
  { path: '/finance', allowed: ['Billing Clerk', 'Hospital Admin', 'System Manager'] }
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip static assets, next internal routes, and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/login' ||
    pathname === '/unauthorized' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check Better Auth session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token') || 
                        request.cookies.get('__Secure-better-auth.session_token') ||
                        request.cookies.get('hospital_erp_user');

  if (!sessionCookie || !sessionCookie.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Parse user profile from session cookie if present
  let userRole = 'Staff Member';
  let userRoles = [];
  let userPermissions = [];
  try {
    const parsed = JSON.parse(sessionCookie.value);
    userRole = parsed.role || parsed.roles?.[0] || 'Staff Member';
    userRoles = Array.isArray(parsed.roles) && parsed.roles.length > 0 
      ? parsed.roles 
      : (parsed.role ? [parsed.role] : ['Staff Member']);
    userPermissions = Array.isArray(parsed.permissions) ? parsed.permissions : [];
  } catch (e) {}

  // Match current route against protection rules
  const matchedRule = ROUTE_PERMISSIONS.find(rule => 
    pathname === rule.path || pathname.startsWith(`${rule.path}/`)
  );

  if (matchedRule) {
    const isAdmin = userRole === 'Hospital Admin' || 
                    userRole === 'System Manager' ||
                    userRoles.includes('Hospital Admin') || 
                    userRoles.includes('System Manager');

    const hasAllowedRole = userRoles.some(r => matchedRule.allowed.includes(r)) || 
                           matchedRule.allowed.includes(userRole);

    const hasExplicitPermission = userPermissions.includes('*') ||
                                  userPermissions.includes(pathname) ||
                                  userPermissions.includes(matchedRule.path) ||
                                  userPermissions.some(p => {
                                    const pClean = (p || '').toLowerCase().replace('/', '').trim();
                                    const pathClean = pathname.toLowerCase().replace('/', '').trim();
                                    return pClean === pathClean || pathClean.includes(pClean) || pClean.includes(pathClean);
                                  });

    const isAllowed = isAdmin || hasAllowedRole || hasExplicitPermission;

    if (!isAllowed) {
      // User is logged in but trying to access unauthorized route
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized).*)',
  ],
};
