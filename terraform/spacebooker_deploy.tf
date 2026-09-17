resource "null_resource" "spacebooker_build_and_deploy" {
  depends_on = [
    null_resource.spacebooker_nginx_setup,
    null_resource.spacebooker_postgres_setup,
  ]

  triggers = {
    vps_id = hostinger_vps.djtools.id
    # Hash package.json + src/ to detect code changes
    src_hash = sha256(join("", [
      filesha256("${var.spacebooker_src_dir}/package.json"),
    ]))
  }

  # ── 1. Build locally ───────────────────────────────────────────────────────
  provisioner "local-exec" {
    working_dir = var.spacebooker_src_dir
    command     = "npm ci && npm run build"
  }

  connection {
    type        = "ssh"
    user        = var.ops_user
    private_key = file(var.ssh_private_key_path)
    host        = local.server_ip
    timeout     = "5m"
  }

  provisioner "remote-exec" {
    inline = ["sudo mkdir -p ${var.spacebooker_app_root} && sudo chown ${var.ops_user}:${var.ops_user} ${var.spacebooker_app_root}"]
  }

  # ── 2. Rsync dist/ to server ───────────────────────────────────────────────
  provisioner "local-exec" {
    command = <<-EOT
      rsync -az --delete \
        -e "ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=no" \
        ${var.spacebooker_src_dir}/dist/ \
        ${var.ops_user}@${local.server_ip}:${var.spacebooker_app_root}/
    EOT
  }

  # ── 3. Fix permissions and reload nginx ───────────────────────────────────
  provisioner "remote-exec" {
    inline = [
      "sudo chown -R www-data:www-data ${var.spacebooker_app_root}",
      "sudo chmod -R 755 ${var.spacebooker_app_root}",
      "sudo systemctl reload nginx",
      "echo 'Spacebooker live at http://${local.server_ip}:${var.spacebooker_port}'",
    ]
  }
}
