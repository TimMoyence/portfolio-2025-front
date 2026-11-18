#!/bin/sh
exec "${CHROME_REEL:?aucun chrome trouvé : posez CHROME_BIN sur le chrome à lancer}" "$@" </dev/null >/dev/null 2>&1
