-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260408100001
-- Production name: bouwnetwerk_demo_data
-- =====================================================
-- BOUWNETWERK DEMO DATA
-- Test data voor het BouwNetwerk messaging systeem
-- =====================================================

-- Alleen uitvoeren als er al bedrijven en gebruikers zijn
DO $$
DECLARE
  v_demo_company_1 UUID;
  v_demo_company_2 UUID;
  v_demo_user_1 UUID;
  v_demo_user_2 UUID;
  v_channel_1 UUID;
  v_channel_2 UUID;
  v_connection_1 UUID;
BEGIN
  -- Haal eerste twee bedrijven op (exclusief de huidige gebruiker zijn bedrijf)
  SELECT id INTO v_demo_company_1 FROM public.companies ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO v_demo_company_2 FROM public.companies ORDER BY created_at LIMIT 1 OFFSET 1;
  
  -- Haal een gebruiker op uit elk bedrijf
  SELECT user_id INTO v_demo_user_1 
  FROM public.memberships 
  WHERE company_id = v_demo_company_1 
  LIMIT 1;
  
  SELECT user_id INTO v_demo_user_2 
  FROM public.memberships 
  WHERE company_id = v_demo_company_2 
  LIMIT 1;

  -- Alleen doorgaan als we bedrijven hebben
  IF v_demo_company_1 IS NULL OR v_demo_company_2 IS NULL THEN
    RAISE NOTICE 'Niet genoeg bedrijven gevonden voor demo data';
    RETURN;
  END IF;

  -- =====================================================
  -- 1. CONNECTIE TUSSEN BEDRIJVEN
  -- =====================================================
  
  -- Check of er al een connectie is
  SELECT id INTO v_connection_1
  FROM public.bouwnetwerk_connections
  WHERE (company_a_id = v_demo_company_1 AND company_b_id = v_demo_company_2)
     OR (company_a_id = v_demo_company_2 AND company_b_id = v_demo_company_1)
  LIMIT 1;
  
  IF v_connection_1 IS NULL THEN
    INSERT INTO public.bouwnetwerk_connections (
      company_a_id,
      company_b_id,
      status,
      requested_by_company_id,
      requested_at,
      accepted_at
    ) VALUES (
      v_demo_company_1,
      v_demo_company_2,
      'accepted',
      v_demo_company_1,
      NOW() - INTERVAL '30 days',
      NOW() - INTERVAL '30 days'
    )
    RETURNING id INTO v_connection_1;
    
    RAISE NOTICE 'Demo connectie aangemaakt: %', v_connection_1;
  END IF;

  -- =====================================================
  -- 2. DIRECT CHANNEL
  -- =====================================================
  
  -- Check of er al een direct channel is
  SELECT c.id INTO v_channel_1
  FROM public.bouwnetwerk_channels c
  INNER JOIN public.bouwnetwerk_channel_members m1 ON c.id = m1.channel_id
  INNER JOIN public.bouwnetwerk_channel_members m2 ON c.id = m2.channel_id
  WHERE c.type = 'direct'
    AND m1.company_id = v_demo_company_1
    AND m2.company_id = v_demo_company_2
    AND m1.is_active = TRUE
    AND m2.is_active = TRUE
  LIMIT 1;
  
  IF v_channel_1 IS NULL THEN
    INSERT INTO public.bouwnetwerk_channels (
      type,
      created_by_company_id,
      created_by_user_id,
      last_message_at
    ) VALUES (
      'direct',
      v_demo_company_1,
      v_demo_user_1,
      NOW() - INTERVAL '2 hours'
    )
    RETURNING id INTO v_channel_1;
    
    -- Voeg members toe
    INSERT INTO public.bouwnetwerk_channel_members (channel_id, company_id, role, is_active, joined_at)
    VALUES 
      (v_channel_1, v_demo_company_1, 'admin', TRUE, NOW() - INTERVAL '30 days'),
      (v_channel_1, v_demo_company_2, 'member', TRUE, NOW() - INTERVAL '30 days');
    
    RAISE NOTICE 'Demo direct channel aangemaakt: %', v_channel_1;
    
    -- Voeg berichten toe
    INSERT INTO public.bouwnetwerk_messages (channel_id, sender_company_id, sender_user_id, content, type, created_at)
    VALUES
      (v_channel_1, v_demo_company_2, v_demo_user_2, 'Hoi! Ik heb de offerte voor het renovatieproject doorgenomen. Kunnen we hierover bellen?', 'text', NOW() - INTERVAL '2 days'),
      (v_channel_1, v_demo_company_1, v_demo_user_1, 'Zeker, wanneer heb je tijd? Vandaag om 14u?', 'text', NOW() - INTERVAL '1 day'),
      (v_channel_1, v_demo_company_2, v_demo_user_2, 'Perfect, dat schikt. Tot dan!', 'text', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
      (v_channel_1, v_demo_company_1, v_demo_user_1, 'Ik heb de meeting notes doorgestuurd via email. Laat maar weten als je vragen hebt.', 'text', NOW() - INTERVAL '2 hours');
  ELSE
    RAISE NOTICE 'Direct channel bestaat al: %', v_channel_1;
  END IF;

  -- =====================================================
  -- 3. GROEP CHANNEL
  -- =====================================================
  
  -- Check of er al een groep channel is met deze naam
  SELECT id INTO v_channel_2
  FROM public.bouwnetwerk_channels
  WHERE name = 'Project Amsterdam Centrum'
  LIMIT 1;
  
  IF v_channel_2 IS NULL THEN
    INSERT INTO public.bouwnetwerk_channels (
      type,
      name,
      description,
      created_by_company_id,
      created_by_user_id,
      last_message_at
    ) VALUES (
      'group',
      'Project Amsterdam Centrum',
      'Samenwerking voor de renovatie van het kantoorpand op de Keizersgracht',
      v_demo_company_1,
      v_demo_user_1,
      NOW() - INTERVAL '5 hours'
    )
    RETURNING id INTO v_channel_2;
    
    -- Voeg members toe
    INSERT INTO public.bouwnetwerk_channel_members (channel_id, company_id, role, is_active, joined_at)
    VALUES 
      (v_channel_2, v_demo_company_1, 'admin', TRUE, NOW() - INTERVAL '14 days'),
      (v_channel_2, v_demo_company_2, 'member', TRUE, NOW() - INTERVAL '14 days');
    
    RAISE NOTICE 'Demo groep channel aangemaakt: %', v_channel_2;
    
    -- Voeg berichten toe
    INSERT INTO public.bouwnetwerk_messages (channel_id, sender_company_id, sender_user_id, content, type, created_at)
    VALUES
      (v_channel_2, v_demo_company_1, v_demo_user_1, 'Welkom allemaal in het project kanaal voor Amsterdam Centrum! 🏗️', 'text', NOW() - INTERVAL '14 days'),
      (v_channel_2, v_demo_company_2, v_demo_user_2, 'Dankjewel! Ik heb de bouwtekeningen al doorgenomen. Ziet er goed uit.', 'text', NOW() - INTERVAL '13 days'),
      (v_channel_2, v_demo_company_1, v_demo_user_1, 'Geweldig. De materialen zijn besteld en komen volgende week aan.', 'text', NOW() - INTERVAL '12 days'),
      (v_channel_2, v_demo_company_2, v_demo_user_2, 'Top! Hebben we ook al een planning voor de eerste werfbezoek?', 'text', NOW() - INTERVAL '5 hours');
  ELSE
    RAISE NOTICE 'Groep channel bestaat al: %', v_channel_2;
  END IF;

  RAISE NOTICE 'Demo data setup voltooid!';
  
END $$;

-- Recovered statement 2
-- Commentaar toevoegen
COMMENT ON TABLE public.bouwnetwerk_connections IS 'Connecties tussen bouwbedrijven voor inter-bedrijf communicatie';

-- Recovered statement 3
COMMENT ON TABLE public.bouwnetwerk_channels IS 'Chat kanalen (direct, groep, of project-gebonden)';

-- Recovered statement 4
COMMENT ON TABLE public.bouwnetwerk_channel_members IS 'Bedrijven die lid zijn van een chat kanaal';

-- Recovered statement 5
COMMENT ON TABLE public.bouwnetwerk_messages IS 'Chat berichten met support voor tekst, images en bestanden';

