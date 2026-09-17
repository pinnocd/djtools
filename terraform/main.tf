terraform {
  required_version = ">= 1.6"

  required_providers {
    hostinger = {
      source  = "hostinger/hostinger"
      version = "~> 0.1"
    }
  }
}

provider "hostinger" {
  api_token = var.hostinger_api_token
}

data "hostinger_vps_data_centers" "all" {}
data "hostinger_vps_templates" "all" {}
data "hostinger_vps_plans" "all" {}

locals {
  datacenter = one([
    for dc in data.hostinger_vps_data_centers.all.data_centers : dc
    if lower(dc.city) == lower(var.datacenter_city)
  ])
  template = one([
    for t in data.hostinger_vps_templates.all.templates : t
    if t.name == var.os_template_name
  ])

  # Authoritative server IP — overrides whatever the API returns.
  # Set vps_ip in tfvars to the IP shown in Hostinger hpanel.
  server_ip = var.vps_ip != "" ? var.vps_ip : hostinger_vps.djtools.ipv4_address
}

resource "hostinger_vps_ssh_key" "deployer" {
  name = "${var.hostname}-terraform"
  key  = file(var.ssh_public_key_path)

  lifecycle {
    # Don't replace the key resource if it already exists with the same content
    ignore_changes = [key]
  }
}

resource "hostinger_vps" "djtools" {
  plan           = var.vps_plan_id
  data_center_id = local.datacenter.id
  template_id    = local.template.id
  hostname       = var.hostname
  password       = var.vps_root_password
  ssh_key_ids    = [hostinger_vps_ssh_key.deployer.id]

  lifecycle {
    # The Hostinger API can return a stale IP and drift on ssh_key_ids after
    # initial creation — ignore both to prevent spurious plan diffs.
    ignore_changes = [ipv4_address, ssh_key_ids]
  }
}
