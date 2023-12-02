import { createEffect } from "solid-js";

import { decodeAddress } from "../compat";
import { RBTC } from "../consts";
import t from "../i18n";
import {
    sendAmountValid,
    setAddressValid,
    setOnchainAddress,
} from "../signals";
import { extractAddress } from "../utils/invoice";
import { setButtonLabel } from "./CreateButton";
import { useCreateContext } from "../context/Create";

const AddressInput = () => {

    let inputRef: HTMLInputElement;
    const { asset, reverse } = useCreateContext();

    const validateAddress = (input: EventTarget & HTMLInputElement) => {
        const inputValue = input.value.trim();
        const address = extractAddress(inputValue);

        try {
            const assetName = asset();
            decodeAddress(assetName, address);
            input.setCustomValidity("");
            input.classList.remove("invalid");
            setAddressValid(true);
            setOnchainAddress(address);
        } catch (e) {
            const msg = t("invalid_address", { asset: asset() });
            setAddressValid(false);
            input.classList.add("invalid");
            input.setCustomValidity(msg);
            setButtonLabel({
                key: "invalid_address",
                params: { asset: asset() },
            });
        }
    };

    createEffect(() => {
        if (sendAmountValid() && reverse() && asset() !== RBTC) {
            validateAddress(inputRef);
        }
    });

    return (
        <input
            ref={inputRef}
            required
            onInput={(e) => validateAddress(e.currentTarget)}
            onKeyUp={(e) => validateAddress(e.currentTarget)}
            onPaste={(e) => validateAddress(e.currentTarget)}
            type="text"
            id="onchainAddress"
            name="onchainAddress"
            placeholder={t("onchain_address", { asset: asset() })}
        />
    );
};

export default AddressInput;
