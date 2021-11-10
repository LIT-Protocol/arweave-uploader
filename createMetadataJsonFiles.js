const Arweave = require("arweave");
const fs = require("fs");
const dagPB = require("ipld-dag-pb");
const { UnixFS } = require("ipfs-unixfs");

async function getIpfsCid(
  data,
  unixFsType = "file",
  dagPbOptions = { cidVersion: 0 }
) {
  const file = new UnixFS(unixFsType, data);

  const node = new dagPB.DAGNode(file.marshal());

  const Cid = await dagPB.util.cid(dagPB.util.serialize(node), dagPbOptions);

  return Cid.toBaseEncodedString();
}

async function loadKeyFromFile(path) {
  let data = "";

  try {
    data = fs.readFileSync(path);
  } catch (error) {
    throw new Error(`Failed to read Arweave key file: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Failed to read Arweave key file`);
  }

  try {
    const decoded = JSON.parse(data);

    if (typeof decoded !== "object") {
      throw new Error(
        "Failed to parse Arweave key file, the file format is invalid"
      );
    }

    return decoded;
  } catch (error) {
    throw new Error(
      "Failed to parse Arweave key file, the file format is invalid"
    );
  }
}

function shuffle(array) {
  var currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

async function main() {
  const allTxns = [];

  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });
  const key = await loadKeyFromFile(
    "/Users/chris/.arweave/arweave-keyfile-04FYC9p-s_IDTFh51eYhbJ7GgpN7RcxGuy053TjhmTE.json"
  );

  let images = shuffle(JSON.parse(fs.readFileSync(`./arweaveImages.json`)));

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const tokenId = i + 1;

    console.log(`processing ${i + 1} of ${images.length}: ${image.filename}`);
    const imageUrl = `https://arweave.net/${image.id}`;
    const q = {
      tokenId,
      imageUrl,
    };
    const metadata = {
      name: "Lit Genesis Gate",
      description:
        "To the owner of this NFT, congrats. You possess the key to a special portal. Behind this gate you'll find collaborative art, access to a private channel in the Lit Protocol discord, and other features and benefits for NFT owners.  Click on the NFT to enter!",
      image: imageUrl,
      animation_url: `https://litgateway.com/LitOgNft.html?${new URLSearchParams(
        q
      ).toString()}`,
    };

    fs.writeFileSync(`./final/${tokenId}.json`, JSON.stringify(metadata));
  }

  console.log("------------------------------");
  console.log("done!");
  console.log("------------------------------");

  return allTxns;
}

main().then((allTxns) => {
  console.log(JSON.stringify(allTxns));
});
