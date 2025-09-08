import * as fs from "fs";

import { eq, and } from "drizzle-orm";
import {
  mplCore,
  create,
  createCollection,
  fetchCollection,
  fetchAsset,
  fetchAssetsByOwner,
  transfer,
  transferV1,
} from "@metaplex-foundation/mpl-core";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  publicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createUmi as createTestUmi } from "@metaplex-foundation/umi-bundle-tests";

// import * as multer from "multer"
import { userWallets, walletAddresses } from "../model/schema";
import { db } from "../config/db";
import { memoryStorage } from "multer";
import multer from "multer";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { nft } from "../model/nft";

const umi = createUmi("http://api.devnet.solana.com")
  .use(mplCore())
  .use(irysUploader());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
        )
      );
    }
  },
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Set up signer from private key
const keypair = umi.eddsa.createKeypairFromSecretKey(
  new Uint8Array([
    52, 52, 212, 166, 63, 87, 120, 139, 26, 57, 91, 117, 243, 1, 251, 111, 227,
    73, 73, 73, 230, 55, 67, 121, 81, 198, 187, 204, 217, 81, 252, 158, 132, 41,
    222, 69, 230, 97, 134, 202, 186, 91, 158, 218, 90, 105, 179, 241, 113, 204,
    215, 39, 54, 158, 233, 66, 129, 141, 95, 31, 203, 109, 193, 83,
  ])
);

const masterWallet = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(masterWallet));

// Database helper functions
async function getUserWalletByUserId(userProfileId) {
  const result = await db
    .select()
    .from(userWallets)
    .where(eq(userWallets.userProfileId, userProfileId));
  return result[0];
}

async function getUserSolanaAddress(userWalletId) {
  const result = await db
    .select()
    .from(walletAddresses)
    .where(
      and(
        eq(walletAddresses.userWalletId, userWalletId),
        eq(walletAddresses.blockchain, "solana"),
        eq(walletAddresses.isVerified, true)
      )
    );
  return result[0];
}

async function getUserPrimarySolanaAddress(userWalletId) {
  const result = await db
    .select()
    .from(walletAddresses)
    .where(
      and(
        eq(walletAddresses.userWalletId, userWalletId),
        eq(walletAddresses.blockchain, "solana"),
        eq(walletAddresses.isPrimary, true),
        eq(walletAddresses.isVerified, true)
      )
    );
  return result[0] || (await getUserSolanaAddress(userWalletId));
}

// Helper function to upload metadata
async function uploadMetadata(imageFile, metadata) {
  try {
    // Upload image first
    const imageBuffer = fs.readFileSync(imageFile.path);
    const genericFile = {
      buffer: imageBuffer,
      fileName: imageFile.originalname || imageFile.filename || "image",
      displayName: imageFile.originalname || imageFile.filename || "image",
      uniqueName:
        Date.now() +
        "-" +
        (imageFile.originalname || imageFile.filename || "image"),
      contentType: imageFile.mimetype || "image/png",
      extension:
        (imageFile.originalname || imageFile.filename || "image")
          .split(".")
          .pop() || "png",
      tags: [],
    };
    const [imageUri] = await umi.uploader.upload([genericFile]);

    // Create metadata JSON
    const metadataJson = {
      name: metadata.name,
      description: metadata.description,
      image: imageUri,
      attributes: metadata.attributes || [],
      properties: {
        category: "image",
        creators: metadata.creators || [],
        ...metadata.properties,
      },
      // Comic-specific metadata
      comic: {
        issue: metadata.issue || 1,
        series: metadata.series || "",
        author: metadata.author || "",
        genre: metadata.genre || "",
        publishDate: metadata.publishDate || new Date().toISOString(),
        pages: metadata.pages || 1,
      },
    };

    // Upload metadata JSON
    const metadataUri = await umi.uploader.uploadJson(metadataJson);

    // Clean up uploaded file
    fs.unlinkSync(imageFile.path);

    return metadataUri;
  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(imageFile.path)) {
      fs.unlinkSync(imageFile.path);
    }
    throw error;
  }
}

// API Roter

// Create a new collection
export const createApiCollection = async (req, res) => {
  try {
    const { name, description, image, userProfileId } = req.body;

    if (!name || !description || !image) {
      return res
        .status(400)
        .json({ error: "Name, description, and image URL are required" });
    }

    const metadataJson = {
      name,
      description,
      image,
      attributes: [],
      properties: {
        category: "image",
        creators: [
          {
            address: masterWallet.publicKey,
            percentage: 100,
          },
        ],
      },
    };
    type SolAmount = {
      basisPoints: bigint;
      identifier: "SOL";
      decimals: 9;
    };
    const amount: SolAmount = {
      basisPoints: BigInt(9),
      identifier: "SOL",
      decimals: 9,
    };
    console.log(await umi.rpc.airdrop(masterWallet.publicKey, amount));

    const metadataUri = await umi.uploader.uploadJson(metadataJson);
    console.log(metadataUri);
    const collectionSigner = generateSigner(umi);

    await createCollection(umi, {
      collection: collectionSigner,
      name,
      uri: metadataUri,
    }).sendAndConfirm(umi);

    // add crea

    res.json({
      success: true,
      collectionId: collectionSigner.publicKey,
      message: "Collection created successfully",
    });
  } catch (error) {
    console.error("Collection creation error:", error);
    res
      .status(500)
      .json({ error: "Failed to create collection", details: error.message });
  }
};

