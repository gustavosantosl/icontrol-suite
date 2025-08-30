-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'viewer';
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
            CHECK (role IN ('admin', 'manager', 'viewer'));
    END IF;
END $$;

-- Ensure profiles table has proper structure for multi-tenant
DO $$ 
BEGIN 
    -- Add name column if it doesn't exist (for full_name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        -- If name exists but full_name doesn't, rename name to full_name
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'name') THEN
            ALTER TABLE public.profiles RENAME COLUMN name TO full_name;
        ELSE
            ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        END IF;
    END IF;
END $$;

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user with default role
  INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'viewer',
    NULL -- Will need to be set by admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- Update existing profiles that don't have roles
UPDATE public.profiles 
SET role = 'viewer' 
WHERE role IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_role ON public.profiles(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);