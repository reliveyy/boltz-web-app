import log from "loglevel";
import { createEffect } from "solid-js";
import { Show } from "solid-js";

import DownloadRefund from "../components/DownloadRefund";
import Refund from "../components/Refund";
import RefundEta from "../components/RefundEta";
import { RBTC } from "../consts";
import { fetcher, getApiUrl } from "../helper";
import t from "../i18n";
import {
    failureReason,
    setTimeoutEta,
    setTransactionToRefund,
    swap,
    timeoutEta,
    transactionToRefund,
} from "../signals";

const SwapExpired = () => {
    createEffect(() => {
        setTransactionToRefund(null);
        fetcher(
            getApiUrl("/getswaptransaction", swap().asset),
            (res: any) => {
                log.debug(`got swap transaction for ${swap().id}`);
                setTransactionToRefund(res);
                setTimeoutEta(null);
            },
            {
                id: swap().id,
            },
            () => {
                log.warn(`no swap transaction for: ${swap().id}`);
            },
        );
    });

    return (
        <div>
            <p>
                {t("failure_reason")}: {failureReason()}
            </p>
            <hr />
            <Show when={transactionToRefund() !== null}>
                <Show when={!timeoutEta()} fallback={RefundEta()}>
                    <Refund swap={swap} />
                </Show>
            </Show>
            <Show when={swap().asset !== RBTC}>
                <DownloadRefund />
            </Show>
            <hr />
        </div>
    );
};

export default SwapExpired;
