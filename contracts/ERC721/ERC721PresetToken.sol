// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

/**
 * @title Token Contract
 * @author akibe
 */

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/common/ERC2981.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract ERC721PresetToken is
    ERC721Enumerable,
    ERC2981,
    AccessControl,
    Ownable
{
    // ==========-==========-==========-==========-==========-==========
    // Variables
    // ==========-==========-==========-==========-==========-==========
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
    string internal _baseTokenURI;

    // ==========-==========-==========-==========-==========-==========
    // ERC721 Interface
    // ==========-==========-==========-==========-==========-==========

     constructor(string memory name, string memory symbol, uint96 royalty) ERC721(name, symbol) Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _setDefaultRoyalty(msg.sender, royalty);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Enumerable, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override {
        super._increaseBalance(account, value);
    }

    // ========== Metadata
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseTokenURI) public onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    // ========== Royalty
    function setDefaultRoyalty(address receiver, uint96 value) external onlyOwner {
        _setDefaultRoyalty(receiver, value);
    }

    // ========== Token
    function tokensOfOwner(
        address owner
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        for (uint256 i; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner,i);
        }
        return tokens;
    }

    function tokensOfAll() external view returns (uint256[] memory) {
        uint256 balance = totalSupply();
        uint256[] memory tokens = new uint256[](balance);
        for (uint256 i; i < balance; i++) {
            tokens[i] = tokenByIndex(i);
        }
        return tokens;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function mint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE)  {
        _safeMint(to, tokenId);
    }
}
