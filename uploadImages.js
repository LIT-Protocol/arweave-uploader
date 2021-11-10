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

  const alreadyUploaded = JSON.parse(fs.readFileSync("./uploadProgress.json"));

  for (let i = 0; i < alreadyUploaded.length; i++) {
    const u = alreadyUploaded[i];
    allTxns.push(u);
  }

  const alreadyUploadedFilenames = alreadyUploaded.map((a) => a.filename);

  const path = "./photos/all";
  const allFiles = fs
    .readdirSync(path)
    .filter((f) => !alreadyUploadedFilenames.includes(f));

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];

    console.log(`processing ${i + 1} of ${allFiles.length}: ${file}`);

    let data = fs.readFileSync(`${path}/${file}`);

    const ipfsCid = await getIpfsCid(data);

    console.log("creating transaction");
    let transaction = null;
    while (!transaction) {
      try {
        transaction = await arweave.createTransaction({ data }, key);
        transaction.addTag("Content-Type", "image/png");
        transaction.addTag("IPFS-Add", ipfsCid);
      } catch (e) {
        console.log(
          "error creating transaction.  swallowing and trying again.",
          e
        );
      }
    }

    console.log("signing");
    await arweave.transactions.sign(transaction, key);

    console.log("getting uploader");
    let uploader = await arweave.transactions.getUploader(transaction);

    console.log("uploading");
    while (!uploader.isComplete) {
      try {
        await uploader.uploadChunk();
      } catch (e) {
        console.log("uploader failed with error", e);
      }
      console.log(
        `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
      );
    }

    console.log(transaction);

    allTxns.push({
      id: transaction.id,
      filename: file,
    });

    console.log("--- alltxns so far ---");
    console.log(JSON.stringify(allTxns));
    fs.writeFileSync("./uploadProgress.json", JSON.stringify(allTxns));
  }

  console.log("------------------------------");
  console.log("done!");
  console.log("------------------------------");

  return allTxns;
}

main().then((allTxns) => {
  console.log(JSON.stringify(allTxns));
  fs.writeFileSync("./arweaveImages.json", JSON.stringify(allTxns));
});
