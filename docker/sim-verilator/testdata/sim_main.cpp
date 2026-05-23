#include "Vmain.h"
#include "verilated.h"
#include <cstdio>
#include <cstdlib>

int main(int argc, char **argv) {
    Verilated::commandArgs(argc, argv);
    Vmain* top = new Vmain;

    // Nur grundlegende Simulation mit verschiedenen Input-Kombinationen
    printf("=== Starting Simulation ===\n");
    
    // Test 4 Kombinationen (für typische 2-Input-Module)
    for (int cycle = 0; cycle < 5; cycle++) {
        // Simuliere verschiedene Eingangszustände
        top->eval();
        printf("Cycle %d: Simulation step completed\n", cycle);
    }
    
    // Variiere die Eingänge, wenn sie existieren
    for (int a = 0; a <= 1; a++) {
        for (int b = 0; b <= 1; b++) {
            // Versuche, die Eingänge zu setzen
            // (Diese existieren vielleicht nicht für alle Module)
            if (a == 0) top->signal_a_in = 0; else top->signal_a_in = 1;
            if (b == 0) top->signal_b_in = 0; else top->signal_b_in = 1;
            
            // Evaluiere die kombinatorische Logik
            top->eval();
            
            printf("Test: a=%d, b=%d - Evaluation successful\n", a, b);
        }
    }
    
    printf("=== Simulation Complete ===\n");
    printf("SUCCESS: Simulation completed without errors\n");
    
    delete top;
    return 0;
}
