# ── Spacebooker app ───────────────────────────────────────────────────────────

variable "spacebooker_src_dir" {
  description = "Absolute local path to the spacebooker repo root (where package.json lives)"
  type        = string
  # Update this once you know where the code lives:
  # default = "/home/dean/Code/repos/spacebooker"
}

variable "spacebooker_port" {
  description = "Port nginx will listen on for the spacebooker app"
  type        = number
  default     = 3001
}

variable "spacebooker_app_root" {
  description = "Path on the server where nginx serves the spacebooker build"
  type        = string
  default     = "/var/www/spacebooker"
}

variable "spacebooker_db_name" {
  description = "PostgreSQL database name for spacebooker"
  type        = string
  default     = "spacebooker"
}

variable "spacebooker_db_user" {
  description = "PostgreSQL user for spacebooker"
  type        = string
  default     = "spacebooker_user"
}

variable "spacebooker_db_password" {
  description = "Password for the spacebooker PostgreSQL user"
  type        = string
  sensitive   = true
}
