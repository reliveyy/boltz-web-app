import { BTC } from "../consts";

const relevantMinerFees = (fees, asset) => {
    return asset === BTC ? fees.minerFees.quoteAsset : fees.minerFees.baseAsset;
};

export const feeChecker = (config, pairs, asset) => {
    const fees = pairs[`${asset}/${BTC}`].fees;
    const feesOld = config[`${asset}/${BTC}`].fees;

    return (
        JSON.stringify(relevantMinerFees(feesOld)) ===
            JSON.stringify(relevantMinerFees(fees)) &&
        ["percentage", "percentageSwapIn"].every(
            (fee) => feesOld[fee] === fees[fee],
        )
    );
};
