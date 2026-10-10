import {
  ReferentialAction,
  RelationshipType,
  SQLProviderName,
} from "@/src/constants/sqlProviders";
import { NodeDTO } from "../model/DiagramData";

// Row shapes of the Supabase tables (see supabase/migrations)
export interface DiagramRow {
  id: string;
  title: string;
  owner_id: string;
  shares: string[];
  is_private: boolean;
  provider: SQLProviderName;
  created_at: string;
  updated_at: string | null;
}

export interface NodeRow {
  id: string;
  diagram_id: string;
  flow_id: string;
  position: { x: number; y: number };
  index: number;
  data: NodeDTO["data"];
  created_at: string;
  updated_at: string | null;
}

export interface EdgeRow {
  id: string;
  diagram_id: string;
  flow_id: string;
  source: string;
  source_handle: string | null;
  target: string;
  target_handle: string | null;
  index: number;
  color: string;
  relation_type: RelationshipType;
  relationship_name: string;
  is_auto_naming: boolean;
  referential_action_for_update: ReferentialAction;
  referential_action_for_delete: ReferentialAction;
  target_selected_primary_or_unique_id: string;
  source_column_ids: string[];
  created_at: string;
  updated_at: string | null;
}
