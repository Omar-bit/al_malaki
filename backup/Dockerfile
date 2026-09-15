# syntax=docker/dockerfile:1

# rclone ships a static Go binary, so it can simply be lifted into the MySQL
# image.
FROM rclone/rclone:1.68 AS rclone

# Based on the official MySQL image so `mysqldump` speaks the same auth plugin
# (caching_sha2_password) as the MySQL 8 server. The MariaDB client, which is
# what Alpine packages, cannot authenticate against it.
FROM mysql:8

RUN microdnf install -y gzip tar ca-certificates \
  && microdnf clean all

COPY --from=rclone /usr/local/bin/rclone /usr/local/bin/rclone

COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
COPY scheduler.sh /usr/local/bin/scheduler.sh
RUN chmod +x /usr/local/bin/backup.sh   /usr/local/bin/restore.sh   /usr/local/bin/scheduler.sh

ENTRYPOINT ["/usr/local/bin/scheduler.sh"]