let defaultCollection;

export const mintApiNFT = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const {
      userProfileId,
      name,
      description,
      author,
      series,
      issue,
      genre,
      pages,
      publishDate,
      collectionId,
      attributes,
      transferImmediately = true,
    } = req.body;

    // Validate required fields
    if (!userProfileId || !name || !description) {
      return res
        .status(400)
        .json({ error: "userProfileId, name, and description are required" });
    }

    // Get user's wallet from database
    const userWallet = "await getUserWalletByUserId(userProfileId);";
    if (!userWallet) {
      return res.status(404).json({ error: "User wallet not found" });
    }

    // Get user's primary Solana address
    const userSolanaWallet =
      "await getUserPrimarySolanaAddress(userWallet.id);";
    if (!userSolanaWallet) {
      return res
        .status(404)
        .json({ error: "User has no verified Solana wallet address" });
    }

    // console.log(`Minting NFT for user ${userProfileId} to address ${userSolanaWallet.address}`);

    // Parse attributes if provided
    let parsedAttributes = [];
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (error) {
        return res.status(400).json({ error: "Invalid attributes format" });
      }
    }

    // Add comic-specific attributes
    const comicAttributes = [
      { trait_type: "Author", value: author || "Unknown" },
      { trait_type: "Series", value: series || "Standalone" },
      { trait_type: "Issue", value: issue || "1" },
      { trait_type: "Genre", value: genre || "Comic" },
      { trait_type: "Pages", value: pages || "1" },
      { trait_type: "Platform", value: "YourPlatformName" },
      { trait_type: "Minted By", value: "Platform" },
      ...parsedAttributes,
    ];

    // Prepare metadata
    const metadata = {
      name,
      description,
      author,
      series,
      issue,
      genre,
      pages,
      publishDate,
      attributes: comicAttributes,
      creators: [
        {
          address: masterWallet.publicKey,
          percentage: 100,
        },
      ],
    };

    // Upload metadata
    const metadataUri = await uploadMetadata(req.file, metadata);

    // Generate asset signer
    const assetSigner = generateSigner(umi);

    // Prepare mint parameters (initially mint to master wallet)
    const mintParams = {
      asset: assetSigner,
      name,
      uri: metadataUri,
      owner: masterWallet.publicKey, // Mint to master wallet first
    };

    // Add collection if specified
    if (collectionId) {
      try {
        const collection = await fetchCollection(umi, publicKey(collectionId));
        mintParams["collection"] = collection;
      } catch (error) {
        console.log("Collection not found, minting without collection");
      }
    }
    // const userPublicKey = publicKey(userSolanaWallet.address)

    // Add royalties plugin (platform gets royalties)
    mintParams["plugins"] = [
      {
        type: "Royalties",
        basisPoints: 500, // 5% royalty to platform
        creators: [
          {
            address: masterWallet.publicKey,
            percentage: 100,
          },
        ],
        ruleSet: { type: "None" },
      },
    ];

    // Create the asset
    console.log("Creating NFT...");
    const createResult = await create(umi, mintParams).sendAndConfirm(umi);

    //save nft to database
    await db.insert(nft).values({
      owner: userWallet, // UUID from the user wallet
      colection: collectionId ?? "standalone", // optional or default string
      isLimitedEdition: false, // or true if it's a limited edition
      amount: 1, // assume 1 NFT minted
      metadata: {
        name,
        description,
        author,
        image: req.file.path,
        uri: metadataUri,
        assetId: assetSigner.publicKey,
        attributes: comicAttributes,
        mintSignature: createResult.signature,
      },
      status: "completed", // or 'pending' if there's more flow
    });

    let transferResult = null;

    // Transfer to user immediately if requested
    // if (transferImmediately) {
    //   console.log('Transferring NFT to user...');
    //   try {
    //    if (collectionId){
    //      transferResult = await transferV1(umi, {
    //       asset: assetSigner.publicKey,
    //       newOwner: publicKey(userSolanaWallet.address),
    //     }).sendAndConfirm(umi);
    //    }else{
    //      transferResult = await transferV1(umi, {
    //       asset: assetSigner.publicKey,
    //       newOwner: publicKey(userSolanaWallet.address),
    //       collection: collectionId
    //     }).sendAndConfirm(umi);
    //    }
    //   } catch (transferError) {
    //     console.error('Transfer failed:', transferError);
    //     // NFT was minted but transfer failed - you might want to handle this differently
    //     return res.status(500).json({
    //       error: 'NFT minted but transfer failed',
    //       details: transferError.message,
    //       assetId: assetSigner.publicKey,
    //       mintSignature: createResult.signature,
    //       metadataUri
    //     });
    //   }
    // }

    // Log the transaction for your records
    console.log(`NFT minted successfully:
      Asset ID: ${assetSigner.publicKey}
      User: ${userProfileId}
      User Wallet: ${userSolanaWallet}
      Mint Signature: ${createResult.signature}
      Transfer Signature: ${transferResult?.signature || "N/A"}
    `);

    res.json({
      success: true,
      assetId: assetSigner.publicKey,
      mintSignature: createResult.signature,
      transferSignature: transferResult?.signature,
      metadataUri,
      // userWalletAddress: userSolanaWallet.address,
      transferred: transferImmediately,
      message: transferImmediately
        ? "Comic NFT minted and transferred to user successfully"
        : "Comic NFT minted successfully (transfer pending)",
    });
  } catch (error) {
    console.error("Minting error:", error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Failed to mint NFT",
      details: error.message,
    });
  }
};

