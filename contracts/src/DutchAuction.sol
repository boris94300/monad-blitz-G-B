// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title BRIC À BRAC : objets fictifs, uniquement pour le testnet.
contract DutchAuction {
    struct ItemInput { string name; uint128 startPrice; uint128 floorPrice; uint32 duration; }
    struct Item {
        address seller; string name; uint128 startPrice; uint128 floorPrice;
        uint64 startTime; uint32 duration; address buyer; bool sold; uint128 soldPrice;
    }
    Item[] private items;
    bool private locked;
    error InvalidInput(); error NotFound(); error AlreadySold();
    error InsufficientPayment(); error SelfPurchase(); error TransferFailed(); error Reentrancy();
    event ItemListed(uint256 indexed id, address indexed seller, string name, uint128 startPrice, uint128 floorPrice, uint64 startTime, uint32 duration);
    event ItemSold(uint256 indexed id, address indexed buyer, uint256 price, uint256 timestamp);

    // Empêche un destinataire de rappeler le contrat pendant un paiement.
    modifier nonReentrant() {
        if (locked) revert Reentrancy();
        locked = true; _; locked = false;
    }

    // Le vendeur inscrit un ou plusieurs lots et démarre leur horloge.
    function listItems(ItemInput[] calldata inputs) external nonReentrant returns (uint256 firstId) {
        if (inputs.length == 0 || inputs.length > 20) revert InvalidInput();
        firstId = items.length;
        for (uint256 i; i < inputs.length; ++i) {
            ItemInput calldata x = inputs[i];
            if (x.startPrice < x.floorPrice || x.floorPrice == 0 || x.duration == 0 || x.duration > 1 days || bytes(x.name).length == 0 || bytes(x.name).length > 200) revert InvalidInput();
            uint256 id = items.length;
            items.push(Item(msg.sender, x.name, x.startPrice, x.floorPrice, uint64(block.timestamp), x.duration, address(0), false, 0));
            emit ItemListed(id, msg.sender, x.name, x.startPrice, x.floorPrice, uint64(block.timestamp), x.duration);
        }
    }

    // Une lecture gratuite calcule le prix. Aucun robot ne doit le modifier.
    // La chute est rapide au début, puis ralentit jusqu'au prix plancher.
    function currentPrice(uint256 id) public view returns (uint256) {
        if (id >= items.length) revert NotFound();
        Item storage x = items[id];
        if (x.sold) return x.soldPrice;
        uint256 elapsed = block.timestamp - x.startTime;
        if (elapsed >= x.duration) return x.floorPrice;
        uint256 remaining = x.duration - elapsed;
        return uint256(x.floorPrice) + uint256(x.startPrice - x.floorPrice) * remaining * remaining / (uint256(x.duration) * x.duration);
    }

    // Le premier achat accepté gagne. Le vendeur ne peut pas s'acheter son lot.
    // L'état change avant les transferts ; un échec annule toute la transaction.
    function buy(uint256 id) external payable nonReentrant {
        if (id >= items.length) revert NotFound();
        Item storage x = items[id];
        if (x.sold) revert AlreadySold();
        if (msg.sender == x.seller) revert SelfPurchase();
        uint256 price = currentPrice(id);
        if (msg.value < price) revert InsufficientPayment();
        x.sold = true; x.buyer = msg.sender; x.soldPrice = uint128(price);
        emit ItemSold(id, msg.sender, price, block.timestamp);
        (bool paid,) = payable(x.seller).call{value: price}("");
        if (!paid) revert TransferFailed();
        if (msg.value > price) {
            (bool refunded,) = payable(msg.sender).call{value: msg.value - price}("");
            if (!refunded) revert TransferFailed();
        }
    }

    // Ces deux lectures permettent à l'interface de retrouver les lots.
    function itemCount() external view returns (uint256) { return items.length; }
    function getItem(uint256 id) external view returns (Item memory) {
        if (id >= items.length) revert NotFound();
        return items[id];
    }
}
