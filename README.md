This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Password Reset

Copy `.env.example` to `.env`, then configure `APP_URL`, `MAILTRAP_API_TOKEN`, `MAILTRAP_FROM_EMAIL`, and `MAILTRAP_FROM_NAME`. The sender domain must be verified in Mailtrap Email Sending.

Apply the database migration before starting the updated app:

```bash
npx prisma migrate deploy
npx prisma generate
```

For an existing database previously created with `prisma db push`, mark only the baseline as applied before deployment:

```bash
npx prisma migrate resolve --applied 20260718000000_baseline
npx prisma migrate deploy
```

The second command then applies the password-reset migration without recreating existing tables.

Disable Mailtrap click tracking for password-reset mail in the Mailtrap stream settings so reset tokens are not rewritten by tracking links.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
