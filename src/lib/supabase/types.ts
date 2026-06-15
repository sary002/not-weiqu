// src/lib/supabase/types.ts
// 来自 docs/04-Database-Design.md 全章

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserTone = 'calm_warm' | 'calm_brief' | 'gentle_firm';
export type ConversationType = 'free' | 'drill' | 'crisis';
export type ConversationStatus = 'active' | 'ending' | 'closed';
export type MessageRole = 'user' | 'assistant' | 'system';
export type CrisisType =
  | 'self_harm'
  | 'harm_others'
  | 'acute_distress'
  | 'violence'
  | 'minor'
  | 'perinatal';
export type CrisisSeverity = 'low' | 'med' | 'high';
export type DetectedBy = 'rule' | 'model' | 'hybrid';
export type ScenarioLayer = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'deprecated';
export type ScriptSource = 'ai' | 'user_edit' | 'community_pick';
export type DataRequestType = 'export' | 'delete';
export type DataRequestStatus = 'pending' | 'running' | 'done' | 'failed';

export interface UserProfile {
  id: string;
  device_hash: string;
  user_token_hash: string | null;
  display_alias: string | null;
  preferred_tone: UserTone | null;
  preferred_scenario: string[];
  reduced_motion: boolean;
  progress_disabled: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserPreference {
  id: string;
  user_id: string;
  key: string;
  value: Json;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  scenario_id: string | null;
  type: ConversationType;
  status: ConversationStatus;
  started_at: string;
  last_active_at: string;
  closed_at: string | null;
  summary: string | null;
  key_facts: Json;
  crisis_flag: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content_enc: string; // base64
  content_hash: string;
  token_in: number | null;
  token_out: number | null;
  model: string | null;
  prompt_id: string | null;
  prompt_version: string | null;
  trace_id: string;
  redacted: boolean;
  crisis_hit: boolean;
  created_at: string;
}

export interface CrisisEvent {
  id: string;
  user_id: string;
  conversation_id: string | null;
  message_id: string | null;
  type: CrisisType;
  severity: CrisisSeverity;
  detected_by: DetectedBy;
  follow_up: string | null;
  created_at: string;
}

export interface Scenario {
  id: string;
  code: string;
  title: string;
  one_liner: string;
  layer: ScenarioLayer;
  scene_tags: string[];
  difficulty: number;
  status: ContentStatus;
  owner_agent: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  version: number;
  created_at: string;
}

export interface Script {
  id: string;
  user_id: string;
  title: string;
  scene_tag: string;
  content_enc: string;
  source: ScriptSource;
  ai_drill_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  bucket: string;
  count: number;
  last_at: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  user_id: string;
  title: string;
  happened_at: string;
  created_at: string;
}

export interface DrillDraft {
  id: string;
  user_id: string;
  scenario_id: string | null;
  conversation_id: string | null;
  state: Json;
  paused_at: string;
  expires_at: string;
}

export interface DataRequest {
  id: string;
  user_id: string;
  type: DataRequestType;
  status: DataRequestStatus;
  requested_at: string;
  completed_at: string | null;
  sla_due_at: string;
  result_url: string | null;
  error: string | null;
}

export interface AuditEvent {
  id: string;
  user_id_hash: string | null;
  trace_id: string;
  event_type: string;
  payload: Json;
  created_at: string;
}
