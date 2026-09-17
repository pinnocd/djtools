resource "null_resource" "spacebooker_postgres_setup" {
  depends_on = [null_resource.postgres_setup]   # postgres must be installed first

  triggers = {
    vps_id      = hostinger_vps.djtools.id
    db_name     = var.spacebooker_db_name
    db_user     = var.spacebooker_db_user
    db_password = sha256(var.spacebooker_db_password)
  }

  connection {
    type        = "ssh"
    user        = var.ops_user
    private_key = file(var.ssh_private_key_path)
    host        = local.server_ip
    timeout     = "5m"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo -u postgres PAGER=cat psql -c \"CREATE USER ${var.spacebooker_db_user} WITH PASSWORD '${var.spacebooker_db_password}';\" || true",
      "sudo -u postgres PAGER=cat psql -c \"CREATE DATABASE ${var.spacebooker_db_name} OWNER ${var.spacebooker_db_user};\" || true",
      "sudo -u postgres PAGER=cat psql -c \"GRANT ALL PRIVILEGES ON DATABASE ${var.spacebooker_db_name} TO ${var.spacebooker_db_user};\"",
      "sudo -u postgres PAGER=cat psql -d ${var.spacebooker_db_name} -c \"GRANT ALL ON SCHEMA public TO ${var.spacebooker_db_user};\"",
      # Add pg_hba entry for this user
      "PGVER=$(sudo -u postgres PAGER=cat psql -t -A -c 'SHOW server_version_num;' | cut -c1-2)",
      "grep -q 'host ${var.spacebooker_db_name} ${var.spacebooker_db_user}' /etc/postgresql/$${PGVER}/main/pg_hba.conf || echo 'host ${var.spacebooker_db_name} ${var.spacebooker_db_user} 127.0.0.1/32 md5' | sudo tee -a /etc/postgresql/$${PGVER}/main/pg_hba.conf",
      "sudo systemctl reload postgresql",
      "echo 'Spacebooker database ready'",
    ]
  }
}
