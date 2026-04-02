FROM ubuntu:24.04

# System-Updates und Abhängigkeiten
RUN apt-get update && \
    apt-get install -y verilator make g++ git python3 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis
WORKDIR /sim

# Entrypoint-Skript
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
