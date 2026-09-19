// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "../src/DutchAuction.sol";
interface Vm {
    function warp(uint256) external;
    function deal(address,uint256) external;
    function prank(address) external;
    function expectRevert(bytes4) external;
}
contract RejectPayment { receive() external payable { revert(); } }
contract DutchAuctionTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    DutchAuction auction;
    address seller = address(0x100);
    address buyer = address(0x200);
    function setUp() public {
        auction = new DutchAuction();
        vm.warp(1000); vm.deal(buyer,100 ether);
    }
    function list(address owner) internal {
        DutchAuction.ItemInput[] memory input = new DutchAuction.ItemInput[](1);
        input[0] = DutchAuction.ItemInput("Trone du stagiaire",10 ether,2 ether,60);
        vm.prank(owner); auction.listItems(input);
    }
    function testPriceAtStartMiddleEndAndAfter() public {
        list(seller); require(auction.currentPrice(0)==10 ether,"start");
        vm.warp(1030); require(auction.currentPrice(0)==4 ether,"middle");
        vm.warp(1060); require(auction.currentPrice(0)==2 ether,"end");
        vm.warp(1200); require(auction.currentPrice(0)==2 ether,"after end");
    }
    function testBuyAndRefundExcess() public {
        list(seller); vm.warp(1030);
        vm.prank(buyer); auction.buy{value:10 ether}(0);
        require(buyer.balance==96 ether,"excess refunded");
        require(seller.balance==4 ether,"seller paid");
        require(address(auction).balance==0,"no funds retained");
        DutchAuction.Item memory item = auction.getItem(0);
        require(item.sold && item.buyer==buyer && item.soldPrice==4 ether,"sold");
        vm.warp(5000); require(auction.currentPrice(0)==4 ether,"sold price frozen");
    }
    function testSecondBuyerLoses() public {
        list(seller); vm.prank(buyer); auction.buy{value:10 ether}(0);
        vm.expectRevert(DutchAuction.AlreadySold.selector);
        vm.prank(buyer); auction.buy{value:10 ether}(0);
    }
    function testInsufficientPayment() public {
        list(seller); vm.expectRevert(DutchAuction.InsufficientPayment.selector);
        vm.prank(buyer); auction.buy{value:1 ether}(0);
        require(!auction.getItem(0).sold,"not sold");
    }
    function testBuyAtFloorAfterDuration() public {
        list(seller); vm.warp(2000); vm.prank(buyer); auction.buy{value:2 ether}(0);
        require(auction.getItem(0).soldPrice==2 ether,"floor");
    }
    function testSellerCannotBuyOwnLot() public {
        list(seller); vm.deal(seller,20 ether);
        vm.expectRevert(DutchAuction.SelfPurchase.selector);vm.prank(seller);auction.buy{value:10 ether}(0);
    }
    function testInvalidInputs() public {
        DutchAuction.ItemInput[] memory input = new DutchAuction.ItemInput[](1);
        input[0]=DutchAuction.ItemInput("bad",1 ether,2 ether,60);
        vm.expectRevert(DutchAuction.InvalidInput.selector);auction.listItems(input);
        input[0]=DutchAuction.ItemInput("bad",10 ether,2 ether,0);
        vm.expectRevert(DutchAuction.InvalidInput.selector);auction.listItems(input);
        input[0]=DutchAuction.ItemInput("",10 ether,2 ether,60);
        vm.expectRevert(DutchAuction.InvalidInput.selector);auction.listItems(input);
        input[0]=DutchAuction.ItemInput("bad",10 ether,0,60);
        vm.expectRevert(DutchAuction.InvalidInput.selector);auction.listItems(input);
    }
    function testUnknownItem() public {
        vm.expectRevert(DutchAuction.NotFound.selector);auction.currentPrice(0);
        vm.expectRevert(DutchAuction.NotFound.selector);auction.getItem(0);
        vm.expectRevert(DutchAuction.NotFound.selector);auction.buy(0);
    }
    function testSellerPaymentRevertRollsBack() public {
        RejectPayment rejector=new RejectPayment();list(address(rejector));
        vm.expectRevert(DutchAuction.TransferFailed.selector);vm.prank(buyer);auction.buy{value:10 ether}(0);
        require(!auction.getItem(0).sold,"rollback");require(buyer.balance==100 ether,"funds returned");
    }
    function testFuzzPriceMonotonicAndBounded(uint32 t1,uint32 t2) public {
        list(seller);uint256 a=uint256(t1)%100000;uint256 b=a+uint256(t2)%100000;
        vm.warp(1000+a);uint256 p1=auction.currentPrice(0);
        vm.warp(1000+b);uint256 p2=auction.currentPrice(0);
        require(p2<=p1 && p2>=2 ether && p1<=10 ether,"monotonic bounded");
    }
}
