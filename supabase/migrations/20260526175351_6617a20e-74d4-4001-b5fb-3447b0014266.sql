-- Provision admin user lqfigueredo@gmail.com
DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = 'lqfigueredo@gmail.com';

  IF v_existing IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'lqfigueredo@gmail.com',
      crypt('Verdya2026!Admin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin Verdya"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'lqfigueredo@gmail.com', 'email_verified', true),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  ELSE
    v_user_id := v_existing;
  END IF;

  -- Ensure profile exists (trigger may not have run for pre-existing users)
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (v_user_id, 'Admin Verdya', 'lqfigueredo@gmail.com')
  ON CONFLICT (id) DO NOTHING;

  -- Promote to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;