# Deploying to Vercel (Without GitHub)

This guide will help you deploy your school management software to Vercel directly from your local machine using the Vercel CLI.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com if you don't have one)
2. Node.js and pnpm installed on your machine
3. Your Supabase credentials ready

## Step 1: Install Vercel CLI

Open your terminal in the project directory and run:

```bash
npm install -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel
```

## Step 2: Login to Vercel

Run the following command to login:

```bash
vercel login
```

This will open a browser window for you to authenticate with your Vercel account.

## Step 3: Set Environment Variables

Before deploying, you need to set your environment variables. You can do this in two ways:

### Option A: Set during deployment (Recommended)
When you run `vercel`, it will prompt you to add environment variables interactively.

### Option B: Set via CLI
Run these commands to set your environment variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

You'll be prompted to enter the values for each variable.

## Step 4: Deploy to Vercel

Run the following command in your project root:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (for first deployment)
- **What's your project's name?** → Enter a name (e.g., "school-management")
- **In which directory is your code located?** → `./` (current directory)

## Step 5: Deploy to Production

After the initial deployment, you can deploy to production with:

```bash
vercel --prod
```

## Important Notes

1. **Environment Variables**: Make sure you have set:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

2. **Supabase Configuration**: Ensure your Supabase project allows requests from your Vercel domain. You may need to update CORS settings in Supabase.

3. **Future Deployments**: After the first deployment, you can simply run `vercel --prod` to deploy updates.

## Troubleshooting

- If you encounter build errors, check the Vercel dashboard logs
- Make sure all environment variables are set correctly
- Verify your Supabase project is accessible and configured properly

## Quick Deploy Commands

```bash
# First time deployment
vercel

# Deploy to production
vercel --prod

# Preview deployment (creates a preview URL)
vercel

# View deployment logs
vercel logs
```
