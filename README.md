# NeemahCouture Website

A modern, elegant website for NeemahCouture — a Nigerian fashion/couture house.

## Features
- Responsive public site (Home, About, Gallery, Services, Contact)
- Filterable gallery with lightbox
- Contact form with WhatsApp integration
- Admin dashboard (upload designs, edit business info, view inquiries)
- Real backend via Supabase (auth, database, storage)

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload all these files to the repo
3. Go to Settings → Pages → Source → select "Deploy from a branch" → select `main` / `root`
4. Your site will be live at `https://yourusername.github.io/repo-name/`

## Supabase Setup (Required)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Get your **Project URL** and **Anon Key** from Project Settings → API
3. Replace them in `js/config.js`:
   ```js
   const SUPABASE_URL = 'https://your-project.supabase.co'
   const SUPABASE_ANON_KEY = 'your-anon-key'
   ```

### Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Designs table
CREATE TABLE designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Business info table
CREATE TABLE business_info (
  id INTEGER PRIMARY KEY DEFAULT 1,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  hours TEXT,
  instagram TEXT,
  facebook TEXT,
  twitter TEXT,
  about_text TEXT
);

-- Contact submissions
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  style_interest TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default business info
INSERT INTO business_info (id) VALUES (1) ON CONFLICT DO NOTHING;
```

### Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a new public bucket called `designs`
3. Set bucket policy to allow public read access

### Auth Setup

1. Go to Authentication → Settings
2. Enable Email provider
3. Create your admin user manually or use the signup in admin page once

## File Structure
```
├── index.html          # Public website
├── admin.html          # Admin dashboard
├── 404.html            # Custom 404 page
├── css/
│   └── style.css       # Styles
├── js/
│   ├── config.js       # Supabase credentials (EDIT THIS)
│   ├── app.js          # Public site logic
│   └── admin.js        # Admin dashboard logic
└── README.md
```
