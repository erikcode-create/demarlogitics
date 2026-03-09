

## Remove Credit Limit from Shipper Agreement

Remove line 14 (`• Credit Limit: $${shipper.creditLimit.toLocaleString()}`) from the `PAYMENT TERMS` section in `src/utils/contractTemplates.ts`.

| File | Change |
|------|--------|
| `src/utils/contractTemplates.ts` | Delete the credit limit bullet point (line 14) from `generateShipperAgreement` |

