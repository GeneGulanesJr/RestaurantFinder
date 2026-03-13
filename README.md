# Restaurant Finder

Full-stack app that interprets natural language restaurant requests, calls the Foursquare Places API, and returns results via a web UI and JSON API.

## Features

- **Natural Language Search**: Type queries like "Find cheap sushi in downtown LA open now" and get restaurant results
- **AI-Powered Interpretation**: Uses OpenRouter LLM to parse natural language into structured search parameters
- **Real-Time Results**: Queries Foursquare Places API for up-to-date restaurant information
- **Web UI**: Clean, responsive interface for searching and viewing results
- **JSON API**: Public API endpoint for programmatic access
- **Session-Based Auth**: Secure login system with configurable demo credentials
- **CSRF Protection**: Cross-site request forgery protection for all sensitive operations
- **Rate Limiting**: Sliding window rate limiting with automatic cleanup
- **Error Handling**: Comprehensive error responses with clear messages
- **Rate Limit UX**: Visual countdown timer when rate limit is exceeded

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework with API routes |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Validation** | Zod | Runtime schema validation |
| **Testing** | Vitest | Fast unit testing |
| **LLM** | OpenRouter API | Natural language interpretation |
| **Places Data** | Foursquare Places API v3 | Restaurant and venue data |
| **Deployment** | Cloudflare Pages/Workers | Edge deployment platform |

## Project Structure

```
restaurant-finder/
├── app/
│   ├── api/
│   │   ├── execute/
│   │   │   ├── route.ts          # Main API endpoint
│   │   │   └── route.test.ts     # API tests
│   │   ├── login/
│   │   │   ├── route.ts          # Login endpoint
│   │   │   └── route.test.ts     # Login tests
│   │   └── logout/
│   │       └── route.ts          # Logout endpoint
│   ├── components/
│   │   └── SearchUI.tsx          # Main search interface
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── page.tsx                  # Home page (search UI)
├── lib/
│   ├── constants.ts              # Application constants
│   ├── foursquare-schema.ts      # Foursquare response schemas
│   ├── foursquare.ts             # Foursquare API client
│   ├── foursquare.test.ts        # Foursquare tests
│   ├── llm.ts                    # OpenRouter LLM client
│   ├── llm.test.ts               # LLM tests
│   ├── rate-limit.ts             # Rate limiting logic
│   ├── schemas.ts                # Shared Zod schemas
│   └── session.ts                # Session management
├── openspec/                     # OpenSpec change documentation
├── .env.example                  # Environment variables template
├── CHANGELOG.md                  # Project changelog
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Vitest configuration
└── README.md                     # This file
```

## Architecture Overview

```
User Request
    ↓
GET /api/execute?message=...&code=pioneerdevai
    ↓
┌─────────────────────────────────────────┐
│  Authentication Gate                    │
│  - Validate code === "pioneerdevai"     │
│  - Return 401 if invalid                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Message Validation                     │
│  - Check message exists (not empty)    │
│  - Trim and validate max 2000 chars     │
│  - Return 400 if invalid                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Rate Limit Check                       │
│  - Check 1 request per 60s per client   │
│  - Return 429 if exceeded               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  LLM Interpretation (OpenRouter)        │
│  - Parse natural language               │
│  - Extract: query, near, price, etc.    │
│  - Validate with Zod schema             │
│  - Return 422 if uninterpretable        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Foursquare API Call                    │
│  - Search with structured params        │
│  - 15 second timeout                    │
│  - Return 502 on error                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Response Mapping                       │
│  - Filter to relevant fields            │
│  - Format for UI/API                    │
└─────────────────────────────────────────┘
    ↓
JSON Response (200) with results + interpreted params
```

## Quick Start

