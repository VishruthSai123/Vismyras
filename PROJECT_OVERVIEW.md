# Vismyras - Virtual Try-On Application

## 📋 Project Overview

**Vismyras** is a sophisticated AI-powered virtual try-on application that allows users to visualize different clothing items on their photos. The application uses Google's Gemini AI (gemini-2.5-flash-image) to generate photorealistic virtual try-on images.

### Key Features
- 📸 **Upload & Transform**: Upload a photo and transform it into a fashion model
- 👗 **Virtual Try-On**: Try on various clothing items (tops, bottoms, dresses, outerwear, accessories, Indian festive wear)
- 🎭 **Pose Variations**: Change poses while maintaining the outfit
- 💬 **AI Chat Editor**: Use natural language to edit your look
- 💾 **Save Outfits**: Save and reload your favorite outfit combinations
- 🗃️ **Custom Wardrobe**: Add custom clothing items to your wardrobe
- 📱 **Responsive Design**: Works on mobile and desktop devices

---

## 🏗️ Architecture & Technology Stack

### Frontend Technologies
- **React 19.1.0** - UI framework
- **TypeScript 5.8.2** - Type-safe development
- **Vite 6.2.0** - Build tool and dev server
- **Framer Motion 11.2.12** - Animation library
- **Tailwind CSS** (via CDN) - Styling framework
- **React Image Crop 11.0.6** - Image cropping functionality
- **@tsparticles** - Particle effects for UI

### AI & Backend
- **@google/genai 1.10.0** - Google Gemini AI SDK
- **Model**: gemini-2.5-flash-image - Multimodal image generation

### Data Storage
- **IndexedDB** - Client-side image storage (VismyrasImageDB)
- **LocalStorage** - Application state persistence

---

## 📁 Project Structure

```
Vismyras/
├── App.tsx                    # Main application component
├── index.tsx                  # React entry point
├── index.html                 # HTML template
├── index.css                  # Global styles & animations
├── types.ts                   # TypeScript type definitions
├── wardrobe.ts                # Default wardrobe items catalog
├── metadata.json              # App metadata
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── .env.local                 # Environment variables (API key)
│
├── components/                # React components
│   ├── StartScreen.tsx        # Initial upload & model generation
│   ├── Canvas.tsx             # Main display canvas
│   ├── Header.tsx             # App header
│   ├── Footer.tsx             # App footer
│   ├── WardrobeModal.tsx      # Clothing selection interface
│   ├── OutfitStack.tsx        # Current outfit layers display
│   ├── PosePanel.tsx          # Saved outfits management
│   ├── ChatFab.tsx            # Floating chat button
│   ├── ChatPanel.tsx          # AI chat interface
│   ├── ImageUploader.tsx      # Image upload component
│   ├── Spinner.tsx            # Loading spinner
│   ├── icons.tsx              # Icon components
│   ├── ui/
│   │   ├── compare.tsx        # Before/after comparison
│   │   └── sparkles.tsx       # Sparkle effects
│   └── [other components...]
│
├── services/
│   └── geminiService.ts       # Gemini AI integration
│
└── lib/
    └── utils.ts               # Utility functions & IndexedDB
```

---

## 🔧 Core Components Explained

### 1. **App.tsx** (Main Application)
- **State Management**: Manages model image, outfit history, wardrobe, and saved outfits
- **Outfit History**: Implements an undo/redo system with outfit layers
- **Pose Management**: Tracks different poses for each outfit state
- **Persistence**: Auto-saves state to localStorage and IndexedDB
- **Key Features**:
  - Model image finalization
  - Garment selection and application
  - Pose variation generation
  - Chat-based editing
  - Outfit saving/loading

### 2. **geminiService.ts** (AI Integration)
Core AI functions:
- `generateModelImage(userImage)`: Transforms user photo into fashion model
- `generateVirtualTryOnImage(modelImageId, garmentImage, garmentCategory)`: Applies clothing to model
- `generatePoseVariation(tryOnImageId, poseInstruction)`: Changes pose while maintaining outfit
- `generateChatEdit(baseImageId, userPrompt, referenceImage?)`: AI-powered style editing

