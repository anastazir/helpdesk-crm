export interface WhatsAppSettingsData {
  use_whatsapp: boolean
  stored_use_whatsapp: boolean
  enabled: boolean
  server_enabled: boolean
  configured: boolean
  can_manage: boolean
}

export interface WhatsAppMeData {
  use_whatsapp: boolean
  enabled: boolean
  server_enabled: boolean
  configured: boolean
  phone: string
  can_opt_in: boolean
  whatsapp_opt_in: boolean
  whatsapp_opt_in_at: string | null
  whatsapp_opt_out_at: string | null
  whatsapp_opt_in_source: string
}
