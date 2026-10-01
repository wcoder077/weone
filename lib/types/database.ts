
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "activities": {
                  Row: {
                    "created_at": string,"entity_id": string,"id": string,"type": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"entity_id": string,"id"?: string,"type": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"entity_id"?: string,"id"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activities_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"collab_requests": {
                  Row: {
                    "created_at": string,"id": string,"message": string | null,"project_id": string | null,"reason": string,"receiver_id": string,"sender_id": string,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"project_id"?: string | null,"reason": string,"receiver_id": string,"sender_id": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"project_id"?: string | null,"reason"?: string,"receiver_id"?: string,"sender_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collab_requests_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collab_requests_receiver_id_fkey"
      columns: ["receiver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collab_requests_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"connections": {
                  Row: {
                    "addressee_id": string,"created_at": string,"id": string,"requester_id": string,"responded_at": string | null,"status": string
                  }
                  Insert: {
                    "addressee_id": string,"created_at"?: string,"id"?: string,"requester_id": string,"responded_at"?: string | null,"status"?: string
                  }
                  Update: {
                    "addressee_id"?: string,"created_at"?: string,"id"?: string,"requester_id"?: string,"responded_at"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "connections_addressee_id_fkey"
      columns: ["addressee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversation_members": {
                  Row: {
                    "conversation_id": string,"last_read_at": string,"user_id": string
                  }
                  Insert: {
                    "conversation_id": string,"last_read_at"?: string,"user_id": string
                  }
                  Update: {
                    "conversation_id"?: string,"last_read_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversation_members_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversation_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "connection_id": string | null,"created_at": string,"id": string
                  }
                  Insert: {
                    "connection_id"?: string | null,"created_at"?: string,"id"?: string
                  }
                  Update: {
                    "connection_id"?: string | null,"created_at"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_connection_id_fkey"
      columns: ["connection_id"]
isOneToOne: true
      referencedRelation: "connections"
      referencedColumns: ["id"]
    }
                  ]
                },"education": {
                  Row: {
                    "degree": string | null,"end_year": number | null,"field": string | null,"id": string,"institution": string,"start_year": number | null,"user_id": string
                  }
                  Insert: {
                    "degree"?: string | null,"end_year"?: number | null,"field"?: string | null,"id"?: string,"institution": string,"start_year"?: number | null,"user_id": string
                  }
                  Update: {
                    "degree"?: string | null,"end_year"?: number | null,"field"?: string | null,"id"?: string,"institution"?: string,"start_year"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "education_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"join_requests": {
                  Row: {
                    "created_at": string,"id": string,"message": string | null,"project_id": string,"project_role_id": string | null,"status": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"project_id": string,"project_role_id"?: string | null,"status"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string | null,"project_id"?: string,"project_role_id"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "join_requests_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "join_requests_project_role_id_fkey"
      columns: ["project_role_id"]
isOneToOne: false
      referencedRelation: "project_roles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "join_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"journey_confirmations": {
                  Row: {
                    "confirmer_id": string,"created_at": string,"journey_item_id": string
                  }
                  Insert: {
                    "confirmer_id": string,"created_at"?: string,"journey_item_id": string
                  }
                  Update: {
                    "confirmer_id"?: string,"created_at"?: string,"journey_item_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journey_confirmations_confirmer_id_fkey"
      columns: ["confirmer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "journey_confirmations_journey_item_id_fkey"
      columns: ["journey_item_id"]
isOneToOne: false
      referencedRelation: "journey_items"
      referencedColumns: ["id"]
    }
                  ]
                },"journey_item_skills": {
                  Row: {
                    "journey_item_id": string,"skill_id": string
                  }
                  Insert: {
                    "journey_item_id": string,"skill_id": string
                  }
                  Update: {
                    "journey_item_id"?: string,"skill_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journey_item_skills_journey_item_id_fkey"
      columns: ["journey_item_id"]
isOneToOne: false
      referencedRelation: "journey_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "journey_item_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"journey_items": {
                  Row: {
                    "created_at": string,"description": string | null,"end_date": string | null,"id": string,"organization": string | null,"result": string | null,"role": string | null,"start_date": string | null,"title": string,"type": string,"user_id": string,"verified": boolean
                  }
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"organization"?: string | null,"result"?: string | null,"role"?: string | null,"start_date"?: string | null,"title": string,"type": string,"user_id": string,"verified"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"organization"?: string | null,"result"?: string | null,"role"?: string | null,"start_date"?: string | null,"title"?: string,"type"?: string,"user_id"?: string,"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "journey_items_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"conversation_id": string,"created_at": string,"edited_at": string | null,"id": string,"image_path": string | null,"kind": string,"project_id": string | null,"sender_id": string
                  }
                  Insert: {
                    "body"?: string,"conversation_id": string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"image_path"?: string | null,"kind"?: string,"project_id"?: string | null,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"conversation_id"?: string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"image_path"?: string | null,"kind"?: string,"project_id"?: string | null,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"entity_id": string | null,"id": string,"read": boolean,"type": string,"user_id": string
                  }
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"id"?: string,"read"?: boolean,"type": string,"user_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"id"?: string,"read"?: boolean,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"edited_at": string | null,"id": string
                  }
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"edited_at"?: string | null,"id"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"edited_at"?: string | null,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "available": boolean,"avatar_url": string | null,"banner_path": string | null,"banner_position": number,"bio": string | null,"city": string | null,"created_at": string,"full_name": string,"headline": string | null,"id": string,"interests": (string)[],"is_online_ok": boolean,"languages": (string)[],"looking_for": (string)[],"onboarded": boolean,"open_to": (string)[],"search": unknown,"username": string
                  }
                  Insert: {
                    "available"?: boolean,"avatar_url"?: string | null,"banner_path"?: string | null,"banner_position"?: number,"bio"?: string | null,"city"?: string | null,"created_at"?: string,"full_name"?: string,"headline"?: string | null,"id": string,"interests"?: (string)[],"is_online_ok"?: boolean,"languages"?: (string)[],"looking_for"?: (string)[],"onboarded"?: boolean,"open_to"?: (string)[],"search"?: never,"username": string
                  }
                  Update: {
                    "available"?: boolean,"avatar_url"?: string | null,"banner_path"?: string | null,"banner_position"?: number,"bio"?: string | null,"city"?: string | null,"created_at"?: string,"full_name"?: string,"headline"?: string | null,"id"?: string,"interests"?: (string)[],"is_online_ok"?: boolean,"languages"?: (string)[],"looking_for"?: (string)[],"onboarded"?: boolean,"open_to"?: (string)[],"search"?: never,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_members": {
                  Row: {
                    "created_at": string,"project_id": string,"role": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"project_id": string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"project_id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_members_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"project_role_skills": {
                  Row: {
                    "project_role_id": string,"skill_id": string
                  }
                  Insert: {
                    "project_role_id": string,"skill_id": string
                  }
                  Update: {
                    "project_role_id"?: string,"skill_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_role_skills_project_role_id_fkey"
      columns: ["project_role_id"]
isOneToOne: false
      referencedRelation: "project_roles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_role_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"project_roles": {
                  Row: {
                    "id": string,"is_open": boolean,"project_id": string,"title": string
                  }
                  Insert: {
                    "id"?: string,"is_open"?: boolean,"project_id": string,"title": string
                  }
                  Update: {
                    "id"?: string,"is_open"?: boolean,"project_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_roles_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_skills": {
                  Row: {
                    "project_id": string,"skill_id": string
                  }
                  Insert: {
                    "project_id": string,"skill_id": string
                  }
                  Update: {
                    "project_id"?: string,"skill_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_skills_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "category": string | null,"city": string | null,"created_at": string,"demo_url": string | null,"description": string | null,"github_url": string | null,"id": string,"is_looking": boolean,"is_online": boolean,"logo_url": string | null,"name": string,"owner_id": string,"search": unknown,"slug": string,"status": string,"tagline": string | null
                  }
                  Insert: {
                    "category"?: string | null,"city"?: string | null,"created_at"?: string,"demo_url"?: string | null,"description"?: string | null,"github_url"?: string | null,"id"?: string,"is_looking"?: boolean,"is_online"?: boolean,"logo_url"?: string | null,"name": string,"owner_id": string,"search"?: never,"slug": string,"status"?: string,"tagline"?: string | null
                  }
                  Update: {
                    "category"?: string | null,"city"?: string | null,"created_at"?: string,"demo_url"?: string | null,"description"?: string | null,"github_url"?: string | null,"id"?: string,"is_looking"?: boolean,"is_online"?: boolean,"logo_url"?: string | null,"name"?: string,"owner_id"?: string,"search"?: never,"slug"?: string,"status"?: string,"tagline"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"skills": {
                  Row: {
                    "category": string,"id": string,"name": string
                  }
                  Insert: {
                    "category"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "category"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_skills": {
                  Row: {
                    "level": string,"skill_id": string,"user_id": string
                  }
                  Insert: {
                    "level": string,"skill_id": string,"user_id": string
                  }
                  Update: {
                    "level"?: string,"skill_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_skills_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "user_skill_evidence": {
                  Row: {
                    "category": string | null,"journey_count": number | null,"level": string | null,"project_count": number | null,"skill_id": string | null,"skill_name": string | null,"user_id": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_skills_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "can_confirm_journey_item":
{ Args: { "item_id": string }; Returns: boolean
                           },
"can_read_message_image":
{ Args: { "object_name": string }; Returns: boolean
                           },
"check_first_message":
{ Args: { "p_body": string,"p_image_path": string }; Returns: undefined
                           },
"conversation_is_open":
{ Args: { "p_conversation_id": string }; Returns: boolean
                           },
"find_people":
{ Args: { "p_city"?: string,"p_limit"?: number,"p_offset"?: number,"p_online_ok"?: boolean,"p_open_only"?: boolean,"p_purpose"?: string,"p_role"?: string,"p_skill_ids"?: (string)[] }; Returns: {
              "available": boolean,"avatar_url": string,"city": string,"evidence_count": number,"full_name": string,"has_hackathon": boolean,"headline": string,"id": string,"is_open": boolean,"location_match": boolean,"looking_for_match": boolean,"match_count": number,"matched_skill_ids": (string)[],"role_match": boolean,"username": string
            }[]
                           },
"grapheme_length":
{ Args: { "value": string }; Returns: number
                           },
"is_conversation_member":
{ Args: { "p_conversation_id": string }; Returns: boolean
                           },
"is_project_owner":
{ Args: { "p_project_id": string }; Returns: boolean
                           },
"normalize_apostrophes":
{ Args: { "value": string }; Returns: string
                           },
"owns_journey_item":
{ Args: { "item_id": string }; Returns: boolean
                           },
"owns_project_folder":
{ Args: { "object_name": string }; Returns: boolean
                           },
"owns_project_role":
{ Args: { "p_role_id": string }; Returns: boolean
                           },
"public_people_preview":
{ Args: { "p_limit"?: number }; Returns: {
              "avatar_url": string,"city": string,"full_name": string,"headline": string,"skills": (string)[],"username": string
            }[]
                           },
"public_projects_preview":
{ Args: { "p_limit"?: number }; Returns: {
              "logo_url": string,"name": string,"skills": (string)[],"slug": string,"status": string,"tagline": string
            }[]
                           },
"respond_connection_request":
{ Args: { "p_accept": boolean,"p_connection_id": string }; Returns: undefined
                           },
"send_connection_request":
{ Args: { "p_addressee": string,"p_body": string,"p_image_path"?: string }; Returns: string
                           },
"start_conversation":
{ Args: { "other_user": string }; Returns: string
                           },
"update_connection_request":
{ Args: { "p_body": string,"p_connection_id": string,"p_image_path"?: string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

