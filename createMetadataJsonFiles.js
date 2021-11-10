const Arweave = require('arweave');
const fs = require('fs');
const dagPB = require('ipld-dag-pb');
const { UnixFS } = require('ipfs-unixfs');


async function getIpfsCid(data, unixFsType = 'file', dagPbOptions = { cidVersion: 0 }) {
  const file = new UnixFS(unixFsType, data);

  const node = new dagPB.DAGNode(file.marshal());

  const Cid = await dagPB.util.cid(dagPB.util.serialize(node), dagPbOptions);

  return Cid.toBaseEncodedString();
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function shuffle(array) {
  var currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


function generateDescription(word) {
  if (!word.definitions) {
    throw new Error(`${word.word} is missing a definition`)
  }

  let desc = ''
  if (word.definitions.length === 1) {
    const d = word.definitions[0]
    desc += `${d.partOfSpeech} - `
    if (d.definitions.length === 1) {
      desc += d.definitions[0].definition
    } else {
      d.definitions.forEach((def, j) => {
        desc += `${String.fromCharCode(97 + j)}) ${def.definition} `
        // if (def.example) {
        //   desc += `\n  // ${def.example}`
        // }
      })
    }
  } else {
    word.definitions.forEach((d, i) => {
      desc += `${i + 1}: ${d.partOfSpeech} - `
      d.definitions.forEach((def, j) => {
        desc += `${String.fromCharCode(97 + j)}) ${def.definition} `
        // if (def.example) {
        //   desc += `\n  // ${def.example}`
        // }
      })
    })
  }
  return desc
}

async function loadKeyFromFile(path) {
  let data = '';

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

    if (typeof decoded !== 'object') {
      throw new Error('Failed to parse Arweave key file, the file format is invalid');
    }

    return decoded;
  } catch (error) {
    throw new Error('Failed to parse Arweave key file, the file format is invalid');
  }
}

async function main() {
  const allTxns = []

  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  const key = await loadKeyFromFile('/Users/chris/.arweave/arweave-keyfile-04FYC9p-s_IDTFh51eYhbJ7GgpN7RcxGuy053TjhmTE.json')

  let words = shuffle(JSON.parse(fs.readFileSync(`./words.json`)));

  for (let i = 0; i < words.length; i++) {
    const word = words[i]

    console.log(`processing ${i + 1} of ${words.length}: ${word.word}`)

    const metadata = {
      name: capitalizeFirstLetter(word.word),
      description: generateDescription(word),
      image: `https://arweave.net/${word.id}`
    }

    fs.writeFileSync(`./final/${i + 1}.json`, JSON.stringify(metadata))


    // let data = fs.readFileSync(`${path}/${file}`);

    // const ipfsCid = await getIpfsCid(data);

    // let transaction = await arweave.createTransaction({ data }, key);
    // transaction.addTag('Content-Type', 'application/json');
    // transaction.addTag('IPFS-Add', ipfsCid);

    // await arweave.transactions.sign(transaction, key);

    // let uploader = await arweave.transactions.getUploader(transaction);

    // while (!uploader.isComplete) {
    //   await uploader.uploadChunk();
    //   console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    // }


    // console.log(transaction)

    // allTxns.push({
    //   id: transaction.id,
    //   filename: file
    // })
  }

  console.log('------------------------------')
  console.log('done!')
  console.log('------------------------------')

  return allTxns
}


main().then((allTxns) => {
  console.log(JSON.stringify(allTxns))
})