# ─────────────────────────────────────────────────────────────────────────────
# Generate self-signed SSL certificates for both apps.
# Certs are valid for 10 years. Browsers will show a security warning —
# accept it once, or import the .crt into your OS trust store to silence it.
# ─────────────────────────────────────────────────────────────────────────────

resource "null_resource" "ssl_certs" {
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
      "sudo mkdir -p /etc/ssl/private",
      "sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -sha256 -keyout /etc/ssl/private/djtools.key -out /etc/ssl/certs/djtools.crt -subj '/C=GB/ST=England/L=Manchester/O=DJTools/CN=${local.server_ip}'",
      "sudo chmod 600 /etc/ssl/private/djtools.key",
      "sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -sha256 -keyout /etc/ssl/private/spacebooker.key -out /etc/ssl/certs/spacebooker.crt -subj '/C=GB/ST=England/L=Manchester/O=Spacebooker/CN=${local.server_ip}'",
      "sudo chmod 600 /etc/ssl/private/spacebooker.key",
      "echo 'Self-signed certs generated'",
    ]
  }
}
