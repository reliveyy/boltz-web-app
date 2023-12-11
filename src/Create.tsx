import log from "loglevel";
import { Show, createEffect, createMemo, on, onMount } from "solid-js";

import AddressInput from "./components/AddressInput";
import Asset from "./components/Asset";
import AssetSelect from "./components/AssetSelect";
import ConnectMetamask from "./components/ConnectMetamask";
import { CreateButton, setButtonLabel } from "./components/CreateButton";
import Fees from "./components/Fees";
import InvoiceInput from "./components/InvoiceInput";
import Reverse from "./components/Reverse";
import { RBTC, sideReceive, sideSend } from "./consts";
import { useCreateContext } from "./context/Create";
import t from "./i18n";
import { boltzFee, denomination, minerFee, webln } from "./signals";
import { calculateReceiveAmount, calculateSendAmount } from "./utils/calculate";
import {
    calculateDigits,
    convertAmount,
    denominations,
    formatAmount,
    getValidationRegex,
} from "./utils/denomination";
import { enableWebln } from "./utils/webln";

const Create = () => {
    let receiveAmountRef: HTMLInputElement;
    let sendAmountRef: HTMLInputElement;

    const {
        asset,
        assetReceive,
        assetSend,
        addressValid,
        reverse,
        setInvoice,
        invoiceValid,
        receiveAmount,
        receiveAmountFormatted,
        sendAmount,
        sendAmountFormatted,
        sendAmountValid,
        setReceiveAmount,
        setReceiveAmountFormatted,
        setSendAmount,
        setSendAmountFormatted,
        setSendAmountValid,
        setValid,
        assetSelect,
        assetSelected,
        amountChanged,
        setAmountChanged,
        minimum,
        maximum,
    } = useCreateContext();

    const changeReceiveAmount = (evt: InputEvent) => {
        const target = evt.currentTarget as HTMLInputElement;
        const amount = target.value.trim();
        const satAmount = convertAmount(Number(amount), denomination());
        const sendAmount = calculateSendAmount(satAmount, reverse());
        setAmountChanged(sideReceive);
        setReceiveAmount(BigInt(satAmount));
        setSendAmount(BigInt(sendAmount));
        validateAmount();
        target.setCustomValidity("");
        target.classList.remove("invalid");
    };

    const changeSendAmount = (evt: InputEvent) => {
        const target = evt.currentTarget as HTMLInputElement;
        const amount = target.value.trim();
        const satAmount = convertAmount(Number(amount), denomination());
        const receiveAmount = calculateReceiveAmount(satAmount, reverse());
        setAmountChanged(sideSend);
        setSendAmount(BigInt(satAmount));
        setReceiveAmount(BigInt(receiveAmount));
        validateAmount();
        target.setCustomValidity("");
        target.classList.remove("invalid");
    };

    const createWeblnInvoice = async () => {
        enableWebln(async () => {
            const amount = Number(receiveAmount());
            // @ts-ignore
            const invoice = await window.webln.makeInvoice({ amount: amount });
            validateAmount();
            log.debug("created webln invoice", invoice);
            setInvoice(invoice.paymentRequest);
        });
    };

    const validateInput = (evt: KeyboardEvent) => {
        const input = evt.currentTarget as HTMLInputElement;
        const keycode = evt.key;
        const hasDot = input.value.includes(".");
        const regex = denomination() == "sat" || hasDot ? /[0-9]/ : /[0-9]|\./;
        if (!regex.test(keycode)) {
            evt.preventDefault();
        }
    };

    const validatePaste = (evt: ClipboardEvent) => {
        const clipboardData = evt.clipboardData || globalThis.clipboardData;
        const pastedData = clipboardData.getData("Text").trim();
        if (!getValidationRegex(maximum(), denomination()).test(pastedData)) {
            evt.stopPropagation();
            evt.preventDefault();
        }
    };

    const validateAmount = () => {
        const setCustomValidity = (msg: string, isZero: boolean = true) => {
            [sendAmountRef, receiveAmountRef].forEach((ref) => {
                ref.setCustomValidity(msg);
                if (!isZero && msg !== "") {
                    ref.classList.add("invalid");
                } else {
                    ref.classList.remove("invalid");
                }
            });
        };

        setCustomValidity("");

        const amount = Number(sendAmount());
        const lessThanMin = amount < minimum();

        if (lessThanMin || amount > maximum()) {
            const params = {
                amount: formatAmount(lessThanMin ? minimum() : maximum()),
                denomination: denomination(),
            };
            const label = lessThanMin ? "minimum_amount" : "maximum_amount";
            const errorMsg = t(label, params);
            setCustomValidity(errorMsg, amount === 0);
            setButtonLabel({ key: label, params: params });
            setSendAmountValid(false);
            return;
        }
        setSendAmountValid(true);
    };

    const setAmount = (amount: number) => {
        setSendAmount(BigInt(amount));
        setReceiveAmount(BigInt(calculateReceiveAmount(amount, reverse())));
        validateAmount();
        sendAmountRef.focus();
    };

    onMount(() => {
        sendAmountRef.focus();
    });

    createEffect(
        on([boltzFee, minerFee, reverse, asset], () => {
            if (amountChanged() === sideReceive) {
                setSendAmount(
                    BigInt(
                        calculateSendAmount(Number(receiveAmount()), reverse()),
                    ),
                );
            } else {
                setReceiveAmount(
                    BigInt(
                        calculateReceiveAmount(Number(sendAmount()), reverse()),
                    ),
                );
            }
            validateAmount();
        }),
    );

    createEffect(() => {
        if (assetSelect()) return;
        const ref =
            assetSelected() === sideSend ? sendAmountRef : receiveAmountRef;
        ref.focus();
    });

    createMemo(() => {
        const rAmount = Number(receiveAmount());
        if (rAmount > 0) {
            setReceiveAmountFormatted(
                formatAmount(rAmount, denomination()).toString(),
            );
        }
        const sAmount = Number(sendAmount());
        if (sAmount > 0) {
            setSendAmountFormatted(
                formatAmount(sAmount, denomination()).toString(),
            );
        }
    });

    // validation swap
    createMemo(() => {
        if (sendAmountValid()) {
            if (
                (reverse() && addressValid()) ||
                (!reverse() &&
                    invoiceValid() &&
                    (asset() !== RBTC || addressValid()))
            ) {
                setValid(true);
                return;
            }
        }
        setValid(false);
    });

    // validate amounts when invoice is valid, because we
    // set the amount based on invoice amount if amount is 0
    createMemo(() => {
        if (invoiceValid()) {
            validateAmount();
        }
    });

    return (
        <div class="frame" data-reverse={reverse()} data-asset={asset()}>
            <h2>{t("create_swap")}</h2>
            <p>
                {t("create_swap_subline")} <br />
                {t("send")} {t("min")}{" "}
                <span
                    class="btn-small btn-light"
                    onClick={() => setAmount(minimum())}>
                    {formatAmount(minimum(), denomination())}
                </span>{" "}
                {t("max")}{" "}
                <span
                    class="btn-small btn-light"
                    onClick={() => setAmount(maximum())}>
                    {formatAmount(maximum(), denomination())}
                </span>
            </p>
            <div class="icons">
                <div>
                    <Asset side={sideSend} signal={assetSend} />
                    <input
                        ref={sendAmountRef}
                        autofocus
                        required
                        type="text"
                        maxlength={calculateDigits(maximum(), denomination())}
                        inputmode={
                            denomination() == "btc" ? "decimal" : "numeric"
                        }
                        id="sendAmount"
                        data-testid="sendAmount"
                        value={sendAmountFormatted()}
                        onpaste={(e) => validatePaste(e)}
                        onKeyPress={(e) => validateInput(e)}
                        onInput={(e) => changeSendAmount(e)}
                    />
                </div>
                <Reverse />
                <div>
                    <Asset side={sideReceive} signal={assetReceive} />
                    <input
                        ref={receiveAmountRef}
                        required
                        type="text"
                        maxlength={calculateDigits(maximum(), denomination())}
                        inputmode={
                            denomination() == "btc" ? "decimal" : "numeric"
                        }
                        id="receiveAmount"
                        data-testid="receiveAmount"
                        value={receiveAmountFormatted()}
                        onpaste={(e) => validatePaste(e)}
                        onKeyPress={(e) => validateInput(e)}
                        onInput={(e) => changeReceiveAmount(e)}
                    />
                </div>
            </div>
            <Fees />
            <hr class="spacer" />
            <Show when={asset() === RBTC}>
                <ConnectMetamask showAddress={true} />
                <hr class="spacer" />
            </Show>
            <Show when={reverse() && asset() !== RBTC}>
                <AddressInput />
            </Show>
            <Show when={!reverse()}>
                <Show when={webln()}>
                    <button
                        id="webln"
                        class="btn btn-light"
                        onClick={() => createWeblnInvoice()}>
                        {t("create_invoice_webln")}
                    </button>
                    <hr class="spacer" />
                </Show>
                <InvoiceInput />
            </Show>
            <CreateButton />
            <AssetSelect />
        </div>
    );
};

export default Create;
