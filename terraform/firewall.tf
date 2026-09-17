resource "null_resource" "firewall_setup" {
  depends_on = [hostinger_vps.djtools]

  triggers = {
    vps_id = hostinger_vps.djtools.id
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
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ufw",
      "sudo ufw default deny incoming",
      "sudo ufw default allow outgoing",
      "sudo ufw allow 22/tcp comment 'SSH'",
      "sudo ufw allow 80/tcp comment 'HTTP'",
      "sudo ufw allow ${var.spacebooker_port}/tcp comment 'Spacebooker'",
      "sudo ufw deny 5432/tcp comment 'Block external Postgres'",
      "sudo ufw --force enable",
      "sudo ufw status verbose",
    ]
  }
}
