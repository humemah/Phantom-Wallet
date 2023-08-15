import { FC, useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { fetchTokenBalances, TokenBalanceInfo } from "./TokenBalances";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, callback: (args: any) => void) => void;
  isPhantom: boolean;
}

type WindowWithSolana = Window & {
  solana?: PhantomProvider;
};

const Connect2Phantom: FC = () => {
  const [walletAvail, setWalletAvail] = useState(false);
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [pubKey, setPubKey] = useState<PublicKey | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalanceInfo[]>([]);
  
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed"); 

  useEffect(() => {
    if ("solana" in window) {
      const solWindow = window as WindowWithSolana;
      if (solWindow?.solana?.isPhantom) {
        setProvider(solWindow.solana);
        setWalletAvail(true);
        // Attemp an eager connection
        solWindow.solana.connect({ onlyIfTrusted: true });
      }
    }
  }, []);

  useEffect(() => {
    provider?.on("connect", (publicKey: PublicKey) => {
      console.log(`connect event: ${publicKey}`);
      setConnected(true);
      setPubKey(publicKey);
    });
    provider?.on("disconnect", () => {
      console.log("disconnect event");
      setConnected(false);
      setPubKey(null);
    });
  }, [provider]);

  const connectHandler: React.MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    console.log(`connect handler`);
    try {
      await provider?.connect();
      if (pubKey) {
        const balances = await fetchTokenBalances(pubKey);
        setTokenBalances(balances);
      }
    } catch (err) {
      console.error("connect ERROR:", err);
    }
  };
  const disconnectHandler: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    console.log("disconnect handler");
    provider?.disconnect().catch((err) => {
      console.error("disconnect ERROR:", err);
    });
  };
  return (

        <div>
          { walletAvail ?
              <>
              <button disabled={connected} onClick={connectHandler}>Connect to Phantom</button>
              <button disabled={!connected} onClick={disconnectHandler}>Disconnect from Phantom</button>
              { connected ? <p>Your public key is : {pubKey?.toBase58()}</p> : null }
              </>
          :
              <>
              <p>Opps!!! Phantom Wallet is not available.You can find it here <a href="https://phantom.app/">https://phantom.app/</a>.</p>
              </>
          }
{connected ? (
        <div>
          <h3>Token Balances:</h3>
          <ul>
            {tokenBalances.map((balanceInfo, index: number) => (
              <li key={index}>
                Token Mint: {balanceInfo.token}, Balance: {balanceInfo.balance}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      
  </div>

  );
};

export default Connect2Phantom;
