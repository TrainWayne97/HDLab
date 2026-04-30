module tb_Top;
    parameter N = 4;
    logic clk, rst;
    logic [31:0] in_data [N];
    logic [31:0] out_data [N];

    Top #(.N(N)) dut (
        .clk(clk),
        .rst(rst),
        .in_data(in_data),
        .out_data(out_data)
    );

    // Clock generation
    always #5 clk = ~clk;

    initial begin
        $display("Testbench start!");
        clk = 0;
        module tb_Top;
            parameter N = 4;
            logic clk, rst;
            logic [31:0] in_data [N];
            logic [31:0] out_data [N];

            Top #(.N(N)) dut (
                .clk(clk),
                .rst(rst),
                .in_data(in_data),
                .out_data(out_data)
            );

            // Clock generation
            always #5 clk = ~clk;

            // Initialisierung von clk und rst in separaten initial-Blöcken
            initial clk = 0;
            initial rst = 1;

            // Timeout, falls etwas hängt
            initial begin
                #10000;
                $display("Timeout! Simulation did not finish.");
                $finish;
            end

            initial begin
                $display("Testbench start!");
                repeat (2) @(posedge clk);
                $display("Reset wird deaktiviert");
                rst = 0;

                // Randomize inputs und Fortschritt anzeigen
                for (int t = 0; t < 20; t++) begin
                    $display("t = %0d", t);
                    for (int i = 0; i < N; i++)
                        in_data[i] = $urandom();
                    @(posedge clk);
                end

                $display("Stress test finished.");
                $finish;
            end
        endmodule
