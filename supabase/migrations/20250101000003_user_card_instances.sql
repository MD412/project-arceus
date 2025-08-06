-- Create user_card_instances table for individual card tracking
CREATE TABLE user_card_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  condition TEXT DEFAULT 'Near Mint',
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_card_instances_user_id ON user_card_instances(user_id);
CREATE INDEX idx_user_card_instances_card_id ON user_card_instances(card_id);

-- Add RLS policies
ALTER TABLE user_card_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own card instances" ON user_card_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card instances" ON user_card_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card instances" ON user_card_instances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card instances" ON user_card_instances
  FOR DELETE USING (auth.uid() = user_id); 