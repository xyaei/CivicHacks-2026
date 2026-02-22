const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const { mplTokenMetadata, createNft, fetchDigitalAsset } = require("@metaplex-foundation/mpl-token-metadata");
const { keypairIdentity, generateSigner, percentAmount, publicKey } = require("@metaplex-foundation/umi");

// Load wallet
const secret = JSON.parse(fs.readFileSync("/Users/v/.config/solana/id.json"));
const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());

const keypair = umi.eddsa.createKeypairFromSecretKey(Buffer.from(secret));
umi.use(keypairIdentity(keypair));

// Credential types
const CREDENTIAL_TYPES = {
  COMMUNITY_WATCH: "Court Watch Observer",
  RIGHTS_TRAINING: "Know Your Rights Graduate",
  DEFENDER_CERTIFIED: "BailLens Defender",
  JUDGE_TRANSPARENCY: "Judicial Transparency",
};

async function mintCredentialToken(recipientAddress, credentialType) {
  try {
    console.log(`Minting ${credentialType} credential for ${recipientAddress}...`);

    const mint = generateSigner(umi);

    await createNft(umi, {
      mint,
      name: CREDENTIAL_TYPES[credentialType] || credentialType,
      symbol: "BAIL",
      uri: "https://baillens.org/credentials/metadata.json",
      sellerFeeBasisPoints: percentAmount(0),
      isMutable: false, // soulbound — cannot be changed
      tokenOwner: publicKey(recipientAddress),
    }).sendAndConfirm(umi);

    console.log("Credential minted successfully");
    console.log("Mint address:", mint.publicKey);
    console.log(`Explorer: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`);

    return {
      success: true,
      mint_address: mint.publicKey,
      credential_type: CREDENTIAL_TYPES[credentialType],
      recipient: recipientAddress,
      explorer: `https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`,
    };

  } catch (err) {
    console.error("Minting error:", err.message);
    throw err;
  }
}

module.exports = { mintCredentialToken, CREDENTIAL_TYPES };