**Prompt Engineering**:
- Detailed instructions for clothing replacement vs. accessory addition
- Preservation of identity, background, and body type
- Photorealistic quality enforcement

### 3. **utils.ts** (Utilities & Storage)
- **ImageDB Class**: IndexedDB wrapper for blob storage
  - `init()`: Initialize database
  - `putImage(image, id)`: Store image blob
  - `getImage(id)`: Retrieve image blob
- **useObjectURL Hook**: React hook for displaying IndexedDB images
- **Error Handling**: User-friendly error messages
- **File Conversion**: Base64 to Blob, URL to File utilities

### 4. **StartScreen.tsx**
- Initial user onboarding
- Image upload with drag & drop
- Before/after comparison preview
- Model generation with loading states

### 5. **Canvas.tsx**
- Main display area for try-on images
- Pose navigation controls
- Loading overlays
- Image rendering optimization

---

## 🎨 Data Models

### Type Definitions (types.ts)

```typescript
interface WardrobeItem {
  id: string;              // Unique identifier
  name: string;            // Display name
  url: string;             // Image URL
  category: string;        // Category (Tops, Bottoms, etc.)
}

interface OutfitLayer {
  garment: WardrobeItem | null;           // null = base model layer
  poseImages: Record<string, string>;     // pose -> imageId mapping
}

interface SavedOutfit {
  id: string;              // Unique identifier
  layers: OutfitLayer[];   // Complete outfit layers
  previewUrl: string;      // Display thumbnail
}
```

---

## 🔄 Application Flow

### 1. **Initial Setup**
```
User uploads photo → AI generates fashion model → Base layer created
```

### 2. **Virtual Try-On**
```
Select garment → AI applies garment → New layer added to history
Current index incremented → Image stored in IndexedDB
```

### 3. **Pose Changes**
```
Select new pose → Check if pose exists for current layer
If not exists → AI generates new pose → Update layer with new pose
Switch to new pose view
```

### 4. **Outfit History Navigation**
```
User clicks "Remove" → Current index decremented
Display previous layer → Previous outfit visible
```

### 5. **Chat Editing**
```
User enters prompt + optional reference image
AI processes request → Generates edited image
Updates current layer → Resets to base pose
```

---

## 🗄️ Storage Strategy

### IndexedDB (VismyrasImageDB)
- **Purpose**: Store generated image blobs
- **Store Name**: 'images'
- **Key**: Unique image ID (timestamp-random)
- **Value**: Blob object
- **Advantages**: Large storage capacity, no URL length limits

### LocalStorage
- **Keys**:
  - `vismyras_modelImageId`: Base model image ID
  - `vismyras_outfitHistory`: Complete outfit layer array
  - `vismyras_currentOutfitIndex`: Active layer index
  - `vismyras_wardrobe`: Custom wardrobe items
  - `vismyras_savedOutfits`: Saved outfit combinations

---

## 🎯 Pose System

### Available Poses (POSE_INSTRUCTIONS)
1. "Full frontal view, hands on hips"
2. "Slightly turned, 3/4 view"
3. "Side profile view"
4. "Jumping in the air, mid-action shot"
5. "Walking towards camera"
6. "Leaning against a wall"

### Pose Management
- Each outfit layer maintains a `poseImages` map
- Lazy generation: Poses generated on demand
- Navigation: Cycle through available poses
- Persistence: Pose index saved in localStorage

---

## 🎨 Styling & Animations

### CSS Animations (index.css)
- `fade-in`: Gentle component entrance
- `zoom-in`: Canvas image zoom effect
- `slide-up`: Wardrobe sheet slide animation
- Custom scrollbar styling

