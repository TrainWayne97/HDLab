FROM ubuntu:24.04

# Gewuenschte Verilator-Version (Cocotb-Kompatibilitaet)
ARG VERILATOR_VERSION=5.036

# System-Updates und Build-Abhaengigkeiten
RUN apt-get update && \
    apt-get install -y \
    autoconf \
    bison \
    flex \
    g++ \
    git \
    help2man \
    make \
    perl \
    python3 \
    python3-pip \
    zlib1g-dev && \
    git clone --depth 1 --branch v${VERILATOR_VERSION} https://github.com/verilator/verilator.git /tmp/verilator && \
    cd /tmp/verilator && \
    autoconf && \
    ./configure && \
    make -j"$(nproc)" && \
    make install && \
    verilator --version && \
    cd / && \
    pip3 install --no-cache-dir --break-system-packages cocotb pytest && \
    rm -rf /tmp/verilator && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis
WORKDIR /sim

# Yosys fuer die Netlist-Ansicht (eigener Layer, damit der Verilator-Build im Cache bleibt)
RUN apt-get update && \
    apt-get install -y --no-install-recommends yosys && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Entrypoint-Skript
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
