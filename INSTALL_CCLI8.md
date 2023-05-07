# Build cardano-cli v8 from input-output-hk

Please note that version 8 as successor of the previous v1.35.x codebase has undergone an extensive revision. So the build process on your system may be a bit different than you were used to.

We provide a [build script](scripts/build_CCLI8.sh) here, which was tested on Linux/Ubuntu, and should serve you as a help. If it does not run successfully on your system, please try to find the adjustments for your system using the steps that are already given there.

## Build requirements

The cabal and ghc binaries should be versions known to work for compiling cardano-node. If you do not normally compile your own cardano-node the following versions are known to work.

* cabal 3.6.2.0
* ghc 8.10.7

## Download the build script

```bash
mkdir "$HOME/tmp";cd "$HOME/tmp"
# Install curl
# CentOS / RedHat - sudo dnf -y install curl
# Ubuntu / Debian - sudo apt -y install curl
curl -sS -o build_CCLI8.sh https://raw.githubusercontent.com/cardano-foundation/CIP-0094-polls/main/scripts/build_CCLI8.sh
chmod 755 build_CCLI8.sh
```

## Execute the build script

Now execute `./build_CCLI8.sh`.

The script will explain each step it will do. Confirm with `[Enter]` or abort
the script if something doesn't seem right. It is designed to rely on an
existing local clone of IOG's cardano-node repository on your computer. If
successfull it will not overwrite your existing cardano-cli but instead save it
into a dedicated subfolder.
