export function normalizeVoucherInput(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9_-]/g, "");
}

export function getVoucherErrorMessage(
  value: unknown,
  translate: (text: string) => string
) {
  const message = value instanceof Error ? value.message : String(value ?? "");
  const signal = message.toLowerCase();

  if (signal.includes("not found")) {
    return translate("Não encontramos esse código. Confira a escrita e tente novamente.");
  }
  if (signal.includes("expired") || signal.includes("not active")) {
    return translate("Esse código não está mais disponível para resgate.");
  }
  if (signal.includes("usage limit") || signal.includes("exhausted")) {
    return translate("Esse código já atingiu o limite de usos.");
  }
  if (signal.includes("reserved") || signal.includes("another account")) {
    return translate("Esse código foi reservado para outra conta.");
  }
  if (signal.includes("too many")) {
    return translate("Houve muitas tentativas. Aguarde um pouco e tente novamente.");
  }

  return translate("Não foi possível ativar o código agora. Tente novamente.");
}
