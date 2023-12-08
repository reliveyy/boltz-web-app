import log from "loglevel";

import { pairs } from "./config";
import { BTC } from "./consts";
import {
    config,
    ref,
    setConfig,
    setFailureReason,
    setNotification,
    setNotificationType,
    setOnline,
    setRef,
    setSwaps,
    swap,
    swaps,
} from "./signals";
import { claim } from "./utils/claim";
import { feeChecker } from "./utils/feeChecker";
import { checkResponse } from "./utils/http";
import { checkForFailed } from "./utils/swapChecker";
import { swapStatusPending, updateSwapStatus } from "./utils/swapStatus";

export const isIos = !!navigator.userAgent.match(/iphone|ipad/gi) || false;
export const isMobile =
    isIos || !!navigator.userAgent.match(/android|blackberry/gi) || false;

export const parseBlindingKey = (swap: any) => {
    return swap.blindingKey ? Buffer.from(swap.blindingKey, "hex") : undefined;
};

export const cropString = (str: string) => {
    if (str.length < 40) {
        return str;
    }
    return str.substring(0, 19) + "..." + str.substring(str.length - 19);
};

export const checkReferralId = () => {
    const ref_param = new URLSearchParams(window.location.search).get("ref");
    if (ref_param && ref_param !== "") {
        setRef(ref_param);
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
        );
    }
};

export const startInterval = (cb: Function, interval: number) => {
    cb();
    return setInterval(cb, interval);
};

export const clipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    setNotificationType("success");
    setNotification(message);
};

export const errorHandler = (error: any) => {
    log.error(error);
    setNotificationType("error");
    if (typeof error.json === "function") {
        error
            .json()
            .then((jsonError: any) => {
                setNotification(jsonError.error);
            })
            .catch((genericError: any) => {
                log.error(genericError);
                setNotification(error.statusText);
            });
    } else {
        setNotification(error.message);
    }
};

export const getApiUrl = (url: string, asset: string) => {
    const pair = pairs[`${asset}/BTC`];
    if (pair) {
        return pair.apiUrl + url;
    }
    log.error(`no pair found for ${asset}; falling back to ${BTC}`);
    return getApiUrl(url, BTC);
};

export const fetcher = (
    url: string,
    cb: (data: any) => void,
    params?: any,
    errorCb = errorHandler,
) => {
    let opts = {};
    if (params) {
        params.referralId = ref();
        opts = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        };
    }
    fetch(url, opts).then(checkResponse).then(cb).catch(errorCb);
};

export const fetchPairs = () => {
    fetcher(
        getApiUrl("/getpairs", BTC),
        (data) => {
            log.debug("getpairs", data);
            setOnline(true);
            setConfig(data.pairs);
        },
        null,
        (error) => {
            log.debug(error);
            setOnline(false);
        },
    );
    return false;
};

export const feeCheck = async (notification: string, asset: string) => {
    return new Promise((resolve) => {
        fetcher(
            getApiUrl("/getpairs", asset),
            (data) => {
                log.debug("getpairs", data);
                if (feeChecker(config(), data.pairs, asset)) {
                    // amounts matches and fees are ok
                    resolve(true);
                } else {
                    setNotificationType("error");
                    setNotification(notification);
                    resolve(false);
                }

                // Always update the pairs to make sure the pairHash for the next request is up to date
                setConfig(data.pairs);
            },
            null,
            (error) => {
                log.debug(error);
                setNotificationType("error");
                setNotification(error);
                resolve(false);
            },
        );
    });
};

export const updateSwaps = (cb: Function) => {
    const swapsTmp = swaps();
    const currentSwap = swapsTmp.find((s) => swap().id === s.id);
    cb(currentSwap);
    setSwaps(swapsTmp);
};

export const runClaim = async (data: any, swapId: string) => {
    const currentSwap = swaps().find((s) => swapId === s.id);

    if (data.status) {
        updateSwapStatus(currentSwap.id, data.status);
    }

    if (
        currentSwap.claimTx === undefined &&
        data.transaction !== undefined &&
        (data.status === swapStatusPending.TransactionConfirmed ||
            data.status === swapStatusPending.TransactionMempool)
    ) {
        await claim(currentSwap, data);
    }
    checkForFailed(swapId, currentSwap.asset, data);
    setFailureReason(data.failureReason);
};

export default fetcher;
