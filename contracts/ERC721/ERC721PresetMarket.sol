// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

/**  
 * @title Market Contract
 * @author akibe
 */

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import './ERC721PresetToken.sol';

contract ERC721PresetMarket is Ownable {

    // ==========-==========-==========-==========-==========-==========
    // Multi Sales
    // ==========-==========-==========-==========-==========-==========

    event ChangeSale(uint8 newId, uint216 newSupply);

    struct Sale {
        uint8 id;
        uint256 startTime;
        uint256 endTime;
        uint256 price;
        uint216 maxSupply;
        bytes32 merkleRoot;
    }

    Sale internal _currentSale;
    mapping(address => mapping(uint8 => uint256)) internal _salesOfOwner;

    constructor() Ownable(msg.sender) {}

    function getCurrentSale() external view returns (Sale memory) {
        return _currentSale;
    }

    function setCurrentSale(
        uint8 id,
        uint256 startTime,
        uint256 endTime,
        uint256 price,
        uint216 maxSupply,
        bytes32 merkleRoot
    ) external onlyOwner {
        _currentSale = Sale({
            id: id,
            startTime: startTime,
            endTime: endTime,
            price: price,
            maxSupply: maxSupply,
            merkleRoot: merkleRoot
        });
        emit ChangeSale(id, maxSupply);
    }

    // ==========-==========-==========-==========-==========-==========
    // Token Mint
    // ==========-==========-==========-==========-==========-==========

    error InsufficientFunds();
    error InvalidTokenContract();
    error NotForSale();
    error InvalidTokenId();
    error TokenAlreadyMinted();
    error SaleHasNotStarted();
    error SaleHasEnded();
    error NotAllowlisted();
    error OverMintLimit();

    address public tokenContract;
    
    function setTokenContract(address cont) external onlyOwner {
        tokenContract = cont;
    }

    function mint(
        address minter,
        uint256 tokenId,
        uint256 maxMintAmount,
        bytes32[] memory merkleProof
    ) public payable {
        checkMint(minter, tokenId, maxMintAmount, merkleProof);
        if (msg.value < _currentSale.price) revert InsufficientFunds();
        if (_currentSale.merkleRoot > 0) {
            _salesOfOwner[minter][_currentSale.id] += 1;
        }
        ERC721PresetToken(tokenContract).mint(minter, tokenId);
    }

    function checkMint(
        address minter,
        uint256 tokenId,
        uint256 maxMintAmount,
        bytes32[] memory merkleProof
    ) public view returns (bool) {
        if (tokenContract == address(0)) revert InvalidTokenContract();
        if (_currentSale.id == 0) revert NotForSale();
        if (tokenId == 0 || _currentSale.maxSupply < tokenId) revert InvalidTokenId();
        if (ERC721PresetToken(tokenContract).exists(tokenId)) revert TokenAlreadyMinted();
        if (_currentSale.startTime > block.timestamp) revert SaleHasNotStarted();
        if (_currentSale.endTime != 0 && _currentSale.endTime < block.timestamp) revert SaleHasEnded();
        if (_currentSale.merkleRoot > 0) {
            if (!checkMerkleProof(minter, maxMintAmount, merkleProof)) revert NotAllowlisted();
            if (_salesOfOwner[minter][_currentSale.id] >= maxMintAmount) revert OverMintLimit();
        }
        return true;
    }

    function checkMerkleProof(
        address minter,
        uint256 maxMintAmount,
        bytes32[] memory merkleProof
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(
            bytes.concat(keccak256(abi.encode(minter, maxMintAmount)))
        );
        return MerkleProof.verify(merkleProof, _currentSale.merkleRoot, leaf);
    }

    // ==========-==========-==========-==========-==========-==========
    // Withdraw
    // ==========-==========-==========-==========-==========-==========

    event Withdrawn(address indexed payee, uint256 weiAmount);

    function withdraw() external onlyOwner {
        address payee = payable(owner());
        uint256 balance = address(this).balance;
        require(0 < balance, 'Withdrawable: 0 Balance');

        (bool success, ) = payee.call{ value: balance }('');
        require(success, 'Withdrawable: Transfer failed');

        emit Withdrawn(payee, balance);
    }
}
