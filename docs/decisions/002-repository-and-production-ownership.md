# ADR 002: Repository and Production Stewardship
Status: Pending organizational decision
Date: 2026-10-14

## Current state
The public development repository belongs to the original developer's personal GitHub account. GitHub source control and the deployed EUC application's administrative accounts are separate.

## Interim practices
- Use individual GitHub accounts and attributable commits/PRs, not a shared password.
- No production hosting, credentials, subscription data or billing under temporary officer accounts until stewardship is agreed.
- Keep development and production roles separate. The developer may be authorized as an application admin, but app admin is not automatically infrastructure owner.
- Do not add an open-source LICENSE until publication rights have been discussed with EUC and, if required, Penn State.
- Preserve contributor attribution and decide whether EUC will operate a GitHub organization or receive a transferred/forked project.

## Decision still needed
Who has authority to license the code? Who owns and pays for the hosting, domain, database and email service? Which officers/admins have emergency access? How is ownership transferred during leadership turnover?

Revisit before public deployment and before adopting a license.