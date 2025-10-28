-- Migration: Outfit History and User Styles
-- Description: Tables for storing user outfit history and generated images
-- Date: 2025-10-28

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user_outfit_history
-- Stores all outfit creations and modifications by users
CREATE TABLE IF NOT EXISTS user_outfit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Outfit metadata
    outfit_name VARCHAR(255),
    description TEXT,
    tags TEXT[], -- Array of tags like 'casual', 'formal', 'summer'
    
    -- Model and outfit data
    model_image_url TEXT NOT NULL, -- URL to the base model image
    model_image_id VARCHAR(255), -- ID for IndexedDB if needed
    model_image_path TEXT, -- Storage path for cleanup
    
    -- Garment layers (JSON array of applied garments)
    garment_layers JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"id": "dress-1", "name": "Red Dress", "category": "dress", "imageUrl": "..."}]
    
    -- Final result
    final_image_url TEXT, -- URL to the final generated outfit image
    final_image_id VARCHAR(255), -- ID for IndexedDB
    final_image_path TEXT, -- Storage path for cleanup
    
    -- Pose and settings
    pose_variation VARCHAR(100),
    generation_settings JSONB, -- Store any AI generation parameters
    
    -- Status and metadata
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- For future sharing feature
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for fast queries
    CONSTRAINT outfit_history_user_id_idx CHECK (user_id IS NOT NULL)
);

-- Create indexes for better query performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_id ON user_outfit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_history_created_at ON user_outfit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_history_favorite ON user_outfit_history(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_outfit_history_tags ON user_outfit_history USING GIN(tags);

-- Table: user_wardrobe_items
-- Stores custom wardrobe items uploaded by users
CREATE TABLE IF NOT EXISTS user_wardrobe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Item details
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'top', 'bottom', 'dress', 'outerwear'
    description TEXT,
    color VARCHAR(50),
    brand VARCHAR(100),
    price DECIMAL(10, 2),
    
    -- Image storage
    image_url TEXT NOT NULL,
    image_id VARCHAR(255),
    thumbnail_url TEXT,
    
    -- Metadata
    usage_count INTEGER DEFAULT 0, -- How many times used in outfits
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_user_id ON user_wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_category ON user_wardrobe_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_favorite ON user_wardrobe_items(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Table: outfit_collections
-- Allows users to organize outfits into collections/albums
CREATE TABLE IF NOT EXISTS outfit_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON outfit_collections(user_id);

-- Junction table: Link outfits to collections
CREATE TABLE IF NOT EXISTS outfit_collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES outfit_collections(id) ON DELETE CASCADE,
    outfit_id UUID NOT NULL REFERENCES user_outfit_history(id) ON DELETE CASCADE,
    
    position INTEGER DEFAULT 0, -- For ordering within collection
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(collection_id, outfit_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON outfit_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_outfit ON outfit_collection_items(outfit_id);

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at (idempotent)
DROP TRIGGER IF EXISTS update_outfit_history_updated_at ON user_outfit_history;
CREATE TRIGGER update_outfit_history_updated_at
    BEFORE UPDATE ON user_outfit_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wardrobe_items_updated_at ON user_wardrobe_items;
CREATE TRIGGER update_wardrobe_items_updated_at
    BEFORE UPDATE ON user_wardrobe_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON outfit_collections;
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON outfit_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_outfit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_collection_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own outfit history (idempotent)
DROP POLICY IF EXISTS "Users can view own outfit history" ON user_outfit_history;
CREATE POLICY "Users can view own outfit history"
    ON user_outfit_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own outfit history" ON user_outfit_history;
CREATE POLICY "Users can insert own outfit history"
    ON user_outfit_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own outfit history" ON user_outfit_history;
CREATE POLICY "Users can update own outfit history"
    ON user_outfit_history FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own outfit history" ON user_outfit_history;
CREATE POLICY "Users can delete own outfit history"
    ON user_outfit_history FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can only see their own wardrobe (idempotent)
DROP POLICY IF EXISTS "Users can view own wardrobe" ON user_wardrobe_items;
CREATE POLICY "Users can view own wardrobe"
    ON user_wardrobe_items FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wardrobe items" ON user_wardrobe_items;
CREATE POLICY "Users can insert own wardrobe items"
    ON user_wardrobe_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wardrobe items" ON user_wardrobe_items;
CREATE POLICY "Users can update own wardrobe items"
    ON user_wardrobe_items FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wardrobe items" ON user_wardrobe_items;
CREATE POLICY "Users can delete own wardrobe items"
    ON user_wardrobe_items FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can manage their own collections (idempotent)
DROP POLICY IF EXISTS "Users can manage own collections" ON outfit_collections;
CREATE POLICY "Users can manage own collections"
    ON outfit_collections FOR ALL
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own collection items" ON outfit_collection_items;
CREATE POLICY "Users can manage own collection items"
    ON outfit_collection_items FOR ALL
    USING (
        collection_id IN (
            SELECT id FROM outfit_collections WHERE user_id = auth.uid()
        )
    );

-- Create default collection for existing users
CREATE OR REPLACE FUNCTION create_default_collection()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO outfit_collections (user_id, name, description, is_default)
    VALUES (NEW.id, 'My Styles', 'All your created outfits', TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_outfit_history IS 'Stores complete history of user outfit creations';
COMMENT ON TABLE user_wardrobe_items IS 'Custom wardrobe items uploaded by users';
COMMENT ON TABLE outfit_collections IS 'User-created collections/albums for organizing outfits';
COMMENT ON TABLE outfit_collection_items IS 'Junction table linking outfits to collections';

COMMENT ON COLUMN user_outfit_history.garment_layers IS 'JSON array of applied garments with full metadata';
COMMENT ON COLUMN user_outfit_history.generation_settings IS 'AI generation parameters used for reproducibility';
COMMENT ON COLUMN user_outfit_history.is_favorite IS 'User marked this outfit as favorite';
COMMENT ON COLUMN user_outfit_history.is_public IS 'Future feature: Allow outfit sharing';
