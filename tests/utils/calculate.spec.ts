import { BigNumber } from "bignumber.js";
import { beforeAll, describe, expect, test } from "vitest";

import { minerFee, setBoltzFee, setMinerFee } from "../../src/signals";
import {
    calculateBoltzFeeOnSend,
    calculateReceiveAmount,
    calculateSendAmount,
} from "../../src/utils/calculate";

describe("Calculate amounts", () => {
    const setSwapFees = () => {
        setMinerFee(147);
        setBoltzFee(0.1);
    };

    const setReverseSwapFees = () => {
        setMinerFee(428);
        setBoltzFee(0.25);
    };

    describe("should calculate Swap amounts", () => {
        beforeAll(() => {
            setSwapFees();
        });

        test.each`
            sendAmount | receiveAmount
            ${10157}   | ${10000}
            ${12473}   | ${12313}
            ${4299409} | ${4294967}
            ${62531}   | ${62321}
        `(
            "calculate amounts $sendAmount <-> $receiveAmount",
            ({ sendAmount, receiveAmount }) => {
                expect(calculateReceiveAmount(sendAmount, false)).toEqual(
                    receiveAmount,
                );
                expect(calculateSendAmount(receiveAmount, false)).toEqual(
                    sendAmount,
                );
            },
        );

        test("should return correct types", () => {
            expect(typeof calculateReceiveAmount(1000000, false)).toEqual(
                "number",
            );
            expect(typeof calculateSendAmount(1000000, false)).toEqual(
                "number",
            );
        });

        test("should not return negative numbers", () => {
            expect(calculateReceiveAmount(0, false)).toEqual(0);
        });
    });

    describe("should calculate Reverse Swap amounts", () => {
        beforeAll(() => {
            setReverseSwapFees();
        });

        test.each`
            sendAmount | receiveAmount
            ${1000000} | ${997072}
            ${10000}   | ${9547}
            ${122344}  | ${121610}
            ${4294967} | ${4283801}
        `(
            "calculate amounts $sendAmount <-> $receiveAmount",
            ({ sendAmount, receiveAmount }) => {
                expect(calculateReceiveAmount(sendAmount, true)).toEqual(
                    receiveAmount,
                );
                expect(calculateSendAmount(receiveAmount, true)).toEqual(
                    sendAmount,
                );
            },
        );

        test("should return correct types", () => {
            expect(typeof calculateReceiveAmount(1000000, true)).toEqual(
                "number",
            );
            expect(typeof calculateSendAmount(1000000, true)).toEqual("number");
        });

        test("should not return negative numbers", () => {
            expect(calculateReceiveAmount(0, true)).toEqual(0);
        });
    });

    describe("should calculate Boltz fee based on send amount", () => {
        test.each`
            sendAmount | receiveAmount | fee
            ${10157}   | ${10000}      | ${10}
            ${12473}   | ${12313}      | ${13}
            ${4299409} | ${4294967}    | ${4295}
            ${62531}   | ${62321}      | ${63}
            ${100}     | ${-47}        | ${0}
        `(
            "should calculate fee for Swaps $sendAmount -> $fee",
            ({ sendAmount, receiveAmount, fee }) => {
                setSwapFees();

                expect(calculateBoltzFeeOnSend(sendAmount, false)).toEqual(fee);
                expect(
                    BigNumber(sendAmount)
                        .minus(calculateBoltzFeeOnSend(sendAmount, false))
                        .minus(minerFee())
                        .toNumber(),
                ).toEqual(receiveAmount);
            },
        );

        test.each`
            sendAmount | receiveAmount | fee
            ${1000000} | ${997072}     | ${2500}
            ${10000}   | ${9547}       | ${25}
            ${122344}  | ${121610}     | ${306}
            ${4294967} | ${4283801}    | ${10738}
        `(
            "should calculate fee for Reverse Swaps $sendAmount -> $fee",
            ({ sendAmount, receiveAmount, fee }) => {
                setReverseSwapFees();

                expect(calculateBoltzFeeOnSend(sendAmount, true)).toEqual(fee);
                expect(
                    BigNumber(sendAmount)
                        .minus(calculateBoltzFeeOnSend(sendAmount, true))
                        .minus(minerFee())
                        .toNumber(),
                ).toEqual(receiveAmount);
            },
        );

        test("should calculate negative fees", () => {
            setSwapFees();
            setBoltzFee(-0.1);
            expect(calculateBoltzFeeOnSend(1_000_000, false)).toEqual(-1000);
        });

        test("should return correct types", () => {
            expect(typeof calculateBoltzFeeOnSend(1000000, true)).toEqual(
                "number",
            );
            expect(typeof calculateBoltzFeeOnSend(1000000, false)).toEqual(
                "number",
            );
        });
    });
});
