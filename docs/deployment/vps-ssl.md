# VPS и SSL

## Требования к серверу

- Ubuntu 22.04 LTS
- Docker + Docker Compose v2
- Открытые порты: 80, 443, 22

## Первоначальная настройка VPS

```bash
# 1. Создать пользователя deploy
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# 2. Добавить SSH ключ для GitHub Actions
mkdir -p /home/deploy/.ssh
echo "PUBLIC_KEY_CONTENT" >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Создать папку проекта
mkdir -p /home/deploy/fuel-tracker
cd /home/deploy/fuel-tracker
git clone https://github.com/PVMaksim/fuel-tracker.git .
cp .env.example .env
nano .env  # Заполнить реальными значениями
```

## Выпуск SSL-сертификата (один раз)

```bash
chmod +x scripts/init_ssl.sh
./scripts/init_ssl.sh
```

Скрипт:
1. Запускает nginx (для прохождения ACME challenge)
2. Запускает certbot через Docker
3. Заменяет `DOMAIN_PLACEHOLDER` в `nginx.conf`
4. Перезапускает nginx с новым сертификатом

## Обновление сертификата (автоматически)

```bash
# Добавить в crontab (обновление каждые 2 месяца)
crontab -e
# Добавить:
0 4 1 */2 * docker run --rm -v /home/deploy/fuel-tracker/certbot_certs:/etc/letsencrypt \
  certbot/certbot renew --quiet && \
  docker compose -f /home/deploy/fuel-tracker/docker-compose.yml restart nginx
```

## Первый запуск приложения

```bash
cd /home/deploy/fuel-tracker
docker compose up -d
docker compose ps      # Проверить статус
docker compose logs -f # Посмотреть логи
```

## Настройка бэкапов

```bash
chmod +x scripts/backup.sh

# Добавить в crontab (дамп каждую ночь в 3:00)
crontab -e
# Добавить:
0 3 * * * /home/deploy/fuel-tracker/scripts/backup.sh >> /var/log/fuel-backup.log 2>&1
```