1. **Clone and install**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**: Navigate to [http://localhost:3000](http://localhost:3000)

5. **Login**: Use credentials `demo` / `1234`

6. **Search**: Type a natural language query and submit

## Setup

- **Node.js** 18+
- **npm**

```bash
npm install
cp .env.example .env
# Edit .env and set the required keys (see below).
```

### Environment variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Yes | [OpenRouter](https://openrouter.ai) API key for LLM interpretation. | - |
| `FOURSQUARE_API_KEY` | Yes | [Foursquare Places API](https://docs.foursquare.com/fsq-developers-places/) key (v3). | - |
| `SESSION_SECRET` | Yes | Secret for signing session cookies (min 16 characters). | - |
| `DEMO_USERNAME` | No | Demo username for login. | `demo` |
| `DEMO_PASSWORD` | No | Demo password for login. | `1234` |
| `SESSION_TTL_SEC` | No | Session time-to-live in seconds. | `604800` (7 days) |
| `OPENROUTER_TIMEOUT_MS` | No | OpenRouter API timeout in milliseconds. | `15000` (15 seconds) |
| `FOURSQUARE_TIMEOUT_MS` | No | Foursquare API timeout in milliseconds. | `15000` (15 seconds) |

See `.env.example` for placeholders.

### External services (documented values)

- **Foursquare**: Base URL `https://places-api.foursquare.com/places/search` with header `X-Places-Api-Version: 2025-06-17`. Use a [Service Key](https://docs.foursquare.com/developer/docs/manage-service-api-keys) in the `Authorization: Bearer <key>` header. See [`lib/foursquare.ts`](lib/foursquare.ts).
- **OpenRouter**: Model ID `openai/gpt-3.5-turbo`. See [`lib/llm.ts`](lib/llm.ts) and [`openspec/changes/restaurant-finder-app/prompts/openrouter-system.md`](openspec/changes/restaurant-finder-app/prompts/openrouter-system.md) for system prompt details.
- **Upstream timeouts**: OpenRouter and Foursquare requests use a **15 second** timeout each. On timeout or non-200, the API returns 502.
- **Message max length**: The `message` query parameter is limited to **2000** characters (after trim). Longer messages return 400.

### API Key Setup

1. **OpenRouter API Key**:
   - Sign up at [https://openrouter.ai](https://openrouter.ai)
   - Navigate to API Keys section
   - Create a new key
   - Add to `.env` as `OPENROUTER_API_KEY=your_key_here`

2. **Foursquare API Key**:
   - Sign up at [https://foursquare.com/developers](https://foursquare.com/developers)
   - Create a new app in the developer portal
   - Generate a Service Key (not Client Key)
   - Add to `.env` as `FOURSQUARE_API_KEY=your_key_here`

3. **Session Secret**:
   - Generate a secure random string (minimum 16 characters)
   - Use a tool like: `openssl rand -base64 32`
   - Add to `.env` as `SESSION_SECRET=your_secret_here`

## Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` until you sign in.

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |

### Login

- **URL**: `/login`
- **Demo credentials**: username **demo**, password **1234** (configurable via environment variables).
- **CSRF Protection**: Login endpoint validates CSRF tokens in production to prevent cross-site request forgery.
- On success you are redirected to `/` (search UI).

### Session Management

- Sessions are managed using Next.js session cookies
- Session secret is configured via `SESSION_SECRET` environment variable (min 16 characters)
- Session protects the root route `/` - unauthenticated users are redirected to `/login`
- Sessions are server-side only - no sensitive data is stored in client cookies
- Session duration is controlled by the session middleware configuration

### Logout

- **URL**: `/api/logout` (POST)
- **Authentication**: Requires active session
- **Behavior**: Clears session cookie and redirects to `/login`
- **Response**: 302 redirect to login page

## Test the API

**GET** `/api/execute` with query parameters:

- `message` (required): natural language request, e.g. `Find cheap sushi in downtown LA open now`. Trimmed; max 2000 chars.
- **Authentication**: Requires valid session cookie (obtained via `/api/login`). No `code` parameter needed.

Example:

```bash
# First, login to get session cookie
curl -X POST "http://localhost:3000/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"1234"}' \
  -c cookies.txt

# Then use the session cookie to search
curl "http://localhost:3000/api/execute?message=Find%20pizza%20in%20Los%20Angeles" \
  -b cookies.txt
```

- **200**: `{ "results": [...], "interpreted": { "query", "near", "limit", ... } }`
- **401**: `{ "error": "Unauthorized" }` — missing or invalid session
- **400**: missing/empty/whitespace or too-long `message`
- **422**: interpretation failed (malformed or uninterpretable message)
- **429**: rate limit exceeded (see below)
- **502**: upstream error (OpenRouter or Foursquare)

### API Response Schema

#### Success Response (200)

```json
{
  "results": [
    {
      "name": "Sugarfish",
      "address": "600 W 7th St, Los Angeles, CA",
      "category": "Sushi Restaurant",
      "rating": 8.9,
      "price": 2,
      "open_now": true,
      "distance_meters": 312
    }
  ],
  "interpreted": {
    "query": "sushi",
    "near": "downtown Los Angeles",
    "open_now": true,
    "price": "1",
    "limit": 10
  }
}
```

**Result Object Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Restaurant name |
| `address` | string | Yes | Full address |
| `category` | string | Yes | Primary category (e.g., "Sushi Restaurant") |
| `rating` | number | No | Rating score (typically 0-10) |
| `price` | number | No | Price tier (1-4, where 1=cheap, 4=expensive) |
| `open_now` | boolean | No | Whether the venue is currently open |
| `distance_meters` | number | No | Distance from search location |

**Interpreted Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Search query extracted from message |
| `near` | string | Location extracted from message |
| `open_now` | boolean | Whether user requested open now filter |
| `price` | string | Price tier ("1", "2", "3", or "4") |
| `limit` | number | Number of results requested (default: 10) |

#### Error Responses

| Status | Body | Description |
|--------|------|-------------|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid session cookie |
| 403 | `{ "error": "Forbidden", "detail": "..." }` | Invalid CSRF token (production only) |
| 400 | `{ "error": "message parameter is required" }` | Missing, empty, or whitespace-only `message` |
| 400 | `{ "error": "message too long (max 2000 characters)" }` | Message exceeds character limit |
| 422 | `{ "error": "Could not interpret request", "detail": "..." }` | LLM failed to interpret or returned invalid JSON |
| 429 | `{ "error": "Too many requests", "retry_after": 60 }` | Rate limit exceeded |
| 502 | `{ "error": "Upstream API error" }` | OpenRouter or Foursquare API failure/timeout |

## Rate limit

- At most **1 LLM interpretation per rolling 60 seconds per client**.
- **Algorithm**: Uses a sliding window algorithm for accurate rate limiting with automatic cleanup of old entries.
- **Client identity**: On Cloudflare, client is identified by IP using `CF-Connecting-IP`, with fallback to `X-Forwarded-For`. Local dev uses the same headers when present; otherwise a single fallback id is used.
- **Store**: Local dev uses an **in-memory** map. For production on Cloudflare, use a **Durable Object** (or other shared store) so the limit is enforced across instances/regions; document the choice in this README when you deploy.
- **UX**: Frontend displays a countdown timer when rate limit is exceeded, showing remaining time before next request is allowed.
- When exceeded: **429** with body `{ "error": "Too many requests", "retry_after": 60 }` and response header **`Retry-After: 60`**. The LLM is not called.

## Testing

- **Runner**: [Vitest](https://vitest.dev) (`npm run test`).
- **What is tested**:
  - Execute route: `code` validation (missing, wrong, correct), `message` validation (missing, whitespace), interpretation failure (422), rate limit (429).
  - LLM (`lib/llm.ts`): invalid JSON response, SearchParams validation failure, uninterpretable response, valid response with default limit.
  - Foursquare (`lib/foursquare.ts`): non-JSON response, schema validation failure, successful response mapping.
  - Login API: valid `demo` / `1234` (200 + session cookie), invalid credentials (401).
- **Not covered**: E2E/browser tests; live OpenRouter/Foursquare calls (tests mock `fetch`).

```bash
npm run test
```

## Troubleshooting

### Common Issues

**Issue: "Unauthorized" (401) when calling API**
- **Cause**: Missing or incorrect `code` parameter
- **Solution**: Ensure `code=pioneerdevai` is included in the query string

**Issue: "Could not interpret request" (422)**
- **Cause**: LLM unable to parse the natural language message
- **Solution**: Try rephrasing the request with clearer terms (e.g., "Find sushi in LA" instead of vague queries)

**Issue: "Too many requests" (429)**
- **Cause**: Rate limit exceeded (1 request per 60 seconds per client)
- **Solution**: Wait 60 seconds before making another request from the same client

**Issue: "Upstream API error" (502)**
- **Cause**: OpenRouter or Foursquare API timeout or failure
- **Solution**: Check your API keys are valid and have sufficient quota. Try again after a few seconds.

**Issue: Login redirect loop**
- **Cause**: Session cookie not being set properly
- **Solution**: Ensure `SESSION_SECRET` is set in `.env` (minimum 16 characters). Clear browser cookies for localhost.

**Issue: Development server won't start**
- **Cause**: Port 3000 already in use
- **Solution**: Stop the process using port 3000 or use a different port with `npm run dev -- -p 3001`

**Issue: Tests failing with timeout errors**
- **Cause**: Tests may be timing out due to slow execution
- **Solution**: Check if all dependencies are installed properly with `npm install`. Run tests with increased timeout if needed.

### Debugging Tips

1. **Enable debug logging**: Check [`lib/constants.ts`](lib/constants.ts) for configurable debug flags
2. **Check API responses**: Use browser DevTools Network tab to inspect API requests/responses
3. **Verify environment variables**: Ensure all required keys are set in `.env` file
4. **Test individual components**: Use the test files in [`lib/`](lib/) to test LLM and Foursquare integration separately
5. **Review logs**: Check terminal output for detailed error messages and stack traces

## Deployment (Cloudflare)

You can deploy to [Cloudflare Pages](https://developers.cloudflare.com/pages) (with Next.js support) or adapt for Workers. This project uses [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for the Pages project name and optional CLI deploys.

### One-time setup: Pages project and custom domain

To use the subdomain **restaurantfinder.genegulanesjr.com**:

1. **Create the Pages project** (once):
   ```bash
   npm run pages:create
   ```
   When prompted, confirm the project name `restaurantfinder`. If the project already exists, you can skip this.

2. **Connect your Git repo** to this project:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
   - Select the **restaurantfinder** project (or create and name it `restaurantfinder`)
   - Connect your repository and set **Build command**: `npm run build`, **Build output directory**: `.next`
   - **Important:** If your project has a separate **Deploy command**, set it to:
     `npx wrangler pages deploy .next --project-name=restaurantfinder`
     Do **not** use `npx wrangler deploy` (that is for Workers; this app is Pages).

3. **Add the custom domain**:
   - In the same project, go to **Custom domains** → **Set up a custom domain**
   - Enter: `restaurantfinder.genegulanesjr.com`
   - If **genegulanesjr.com** is already on Cloudflare, DNS and HTTPS are set up automatically. Otherwise, add the CNAME record Cloudflare shows (e.g. `restaurantfinder` → `restaurantfinder.pages.dev`).

After this, every push to your connected branch will build and deploy, and the app will be available at **https://restaurantfinder.genegulanesjr.com**.

### Cloudflare Pages Deployment (build and env)

1. **Configure build settings** (if not already set when connecting Git):
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`

2. **Set environment variables**:
   - In the project: **Settings** → **Environment variables**
   - Add: `OPENROUTER_API_KEY`, `FOURSQUARE_API_KEY`, `SESSION_SECRET` (see [Environment variables](#environment-variables) above)

3. **Production rate limiting**:
   - For production, implement the 60s limit using a [Durable Object](https://developers.cloudflare.com/durable-objects/)
   - Alternative: Use Cloudflare KV with TTL for distributed rate limiting
   - Update [`lib/rate-limit.ts`](lib/rate-limit.ts) to use the chosen storage backend
   - Document your implementation choice in this README

4. **Deploy**:
   - Push to your connected branch; Cloudflare builds and deploys automatically.
   - If the build succeeds but deploy fails with **"Missing entry-point to Worker script"**, the deploy command is wrong: it must be **Pages** deploy, not Workers. In **Settings** → **Builds & deployments** (or Build configuration), set the deploy step to: `npx wrangler pages deploy .next --project-name=restaurantfinder`. Do not use `npx wrangler deploy`.
   - Optional: deploy from your machine with `npm run deploy` (builds then runs `wrangler pages deploy` for project `restaurantfinder`).

### Alternative Deployment Options

- **Vercel**: Compatible with Next.js, similar setup process
- **Netlify**: Supports Next.js with build configuration
- **Self-hosted**: Use `npm run build` and `npm start` with Node.js 18+

### Production Checklist

- [ ] All environment variables set in production
- [ ] Rate limiting configured for distributed environment
- [ ] HTTPS enabled
- [ ] API keys have appropriate quotas and limits
- [ ] Monitoring/logging configured
- [ ] Error tracking implemented (optional)
- [ ] Backup strategy for session data (if using persistent storage)

**Live URL**: `https://restaurantfinder.genegulanesjr.com` (after custom domain is set)

## Security Considerations

### CSRF Protection

- All sensitive operations (login) are protected by CSRF tokens
- CSRF tokens are generated server-side and validated using timing-safe comparison
- Tokens are stored in HTTP-only cookies to prevent XSS attacks
- CSRF protection is enforced in production environments

### API Key Protection

- All API keys (`OPENROUTER_API_KEY`, `FOURSQUARE_API_KEY`) are **server-side only**
- Never expose these keys to client-side code
- Use environment variables for all sensitive configuration
- Rotate keys periodically

### Session Security

- Sessions use secure, HTTP-only cookies
- Session secret must be cryptographically secure (min 16 characters)
- Session TTL is configurable via `SESSION_TTL_SEC` environment variable (default: 7 days)
- Consider implementing session timeout and refresh mechanisms
- Validate session on protected routes

### Rate Limiting

- Prevents API abuse and protects against DoS attacks
- Uses sliding window algorithm for accurate rate limiting
- Configurable per-client limits (currently 1 request/60s)
- Automatic cleanup of old entries to prevent memory leaks
- Implement distributed rate limiting for production deployments

### Input Validation

- All user inputs are validated using Zod schemas
- Message length limited to 2000 characters
- LLM output validated before use
- Never trust client-side input

### Dependencies

- Keep dependencies updated: `npm audit` and `npm update`
- Review security advisories for used packages
- Use lockfile (`package-lock.json`) for reproducible builds

## Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the existing code style
4. **Run tests**: `npm run test` to ensure all tests pass
5. **Run linter**: `npm run lint` to check code quality
6. **Commit changes**: Use clear, descriptive commit messages
7. **Push to branch**: `git push origin feature/your-feature-name`
8. **Open a pull request** with a description of your changes

### Code Style Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions (camelCase for variables/functions, PascalCase for components)
- Add comments for complex logic
- Write tests for new features and bug fixes
- Keep functions focused and single-purpose
- Use Zod schemas for all data validation
- Handle errors gracefully with appropriate HTTP status codes

### Adding New Features

1. **Update the README**: Document new features, API endpoints, or configuration options
2. **Add tests**: Ensure test coverage for new functionality
3. **Update CHANGELOG.md**: Add an entry describing what was added/changed
4. **Consider backwards compatibility**: Ensure changes don't break existing functionality

### Reporting Issues

When reporting bugs or requesting features, please include:
- Clear description of the issue or feature request
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (OS, Node.js version, browser)
- Relevant error messages or logs

## Additional Resources

### Documentation

- **OpenSpec Change**: [`openspec/changes/restaurant-finder-app/`](openspec/changes/restaurant-finder-app/) - Complete design, specs, and tasks
- **API Specs**: [`openspec/changes/restaurant-finder-app/specs/`](openspec/changes/restaurant-finder-app/specs/) - Detailed API specifications
- **Changelog**: [`CHANGELOG.md`](CHANGELOG.md) - Version history and changes

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)
- [Vitest Documentation](https://vitest.dev)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Foursquare Places API Documentation](https://docs.foursquare.com/fsq-developers-places/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)

### Project Files Reference

| File | Purpose |
|------|---------|
| [`lib/llm.ts`](lib/llm.ts) | OpenRouter LLM integration |
| [`lib/foursquare.ts`](lib/foursquare.ts) | Foursquare API client |
| [`lib/schemas.ts`](lib/schemas.ts) | Zod validation schemas |
| [`lib/rate-limit.ts`](lib/rate-limit.ts) | Rate limiting logic |
| [`lib/session.ts`](lib/session.ts) | Session management |
| [`app/api/execute/route.ts`](app/api/execute/route.ts) | Main API endpoint |
| [`app/components/SearchUI.tsx`](app/components/SearchUI.tsx) | Search interface component |

## License

Private / coding challenge.
