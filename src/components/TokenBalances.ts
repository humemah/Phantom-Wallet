import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, clusterApiUrl, Account } from "@solana/web3.js";


export interface TokenBalanceInfo {
  token: Token;
  balance: number;
}

export const fetchTokenBalances = async (
  publicKey: PublicKey
): Promise<TokenBalanceInfo[]> => {
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

  // Fetch token accounts
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  const tokenAccountData = tokenAccounts.value;
  const accountInstance = new Account();
  const balances = await Promise.all(
    Array.isArray(tokenAccountData)
      ? tokenAccountData.map(async (account: any) => {
          const balance = account.account.data.parsed.info.tokenAmount.amount.toNumber();
          const token = new Token(
            connection,
            account.account.data.parsed.info.mint,
            TOKEN_PROGRAM_ID,
            accountInstance
          );
          return { token, balance };
        })
      : []
  );

  return balances;
};

