# Fast Code Fetch System

A Next.js application for managing vector indexes and file uploads with multi-user support.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Setup database:
```bash
# Push schema to database
pnpm db:push

# Seed demo user (required for development)
pnpm db:seed
```

3. Run development server:
```bash
pnpm dev
```

## Default Admin Account

- **Username/Email**: `admin`
- **Password**: `123456qq`
- **User ID**: `1`

This account is used for both NextAuth login and project management.

## Database Commands

- `pnpm db:push` - Push schema changes to database
- `pnpm db:seed` - Seed admin user (email: admin, id: 1)
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:generate` - Generate Prisma Client

## Troubleshooting

### Foreign Key Constraint Error (P2003)

If you see "Foreign key constraint violated" when creating projects:

```bash
pnpm db:seed
```

This creates the admin user (ID: 1) required for development.

## Next Steps

- [ ] Support Prisma multi-user authentication
- [ ] Single user can create their own index and post files
- [ ] Code chunk support with LangChain
- [ ] Integrate Elysia as API documentation