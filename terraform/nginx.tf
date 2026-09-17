locals {
  nginx_conf = templatefile("${path.module}/templates/nginx_ssl_default.conf.tpl", {
    cert_name = "djtools"
    app_root  = var.app_root
  })
}

resource "null_resource" "nginx_setup" {
  depends_on = [
    hostinger_vps.djtools,
    null_resource.ssl_certs,
  ]

  triggers = {
    vps_id     = hostinger_vps.djtools.id
    nginx_conf = sha256(local.nginx_conf)
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
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx",
      "sudo systemctl enable nginx",
      "sudo mkdir -p ${var.app_root}",
      "sudo chown -R www-data:www-data ${var.app_root}",
      "sudo rm -f /etc/nginx/sites-enabled/default",
    ]
  }

  provisioner "file" {
    content     = local.nginx_conf
    destination = "/tmp/djtools.nginx.conf"
  }

  provisioner "remote-exec" {
    inline = [
      "sudo mv /tmp/djtools.nginx.conf /etc/nginx/sites-available/djtools",
      "sudo ln -sf /etc/nginx/sites-available/djtools /etc/nginx/sites-enabled/djtools",
      "sudo nginx -t",
      "sudo systemctl reload nginx",
    ]
  }
}
