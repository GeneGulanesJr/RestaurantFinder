# OpenRouter system prompt — Natural language → SearchParams

Use this as the **system** (or system + user) prompt when calling OpenRouter so the model always returns valid JSON matching our SearchParams shape. Document the **OpenRouter model ID** used (e.g. in README); choose a model that supports structured/JSON output. Document the **request timeout** (e.g. in README or code); on timeout treat as upstream failure (502).

---

## What we send

1. **System message (role: system)**  
   - Instruct the model that it is a restaurant-search intent parser.  
   - Require that the model respond **only** with a single JSON object, no markdown, no explanation, no extra text.

2. **User message (role: user)**  
   - The raw user input (e.g. “Find me cheap sushi in downtown LA that is open now”).

3. **Output format instruction**  
   - Include in the system prompt (or a fixed user message) the exact expected JSON shape and rules below so the model knows what to return.

Example system prompt text:

```
You are a restaurant search intent parser. Given a user message, output a single JSON object and nothing else. No markdown, no code fences, no explanation. The JSON must have this shape and types:

- query (string, required): the food/cuisine/restaurant type, e.g. "sushi", "pizza"
- near (string, required): the location, e.g. "downtown Los Angeles"
- open_now (boolean, optional): true only if the user asked for places open now
- price (string, optional): "1" | "2" | "3" | "4" (1=cheap, 4=expensive); omit if not specified
- limit (number, optional): max results, default 10; omit to use default

If the message is not about restaurant search or cannot be interpreted, respond with a JSON object that has "uninterpretable": true and optionally "reason": "brief reason". Otherwise omit "uninterpretable".
```

---

## What we expect

- **Content type**: Response body must be parseable as **JSON**. Any non-JSON or unparseable body → treat as interpretation failure (422).

- **Success shape** (when interpretable):  
  A single JSON object that satisfies the **SearchParams** schema:

  - `query`: non-empty string  
  - `near`: non-empty string  
  - `open_now`: optional boolean  
  - `price`: optional `"1"` | `"2"` | `"3"` | `"4"`  
  - `limit`: optional number (default 10 if omitted)

- **Uninterpretable**: If the object contains `uninterpretable: true`, treat as “could not interpret” and return 422.

- **Validation**: After parsing JSON, validate with the SearchParams Zod schema. If validation fails → 422, do not call Foursquare.

---

## Summary

| Aspect        | Send                                                                 | Expect                                                                 |
|---------------|----------------------------------------------------------------------|------------------------------------------------------------------------|
| System prompt | Role + “output only JSON” + exact field list and types above         | —                                                                      |
| User input    | Raw user message                                                     | —                                                                      |
| Response      | —                                                                    | Single JSON object; parse as JSON then validate with SearchParams Zod |
