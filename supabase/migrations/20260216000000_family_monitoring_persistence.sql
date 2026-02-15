-- ============================================================================
-- MIGRATION: Family Monitoring Persistence
-- Purpose: Add missing 'viewed_presence' action type to activity log CHECK
-- ============================================================================

-- Extend the CHECK constraint to include 'viewed_presence'
-- (all other action types already added by 20260213000000_parent_dashboard.sql)
ALTER TABLE family_activity_log DROP CONSTRAINT IF EXISTS family_activity_log_activity_type_check;
ALTER TABLE family_activity_log ADD CONSTRAINT family_activity_log_activity_type_check
  CHECK (activity_type IN (
    'viewed_messages', 'viewed_friends', 'viewed_servers', 'viewed_flags',
    'changed_monitoring_level', 'approved_server', 'denied_server',
    'approved_friend', 'denied_friend',
    'added_keyword_alert', 'removed_keyword_alert',
    'changed_time_limit', 'blocked_category', 'unblocked_category',
    'viewed_voice_metadata', 'exported_activity_log',
    'changed_data_retention', 'restricted_server', 'unrestricted_server',
    'viewed_presence'
  ));
