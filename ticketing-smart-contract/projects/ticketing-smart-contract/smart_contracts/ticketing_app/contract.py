from algopy import ARC4Contract, String, UInt64, GlobalState, LocalState, Global, Txn, itxn, Account
from algopy.arc4 import abimethod


class TicketingApp(ARC4Contract):
    """A ticketing smart contract that handles ticket sales for pre-created ASAs."""

    def __init__(self) -> None:
        # Global state
        self.asset_id = GlobalState(UInt64)          # ASA being sold
        self.unit_price = GlobalState(UInt64)        # microAlgos per ticket
        self.sale_start = GlobalState(UInt64)        # unix time
        self.sale_end = GlobalState(UInt64)          # unix time
        self.organizer = GlobalState(Account)        # organizer address
        self.per_cap = GlobalState(UInt64)           # max per wallet
        self.proceeds = GlobalState(UInt64)          # ALGO balance owed to organizer

        # Local state (per buyer)
        self.purchased = LocalState(UInt64)

    @abimethod(create="require")
    def bootstrap(self,
                  asset_id: UInt64,
                  price: UInt64,
                  start: UInt64,
                  end: UInt64,
                  per_wallet_cap: UInt64,
                  organizer: Account) -> None:
        """Bootstrap the ticket sale with ASA and sale parameters."""
        assert self.asset_id.value == 0, "already bootstrapped"
        self.asset_id.value = asset_id
        self.unit_price.value = price
        self.sale_start.value = start
        self.sale_end.value = end
        self.per_cap.value = per_wallet_cap
        self.organizer.value = organizer

    @abimethod
    def buy(self, qty: UInt64, buyer: Account) -> UInt64:
        """Buy tickets by sending ALGO payment."""
        # time + window checks
        now = Global.latest_timestamp
        assert now >= self.sale_start.value and now <= self.sale_end.value, "sale closed"
        assert qty > 0, "qty"

        # Validate payment amount (should be sent as ALGO payment in the same transaction group)
        # Note: In a real implementation, you'd validate the payment amount matches ticket_price * qty

        # enforce per-wallet cap
        assert self.purchased[buyer] + qty <= self.per_cap.value, "cap"

        # increment per-buyer count and track proceeds
        self.purchased[buyer] += qty
        self.proceeds.value += qty * self.unit_price.value

        # Transfer ASA from organizer's holding to buyer via clawback
        # Requires: ASA.clawback = this app address, organizer holds inventory
        itxn.AssetTransfer(
            xfer_asset=self.asset_id.value,
            asset_sender=self.organizer.value,   # take from organizer (clawback)
            asset_receiver=buyer,
            asset_amount=qty
        ).submit()

        # Return the number of tickets purchased
        return qty

    @abimethod
    def withdraw(self) -> None:
        """Withdraw proceeds to organizer."""
        assert Txn.sender == self.organizer.value, "only organizer"
        amt = self.proceeds.value
        assert amt > 0, "nothing to withdraw"

        self.proceeds.value = UInt64(0)

        # Pay out ALGO to organizer
        itxn.Payment(
            receiver=self.organizer.value,
            amount=amt
        ).submit()

    @abimethod
    def get_sale_info(self) -> tuple[UInt64, UInt64, UInt64, UInt64, Account, UInt64, UInt64]:
        """Get sale information."""
        return (
            self.asset_id.value,
            self.unit_price.value,
            self.sale_start.value,
            self.sale_end.value,
            self.organizer.value,
            self.per_cap.value,
            self.proceeds.value,
        )

    @abimethod
    def get_purchased(self, buyer: Account) -> UInt64:
        """Get number of tickets purchased by a specific buyer."""
        return self.purchased[buyer]

    @abimethod
    def hello(self, name: String) -> String:
        """A simple hello world method for testing."""
        return "Hello, " + name
