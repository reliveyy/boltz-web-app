import { render } from "@solidjs/testing-library";
import { describe, expect, test } from "vitest";

import Fees from "../../src/components/Fees";
import { CreateProvider, useCreateContext } from "../../src/context/Create";
import { maximum, minimum, setConfig } from "../../src/signals";
import { calculateSendAmount } from "../../src/utils/calculate";
import { cfg } from "../config";

describe("Fees component", () => {
    let signals: any;

    const TestComponent = () => {
        signals = useCreateContext();
        return "";
    };

    test("should recalculate limits on direction switch", () => {
        render(() => (
            <CreateProvider>
                <TestComponent />
                <Fees />
            </CreateProvider>
        ));

        setConfig(cfg);
        signals.setReverse(true);
        signals.setAsset("BTC");

        const limits = cfg["BTC/BTC"].limits;

        expect(minimum()).toEqual(limits.minimal);
        expect(maximum()).toEqual(limits.maximal);

        signals.setReverse(false);

        expect(minimum()).toEqual(
            calculateSendAmount(limits.minimal, signals.reverse()),
        );
        expect(maximum()).toEqual(
            calculateSendAmount(limits.maximal, signals.reverse()),
        );
    });
});
