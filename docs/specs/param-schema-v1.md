# Param Schema v1

Schema object shape:

```js
{
  version: 1,
  fields: {
    amount: { type: "range", min: 0, max: 1, step: 0.01, default: 0.5 },
    mode: { type: "select", options: ["a", "b"], default: "a" }
  },
  aliases: { legacyAmount: "amount" }
}
```

Migration rules:

1. Resolve aliases before coercion.
2. Unknown keys are dropped unless `passthrough` flag is true.
3. Values are coerced by field type and clamped to constraints.
4. Serialization is stable and sorted by schema field order.
