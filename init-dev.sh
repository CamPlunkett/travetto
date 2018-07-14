export NODE_PRESERVE_SYMLINKS=1
export TRAVETTO_DEV=1

ROOT=`dirname ${BASH_SOURCE[@]}`
ROOT=`realpath $ROOT`

lerna clean --yes
lerna bootstrap --hoist

function resolve_deps() {
  OUT=""
  for dep in `jq -r '.dependencies,.devDependencies | to_entries | .[].key' $ROOT/module/$1/package.json 2>/dev/null | grep travetto | awk -F '/' '{ print $2 }' | grep .`; do
    SUBS=`resolve_deps $dep`
    OUT="$OUT~$dep~$SUBS"
  done
  echo $OUT
}

function init() {
  NAME=`echo $1 | awk -F '/' '{ print $NF }'`
  DEPS=`resolve_deps $NAME | tr '~' '\n' | sort -u`

  mkdir -p $ROOT/module/$NAME/node_modules/@travetto

  for sub in typescript tslib; do
    ln -sTf $ROOT/node_modules/$sub $ROOT/module/$NAME/node_modules/$sub
  done  

  for DEP in `echo "$DEPS"`; do
    ln -sTf $ROOT/module/$DEP $ROOT/module/$NAME/node_modules/@travetto/$DEP
  done
}

for x in $ROOT/module/*; do
  init $x
done