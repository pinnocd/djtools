locals {
  spacebooker_nginx_conf = templatefile("${path.module}/templates/nginx_ssl_port.conf.tpl", {
    cert_name = "spacebooker"
    port      = var.spacebooker_port
    app_root  = var.spacebooker_app_root
  })
}

resource "null_resource" "spacebooker_nginx_setup" {
  depends_on = [
    hostinger_vps.djtools,
    null_resource.nginx_setup,
    null_resource.ssl_certs,
  ]

  triggers = {
    vps_id     = hostinger_vps.djtools.id
    nginx_conf = sha256(local.spacebooker_nginx_conf)
    port       = var.spacebooker_port
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
      "sudo mkdir -p ${var.spacebooker_app_root}",
      "sudo chown -R www-data:www-data ${var.spacebooker_app_root}",
    ]
  }

  provisioner "file" {
    content     = local.spacebooker_nginx_conf
    destination = "/tmp/spacebooker.nginx.conf"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo mv /tmp/spacebooker.nginx.conf /etc/nginx/sites-available/spacebooker",
      "sudo ln -sf /etc/nginx/sites-available/spacebooker /etc/nginx/sites-enabled/spacebooker",
      "sudo nginx -t",
      "sudo systemctl reload nginx",
    ]
  }
}
