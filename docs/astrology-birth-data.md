# Astrology birth data contract

The astrology module stores birth context independently from `profiles.reading_profile`.
This keeps the astrology calculation input stable and prevents future natal-chart data from
being mixed with the user's reading preferences or symbolic profile.

## Endpoints

- `GET /api/astrology/birth-data` reads the authenticated user's saved birth context.
- `PUT /api/astrology/birth-data` stores it after authenticated consent.
- `DELETE /api/astrology/birth-data` removes the saved context.

The `PUT` body must include:

```json
{
  "consent": { "storeBirthData": true },
  "birthData": {
    "localDate": "1990-06-21",
    "localTime": "14:30",
    "timeInputMode": "local-clock",
    "timezone": "America/Sao_Paulo",
    "location": {
      "label": "Sao Paulo, SP, Brazil",
      "countryCode": "BR",
      "latitude": -23.55052,
      "longitude": -46.633308
    },
    "precision": "exact",
    "timeResolution": {
      "status": "resolved",
      "inputMode": "local-clock",
      "localDate": "1990-06-21",
      "localTime": "14:30",
      "timezone": "America/Sao_Paulo",
      "utcISO": "1990-06-21T17:30:00.000Z",
      "utcOffsetMinutes": -180,
      "utcOffsetLabel": "UTC-03:00",
      "daylightSaving": "inactive",
      "source": "iana-timezone-rules"
    }
  }
}
```

`localTime` is the clock time shown on the birth record. The user should not manually add or
remove daylight-saving hours. The `timeResolution` object records how that local clock time was
interpreted for the selected IANA timezone, including the resulting UTC instant and offset.

The route requires a signed-in user and explicit storage consent. The table has its own RLS
policies and is deleted together with the authenticated profile. Before saving, the server
recomputes the local clock against the IANA timezone rules and rejects a client resolution that
does not match the canonical UTC instant, offset or daylight-saving status.

This adapter persists and validates the resolved birth-time contract; it does not yet claim to be
the final natal chart engine. Natal calculations remain a separate server-side provider with its
own fixtures and limitations.
