#!/bin/bash

################# custom settings #######################


repoPath="${HOME}/git/cardanosolutions"
binaryDestinationPath="${HOME}/.local/bin/CIP-0094"

repoURL="https://github.com/CardanoSolutions/cardano-node.git"
targetTag="release/1.35+cip-0094"

#########################################################

echo ""
echo "build tool versions:"
ghc --version
echo "recommended: GHC 8.10.7"

echo ""
cabal --version
echo "recommended: cabal 3.6.2.0 or higher"
read -p "Press [Enter] to continue ..."

mkdir -p ${binaryDestinationPath}
mkdir -p ${repoPath}
cd ${repoPath}

echo "Let's clone ${repoURL} "
echo "and checkout ${targetTag} tag ..."
read -p "Press [Enter] to continue ..."
git clone ${repoURL}
cd cardano-node
git checkout ${targetTag}

cabal update
cabal --version

echo ""
echo "Now let's build and install cardano-cli ..." 
read -p "Press [Enter] to continue ..."

cabal run cardano-cli:exe:cardano-cli -- --help 2>&1 | tee /tmp/build.log

echo ""
ccli135Found=false
grep -E "^Linking+.*cardano-cli" /tmp/build.log | while read -r line ; do
    act_bin_path=$(echo "$line" | awk '{print $2}')
    act_bin=$(echo "$act_bin_path" | awk -F "/" '{print $NF}')
    echo "move new built to .local/bin/CIP-0094/cardano-cli (not overwriting existing cardano-cli)"
    read -p "Press [Enter] to continue ..."
    cp -f "$act_bin_path" "${HOME}/.local/bin/CIP-0094/${act_bin}"
	ccli135Found=true
done
[[ "$ccli135Found" = false ]] && echo "Warn: cabal seems not having built cardano-cli";

cd -

echo ""
echo "Now we should have a new cardano-cli based on the ${targetTag} codebase"
echo "${binaryDestinationPath}/cardano-cli --version"
${binaryDestinationPath}/cardano-cli --version

