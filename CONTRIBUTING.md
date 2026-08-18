# Contributing to Abhyas

Thank you for your interest in contributing to Abhyas! We welcome contributions from everyone whether it's fixing bugs, improving documentation, or adding new features.

## Prerequisites

Before contributing, please ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v18+ LTS recommended)
- **[Git](https://git-scm.com/)**
- **[Docker](https://www.docker.com/products/docker-desktop/)** - runs Supabase (Postgres, Auth, Storage) locally, no cloud account needed
- **[Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)**
- **[Groq API Key](https://console.groq.com/keys)** (Free tier works perfectly) - only needed if you're testing the AI features

## Local Development Setup

You don't need a Supabase account or access to production credentials to contribute. `supabase start` runs the entire backend (Postgres, Auth, Storage) in Docker containers on your machine, seeded with a ready-to-use test account.

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/gloooomed/Abhyas.git
   cd Abhyas
   npm install
   ```

2. **Start the local Supabase stack** (requires Docker running)
   ```bash
   supabase start
   ```
   This applies every migration in `supabase/migrations/` - including the base schema, RLS policies, and the AI rate-limit table/function - and loads `supabase/seed.sql`, which creates a test account:
   ```
   email:    test@abhyas.dev
   password: TestPassword123!
   ```
   The command prints an API URL and `anon key` - copy those into `.env.local`:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=the_anon_key_printed_above
   ```

3. **Serve the Edge Functions locally**, in a separate terminal (only needed if you're touching AI, resume-optimizer, or text-to-speech features):
   ```bash
   supabase functions serve --env-file .env.local
   ```
   Add your own key(s) to `.env.local` first: `GROQ_API_KEY=your_groq_api_key` (and `ELEVENLABS_API_KEY=your_elevenlabs_api_key` for voice features). These are real third-party calls - Groq/ElevenLabs aren't mocked locally.

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Go to `/sign-in` - since `VITE_SUPABASE_URL` points at `127.0.0.1`, a "Local dev only" login form appears below the Google button. Sign in with the test account above.

5. **When you're done**, tear down the containers:
   ```bash
   supabase stop
   ```

## Contribution Workflow

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feat/your-feature-name
   ```
   Or for bug fixes:
   ```bash
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**. Please adhere to the project's coding style (TypeScript strict, Tailwind CSS for styling).

3. **Test your changes**. Ensure that the app builds correctly (`npm run build`), the test suite passes (`npm run test`), and no existing functionality is broken.

4. **Commit your changes**. Use clear and descriptive commit messages:
   ```bash
   git commit -m "feat: add user history dashboard"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Open a Pull Request** against the `main` branch. Provide a clear description of what you have changed and why.

## Code Style & Guidelines

- **TypeScript**: We use strict TypeScript. Please avoid `any` types wherever possible.
- **Styling**: We use Tailwind CSS along with Shadcn UI primitives. Stick to existing class patterns for consistency.
- **Focus**: Keep Pull Requests focused on a single feature or bug fix.
- **Discussions**: For significant architecture changes or new features, please open an issue first to discuss it with the maintainers.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
