import { setSwaps, swaps } from "../signals";

export const swapStatusPending = {
    TransactionConfirmed: "transaction.confirmed",
    TransactionMempool: "transaction.mempool",
};

export const swapStatusFailed = {
    SwapExpired: "swap.expired",
    SwapRefunded: "swap.refunded",
    InvoiceFailedToPay: "invoice.failedToPay",
    TransactionLockupFailed: "transaction.lockupFailed",
};

export const swapStatusSuccess = {
    InvoiceSettled: "invoice.settled",
    TransactionClaimed: "transaction.claimed",
};

export const swapStatusFinal = [
    swapStatusFailed.SwapExpired,
    swapStatusFailed.SwapRefunded,
    swapStatusFailed.InvoiceFailedToPay,
].concat(Object.values(swapStatusSuccess));

export const updateSwapStatus = (id: string, newStatus: string) => {
    if (swapStatusFinal.includes(newStatus)) {
        const swapsTmp = swaps();
        const swap = swapsTmp.find((swap) => swap.id === id);

        if (swap.status !== newStatus) {
            swap.status = newStatus;
            setSwaps(swapsTmp);
            return true;
        }
    }

    return false;
};

export const checkClaimStatus = (
    status?: string,
    transaction?: string,
    claimTx?: string,
) => {
    return (
        claimTx === undefined &&
        transaction !== undefined &&
        (status === swapStatusPending.TransactionConfirmed ||
            status === swapStatusPending.TransactionMempool)
    );
};
