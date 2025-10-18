/**
 * Helper class for form validation and contract parameter conversion
 * for the TicketingApp smart contract
 */
export class TicketingAppHelper {
  /**
   * Validates form data for event creation
   */
  static validateFormData(form: any): string[] {
    const errors: string[] = [];

    if (!form.title || form.title.trim().length < 3) {
      errors.push("Event title must be at least 3 characters long");
    }

    if (!form.startDate) {
      errors.push("Start date is required");
    }

    if (!form.endDate) {
      errors.push("End date is required");
    }

    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      errors.push("End date must be after start date");
    }

    if (form.locationType !== "virtual" && (!form.venue || form.venue.trim().length === 0)) {
      errors.push("Venue is required for in-person and hybrid events");
    }

    if (!form.treasuryAddress || form.treasuryAddress.trim().length === 0) {
      errors.push("Treasury address is required");
    }

    if (!form.issuerAddress || form.issuerAddress.trim().length === 0) {
      errors.push("Issuer address is required");
    }

    if (!form.ticketSupply || form.ticketSupply <= 0) {
      errors.push("Ticket supply must be greater than 0");
    }

    if (form.price < 0) {
      errors.push("Price cannot be negative");
    }

    return errors;
  }

  /**
   * Converts form data to contract parameters
   */
  static formToContractParams(form: any) {
    // Convert dates to Unix timestamps
    const startDate = Math.floor(new Date(form.startDate).getTime() / 1000);
    const endDate = Math.floor(new Date(form.endDate).getTime() / 1000);

    // Convert price to microALGOs (multiply by 1,000,000)
    const priceInMicroAlgos = Math.floor(form.price * 1_000_000);

    return {
      title: form.title,
      subtitle: form.subtitle || "",
      description: form.description || "",
      startDate,
      endDate,
      timezone: form.timezone || "UTC",
      locationType: form.locationType || "in-person",
      venue: form.venue || "",
      city: form.city || "",
      country: form.country || "",
      website: form.website || "",
      ticketName: form.ticketName || "General Admission",
      ticketSupply: form.ticketSupply,
      price: priceInMicroAlgos,
      currency: form.currency || "ALGO",
      perWalletLimit: form.perWalletLimit || 1,
      resaleAllowed: form.resaleAllowed ? 1 : 0,
      treasuryAddress: form.treasuryAddress,
      issuerAddress: form.issuerAddress,
      asaUnitName: form.asaUnitName || "TICKET",
      asaAssetName: form.asaAssetName || "Event Ticket",
      royaltyBps: form.royaltyBps || 0,
      vcIssuerDid: form.vcIssuerDid || "",
      vcSchemaUrl: form.vcSchemaUrl || "",
      enableQr: form.enableQR ? 1 : 0,
      dataMinimised: form.dataMinimised ? 1 : 0,
    };
  }
}
