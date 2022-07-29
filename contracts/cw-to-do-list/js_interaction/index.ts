import { CosmWasmClient, ExecuteResult, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/amino";

const configMap = {
    rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
};

type ConfigKey = keyof typeof configMap;

const config = (key: ConfigKey): string => {
    const value = configMap[key];
    if (!value) throw new Error(`Missing config for ${key}`);
    return value;
};


let client: CosmWasmClient;

const getClient = async () => {
    if (!client) client = await CosmWasmClient.connect(config("rpcEndpoint"));
    return client;
};

export const queryContract = async <T>(
    query: Record<string, unknown>
): Promise<T> => {
    const client = await getClient();
    return client.queryContractSmart(config("contractAddress"), query);
};