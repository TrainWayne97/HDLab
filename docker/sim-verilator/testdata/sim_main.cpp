#include "Vmain.h"
#include "verilated.h"
#include <cstdio>

int main(int argc, char **argv) {
    // Umleitung aller Ausgaben in sim.log
    freopen("sim.log", "w", stdout);
    Verilated::commandArgs(argc, argv);
    Vmain* top = new Vmain;
    while (!Verilated::gotFinish()) { top->eval(); }
    delete top;
    return 0;
}
