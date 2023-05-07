# Build cardano-cli 1.35.7+cip-0094 from CardanoSolutions

A version of the cardano-cli with the governance poll extension has been
backported on top of 1.35.7 (latest cardano-node/cardano-cli release as of
today). If you prefer building a cardano-cli from the 1.35 codebase there is a
repository you can clone to build your 1.35.7 with the governance poll
subcommands included.

## Download the build script

```bash
mkdir "$HOME/tmp";cd "$HOME/tmp"
# Install curl
# CentOS / RedHat - sudo dnf -y install curl
# Ubuntu / Debian - sudo apt -y install curl
curl -sS -o build_CCLI135.sh https://raw.githubusercontent.com/cardano-foundation/CIP-0094-polls/main/scripts/build_CCLI135.sh
chmod 755 build_CCLI135.sh
```

## Execute the build script

Now execute `./build_CCLI135.sh`. The script will explain each step it will do.
Confirm with [Enter] or abort the script if something doesn't seem right. It is
designed to clone a new local copy and build the executable from it. If
successfull it will not overwrite your existing cardano-cli but instead save it
into a dedicated subfolder.
