import { Router } from "@solidjs/router";
import { fireEvent, render, screen } from "@solidjs/testing-library";
import { beforeAll, describe, expect, test } from "vitest";

import Create from "../../src/Create";
import { BTC, LBTC, sideReceive, sideSend } from "../../src/consts";
import { CreateProvider, useCreateContext } from "../../src/context/Create";
import { Web3SignerProvider } from "../../src/context/Web3";
import i18n from "../../src/i18n/i18n";
import { setConfig } from "../../src/signals";
import { calculateReceiveAmount } from "../../src/utils/calculate";
import { cfg } from "../config";

describe("Create", () => {
    let signals: any;

    const TestComponent = () => {
        signals = useCreateContext();
        return "";
    };

    beforeAll(() => {
        setConfig(cfg);
    });

    test("should render Create", async () => {
        render(() => (
            <Router>
                <Web3SignerProvider noFetch={true}>
                    <CreateProvider>
                        <TestComponent />
                        <Create />
                    </CreateProvider>
                </Web3SignerProvider>
            </Router>
        ));
        signals.setReverse(true);
        signals.setAsset(BTC);
        const button = await screen.findAllByText(i18n.en.create_swap);
        expect(button).not.toBeUndefined();
    });

    test("should update receive amount on asset change", async () => {
        // const setReceiveAmount = vi.spyOn(signals, "setReceiveAmount");

        render(() => (
            <Router>
                <Web3SignerProvider noFetch={true}>
                    <CreateProvider>
                        <TestComponent />
                        <Create />
                    </CreateProvider>
                </Web3SignerProvider>
            </Router>
        ));
        signals.setMinimum(cfg["BTC/BTC"].limits.minimal);
        signals.setReverse(true);
        signals.setAsset(BTC);

        signals.setSendAmount(50_000n);

        // To force trigger a recalculation
        signals.setAsset(LBTC);
        signals.setAsset(BTC);

        expect(signals.receiveAmount()).toEqual(38110n);

        signals.setAsset(LBTC);

        expect(signals.receiveAmount()).toEqual(49447n);
    });

    test("should update receive amount on miner fee change", async () => {
        render(() => (
            <Router>
                <Web3SignerProvider noFetch={true}>
                    <CreateProvider>
                        <TestComponent />
                        <Create />
                    </CreateProvider>
                </Web3SignerProvider>
            </Router>
        ));

        signals.setMinimum(cfg["BTC/BTC"].limits.minimal);
        signals.setReverse(true);
        signals.setSendAmount(50_000n);

        // To force trigger a recalculation
        signals.setAsset(LBTC);
        signals.setAsset(BTC);

        expect(signals.receiveAmount()).toEqual(38110n);

        cfg["BTC/BTC"].fees.minerFees.baseAsset.reverse.claim += 1;

        const updatedCfg = { ...cfg };
        setConfig(updatedCfg);

        expect(signals.receiveAmount()).toEqual(38110n - 1n);
    });

    test("should update calculated value on fee change", async () => {
        render(() => (
            <Router>
                <Web3SignerProvider noFetch={true}>
                    <CreateProvider>
                        <TestComponent />
                        <Create />
                    </CreateProvider>
                </Web3SignerProvider>
            </Router>
        ));
        signals.setReverse(true);
        signals.setAsset("BTC");

        const updateConfig = () => {
            const updatedCfg = { ...cfg };
            cfg["BTC/BTC"].fees.minerFees.baseAsset.reverse.claim += 1;
            setConfig(updatedCfg);
        };

        const amount = 100_000;
        fireEvent.input(await screen.findByTestId("receiveAmount"), {
            target: { value: amount },
        });

        expect(signals.amountChanged()).toEqual(sideReceive);
        expect(signals.sendAmount()).not.toEqual(BigInt(amount));
        expect(signals.receiveAmount()).toEqual(BigInt(amount));

        updateConfig();

        fireEvent.input(await screen.findByTestId("sendAmount"), {
            target: { value: amount },
        });

        expect(signals.amountChanged()).toEqual(sideSend);
    });

    test.each`
        extrema
        ${"min"}
        ${"max"}
    `("should set $extrema amount on click", async ({ extrema }) => {
        render(() => (
            <Router>
                <Web3SignerProvider noFetch={true}>
                    <CreateProvider>
                        <TestComponent />
                        <Create />
                    </CreateProvider>
                </Web3SignerProvider>
            </Router>
        ));

        const cfgMinimum = cfg["BTC/BTC"].limits.minimal;
        signals.setMinimum(cfgMinimum);
        signals.setReverse(true);
        signals.setAsset("BTC");

        const amount =
            extrema === "min" ? signals.minimum() : signals.maximum();

        fireEvent.click(await screen.findByText(amount));

        expect(signals.sendAmount()).toEqual(BigInt(amount));
        expect(signals.receiveAmount()).toEqual(
            BigInt(calculateReceiveAmount(amount, signals.reverse())),
        );
    });
});
