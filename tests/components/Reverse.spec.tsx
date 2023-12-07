import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, test } from "vitest";

import Reverse from "../../src/components/Reverse";
import { BTC, LN } from "../../src/consts";
import { CreateProvider, useCreateContext } from "../../src/context/Create";

describe("Reverse", () => {
    test("should reverse assets", async () => {
        let signals: any;

        const TestComponent = () => {
            signals = useCreateContext();
            return "";
        };

        render(() => (
            <CreateProvider>
                <TestComponent />
                <Reverse />
            </CreateProvider>
        ));

        signals.setAssetSend(LN);
        signals.setAssetReceive(BTC);

        expect(signals.reverse()).toEqual(true);

        fireEvent.click(await screen.findByTestId("flip"));

        expect(signals.reverse()).toEqual(false);
        expect(signals.assetSend()).toEqual(BTC);
        expect(signals.assetReceive()).toEqual(LN);
    });
});
