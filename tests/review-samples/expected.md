# Expected Review Findings

Expected tagged findings for `tests/review-samples/` under `/checkmate-review`.

---

## 1. `clean.diff`

Minimal bug fix changing subtraction to addition. No detours, no scope creep.

### Expected Output
```text
verdict: clean
```

---

## 2. `overbuilt.diff`

Diff adding a discount function that includes unnecessary abstractions, speculative configurations, and unrequested features.

### Expected Findings
- `abstraction`: `AbstractDiscountStrategy` class definition (Line 4 or 5)
- `abstraction`: `DiscountStrategyFactory` factory pattern (Line 9 or 10)
- `premature-complexity`: `DEFAULT_DISCOUNT_CONFIG` speculative configuration schema (Line 17 or 18)
- `scope-creep`: `calculateLoyaltyPoints` unrequested customer loyalty points system (Line 26 or 27)

### Expected Output
```text
L4: abstraction: unnecessary abstract strategy class hierarchy
L9: abstraction: unnecessary factory class for simple discount logic
L17: premature-complexity: speculative configuration schema with unrequested options
L26: scope-creep: unrequested loyalty points calculation function
verdict: 4 findings
```

*(Note: Reviewers may cite the block's lead comment on lines 4, 9, 17, 26 or declaration on lines 5, 10, 18, 27. If lines 4/5 and 9/10 are grouped into one abstraction finding, verdict is `3 findings`.)*

---

## 3. `verbose-response.md`

Verbose conversational response containing greetings, unverified claims, option menus, recaps, and closing offers.

### Expected Findings
- `preamble`: Greeting and conversational pleasantries (Line 3)
- `unverified`: Guarantees code is 100% bug-free without running tests (Line 12)
- `option-menu`: 3-item menu of alternative approaches instead of picking one (Line 14)
- `recap`: Summary of the code implementation after answering (Line 19)
- `recap`: Unsolicited closing offer asking if user wants further work (Line 21)

### Expected Output
```text
L3: preamble: conversational pleasantry and greeting before the solution
L12: unverified: guarantees 100% bug-free implementation without running tests
L14: option-menu: presents 3 alternative approaches instead of choosing the shortest path
L19: recap: restates and summarizes the implementation after providing the code
L21: recap: unsolicited closing offer asking if user wants additional work
verdict: 5 findings
```

*(Note: If lines 19 and 21 are combined into a single recap finding, verdict is `4 findings`.)*
