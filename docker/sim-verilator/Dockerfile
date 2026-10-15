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

# Yosys fuer die Netlist-Ansicht (eigener Layer, damit der Verilator-Build im Cache bleibt).
# YoWASP-Build statt Ubuntu-Paket: Ubuntu 24.04 hat nur Yosys 0.33 ohne yosys-slang, dessen
# Parser kein import in Packages/Modul-Headern und kein return in Funktionen versteht.
# Der erste Aufruf kompiliert das WebAssembly-Modul und legt es im Cache ab (/root/.cache),
# deshalb hier einmal ausfuehren - sonst dauert jede Simulation deutlich laenger.
ARG YOWASP_YOSYS_VERSION=0.70.0.0.post1259
RUN pip3 install --no-cache-dir --break-system-packages yowasp-yosys==${YOWASP_YOSYS_VERSION} && \
    ln -sf "$(command -v yowasp-yosys)" /usr/local/bin/yosys && \
    yosys -V && \
    yosys -q -p "help read_slang" > /dev/null

# Entrypoint-Skript
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
