[
  {
    "rls_policy": "CREATE POLICY \"Permitir actualizar perfil del profesional\" ON public.api_psicologoprofile FOR UPDATE TO authenticated USING ((user_id = ((auth.uid())::text)::bigint));"
  },
  {
    "rls_policy": "CREATE POLICY \"Permitir ver perfil\" ON public.api_psicologoprofile FOR SELECT TO authenticated USING (true);"
  },
  {
    "rls_policy": "CREATE POLICY \"Permitir actualizar perfil paciente\" ON public.api_pacienteprofile FOR UPDATE TO authenticated USING ((user_id = ((auth.uid())::text)::bigint));"
  },
  {
    "rls_policy": "CREATE POLICY \"Permitir ver perfil paciente\" ON public.api_pacienteprofile FOR SELECT TO authenticated USING ((user_id = ((auth.uid())::text)::bigint));"
  },
  {
    "rls_policy": null
  },
  {
    "rls_policy": "CREATE POLICY \"dc_read_own\" ON public.direct_conversation FOR SELECT TO authenticated USING (((user1 = auth.uid()) OR (user2 = auth.uid())));"
  },
  {
    "rls_policy": "CREATE POLICY \"dc_update_own\" ON public.direct_conversation FOR UPDATE TO authenticated USING (((user1 = auth.uid()) OR (user2 = auth.uid()))) WITH CHECK (((user1 = auth.uid()) OR (user2 = auth.uid())));"
  },
  {
    "rls_policy": "CREATE POLICY \"msg_delete_sender\" ON public.message FOR DELETE TO authenticated USING ((sender = auth.uid()));"
  },
  {
    "rls_policy": null
  },
  {
    "rls_policy": "CREATE POLICY \"msg_select_participants\" ON public.message FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1\n   FROM direct_conversation dc\n  WHERE ((dc.id = message.conversation) AND ((dc.user1 = auth.uid()) OR (dc.user2 = auth.uid()))))));"
  },
  {
    "rls_policy": "CREATE POLICY \"msg_update_sender\" ON public.message FOR UPDATE TO authenticated USING ((sender = auth.uid())) WITH CHECK ((sender = auth.uid()));"
  },
  {
    "rls_policy": null
  },
  {
    "rls_policy": "CREATE POLICY \"ma_select_participants\" ON public.message_attachment FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1\n   FROM (message m\n     JOIN direct_conversation dc ON ((dc.id = m.conversation)))\n  WHERE ((m.id = message_attachment.message_id) AND ((dc.user1 = auth.uid()) OR (dc.user2 = auth.uid()))))));"
  },
  {
    "rls_policy": "CREATE POLICY \"profiles_select_auth\" ON public.profiles FOR SELECT TO authenticated USING (true);"
  },
  {
    "rls_policy": "CREATE POLICY \"profiles_self_read\" ON public.profiles FOR SELECT TO  USING ((auth.uid() = id));"
  },
  {
    "rls_policy": "CREATE POLICY \"profiles_update_own\" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));"
  }
]