// Get NFT details
export const getAssetData = async (req, res) => {
  try {
    const { assetId } = req.params;

    const asset = await fetchAsset(umi, publicKey(assetId));

    res.json({
      success: true,
      asset: {
        id: asset.publicKey,
        name: asset.name,
        uri: asset.uri,
        owner: asset.owner,
        updateAuthority: asset.updateAuthority,
        plugins: asset["plugins"] || null,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch NFT", details: error.message });
  }
};

// Get NFTs by owner
export const getAssetByOwner = async (req, res) => {
  try {
    const { userProfileId } = req.params;

    // Get user's wallet from database
    const userWallet = await getUserWalletByUserId(userProfileId);
    if (!userWallet) {
      return res.status(404).json({ error: "User wallet not found" });
    }

    // Get all user's Solana addresses
    const userAddresses = await db
      .select()
      .from(walletAddresses)
      .where(
        and(
          eq(walletAddresses.userWalletId, userWallet.id),
          eq(walletAddresses.blockchain, "solana"),
          eq(walletAddresses.isVerified, true)
        )
      );

    if (userAddresses.length === 0) {
      return res.json({ success: true, assets: [] });
    }

    // Fetch NFTs for all user addresses
    const allAssets = [];
    for (const address of userAddresses) {
      try {
        const { fetchAssetsByOwner } = require("@metaplex-foundation/mpl-core");
        const assets = await fetchAssetsByOwner(
          umi,
          publicKey(address.address)
        );
        allAssets.push(...assets);
      } catch (error) {
        console.error(
          `Failed to fetch assets for address ${address.address}:`,
          error
        );
      }
    }

    res.json({
      success: true,
      assets: allAssets.map((asset) => ({
        id: asset.publicKey,
        name: asset.name,
        uri: asset.uri,
        owner: asset.owner,
        updateAuthority: asset.updateAuthority,
      })),
    });
  } catch (error) {
    console.error("Fetch user NFTs error:", error);
    res.status(500).json({
      error: "Failed to fetch user NFTs",
      details: error.message,
    });
  }
};

export const transferNft = async (req, res) => {
  try {
    const { assetId, userProfileId } = req.body;

    if (!assetId || !userProfileId) {
      return res
        .status(400)
        .json({ error: "assetId and userProfileId are required" });
    }

    // Get user's wallet from database
    const userWallet = await getUserWalletByUserId(userProfileId);
    if (!userWallet) {
      return res.status(404).json({ error: "User wallet not found" });
    }

    // Get user's primary Solana address
    const userSolanaWallet = await getUserPrimarySolanaAddress(userWallet.id);
    if (!userSolanaWallet) {
      return res
        .status(404)
        .json({ error: "User has no verified Solana wallet address" });
    }

    // Verify the asset exists and is owned by master wallet
    const asset = await fetchAsset(umi, publicKey(assetId));
    if (asset.owner !== masterWallet.publicKey) {
      return res
        .status(400)
        .json({ error: "Asset is not owned by platform wallet" });
    }

    // Transfer the asset
    const transferResult = await transfer(umi, {
      asset: publicKey(assetId),
      newOwner: publicKey(userSolanaWallet.address),
    }).sendAndConfirm(umi);

    res.json({
      success: true,
      assetId,
      transferSignature: transferResult.signature,
      userWalletAddress: userSolanaWallet.address,
      message: "NFT transferred to user successfully",
    });
  } catch (error) {
    console.error("Transfer error:", error);
    res.status(500).json({
      error: "Failed to transfer NFT",
      details: error.message,
    });
  }
};

export const getPlatformNFTs = async (req, res) => {
  try {
    const { fetchAssetsByOwner } = require("@metaplex-foundation/mpl-core");
    const assets = await fetchAssetsByOwner(umi, masterWallet.publicKey);

    res.json({
      success: true,
      assets: assets.map((asset) => ({
        id: asset.publicKey,
        name: asset.name,
        uri: asset.uri,
        owner: asset.owner,
        updateAuthority: asset.updateAuthority,
      })),
    });
  } catch (error) {
    console.error("Fetch platform NFTs error:", error);
    res.status(500).json({
      error: "Failed to fetch platform NFTs",
      details: error.message,
    });
  }
};
