import { makePersisted } from "@solid-primitives/storage";
import {
    Accessor,
    ResolvedChildren,
    Setter,
    createContext,
    createEffect,
    createSignal,
    useContext,
} from "solid-js";

import { pairs } from "../config";
import { LN } from "../consts";

const defaultSelection = Object.keys(pairs)[0].split("/")[0];

const CreateContext = createContext<{
    reverse: Accessor<boolean>;
    setReverse: Setter<boolean>;
    invoice: Accessor<string>;
    setInvoice: Setter<string>;
    asset: Accessor<string>;
    setAsset: Setter<string>;
    assetSend: Accessor<string>;
    setAssetSend: Setter<string>;
    assetReceive: Accessor<string>;
    setAssetReceive: Setter<string>;
}>();

const CreateProvider = (props: { children: ResolvedChildren }) => {
    const [asset, setAsset] = createSignal<string>(defaultSelection);
    const [reverse, setReverse] = createSignal<boolean>(true);
    const [invoice, setInvoice] = createSignal<string>("");

    const [assetReceive, setAssetReceive] = makePersisted(
        createSignal(defaultSelection),
        { name: "assetReceive" },
    );
    const [assetSend, setAssetSend] = makePersisted(createSignal(LN), {
        name: "assetSend",
    });

    createEffect(() => setReverse(assetReceive() !== LN));

    [assetSend, assetReceive].forEach((signal) => {
        createEffect(() => {
            if (signal() !== LN) {
                setAsset(signal());
            }
        });
    });

    return (
        <CreateContext.Provider
            value={{
                reverse,
                setReverse,
                invoice,
                setInvoice,
                asset,
                setAsset,
                assetSend,
                setAssetSend,
                assetReceive,
                setAssetReceive,
            }}>
            {props.children}
        </CreateContext.Provider>
    );
};

const useCreateContext = () => useContext(CreateContext);
export { useCreateContext, CreateProvider };
