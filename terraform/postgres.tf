resource "null_resource" "postgres_setup" {
  depends_on = [hostinger_vps.djtools]

  triggers = {
    vps_id      = hostinger_vps.djtools.id
    db_name     = var.db_name
    db_user     = var.db_user
    db_password = sha256(var.db_password)
  }

  connection {
    type        = "ssh"
    user        = var.ops_user
    private_key = file(var.ssh_private_key_path)
    host        = local.server_ip
    timeout     = "10m"
  }

  # ── Install PostgreSQL if not already present ──────────────────────────────
  provisioner "remote-exec" {
    inline = [
      # Skip install if postgres binary already exists
      "if ! command -v psql &>/dev/null; then",
      "  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates lsb-release",
      "  CODENAME=$(lsb_release -cs)",
      "  sudo install -d /usr/share/postgresql-common/pgdg",
      "  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc > /dev/null",
      "  if curl -fsSL --head https://apt.postgresql.org/pub/repos/apt/dists/$${CODENAME}-pgdg/Release > /dev/null 2>&1; then echo \"deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $${CODENAME}-pgdg main\" | sudo tee /etc/apt/sources.list.d/pgdg.list; fi",
      "  sudo apt-get update -qq",
      "  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql",
      "fi",
      "sudo systemctl enable postgresql",
      "sudo systemctl start postgresql",
      "sudo systemctl is-active postgresql",
    ]
  }

  # ── Create database and user ───────────────────────────────────────────────
  # PAGER=cat prevents psql from opening an interactive pager (no TTY in provisioner)
  provisioner "remote-exec" {
    inline = [
      "sudo -u postgres PAGER=cat psql -c \"CREATE USER ${var.db_user} WITH PASSWORD '${var.db_password}';\" || true",
      "sudo -u postgres PAGER=cat psql -c \"CREATE DATABASE ${var.db_name} OWNER ${var.db_user};\" || true",
      "sudo -u postgres PAGER=cat psql -c \"GRANT ALL PRIVILEGES ON DATABASE ${var.db_name} TO ${var.db_user};\"",
      "sudo -u postgres PAGER=cat psql -d ${var.db_name} -c \"GRANT ALL ON SCHEMA public TO ${var.db_user};\"",
    ]
  }

  # ── Lock PostgreSQL to localhost only ─────────────────────────────────────
  provisioner "remote-exec" {
    inline = [
      # Detect installed pg version directory
      "PGVER=$(sudo -u postgres PAGER=cat psql -t -A -c 'SHOW server_version_num;' | cut -c1-2)",
      "PGCONF=\"/etc/postgresql/$${PGVER}/main\"",
      "echo \"PostgreSQL $${PGVER} config: $${PGCONF}\"",
      "grep -q 'host ${var.db_name} ${var.db_user}' $${PGCONF}/pg_hba.conf || echo 'host ${var.db_name} ${var.db_user} 127.0.0.1/32 md5' | sudo tee -a $${PGCONF}/pg_hba.conf",
      "sudo sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/\" $${PGCONF}/postgresql.conf",
      "sudo sed -i \"s/listen_addresses = '\\*'/listen_addresses = 'localhost'/\" $${PGCONF}/postgresql.conf",
      "sudo systemctl restart postgresql",
      "sudo systemctl is-active postgresql",
      "echo 'PostgreSQL setup complete'",
    ]
  }
}
