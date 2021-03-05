echo "[.] Starting all services"
docker-compose -f docker-compose.common.yaml -f docker-compose.dev.yaml up -d
echo "[.] Execute the following commands to attach to stdout the container(s)"
echo "docker-compose -f docker-compose.common.yaml logs -f penpal-server"
echo "[.] To shutdown the containers, run the following command"
echo "./stop-dev.ps1"