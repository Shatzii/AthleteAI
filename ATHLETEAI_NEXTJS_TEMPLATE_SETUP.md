# 🚀 AthleteAI Next.js Template Setup Guide

**Date**: September 3, 2025  
**Template**: AthleteAI Enterprise Template  
**Framework**: Next.js 15 with App Router  
**Status**: ✅ **READY FOR IMPLEMENTATION**  

---

## 📋 **Template Setup Overview**

This guide provides step-by-step instructions for creating the new AthleteAI template using Next.js 15, PostgreSQL with Drizzle ORM, and Clerk authentication. This template will migrate 80-90% of existing AthleteAI enterprise features while modernizing the architecture.

---

## 🛠️ **Prerequisites**

### **System Requirements**
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git repository access
- Clerk account for authentication

### **Development Tools**
- VS Code or preferred IDE
- Terminal/Command Line
- Git for version control

---

## 📁 **Step 1: Create Next.js Template (Week 1)**

### **1.1 Initialize Next.js Project**
```bash
# Create new Next.js project with TypeScript and Tailwind
npx create-next-app@latest athleteai-template \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --eslint \
  --import-alias "@/*"

cd athleteai-template
```

### **1.2 Install Core Dependencies**
```bash
# Database and ORM
npm install drizzle-orm postgres
npm install -D drizzle-kit @types/pg

# Authentication
npm install @clerk/nextjs

# Additional enterprise tools
npm install winston sentry @types/winston
npm install rate-limiter-flexible
npm install helmet cors

# Development tools
npm install -D @types/node @types/cors
```

### **1.3 Project Structure Setup**
```bash
# Create enterprise directory structure
mkdir -p src/app/api/auth
mkdir -p src/app/dashboard
mkdir -p src/components/ui
mkdir -p src/lib/database
mkdir -p src/lib/auth
mkdir -p src/lib/security
mkdir -p src/lib/monitoring
mkdir -p src/types
mkdir -p src/utils
```

---

## 🗄️ **Step 2: Database Setup**

### **2.1 Configure PostgreSQL Connection**
Create `src/lib/database/db.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });

// Drizzle instance
export const db = drizzle(client, { schema });

// Export schema for migrations
export * from './schema';
```

### **2.2 Create Database Schema**
Create `src/lib/database/schema.ts`:
```typescript
import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Users table (Clerk integration)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Athletes table
export const athletes = pgTable('athletes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  school: text('school'),
  position: text('position'),
  year: integer('year'),
  rating: integer('rating'),
  profileUrl: text('profile_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  details: text('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### **2.3 Configure Drizzle Migration**
Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### **2.4 Run Initial Migration**
```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

---

## 🔐 **Step 3: Authentication Setup**

### **3.1 Configure Clerk**
Create `src/lib/auth/clerk.ts`:
```typescript
import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ['/', '/api/health'],
  ignoredRoutes: ['/api/webhooks/clerk'],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### **3.2 Environment Variables**
Create `.env.local`:
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/athleteai"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Security
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### **3.3 Clerk Middleware**
Create `middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/protected(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

---

## 🛡️ **Step 4: Security Implementation**

### **4.1 Rate Limiting Setup**
Create `src/lib/security/rate-limit.ts`:
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

export const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 1000, // Number of requests
  duration: 900, // Per 15 minutes
});

export async function checkRateLimit(identifier: string) {
  try {
    await rateLimiter.consume(identifier);
    return { success: true };
  } catch (rejRes) {
    return {
      success: false,
      resetTime: new Date(Date.now() + rejRes.msBeforeNext),
    };
  }
}
```

### **4.2 Security Headers**
Create `src/lib/security/headers.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function securityHeaders(response: NextResponse) {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}
```

### **4.3 API Security Middleware**
Create `src/middleware/security.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { securityHeaders } from '@/lib/security/headers';

export async function securityMiddleware(request: NextRequest) {
  // Rate limiting
  const identifier = request.ip || 'anonymous';
  const rateLimitResult = await checkRateLimit(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime!.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Create response
  const response = NextResponse.next();

  // Apply security headers
  return securityHeaders(response);
}
```

---

## 📊 **Step 5: Monitoring Setup**

### **5.1 Winston Logger Configuration**
Create `src/lib/monitoring/logger.ts`:
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'athleteai-template' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### **5.2 Sentry Integration**
Create `src/lib/monitoring/sentry.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Console(),
  ],
});

export { Sentry };
```

---

## 🎨 **Step 6: UI Components Setup**

### **6.1 Tailwind Configuration**
Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
```

### **6.2 Base Layout Component**
Create `src/components/layout/Layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50">
            <main>{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### **6.3 Navigation Component**
Create `src/components/layout/Navigation.tsx`:
```typescript
'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function Navigation() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              AthleteAI
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isLoaded && isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <Link
                href="/sign-in"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## 🔧 **Step 7: API Routes Setup**

### **7.1 Health Check API**
Create `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { logger } from '@/lib/monitoring/logger';

export async function GET() {
  try {
    // Test database connection
    await db.execute('SELECT 1');

    logger.info('Health check passed');

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running',
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      },
      { status: 503 }
    );
  }
}
```

