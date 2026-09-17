output "server_ip" {
  description = "Public IPv4 address of the VPS"
  value       = local.server_ip
}

output "app_url" {
  description = "URL to access the DJ Stems Studio app"
  value       = "http://${local.server_ip}"
}

output "db_connection_string" {
  description = "PostgreSQL connection string for future backend use"
  value       = "postgresql://${var.db_user}:${var.db_password}@localhost:5432/${var.db_name}"
  sensitive   = true
}

output "spacebooker_url" {
  description = "URL to access the Spacebooker app"
  value       = "http://${local.server_ip}:${var.spacebooker_port}"
}

output "spacebooker_db_connection_string" {
  description = "PostgreSQL connection string for Spacebooker backend"
  value       = "postgresql://${var.spacebooker_db_user}:${var.spacebooker_db_password}@localhost:5432/${var.spacebooker_db_name}"
  sensitive   = true
}

output "ssh_command" {
  description = "SSH command to log into the server"
  value       = "ssh root@${local.server_ip}"
}

# ── Discovery outputs (useful before filling in tfvars) ───────────────────────

output "available_plans" {
  description = "All available VPS plans — use the 'id' value for var.vps_plan_id"
  value       = data.hostinger_vps_plans.all.plans
}

output "available_datacenters" {
  description = "All available data centers — use 'city' value for var.datacenter_city"
  value       = data.hostinger_vps_data_centers.all.data_centers
}

output "available_templates" {
  description = "All available OS templates — use exact 'name' for var.os_template_name"
  value       = data.hostinger_vps_templates.all.templates
}
