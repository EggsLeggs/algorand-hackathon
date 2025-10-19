import { TicketingAppFactory } from "@/contracts/TicketingApp";
import { OnSchemaBreak, OnUpdate } from "@algorandfoundation/algokit-utils/types/app";
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from "@/utils/network/getAlgoClientConfigs";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { TransactionSigner } from "algosdk";

export interface DeployEventParams {
  eventName: string;
  eventDate: number; // Unix timestamp
  ticketPrice: number; // Price in microALGOs
  seatCount: number;
  perWalletCap: number; // Maximum tickets per wallet
  network: string;
  activeAddress: string;
  transactionSigner: TransactionSigner;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

export interface DeployEventResult {
  success: boolean;
  appId?: number;
  asaId?: number;
  error?: string;
}

export async function deployEvent({
  eventName,
  eventDate,
  ticketPrice,
  seatCount,
  perWalletCap,
  network,
  activeAddress,
  transactionSigner,
  onError,
  onSuccess,
  onLoadingChange,
}: DeployEventParams): Promise<DeployEventResult> {
  if (!activeAddress || !transactionSigner) {
    onError("Please connect your wallet first");
    return { success: false, error: "Wallet not connected" };
  }

  // Validate required parameters
  if (!eventName || !eventName.trim()) {
    onError("Event name is required");
    return { success: false, error: "Event name is required" };
  }

  if (eventDate === undefined || eventDate === null || isNaN(eventDate) || eventDate <= 0) {
    onError("Event date must be a valid future timestamp");
    return { success: false, error: "Event date must be a valid future timestamp" };
  }

  if (ticketPrice === undefined || ticketPrice === null || isNaN(ticketPrice) || ticketPrice <= 0) {
    onError("Ticket price must be greater than 0");
    return { success: false, error: "Ticket price must be greater than 0" };
  }

  if (seatCount === undefined || seatCount === null || isNaN(seatCount) || seatCount <= 0) {
    onError("Seat count must be greater than 0");
    return { success: false, error: "Seat count must be greater than 0" };
  }

  if (perWalletCap === undefined || perWalletCap === null || isNaN(perWalletCap) || perWalletCap <= 0) {
    onError("Per wallet cap must be greater than 0");
    return { success: false, error: "Per wallet cap must be greater than 0" };
  }

  onLoadingChange(true);

  try {
    // Set up Algorand client
    const algodConfig = getAlgodConfigFromViteEnvironment();
    const indexerConfig = getIndexerConfigFromViteEnvironment();
    const algorand = AlgorandClient.fromConfig({
      algodConfig,
      indexerConfig,
    });
    algorand.setDefaultSigner(transactionSigner);

    // Debug logging
    console.log("Creating ticketing event with parameters:", {
      eventName,
      eventDate,
      ticketPrice,
      seatCount,
      perWalletCap,
      activeAddress,
    });

    // Additional validation and debug logging for BigInt conversion
    console.log("Parameter types and values:", {
      seatCount: { value: seatCount, type: typeof seatCount, isNaN: isNaN(seatCount) },
      ticketPrice: { value: ticketPrice, type: typeof ticketPrice, isNaN: isNaN(ticketPrice) },
      eventDate: { value: eventDate, type: typeof eventDate, isNaN: isNaN(eventDate) },
      perWalletCap: { value: perWalletCap, type: typeof perWalletCap, isNaN: isNaN(perWalletCap) },
    });

    // Additional validation before BigInt conversion
    if (seatCount === undefined || seatCount === null || isNaN(seatCount)) {
      throw new Error(`Invalid seatCount: ${seatCount}`);
    }
    if (ticketPrice === undefined || ticketPrice === null || isNaN(ticketPrice)) {
      throw new Error(`Invalid ticketPrice: ${ticketPrice}`);
    }
    if (eventDate === undefined || eventDate === null || isNaN(eventDate)) {
      throw new Error(`Invalid eventDate: ${eventDate}`);
    }
    if (perWalletCap === undefined || perWalletCap === null || isNaN(perWalletCap)) {
      throw new Error(`Invalid perWalletCap: ${perWalletCap}`);
    }

    // Step 1: Create the ticket ASA
    console.log("Creating ticket ASA...");
    const asaCreateTxn = await algorand.send.assetCreate({
      sender: activeAddress,
      total: BigInt(seatCount),
      decimals: 0, // Tickets are indivisible
      defaultFrozen: false,
      unitName: "TICKET",
      assetName: eventName,
      manager: activeAddress,
      reserve: activeAddress,
      freeze: activeAddress,
      clawback: activeAddress, // Will be updated to app address after deployment
    });

    const asaId = asaCreateTxn.assetId;
    console.log("ASA created with ID:", asaId);

    // Step 2: Deploy the TicketingApp smart contract with bootstrap
    console.log("Deploying TicketingApp smart contract with bootstrap...");
    const factory = new TicketingAppFactory({
      defaultSender: activeAddress,
      algorand,
    });

    const deployResult = await factory.deploy({
      createParams: {
        method: "bootstrap",
        args: [
          BigInt(asaId), // asset_id
          BigInt(ticketPrice), // price
          BigInt(eventDate), // start time (using event date as start)
          BigInt(eventDate + 30 * 24 * 60 * 60), // end time (30 days after start)
          BigInt(perWalletCap), // per_wallet_cap
          activeAddress, // organizer
        ],
      },
      onSchemaBreak: OnSchemaBreak.AppendApp,
      onUpdate: OnUpdate.AppendApp,
    });

    if (!deployResult) {
      throw new Error("Failed to deploy smart contract");
    }

    const { appClient } = deployResult;
    console.log("Smart contract deployed and bootstrapped successfully with App ID:", appClient.appId);

    // Step 3: Fund the app account with minimum balance for operations
    console.log("Funding app account...");
    const appAddress = appClient.appAddress;

    // Send funding transaction (0.5 ALGO for app operations)
    const fundingTxn = await algorand.send.payment({
      sender: activeAddress,
      receiver: appAddress,
      amount: { microAlgo: 500000n } as any, // 0.5 ALGO for funding
    });

    console.log("App account funded:", fundingTxn.txIds[0]);

    // Step 4: Update ASA clawback to the app address
    console.log("Updating ASA clawback to app address...");
    await algorand.send.assetConfig({
      sender: activeAddress,
      assetId: asaId,
      manager: activeAddress,
      reserve: activeAddress,
      freeze: activeAddress,
      clawback: appAddress, // Set clawback to app address
    });

    console.log("ASA clawback updated to app address");

    // Step 6: Transfer all tickets to the organizer (they will be clawed back during sales)
    console.log("Transferring tickets to organizer...");
    await algorand.send.assetTransfer({
      sender: activeAddress,
      receiver: activeAddress,
      assetId: asaId,
      amount: BigInt(seatCount),
    });

    console.log("Tickets transferred to organizer");

    const successMessage = `Event created successfully on ${network}!\n\nEvent Details:\n- Name: ${eventName}\n- Date: ${new Date(
      eventDate * 1000
    ).toLocaleString()}\n- Ticket Price: ${(ticketPrice / 1000000).toFixed(
      2
    )} ALGO\n- Seats Available: ${seatCount}\n- Per Wallet Cap: ${perWalletCap}\n\nContract Details:\n- App ID: ${
      appClient.appId
    }\n- App Address: ${appAddress}\n- ASA ID: ${asaId}\n\nYour ticketing event is now live! Users can buy tickets by sending ALGO payments to the contract.`;

    onSuccess(successMessage);
    console.log("Event created successfully with ASA ID:", asaId);

    return { success: true, appId: Number(appClient.appId), asaId: Number(asaId) };
  } catch (error) {
    console.error("Event creation error:", error);
    const errorMessage = `Event creation failed: ${error}`;
    onError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    onLoadingChange(false);
  }
}