### **7.2 Athletes API**
Create `src/app/api/athletes/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { athletes } from '@/lib/database/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/monitoring/logger';
import { securityMiddleware } from '@/middleware/security';

export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResponse = await securityMiddleware(request);
    if (securityResponse.status !== 200) {
      return securityResponse;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await db
      .select()
      .from(athletes)
      .orderBy(desc(athletes.createdAt))
      .limit(limit)
      .offset(offset);

    logger.info('Athletes fetched successfully', { count: result.length });

    return NextResponse.json({
      athletes: result,
      pagination: {
        limit,
        offset,
        hasMore: result.length === limit,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch athletes', { error });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResponse = await securityMiddleware(request);
    if (securityResponse.status !== 200) {
      return securityResponse;
    }

    const body = await request.json();

    const newAthlete = await db
      .insert(athletes)
      .values({
        name: body.name,
        school: body.school,
        position: body.position,
        year: body.year,
        rating: body.rating,
        profileUrl: body.profileUrl,
      })
      .returning();

    logger.info('Athlete created successfully', { athleteId: newAthlete[0].id });

    return NextResponse.json(newAthlete[0], { status: 201 });
  } catch (error) {
    logger.error('Failed to create athlete', { error });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🚀 **Step 8: Deployment Configuration**

### **8.1 Docker Setup**
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --prod; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile --prod; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
```

### **8.2 Docker Compose**
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/athleteai
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=athleteai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### **8.3 Next.js Configuration**
Create `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 🧪 **Step 9: Testing Setup**

### **9.1 Jest Configuration**
Update `jest.config.js`:
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

### **9.2 Test Setup**
Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom';
```

### **9.3 Sample Test**
Create `src/__tests__/api/health.test.ts`:
```typescript
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

describe('/api/health', () => {
  it('returns health status', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
  });
});
```

---

## 📚 **Step 10: Documentation**

### **10.1 README Setup**
Create `README.md`:
```markdown
# AthleteAI Enterprise Template

A modern, enterprise-ready template for athlete discovery platforms built with Next.js 15, PostgreSQL, and Clerk authentication.

## Features

- ✅ **Modern Framework**: Next.js 15 with App Router
- ✅ **Type Safety**: TypeScript + Drizzle ORM
- ✅ **Authentication**: Clerk enterprise auth
- ✅ **Security**: Rate limiting, security headers
- ✅ **Monitoring**: Winston logging, Sentry integration
- ✅ **Database**: PostgreSQL with migrations
- ✅ **Deployment**: Docker + production ready

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd athleteai-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Set up database**
   ```bash
   npx drizzle-kit migrate
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## Environment Variables

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/athleteai
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
SENTRY_DSN=your-sentry-dsn
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── dashboard/      # Dashboard pages
│   └── globals.css     # Global styles
├── components/         # Reusable components
│   ├── layout/        # Layout components
│   └── ui/            # UI components
├── lib/               # Utility libraries
│   ├── auth/          # Authentication
│   ├── database/      # Database configuration
│   ├── monitoring/    # Logging and monitoring
│   └── security/      # Security utilities
└── types/             # TypeScript types
```

## Deployment

### Docker
```bash
docker-compose up -d
```

### Manual Deployment
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
```

---

## 🎯 **Next Steps**

### **Immediate (This Week)**
1. **Complete Template Setup**: Follow steps 1-5 above
2. **Test Basic Functionality**: Run the development server
3. **Configure Environment**: Set up Clerk and database
4. **Verify Security**: Test rate limiting and authentication

### **Short-term (Next Week)**
1. **Migrate Components**: Port AthleteAI React components
2. **Implement APIs**: Add athlete discovery endpoints
3. **Add Monitoring**: Configure Sentry and logging
4. **Testing**: Write comprehensive test suite

### **Medium-term (2-3 Weeks)**
1. **Enterprise Features**: Add audit logging, advanced security
2. **Performance Optimization**: Implement caching and CDN
3. **Deployment**: Set up production infrastructure
4. **Documentation**: Complete API documentation

---

## 🏆 **Success Criteria**

- ✅ **Template Created**: Next.js 15 project with TypeScript
- ✅ **Database Configured**: PostgreSQL with Drizzle ORM
- ✅ **Authentication Working**: Clerk integration complete
- ✅ **Security Implemented**: Rate limiting and headers
- ✅ **Monitoring Setup**: Winston and Sentry configured
- ✅ **Tests Passing**: Basic test suite implemented
- ✅ **Documentation Complete**: README and setup guides

---

## 📞 **Support & Resources**

### **Documentation**
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/docs/overview)
- [Clerk Documentation](https://clerk.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### **Tools & Services**
- **Database**: PostgreSQL 15
- **Authentication**: Clerk
- **Monitoring**: Sentry
- **Deployment**: Docker + Digital Ocean

---

**Ready to start building with the AthleteAI template?** 🚀

**Next Action**: Follow the setup steps above to create your enterprise-ready template!

---

*Template Status: ✅ READY FOR DEVELOPMENT*  
*Framework: Next.js 15*  
*Database: PostgreSQL + Drizzle*  
*Authentication: Clerk*  
*Security: Enterprise-grade*  
*Monitoring: Winston + Sentry*
```

