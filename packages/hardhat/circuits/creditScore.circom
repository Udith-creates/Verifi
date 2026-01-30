pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template CreditScore() {
    signal input income;
    signal input assets;
    signal input debt;
    signal input threshold;

    signal output isValid;

    component gt = GreaterThan(64);

    // Score calculation: (income * 3) + assets - (debt * 2) > threshold
    signal score;
    score <== (income * 3) + assets - (debt * 2);

    gt.in[0] <== score;
    gt.in[1] <== threshold;

    isValid <== gt.out;

    // Constraint: Enforce isValid === 1
    isValid === 1;
}

component main {public [threshold]} = CreditScore();
