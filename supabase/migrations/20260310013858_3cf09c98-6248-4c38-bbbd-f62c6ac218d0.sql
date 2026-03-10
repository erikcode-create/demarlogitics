
-- Drop and recreate the trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    IF NEW.email = 'shayne@demartransportation.com' THEN
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
