#!/bin/bash

################# custom settings #######################

# set your prefered path to your v8.x.x cardano-cli binary
repoPath="${HOME}/git/cardano-node"

targetTag="8.0.0-untested"

################# initial checks ########################

if [ -d ${repoPath} ]; then
    echo ""
    echo "Local repository check: OK"
    echo "(assuming you git clone'd https://github.com/input-output-hk/cardano-node.git into it)"
else
    echo "please set the path to your local cardano-node repository first and restart this script"
    exit
fi

echo ""
echo "Let's checkout ${targetTag} tag ..."
read -p "Press [Enter] to continue ..."
cd ${repoPath}
git fetch --all --tags
git checkout ${targetTag}

echo ""
echo "backup an existing cabal.project.local to cabal.project.local.bkp_${targetTag} ..."
read -p "Press [Enter] to continue ..."
mv cabal.project.local cabal.project.local.bkp_${targetTag}

echo ""
echo "prepare cabal to build ${targetTag} codebase ..."
read -p "Press [Enter] to continue ..."
cabal update
cabal configure -O0 -w ghc-8.10.7
echo "package cardano-crypto-praos" >> cabal.project.local
echo " flags: -external-libsodium-vrf" >> cabal.project.local

echo ""
echo "Now let's build and install cardano-cli ..."
read -p "Press [Enter] to continue ..."

mkdir -p ${HOME}/.local/bin/CIP-0094

cabal install \
  --installdir ${HOME}/.local/bin/CIP-0094 \
  --install-method=copy \
  --constraint "cardano-crypto-praos -external-libsodium-vrf" \
  --minimize-conflict-set \
  cardano-cli:exe:cardano-cli 2>&1 | tee /tmp/build.log

#echo ""
#ccli8Found=false
#grep -E "^Linking+.*cardano-cli" /tmp/build.log | while read -r line ; do
#    act_bin_path=$(echo "$line" | awk '{print $2}')
#    act_bin=$(echo "$act_bin_path" | awk -F "/" '{print $NF}')
#    echo "move new built to .local/bin/cardano-cli-cip0094 (not overwriting existing cardano-cli)"
#    read -p "Press [Enter] to continue ..."
#    cp -f "$act_bin_path" "${HOME}/.local/bin/${act_bin}-cip0094"
#	ccli8Found=true
#done
#[[ "$ccli8Found" = false ]] && echo "Warn: cabal seems not having built cardano-cli";

echo ""
echo "restore the previous cabal.project.local file ..."
read -p "Press [Enter] to continue ..."
mv cabal.project.local.bkp_${targetTag} cabal.project.local
cd -

echo ""
echo "Now we should have a new cardano-cli based on the ${targetTag} codebase"
echo "${HOME}/.local/bin/CIP-0094/cardano-cli --version"
${HOME}/.local/bin/CIP-0094/cardano-cli --version

echo ""
echo "It's time to download getPoll.sh (helper script to participate to polls)"
read -p "Press [Enter] to continue ..."
curl -s -o getPoll.sh "https://raw.githubusercontent.com/cardano-foundation/CIP-0094-polls/main/scripts/getPoll.sh"
chmod 755 getPoll.sh
echo "ready to run ./getPoll.sh"
