from algopy import ARC4Contract, String, UInt64, Account, itxn, Bytes, Global, Txn, gtxn, Asset
from algopy.arc4 import abimethod, DynamicArray, StaticArray, UInt256


class TicketingApp(ARC4Contract):
    # Global state keys for event data
    # EVENT_COUNT = Bytes(b"event_count")
    # EVENT_PREFIX = Bytes(b"event_")
    
    # Event data structure stored in global state
    # Each event uses keys: event_{event_id}_{field}
    # Fields: name, subtitle, description, start_date, end_date, location_type, venue, 
    #         city, country, ticket_name, ticket_supply, price, currency, per_wallet_limit,
    #         resale_allowed, treasury_address, issuer_address, asa_unit_name, asa_asset_name,
    #         royalty_bps, vc_issuer_did, vc_schema_url, enable_qr, data_minimised

    @abimethod()
    def hello(self, name: String) -> String:
        return "Hello, " + name

    @abimethod()
    def createEvent(
        self,
        # Basic event info
        title: String,
        subtitle: String,
        description: String,
        start_date: UInt64,
        end_date: UInt64,
        timezone: String,
        location_type: String,  # "in-person", "virtual", "hybrid"
        venue: String,
        city: String,
        country: String,
        website: String,
        
        # Ticket configuration
        ticket_name: String,
        ticket_supply: UInt64,
        price: UInt64,  # Price in microALGOs
        currency: String,  # "ALGO" or "USDC"
        per_wallet_limit: UInt64,
        resale_allowed: UInt64,  # 0 = false, 1 = true
        
        # On-chain configuration
        treasury_address: Account,
        issuer_address: Account,
        asa_unit_name: String,
        asa_asset_name: String,
        royalty_bps: UInt64,
        
        # VC configuration
        vc_issuer_did: String,
        vc_schema_url: String,
        enable_qr: UInt64,  # 0 = false, 1 = true
        data_minimised: UInt64,  # 0 = false, 1 = true
    ) -> UInt64:
        """
        Create a new event by minting an ASA and storing event data in global state.
        
        Args:
            title: Event title
            subtitle: Event subtitle
            description: Event description
            start_date: Unix timestamp of event start
            end_date: Unix timestamp of event end
            timezone: Event timezone
            location_type: Type of event (in-person, virtual, hybrid)
            venue: Venue name (if applicable)
            city: City name
            country: Country name
            website: Event website URL
            ticket_name: Name of the ticket type
            ticket_supply: Total number of tickets to mint
            price: Price per ticket in microALGOs
            currency: Currency type (ALGO/USDC)
            per_wallet_limit: Maximum tickets per wallet
            resale_allowed: Whether resale is allowed (0/1)
            treasury_address: Address to receive ticket revenue
            issuer_address: Address that manages the event
            asa_unit_name: Unit name for the ASA
            asa_asset_name: Asset name for the ASA
            royalty_bps: Royalty in basis points
            vc_issuer_did: DID for VC issuer
            vc_schema_url: URL for VC schema
            enable_qr: Whether QR check-in is enabled (0/1)
            data_minimised: Whether to use data minimization (0/1)
            
        Returns:
            UInt64: The created event ASA ID
        """

        # Get the next event ID
        # event_count = Global.box.get(self.EVENT_COUNT, UInt64(0))
        # event_id = event_count + UInt64(1)
        
        # Store event count
        # Global.box[self.EVENT_COUNT] = event_id
        
        # Create the event ASA
        ixtn_result = itxn.AssetConfig(
            total=ticket_supply,
            decimals=0,  # Each token represents one ticket
            default_frozen=False,
            unit_name=asa_unit_name,
            asset_name=asa_asset_name,
            manager=issuer_address,
            reserve=treasury_address,
            freeze=issuer_address,
            clawback=issuer_address,
            url=website,
            # metadata_hash omitted - will be None/undefined
            note=b"EVENT_TICKET",
        ).submit()
        
        asa_id = ixtn_result.created_asset.id
        
        # Store event data in global state
        # Using event_id as the key prefix
        # event_key_prefix = self.EVENT_PREFIX + Bytes(str(event_id))
        
        # Store all event fields
        # Global.box[event_key_prefix + Bytes(b"title")] = title
        # Global.box[event_key_prefix + Bytes(b"subtitle")] = subtitle
        # Global.box[event_key_prefix + Bytes(b"description")] = description
        # Global.box[event_key_prefix + Bytes(b"start_date")] = start_date
        # Global.box[event_key_prefix + Bytes(b"end_date")] = end_date
        # Global.box[event_key_prefix + Bytes(b"timezone")] = timezone
        # Global.box[event_key_prefix + Bytes(b"location_type")] = location_type
        # Global.box[event_key_prefix + Bytes(b"venue")] = venue
        # Global.box[event_key_prefix + Bytes(b"city")] = city
        # Global.box[event_key_prefix + Bytes(b"country")] = country
        # Global.box[event_key_prefix + Bytes(b"website")] = website
        # Global.box[event_key_prefix + Bytes(b"ticket_name")] = ticket_name
        # Global.box[event_key_prefix + Bytes(b"ticket_supply")] = ticket_supply
        # Global.box[event_key_prefix + Bytes(b"price")] = price
        # Global.box[event_key_prefix + Bytes(b"currency")] = currency
        # Global.box[event_key_prefix + Bytes(b"per_wallet_limit")] = per_wallet_limit
        # Global.box[event_key_prefix + Bytes(b"resale_allowed")] = resale_allowed
        # Global.box[event_key_prefix + Bytes(b"treasury_address")] = String(treasury_address)
        # Global.box[event_key_prefix + Bytes(b"issuer_address")] = String(issuer_address)
        # Global.box[event_key_prefix + Bytes(b"asa_unit_name")] = asa_unit_name
        # Global.box[event_key_prefix + Bytes(b"asa_asset_name")] = asa_asset_name
        # Global.box[event_key_prefix + Bytes(b"royalty_bps")] = royalty_bps
        # Global.box[event_key_prefix + Bytes(b"vc_issuer_did")] = vc_issuer_did
        # Global.box[event_key_prefix + Bytes(b"vc_schema_url")] = vc_schema_url
        # Global.box[event_key_prefix + Bytes(b"enable_qr")] = enable_qr
        # Global.box[event_key_prefix + Bytes(b"data_minimised")] = data_minimised
        # Global.box[event_key_prefix + Bytes(b"asa_id")] = asa_id
        
        return asa_id
