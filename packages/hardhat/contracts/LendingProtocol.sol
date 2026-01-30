// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Verifier.sol";

interface IVerifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[2] calldata input
    ) external view returns (bool);
}

contract LendingProtocol {
    IVerifier public verifier;

    event LoanApproved(address user);

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }


    // Usually proof components are passed separately: a, b, c
    function applyForLoan(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[2] calldata input
    ) public {
        // Verify the proof
        // Note: verifyProof returns true if verification succeeds
        require(verifier.verifyProof(a, b, c, input), "Invalid proof");

        // Check public input constraint
        // The circuit has public inputs: [solvent, threshold]
        // solvent is output signal, but in Groth16 it is the first public signal.
        // threshold is the second public signal.
        
        // input[0] is solvent (should be 1)
        require(input[0] == 1, "User is not solvent");

        // input[1] is the threshold
        require(input[1] >= 100, "Credit score threshold too low");

        emit LoanApproved(msg.sender);
    }
}
