# Wedding Innovation Frontend

A beautiful Next.js wedding invitation website with animated intro page.

## Features

- 🎭 **Animated Intro Page**: Sliding door effect with left and right images
- 🎵 **Background Music**: Auto-plays when doors open
- 🎨 **Tailwind CSS**: Modern styling with custom wedding theme
- ⚡ **Framer Motion**: Smooth animations and transitions
- 📱 **Responsive Design**: Works on all devices

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Assets

Place your images in the `public` folder:
- `/public/img/wedding-left.jpg` - Left door image
- `/public/img/wedding-right.jpg` - Right door image  
- `/public/img/lantern.png` - Decorative lantern (optional)
- `/public/music/wedding-music.mp3` - Background music

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/
│   ├── globals.css       # Global styles with Tailwind
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── IntroPage.tsx     # Main intro component with sliding doors
├── public/
│   ├── img/              # Images
│   └── music/            # Audio files
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Intro Page Animation

The intro page features:

1. **Two sliding doors** (left and right images)
   - Left door slides to the left (-100%)
   - Right door slides to the right (100%)
   - Right door has higher z-index for layering effect

2. **Center button** with:
   - Animated pulsing ring
   - Hover effects
   - Decorative rotating elements

3. **Music playback**:
   - Starts automatically when doors open
   - Loops continuously

4. **Welcome message**:
   - Fades in after doors open
   - Animated text appearance

## Customization

### Colors

Edit `tailwind.config.js` to change the wedding colors:

```js
colors: {
  wedding: {
    red: '#8B0000',      // Deep red
    gold: '#D4AF37',     // Gold
    cream: '#FFF8DC',    // Cream
  },
}
```

### Animations

Modify animation duration and easing in `components/IntroPage.tsx`:

```tsx
// Door animation
transition={{ duration: 1.5, ease: 'easeInOut' }}

// Button animation
transition={{ delay: 0.5 }}
```

### Images

- **Left Door**: 960x1080px or larger (portrait orientation)
- **Right Door**: 960x1080px or larger (portrait orientation)
- **Lantern**: 100x150px PNG with transparency

### Music

Supported formats:
- MP3 (recommended)
- WAV
- OGG

## Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **React 18** - UI library

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Tips

1. Use high-quality images (at least 1920x1080)
2. Optimize images before uploading (use WebP format)
3. Keep music file size under 5MB for faster loading
4. Test on mobile devices for responsive design

## Future Features

- [ ] Guest RSVP form
- [ ] Photo gallery
- [ ] Event details page
- [ ] Countdown timer
- [ ] Admin dashboard integration

## License

Private project
