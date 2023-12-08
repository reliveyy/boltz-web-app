import { BigNumber } from "bignumber.js";

export const satFactor = 100_000_000;

export const denominations = {
    sat: "sat",
    btc: "btc",
};

export const getValidationRegex = (max: number, denom: string) => {
    const digits = calculateDigits(max, denom);
    const regex =
        denom === denominations.sat
            ? `^[0-9]{1,${digits}}$`
            : `^[0-9](.[0-9]{1,${digits}}){0,1}$`;
    return new RegExp(regex);
};

export const formatAmount = (amount: number, denom: string, fixed = false) => {
    return formatAmountDenomination(denom, amount, fixed);
};

export const formatAmountDenomination = (
    denom: string,
    amount: number,
    fixed = false,
) => {
    switch (denom) {
        case denominations.btc:
            const amountBig = new BigNumber(amount).div(satFactor);
            if (fixed) {
                return amountBig.toFixed(8);
            }
            if (amountBig.isZero()) {
                return amountBig.toFixed(1);
            }
            // 0.00000001.toString() returns "1e-8"
            // 0.0000001.toString() returns "1e-7"
            if (amountBig.toString().indexOf("-") !== -1) {
                const digits = amountBig.toString().slice(-1);
                return amountBig.toFixed(Number(digits));
            }

            return amountBig.toString();

        case denominations.sat:
            return amount.toString();
        default:
            return amount.toString();
    }
};

export const convertAmount = (amount: number, denomination: string) => {
    switch (denomination) {
        case denominations.btc:
            const amountBig = new BigNumber(amount).multipliedBy(satFactor);
            return amountBig.toNumber();
        case denominations.sat:
            return Number(amount);
        default:
            return Number(amount);
    }
};

export const calculateDigits = (max: number, denom: string) => {
    let digits = max.toString().length;
    if (denom === denominations.btc && digits < 10) {
        digits = 10;
    } else {
        digits += 1;
    }

    return digits;
};
