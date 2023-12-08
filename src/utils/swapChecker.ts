import log from "loglevel";
import { createEffect, createSignal } from "solid-js";

import { RBTC } from "../consts";
import { fetcher, getApiUrl, runClaim } from "../helper";
import { swap, swaps } from "../signals";
import { setTimeoutBlockheight, setTimeoutEta } from "../signals";
import { swapStatusFinal } from "./swapStatus";

const swapCheckInterval = 3000;
let activeStreamId = undefined;
let activeSwapStream = undefined;

export const [checkInterval, setCheckInterval] = createSignal<
    NodeJS.Timer | undefined
>(undefined);

export const checkForFailed = (swapId: string, asset: string, data: any) => {
    if (
        data.status == "transaction.lockupFailed" ||
        data.status == "invoice.failedToPay"
    ) {
        fetcher(
            getApiUrl("/getswaptransaction", asset),
            (data) => {
                if (asset !== RBTC && !data.transactionHex) {
                    log.error("no mempool tx found");
                }
                if (!data.timeoutEta) {
                    log.error("no timeout eta");
                }
                if (!data.timeoutBlockHeight) {
                    log.error("no timeout blockheight");
                }
                const timestamp = data.timeoutEta * 1000;
                const eta = new Date(timestamp);
                log.debug("Timeout ETA: \n " + eta.toLocaleString(), timestamp);
                setTimeoutEta(timestamp);
                setTimeoutBlockheight(data.timeoutBlockHeight);
            },
            {
                swapId,
            },
        );
    }
};

export const swapChecker = () => {
    createEffect(() => {
        const activeSwap = swap();
        if (swap()?.id === activeStreamId) {
            return;
        }

        if (activeSwapStream !== undefined) {
            activeSwapStream.close();
            activeSwapStream = undefined;
            activeStreamId = undefined;
        }

        if (activeSwap === null) {
            return;
        }

        log.debug(`subscribing to SSE of swap`, activeSwap.id);
        activeStreamId = activeSwap.id;
        activeSwapStream = handleStream(
            getApiUrl(
                `/streamswapstatus?id=${activeSwap.id}`,
                activeSwap.asset,
            ),
            (data) => runClaim(data, activeSwap.id),
        );
    });

    let checkRunning = false;

    if (checkInterval() !== undefined) {
        clearInterval(checkInterval());
    }

    runSwapCheck().then();

    setCheckInterval(
        setInterval(async () => {
            if (checkRunning) {
                return;
            }

            checkRunning = true;
            try {
                await runSwapCheck();
            } catch (e) {
                log.error("swap update check failed", e);
            }

            checkRunning = false;
        }, swapCheckInterval),
    );
};

const runSwapCheck = async () => {
    const swapsToCheck = swaps()
        .filter((s) => !swapStatusFinal.includes(s.status))
        .filter((s) => s.id !== swap()?.id);

    for (const swap of swapsToCheck) {
        await new Promise<void>((resolve) => {
            fetcher(
                getApiUrl("/swapstatus", swap.asset),
                async (data: any) => {
                    await runClaim(data, swap.id);
                    resolve();
                },
                { id: swap.id },
            );
        });
    }
};

const handleStream = (streamUrl: string, cb: (data: any) => void) => {
    let reconnectFrequencySeconds = 1;

    // Putting these functions in extra variables is just for the sake of readability
    const waitFunc = () => {
        return reconnectFrequencySeconds * 1000;
    };

    const tryToSetupFunc = () => {
        setupEventSource();
        reconnectFrequencySeconds *= 2;
        if (reconnectFrequencySeconds >= 64) {
            reconnectFrequencySeconds = 64;
        }
    };

    const reconnectFunc = () => {
        setTimeout(tryToSetupFunc, waitFunc());
    };

    const setupEventSource = () => {
        let stream = new EventSource(streamUrl);
        log.debug(`stream started: ${streamUrl}`);
        stream.onmessage = function (event) {
            const data = JSON.parse(event.data);
            log.debug(`stream status update: ${data.status}`, data);
            cb(data);
        };
        stream.onopen = function () {
            reconnectFrequencySeconds = 1;
        };
        stream.onerror = function (e) {
            log.debug("stream error", e);
            stream.close();
            reconnectFunc();
        };
        return stream;
    };

    return setupEventSource();
};
