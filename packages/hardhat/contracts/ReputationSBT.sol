// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ReputationSBT
 * @notice Soulbound Token (non-transferable) for loan repayment reputation
 */
contract ReputationSBT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    
    // Mapping from address to token ID (one SBT per address)
    mapping(address => uint256) public userToken;
    
    // Mapping from token ID to reputation score (number of loans repaid)
    mapping(uint256 => uint256) public tokenReputation;

    // IPFS URI for the specific badge image
    string public constant IMAGE_URI = "ipfs://bafkreibkvjcfseiep6bp2y53zua2bah4qymwg4vznsxy4hwke5pfuavldy";

    event ReputationIncreased(address indexed user, uint256 tokenId, uint256 newReputation);

    constructor() ERC721("VeriFi Solvency Badge", "VERIFI") {}

    /**
     * @notice Mint a new SBT or increase reputation of existing one
     * @dev Only callable by the LendingMarketplace contract (owner)
     */
    function mint(address to) external onlyOwner {
        uint256 existingTokenId = userToken[to];
        
        if (existingTokenId == 0) {
            // First time - mint new SBT
            _tokenIdCounter++;
            uint256 newTokenId = _tokenIdCounter;
            
            _safeMint(to, newTokenId);
            userToken[to] = newTokenId;
            tokenReputation[newTokenId] = 1;
            
            emit ReputationIncreased(to, newTokenId, 1);
        } else {
            // Already has SBT - increase reputation
            tokenReputation[existingTokenId]++;
            emit ReputationIncreased(to, existingTokenId, tokenReputation[existingTokenId]);
        }
    }

    /**
     * @notice Get reputation score for an address
     */
    function getReputation(address user) external view returns (uint256) {
        uint256 tokenId = userToken[user];
        if (tokenId == 0) return 0;
        return tokenReputation[tokenId];
    }

    /**
     * @notice Generate token URI with embedded metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        uint256 reputation = tokenReputation[tokenId];
        
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "VeriFi Solvency Badge", "description": "Verified Credit History on VeriFi Protocol. Loans Repaid: ',
                        reputation.toString(),
                        '", "image": "',
                        IMAGE_URI,
                        '", "attributes": [{"trait_type": "Loans Repaid", "value": ',
                        reputation.toString(),
                        '}, {"trait_type": "Status", "value": "Verified Borrower"}]}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // --- SOULBOUND LOGIC (Disable Transfers) ---

    function transferFrom(address, address, uint256) public pure override {
        revert("SBT: Token is soulbound and cannot be transferred");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert("SBT: Token is soulbound and cannot be transferred");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("SBT: Token is soulbound and cannot be transferred");
    }

    function approve(address, uint256) public pure override {
        revert("SBT: Token is soulbound and cannot be approved");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("SBT: Token is soulbound and cannot be approved");
    }
}
