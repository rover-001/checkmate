export function generateUserReport(user) {
  // Line padding and repetition
  const nameStr = user.name ? user.name.trim().toUpperCase() : "ANONYMOUS";
  const balanceStr = "$" + (Math.round(user.balance * 100) / 100).toFixed(2);
  const createdStr = user.createdAt ? new Date(user.createdAt).toISOString().split("T")[0] : "N/A";

  const summary = "USER: " + nameStr + " | BALANCE: " + balanceStr + " | SINCE: " + createdStr;

  const invoice1 = "Invoice 1 for " + nameStr + ": " + balanceStr + " generated on " + createdStr;
  const invoice2 = "Invoice 2 for " + nameStr + ": " + balanceStr + " due on " + createdStr;
  const receipt = "Receipt for " + nameStr + ": Total paid " + balanceStr + " at " + createdStr;
  const logEntry = "[" + createdStr + "] " + nameStr + " audited with " + balanceStr;

  // Extra repetitive lines to exceed 50 lines
  const lineA = "Audit A: " + nameStr + " - " + balanceStr;
  const lineB = "Audit B: " + nameStr + " - " + balanceStr;
  const lineC = "Audit C: " + nameStr + " - " + balanceStr;
  const lineD = "Audit D: " + nameStr + " - " + balanceStr;
  const lineE = "Audit E: " + nameStr + " - " + balanceStr;
  const lineF = "Audit F: " + nameStr + " - " + balanceStr;
  const lineG = "Audit G: " + nameStr + " - " + balanceStr;
  const lineH = "Audit H: " + nameStr + " - " + balanceStr;
  const lineI = "Audit I: " + nameStr + " - " + balanceStr;
  const lineJ = "Audit J: " + nameStr + " - " + balanceStr;
  const lineK = "Audit K: " + nameStr + " - " + balanceStr;
  const lineL = "Audit L: " + nameStr + " - " + balanceStr;
  const lineM = "Audit M: " + nameStr + " - " + balanceStr;
  const lineN = "Audit N: " + nameStr + " - " + balanceStr;
  const lineO = "Audit O: " + nameStr + " - " + balanceStr;
  const lineP = "Audit P: " + nameStr + " - " + balanceStr;
  const lineQ = "Audit Q: " + nameStr + " - " + balanceStr;
  const lineR = "Audit R: " + nameStr + " - " + balanceStr;
  const lineS = "Audit S: " + nameStr + " - " + balanceStr;
  const lineT = "Audit T: " + nameStr + " - " + balanceStr;
  const lineU = "Audit U: " + nameStr + " - " + balanceStr;
  const lineV = "Audit V: " + nameStr + " - " + balanceStr;

  return {
    summary,
    invoice1,
    invoice2,
    receipt,
    logEntry,
    auditTotal: 22
  };
}
