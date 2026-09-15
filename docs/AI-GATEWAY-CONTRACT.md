# PDU ↔ VOLYNX AI Gateway Contract

PDU can optionally route its server-side Lume and reading generation through
the VOLYNX internal AI gateway. This keeps the existing PDU experience intact
while allowing provider/model policy to be centralized later.

## Optional configuration

Set both variables in the PDU server environment:

- `PDU_AI_GATEWAY_URL`: the complete server-to-server gateway endpoint.
- `PDU_AI_GATEWAY_TOKEN`: the private bearer token issued for PDU.

When either variable is absent, PDU uses its current Anthropic adapter. When
both are present, the PDU server sends only bounded prompts and the selected
capability (`lume` or `reading`) to the gateway. The browser never sees the
gateway token.

## Safety and ownership

- PDU keeps its own rate limits, context filtering, response normalization, and
  user-facing fallback behavior.
- VOLYNX keeps provider credentials and model selection in the gateway.
- This bridge does not activate VOLYNX billing for PDU and does not grant VX
  entitlements. A production billing contract requires a separate decision.
- The gateway is not considered active until its secret, deployment, and a
  server-to-server smoke test are verified together.
