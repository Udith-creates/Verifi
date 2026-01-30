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

contract LendingMarketplace {
    IVerifier public verifier;

    struct Offer {
        uint256 id;
        address lender;
        uint256 amount;
        uint256 minScore;
        bool active;
    }

    mapping(uint256 => Offer) public offers;
    uint256 public nextOfferId;

    event OfferCreated(uint256 indexed id, address indexed lender, uint256 amount, uint256 minScore);
    event LoanTaken(uint256 indexed id, address indexed borrower);

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    function createOffer(uint256 _minScore) external payable {
        require(msg.value > 0, "Must deposit ETH");
        require(_minScore > 0, "Min score must be > 0");

        offers[nextOfferId] = Offer({
            id: nextOfferId,
            lender: msg.sender,
            amount: msg.value,
            minScore: _minScore,
            active: true
        });

        emit OfferCreated(nextOfferId, msg.sender, msg.value, _minScore);
        nextOfferId++;
    }

    function acceptOffer(
        uint256 _offerId,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[2] calldata input
    ) external {
        Offer storage offer = offers[_offerId];
        require(offer.active, "Offer not active");

        // Verify the proof
        // Note: verifyProof returns true if verification succeeds
        require(verifier.verifyProof(a, b, c, input), "Invalid proof");

        // Check public input constraint
        // The circuit has public inputs: [isValid, threshold]
        // input[0] is isValid (should be 1)
        require(input[0] == 1, "Proof says invalid");

        // CRITICAL: Ensure the proof was generated for THIS offer's requirement
        // input[1] is the threshold used in the circuit
        require(input[1] == offer.minScore, "Proof generated for different threshold");

        // Mark as inactive first (reentrancy protection)
        offer.active = false;

        // Transfer funds
        (bool sent, ) = msg.sender.call{value: offer.amount}("");
        require(sent, "Failed to send ETH");

        emit LoanTaken(_offerId, msg.sender);
    }
}
