#!/usr/bin/env bash
# Hermetic wrapper checks: fake tools only, no browser or package downloads.
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
wrapper="${script_dir}/playwright_cli.sh"
temp_parent="$(cd -- "${TMPDIR:-/tmp}" && pwd -P)"
test_root="$(mktemp -d "${temp_parent}/euc-pwcli-test.XXXXXX")"
cleanup() {
  case "${test_root}" in
    "${temp_parent}"/euc-pwcli-test.*) rm -rf -- "${test_root}" ;;
    *) echo "Refusing cleanup outside the test temp directory." >&2; return 1 ;;
  esac
}
trap cleanup EXIT
mkdir "${test_root}/bin"
export CLI_ARGS_LOG="${test_root}/args"
export INSTALL_LOG="${test_root}/install"
export PATH="${test_root}/bin:${PATH}"
export PLAYWRIGHT_CLI_BIN="${test_root}/bin/mock-cli"
unset PLAYWRIGHT_CLI_EXPECTED_VERSION PLAYWRIGHT_CLI_SESSION

cat > "${test_root}/bin/blocked-installer" <<'STUB'
#!/usr/bin/env bash
echo "Unexpected installer: $*" >> "${INSTALL_LOG}"
exit 99
STUB
chmod +x "${test_root}/bin/blocked-installer"
for tool in npx npm pnpm bun pip uv curl wget; do
  cp "${test_root}/bin/blocked-installer" "${test_root}/bin/${tool}"
done

checks=0
expect_status() {
  local expected="$1" actual=0
  shift
  "$@" > "${test_root}/stdout" 2> "${test_root}/stderr" || actual=$?
  if [[ "${actual}" != "${expected}" ]]; then
    echo "Expected status ${expected}, got ${actual}." >&2
    cat "${test_root}/stderr" >&2
    exit 1
  fi
  checks=$((checks + 1))
}

expect_status 127 bash "${wrapper}" snapshot
[[ ! -e "${INSTALL_LOG}" ]]

cat > "${PLAYWRIGHT_CLI_BIN}" <<'STUB'
#!/usr/bin/env bash
if [[ "${1:-}" == "--version" ]]; then
  printf '%s\n' 'Version 0.0.0-test'
  exit "${MOCK_VERSION_EXIT:-0}"
fi
printf '%s\n' "$@" > "${CLI_ARGS_LOG}"
exit "${MOCK_EXIT:-0}"
STUB
chmod +x "${PLAYWRIGHT_CLI_BIN}"
expect_status 64 bash "${wrapper}" snapshot
[[ ! -e "${CLI_ARGS_LOG}" ]]
export PLAYWRIGHT_CLI_EXPECTED_VERSION='different-version'
expect_status 65 bash "${wrapper}" snapshot
[[ ! -e "${CLI_ARGS_LOG}" ]]

export PLAYWRIGHT_CLI_EXPECTED_VERSION='Version 0.0.0-test'
expect_status 0 bash "${wrapper}" fill e1 'two words'
[[ "$(cat "${CLI_ARGS_LOG}")" == $'fill\ne1\ntwo words' ]]
export PLAYWRIGHT_CLI_SESSION='task session'
expect_status 0 bash "${wrapper}" snapshot
[[ "$(cat "${CLI_ARGS_LOG}")" == $'--session\ntask session\nsnapshot' ]]
expect_status 0 bash "${wrapper}" --session=explicit snapshot
[[ "$(cat "${CLI_ARGS_LOG}")" == $'--session=explicit\nsnapshot' ]]
expect_status 0 bash "${wrapper}" -s=explicit snapshot
[[ "$(cat "${CLI_ARGS_LOG}")" == $'-s=explicit\nsnapshot' ]]
expect_status 0 bash "${wrapper}" -s explicit snapshot
[[ "$(cat "${CLI_ARGS_LOG}")" == $'-s\nexplicit\nsnapshot' ]]
export MOCK_EXIT=23
expect_status 23 bash "${wrapper}" snapshot
export MOCK_VERSION_EXIT=42
expect_status 42 bash "${wrapper}" snapshot
[[ ! -e "${INSTALL_LOG}" ]]
printf '%s wrapper behavior checks passed; no installer invoked.\n' "${checks}"
