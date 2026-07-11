-- Enable realtime for agent work inbox updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_actions;
