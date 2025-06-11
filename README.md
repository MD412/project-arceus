# Project Arceus

A Pokémon card collection management app built with Next.js and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd project-arceus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the project root:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://dipwodpxxjwkwflimgsf.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```
   
   > **Note:** Contact the project maintainer for the actual API keys, or set up your own Supabase project.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database & Storage

The app uses a production Supabase instance with:
- **Authentication** - User signup/login
- **Database** - Card collection storage with RLS
- **Storage** - Image uploads for card photos
- **Edge Functions** - AI processing pipeline

## 🛠️ Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📁 Project Structure

- `/app` - Next.js 13+ app directory
- `/components` - Reusable React components
- `/lib` - Utility functions and configurations
- `/supabase` - Database migrations and functions
- `/app/(circuitds)/circuitds` - Design system documentation

## 🎨 Design System

Visit `/circuitds` in the app to explore the CircuitDS design system documentation.

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (sensitive) |

## 🚨 Security Notes

- Never commit `.env.local` to version control
- The service role key has admin privileges - keep it secure
- RLS policies are enabled on all user-facing tables

## 🐛 Troubleshooting

### Dependency Version Errors
If you get ESLint or Next.js version mismatch errors:

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.17.0 or higher
   npm --version   # Should be 9.0.0 or higher
   ```

2. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Use exact Node.js version (recommended):**
   - Install [nvm](https://github.com/nvm-sh/nvm) (Unix/Mac) or [nvm-windows](https://github.com/coreybutler/nvm-windows)
   ```bash
   nvm install 18.17.0
   nvm use 18.17.0
   ```

### Common Platform Issues
- **Windows**: Use `npm` instead of `yarn` if you encounter issues
- **Unix/Mac**: Make sure you have the latest version of your package manager
- **Docker**: If using containers, ensure the base image has Node.js 18.17+

## 📞 Support

For questions or issues, contact the project maintainer or create an issue in this repository.
