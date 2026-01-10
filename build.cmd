docker build -t lionelschiepers/stockquote-mcp:latest -f .\Dockerfile .
docker push lionelschiepers/stockquote-mcp:latest

REM docker run --rm -v /var/run/docker.sock:/var/run/docker.sock nickfedor/watchtower --cleanup --run-once
