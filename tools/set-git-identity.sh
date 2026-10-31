#!/bin/sh
# SessionStart-Hook für Claude Code (aus apachler/violetveinsmp übernommen):
# Hat die Umgebung keine Git-Identität (z. B. Claude Code in der Cloud), wird repo-lokal die des
# Repo-Owners gesetzt. Wer schon eine Identität hat (z. B. global auf seinem Laptop), behält sie.
# Eine Assistenten-Identität (noreply@anthropic.com, Copilot-Bot) zählt nicht als Identität.
cd "$(dirname "$0")/.." || exit 1
email=$(git config user.email)
case "$email" in
  ""|*@anthropic.com|*copilot*|*github-actions*) unset_identity=1 ;;
  *) unset_identity= ;;
esac
if [ -n "$unset_identity" ]; then
  git config user.name "Andreas Pachler"
  git config user.email "apachler@paan-systems.com"
fi
