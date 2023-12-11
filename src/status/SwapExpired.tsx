import { Show } from "solid-js";

import DownloadRefund from "../components/DownloadRefund";
import Refund from "../components/Refund";
import RefundEta from "../components/RefundEta";
import { RBTC } from "../consts";
import t from "../i18n";
import { failureReason, swap, timeoutEta } from "../signals";

const SwapExpired = () => {
    return (
        <div>
            <p>
                {t("failure_reason")}: {failureReason()}
            </p>
            <hr />
            <Show when={!timeoutEta()} fallback={RefundEta()}>
                <Refund swap={swap} />
            </Show>
            <Show when={swap().asset !== RBTC}>
                <DownloadRefund />
            </Show>
            <hr />
        </div>
    );
};

export default SwapExpired;
