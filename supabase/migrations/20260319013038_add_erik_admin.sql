
-- Update trigger to also grant admin to erik@demartransportation.com
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    IF NEW.email IN ('shayne@demartransportation.com', 'erik@demartransportation.com') THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user_role error: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

-- Grant admin to erik if account already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'erik@demartransportation.com'
ON CONFLICT (user_id, role) DO NOTHING;
