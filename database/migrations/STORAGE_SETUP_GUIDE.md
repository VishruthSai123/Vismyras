# Storage Buckets Setup Guide

## Step 1: Create Storage Buckets in Supabase Dashboard

### 1. Navigate to Storage
1. Go to your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **New bucket** button

### 2. Create Bucket: model-images
```
Name: model-images
Public: ✓ (checked)
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

Click **Create bucket**

### 3. Create Bucket: garment-images
```
Name: garment-images
Public: ✓ (checked)
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

Click **Create bucket**

### 4. Create Bucket: final-outputs
```
Name: final-outputs
Public: ✓ (checked)  
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

Click **Create bucket**

---

## Step 2: Run Storage Policies SQL

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New query**
3. Copy and paste the contents of `005_storage_buckets.sql`
4. Click **Run** or press Ctrl+Enter
5. Wait for "Success" message

This will:
- Add storage policies for upload/update/delete/view
- Add `model_image_path` and `final_image_path` columns to outfit history
- Create cleanup function to auto-delete images when outfit is deleted

---

## Step 3: Verify Setup

### Check Buckets Created
1. Go to **Storage** in dashboard
2. You should see 3 buckets:
   - model-images (Public)
   - garment-images (Public)
   - final-outputs (Public)

### Check Policies
1. Click on each bucket
2. Click **Policies** tab
3. You should see 4 policies for each bucket:
   - Users can upload to own folder
   - Users can update own files
   - Users can delete own files
   - Public read access

### Check Table Updates
1. Go to **Table Editor**
2. Open `user_outfit_history` table
3. Verify new columns exist:
   - `model_image_path` (text, nullable)
   - `final_image_path` (text, nullable)

---

## Step 4: How It Works

### Image Upload Flow
```
1. User uploads model photo
   ↓
2. App converts to Blob
   ↓
3. supabaseService.uploadImage('model-images', userId, blob, 'model.jpg')
   ↓
4. Stored at: model-images/{userId}/{timestamp}-model.jpg
   ↓
5. Returns: { url: 'public URL', path: 'storage path' }
   ↓
6. Save URL and path to database
```

### Storage Structure
```
model-images/
├── {user_id_1}/
│   ├── 1698765432-model-1.jpg
│   ├── 1698765445-model-2.jpg
│   └── ...
├── {user_id_2}/
│   └── ...

garment-images/
├── {user_id_1}/
│   ├── 1698765567-shirt.jpg
│   └── ...

final-outputs/
├── {user_id_1}/
│   ├── 1698765678-outfit-1.jpg
│   ├── 1698765789-outfit-2.jpg
│   └── ...
```

### Image Cleanup
When an outfit is deleted:
1. Trigger `cleanup_outfit_images_trigger` fires
2. Function `cleanup_outfit_images()` executes
3. Deletes `model_image_path` from storage (if exists)
4. Deletes `final_image_path` from storage (if exists)
5. Outfit record deleted from database
6. No orphaned files in storage!

---

## Step 5: Code Integration

The app already includes the upload methods:

```typescript
// Upload model image
const { url, path } = await supabaseService.uploadImage(
  'model-images',
  userId,
  imageBlob,
  'model.jpg'
);

// Save to database with both URL and path
await supabaseService.saveOutfit({
  user_id: userId,
  model_image_url: url,
  model_image_path: path,  // For cleanup later
  // ... other fields
});
```

---

## Troubleshooting

### Bucket Creation Failed
- Make sure you're logged in to Supabase
- Ensure you have project owner/admin permissions
- Try creating via SQL Editor instead (see alternative below)

### Policies Not Working
1. Go to **Storage** → Click bucket → **Policies**
2. Make sure RLS is enabled
3. Verify all 4 policies are present
4. Check policy names match exactly

### Images Not Uploading
1. Check bucket is marked as **Public**
2. Verify MIME types match your image format
3. Check file size is under limit
4. Ensure user is authenticated

### Images Not Deleting
1. Verify cleanup trigger is created:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'cleanup_outfit_images_trigger';
   ```
2. Check function exists:
   ```sql
   SELECT * FROM information_schema.routines 
   WHERE routine_name = 'cleanup_outfit_images';
   ```

---

## Alternative: Create Buckets via SQL

If dashboard doesn't work, use SQL Editor:

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('model-images', 'model-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('garment-images', 'garment-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('final-outputs', 'final-outputs', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
```

---

## Migration Order

Run migrations in this order:
1. `002_user_profiles.sql` ✅
2. `004_user_billing.sql` ✅
3. `003_outfit_history.sql` ✅
4. **Create storage buckets** (Dashboard)
5. `005_storage_buckets.sql` ← Run this after buckets created

---

## Summary

✅ 3 storage buckets for organizing images  
✅ Public URLs for easy access  
✅ User-specific folders for security  
✅ Automatic cleanup on deletion  
✅ 10MB limit for model/final images  
✅ 5MB limit for garment images  
✅ JPEG, PNG, WebP support  

Your images will now be stored in Supabase Storage instead of blob URLs!
