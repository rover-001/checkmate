import { createScopedLogger } from "../logger.js";

const logger = createScopedLogger("billing");

export function processInvoice(invoiceId, amount) {
  logger.info("Processing invoice " + invoiceId);
  if (amount <= 0) {
    logger.error("Invalid amount");
    return false;
  }
  return true;
}
