locals {
  app_src_dir  = "${path.module}/.."
  app_dist_dir = "${path.module}/../dist"
}

resource "null_resource" "app_build_and_deploy" {
  depends_on = [
    null_resource.nginx_setup,
    null_resource.postgres_setup,
  ]

  triggers = {
    vps_id = hostinger_vps.djtools.id
    src_hash = sha256(join("", [
      filesha256("${local.app_src_dir}/src/App.jsx"),
      filesha256("${local.app_src_dir}/src/components/StemProcessor.jsx"),
      filesha256("${local.app_src_dir}/src/components/FileManager.jsx"),
      filesha256("${local.app_src_dir}/src/utils/stemSeparation.js"),
      filesha256("${local.app_src_dir}/src/utils/audioUtils.js"),
    ]))
  }

  # ── 1. Build the React app locally ────────────────────────────────────────
  provisioner "local-exec" {
    working_dir = local.app_src_dir
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
    inline = ["sudo mkdir -p ${var.app_root} && sudo chown ${var.ops_user}:${var.ops_user} ${var.app_root}"]
  }

  # ── 2. Rsync dist/ to the server ──────────────────────────────────────────
  provisioner "local-exec" {
    command = <<-EOT
      rsync -az --delete \
        -e "ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=no" \
        ${local.app_dist_dir}/ \
        ${var.ops_user}@${local.server_ip}:${var.app_root}/
    EOT
  }

  # ── 3. Fix permissions and reload nginx ───────────────────────────────────
  provisioner "remote-exec" {
    inline = [
      "sudo chown -R www-data:www-data ${var.app_root}",
      "sudo chmod -R 755 ${var.app_root}",
      "sudo systemctl reload nginx",
      "echo 'Deploy complete — app live at http://${local.server_ip}'",
    ]
  }
}
