// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ReputationSBT.sol";

interface IVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[2] calldata _pubSignals
    ) external view returns (bool);
}

contract LendingMarketplace {
    IVerifier public verifier;
    ReputationSBT public sbtContract;

    struct Offer {
        uint256 id;
        address lender;
        uint256 amount;
        uint256 minScore;
        bool active;
    }

    struct SolvencyStatus {
        uint256 threshold;
        uint256 expiry;
    }

    uint256 public nextOfferId;
    mapping(uint256 => Offer) public offers;
    mapping(address => SolvencyStatus) public solvency;
    mapping(uint256 => address) public loanBorrowers;

    event OfferCreated(uint256 indexed id, address indexed lender, uint256 amount, uint256 minScore);
    event LoanTaken(uint256 indexed id, address indexed borrower);
    event LoanRepaid(uint256 indexed id, address indexed borrower, uint256 amount);
    event SolvencyProved(address indexed user, uint256 threshold, uint256 expiry);

    constructor(address _verifier, address _sbtContract) {
        verifier = IVerifier(_verifier);
        sbtContract = ReputationSBT(_sbtContract);
    }

    /**
     * @notice Lender creates a loan offer
     */
    function createOffer(uint256 _minScore) external payable {
        require(msg.value > 0, "Must send ETH");
        
        uint256 offerId = nextOfferId++;
        offers[offerId] = Offer({
            id: offerId,
            lender: msg.sender,
            amount: msg.value,
            minScore: _minScore,
            active: true
        });

        emit OfferCreated(offerId, msg.sender, msg.value, _minScore);
    }

    /**
     * @notice User proves solvency with ZK proof
     * @dev This is the "check-in" that validates creditworthiness
     */
    function proveSolvency(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata input
    ) external {
        // Verify the ZK proof
        require(verifier.verifyProof(a, b, c, input), "Invalid proof");

        // input[0] = isValid (should be 1)
        // input[1] = threshold
        require(input[0] == 1, "Proof indicates invalid score");

        uint256 threshold = input[1];
        
        // Set solvency status (expires in 5 minutes for hackathon demo, represents 90 days)
        solvency[msg.sender] = SolvencyStatus({
            threshold: threshold,
            expiry: block.timestamp + 300 // 5 minutes
        });

        emit SolvencyProved(msg.sender, threshold, block.timestamp + 300);
    }

    /**
     * @notice Borrower accepts a loan offer (no ZK proof needed here)
     * @dev Checks pre-verified solvency status instead
     */
    function acceptOffer(uint256 _offerId) external {
        Offer storage offer = offers[_offerId];
        require(offer.active, "Offer not active");

        SolvencyStatus memory userSolvency = solvency[msg.sender];
        
        // Check solvency is not expired
        require(userSolvency.expiry > block.timestamp, "Solvency expired - please verify again");
        
        // Check solvency threshold meets offer requirement
        require(userSolvency.threshold >= offer.minScore, "Solvency threshold too low");

        // Mark offer as inactive and record borrower
        offer.active = false;
        loanBorrowers[_offerId] = msg.sender;

        // Transfer ETH to borrower
        (bool success, ) = msg.sender.call{value: offer.amount}("");
        require(success, "Transfer failed");

        emit LoanTaken(_offerId, msg.sender);
    }

    /**
     * @notice Borrower repays the loan
     * @dev Automatically mints SBT reputation token upon repayment
     */
    function repayLoan(uint256 _offerId) external payable {
        Offer storage offer = offers[_offerId];
        
        require(loanBorrowers[_offerId] == msg.sender, "Not the borrower");
        require(msg.value >= offer.amount, "Insufficient repayment amount");
        require(!offer.active, "Loan already repaid or not taken");

        // Transfer repayment to lender
        (bool success, ) = offer.lender.call{value: offer.amount}("");
        require(success, "Repayment transfer failed");

        // Mint SBT to increase reputation
        sbtContract.mint(msg.sender);

        // Return excess payment if any
        if (msg.value > offer.amount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - offer.amount}("");
            require(refundSuccess, "Refund failed");
        }

        emit LoanRepaid(_offerId, msg.sender, offer.amount);
    }

    /**
     * @notice Check if user's solvency is currently valid
     */
    function isSolvencyValid(address user) external view returns (bool) {
        return solvency[user].expiry > block.timestamp;
    }

    /**
     * @notice Get time remaining on solvency (in seconds)
     */
    function getSolvencyTimeRemaining(address user) external view returns (uint256) {
        if (solvency[user].expiry <= block.timestamp) {
            return 0;
        }
        return solvency[user].expiry - block.timestamp;
    }
}
