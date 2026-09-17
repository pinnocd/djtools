variable "hostinger_api_token" {
  description = "Hostinger API token — generate at hpanel.hostinger.com → Profile → API"
  type        = string
  sensitive   = true
}

# ── VPS ───────────────────────────────────────────────────────────────────────

variable "hostname" {
  description = "Hostname for the VPS"
  type        = string
  default     = "djtools"
}

variable "vps_plan_id" {
  description = <<-EOT
    Full Hostinger plan slug. Run the following to list all available plans:
      terraform apply -target=data.hostinger_vps_plans.all
      terraform output available_plans
    Example: "hostingercom-vps-kvm2-usd-1m"
  EOT
  type        = string
}

variable "datacenter_city" {
  description = <<-EOT
    City name of the desired data center (case-insensitive).
    Run `terraform output available_datacenters` to see options.
    Examples: "Ashburn", "Amsterdam", "Singapore", "São Paulo"
  EOT
  type        = string
  default     = "Ashburn"
}

variable "os_template_name" {
  description = <<-EOT
    Exact OS template name. Run `terraform output available_templates` to list.
    Example: "Ubuntu 22.04 LTS"
  EOT
  type        = string
  default     = "Ubuntu 22.04 LTS"
}

variable "vps_root_password" {
  description = "Root password for the VPS (also used for emergency console access)"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to your SSH public key to upload to Hostinger"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ssh_private_key_path" {
  description = "Path to the matching SSH private key for provisioner connections"
  type        = string
  default     = "~/.ssh/id_ed25519"
}

# ── PostgreSQL ────────────────────────────────────────────────────────────────

variable "db_name" {
  description = "Name of the application database"
  type        = string
  default     = "djtools"
}

variable "db_user" {
  description = "PostgreSQL application user (not superuser)"
  type        = string
  default     = "djtools_user"
}

variable "db_password" {
  description = "Password for the PostgreSQL application user"
  type        = string
  sensitive   = true
}

variable "vps_ip" {
  description = "Override IP address for the VPS (use the IP shown in Hostinger hpanel if it differs from what the API returns)"
  type        = string
  default     = ""
}

# ── Server user ──────────────────────────────────────────────────────────────

variable "ops_user" {
  description = "Non-root sudo user created on the VPS for all operations after initial setup"
  type        = string
  default     = "ops"
}

# ── App ───────────────────────────────────────────────────────────────────────

variable "app_root" {
  description = "Path on the server where nginx will serve the built React app"
  type        = string
  default     = "/var/www/djtools"
}
