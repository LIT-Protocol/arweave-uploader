step 1: upload images with uploadImages.js

step 2: create json metadata with createMetadataJsonFiles.js

step 3: upload the metadata json files. if they are inside the "metadata" folder, then this command will work: `arweave deploy-dir metadata`

step 4: modify contractMetadata.json and upload it using `arweave deploy contractMetadata.json --ipfs-publish`

step 5: set the metadata URLs in the contracts to match the arweave metadata one