### Framer Motion Animations
- Page transitions with AnimatePresence
- Component mount/unmount animations
- Loading state transitions
- Mobile overlay effects

---

## 🔐 Environment Variables

### .env.local
```env
GEMINI_API_KEY=your_api_key_here
```

**Access in Code**:
```typescript
process.env.GEMINI_API_KEY
process.env.API_KEY  // Vite transforms this
```

---

## 📦 Wardrobe System

### Default Wardrobe (wardrobe.ts)
- **Categories**:
  - Tops (9 items)
  - Bottoms (6 items)
  - Dresses (4 items)
  - Outerwear (5 items)
  - Accessories (6 items)
  - Indian Festive (5 items)

### Custom Items
- Users can upload custom garments
- Added to wardrobe state
- Persisted in localStorage
- Includes metadata (name, category)

---

## 🚀 Development Commands

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌐 API Integration

### Gemini AI Configuration
- **Model**: `gemini-2.5-flash-image`
- **Response Modalities**: IMAGE, TEXT
- **Content Format**: Multipart (image + text prompts)

### API Call Flow
```
1. Convert File/URL to Part format
2. Construct prompt with instructions
3. Call generateContent with model config
4. Parse response for image data
5. Convert base64 to Blob
6. Store in IndexedDB
7. Return unique image ID
```

---

## 🛡️ Error Handling

### User-Friendly Messages
- Safety filter blocks → Informative feedback
- Unsupported MIME types → Format suggestions
- API failures → Retry suggestions
- Storage full → Clear cache recommendations

### Error Sources
- API safety filters
- Network issues
- Invalid file formats
- Storage quota exceeded
- IndexedDB blocked

---

## 📱 Responsive Design

### Mobile (max-width: 767px)
- Collapsible control panel
- Full-screen loading overlays
- Touch-optimized controls
- Vertical layout

### Desktop
- Side-by-side layout
- Persistent control panel
- Hover effects
- Mouse-optimized navigation

---

## 🔍 Key Features Deep Dive

### 1. Outfit Layers System
- Maintains complete history of outfit changes
- Each layer stores all pose variations
- Enables undo functionality
- Base layer is the initial model photo

### 2. Smart Caching
- Generated images stored in IndexedDB
- Avoids regenerating existing poses
- Fast navigation between outfit states
- Persistent across browser sessions

### 3. AI Prompt Engineering
- Separate prompts for clothing vs. accessories
- Preservation instructions for identity & background
- Specific placement guidelines
- Photorealism enforcement

### 4. State Persistence
- Auto-save on every state change
- Restore session on page reload
- Graceful fallback on load failure
- Clear state on "Start Over"

---

## 🐛 Known Limitations

1. **AI Generation**:
   - Subject to Gemini API safety filters
   - Quality depends on input image
   - Processing time varies (typically 5-30 seconds)

2. **Storage**:
   - Browser IndexedDB quota limits
   - LocalStorage 5-10MB limit
   - No cloud sync

3. **Performance**:
   - Large outfit histories increase memory usage
   - Mobile devices may have slower generation

---

## 🔮 Future Enhancements

- Cloud storage integration
- User accounts & profiles
- Social sharing features
- Advanced editing tools
- Video try-on
- AR integration
- Multi-user wardrobes
- E-commerce integration

---

## 📄 License

Apache-2.0 License

---

## 🙏 Credits

- **AI Model**: Google Gemini 2.5 Flash Image
- **Asset Hosting**: jsDelivr CDN (GitHub)
- **Fonts**: Google Fonts (Inter, Instrument Serif)
- **Icons**: Custom icon components

---

## 🆘 Troubleshooting

### API Key Issues
```bash
# Check .env.local exists and has correct key
# Verify key is valid at https://ai.google.dev/
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Storage Issues
```bash
# Clear browser data (IndexedDB + LocalStorage)
# Check browser storage quota in DevTools
```

---

**Last Updated**: October 28, 2025
**Version**: 0.0.0 (Development)
