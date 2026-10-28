#!/usr/bin/env bash
set -euo pipefail

cli="${PLAYWRIGHT_CLI_BIN:-playwright-cli}"
if ! command -v "${cli}" >/dev/null 2>&1; then
  echo "Error: optional playwright-cli is unavailable; no package was installed. Use EUC's existing npm test scripts for regression tests." >&2
  exit 127
fi

if [[ -z "${PLAYWRIGHT_CLI_EXPECTED_VERSION:-}" ]]; then
  echo "Error: inspect the existing CLI's --version output and set PLAYWRIGHT_CLI_EXPECTED_VERSION to the reviewed exact output before use." >&2
  exit 64
fi

actual_version="$("${cli}" --version)"
if [[ "${actual_version}" != "${PLAYWRIGHT_CLI_EXPECTED_VERSION}" ]]; then
  echo "Error: playwright-cli version differs from PLAYWRIGHT_CLI_EXPECTED_VERSION; no browser command was run." >&2
  exit 65
fi

has_session_flag="false"
for arg in "$@"; do
  case "$arg" in
    --session|--session=*|-s|-s=*)
      has_session_flag="true"
      break
      ;;
  esac
done

cmd=("${cli}")
if [[ "${has_session_flag}" != "true" && -n "${PLAYWRIGHT_CLI_SESSION:-}" ]]; then
  cmd+=(--session "${PLAYWRIGHT_CLI_SESSION}")
fi
cmd+=("$@")

exec "${cmd[@]}"
