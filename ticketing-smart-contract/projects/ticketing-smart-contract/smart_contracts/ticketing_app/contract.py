from algopy import ARC4Contract, String, UInt64, Account, itxn, Bytes
from algopy.arc4 import abimethod, DynamicArray, StaticArray


class TicketingApp(ARC4Contract):
    @abimethod()
    def hello(self, name: String) -> String:
        return "Hello, " + name

    @abimethod()
    def createEvent(
        self,
        event_name: String,
        event_date: UInt64,
        ticket_price: UInt64,
        seat_count: UInt64,
        event_organizer: Account,
    ) -> UInt64:
        """
        Create a new event by minting an ASA with encoded event information.
        
        Args:
            event_name: Name of the event
            event_date: Unix timestamp of the event date
            ticket_price: Price per ticket in microALGOs
            seat_count: Total number of seats/tickets available
            event_organizer: Account that will manage the event
            
        Returns:
            UInt64: The created event ASA ID
        """

        # Encode event metadata in the note field
        # Format: "EVENT_DATA:name|date|price|seats"
        # event_data = (
        #     Bytes(b"EVENT_DATA:") + 
        #     Bytes(event_name.encode()) + Bytes(b"|") +
        #     Bytes(str(event_date).encode()) + Bytes(b"|") +
        #     Bytes(str(ticket_price).encode()) + Bytes(b"|") +
        #     Bytes(str(seat_count).encode())
        # )

        # Create the event ASA with metadata using InnerTxnBuilder
        ixtn_result = itxn.AssetConfig(
            total=seat_count,
            decimals=0,  # Each token represents one ticket
            default_frozen=False,
            unit_name="TICKET",
            asset_name=event_name,
            manager=event_organizer,
            reserve=event_organizer,
            freeze=event_organizer,
            clawback=event_organizer,
            url="",  # Could store additional metadata URL here
            metadata_hash=b"",  # Could store hash of additional metadata
            note=b"EVENT_DATA",  # TODO: Simple note for now, we need to encode the event data here
        ).submit()
        
        return ixtn_result.created_asset.id
