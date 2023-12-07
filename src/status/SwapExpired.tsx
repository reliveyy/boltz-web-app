import { useNavigate } from "@solidjs/router";
import log from "loglevel";
import { Show, createEffect, createSignal } from "solid-js";

import { decodeAddress } from "../compat";
import fetcher, { getApiUrl } from "../helper";
import t from "../i18n";
import {
    failureReason,
    setTransactionToRefund,
    swap,
    transactionToRefund,
} from "../signals";
import { refund } from "../utils/refund";

const SwapExpired = () => {
    const navigate = useNavigate();

    const [valid, setValid] = createSignal<boolean>(false);
    const [refundAddress, setRefundAddress] = createSignal<string>("");

    const refundAddressChange = (evt: Event, asset: string) => {
        const input = evt.currentTarget as HTMLInputElement;
        const inputValue = input.value.trim();
        try {
            decodeAddress(asset, inputValue);
            input.setCustomValidity("");
            setRefundAddress(inputValue);
            return true;
        } catch (err) {
            log.warn("parsing refund address failed", err);
            input.setCustomValidity("invalid address");
        }

        return false;
    };

    const refundAction = () => {
        const tx = transactionToRefund();
        if (!tx) return;
        refund(swap(), refundAddress(), tx.txHex, tx.timeoutBlockHeight);
    };

    createEffect(() => {
        setTransactionToRefund(null);
        fetcher(
            getApiUrl("/getswaptransaction", swap().asset),
            (res: any) => {
                log.debug(`got swap transaction for ${swap().id}`);
                setTransactionToRefund(res);
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
                <input
                    onInput={(e) =>
                        setValid(refundAddressChange(e, swap().asset))
                    }
                    type="text"
                    id="refundAddress"
                    name="refundAddress"
                    placeholder={t("refund_address_placeholder")}
                />
                <button class="btn" disabled={!valid()} onclick={refundAction}>
                    {t("refund")}
                </button>
                <hr />
            </Show>
            <button class="btn" onClick={() => navigate("/swap")}>
                {t("new_swap")}
            </button>
        </div>
    );
};

export default SwapExpired;
