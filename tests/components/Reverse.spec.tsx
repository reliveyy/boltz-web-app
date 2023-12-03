import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, test } from "vitest";

import Reverse from "../../src/components/Reverse";
import { BTC, LN } from "../../src/config";
import { CreateProvider } from "../../src/context/Create";

describe("Reverse", () => {
    test("should reverse assets", async () => {
        const {
            container: { firstChild: flip },
        } = render(() => (
            <CreateProvider>
                <Reverse />
            </CreateProvider>
        ));

        // setAssetSend(BTC);
        // setAssetReceive(LN);
        // expect(reverse()).toEqual(true);

        // fireEvent.click(flip);

        // expect(reverse()).toEqual(true);
        // expect(assetSend()).toEqual(LN);
        // expect(assetReceive()).toEqual(BTC);
    });
});
