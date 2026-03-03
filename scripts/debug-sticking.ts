
const testStr = "05/01/2026RENTAB.INVEST FACILCRED*29885183,6334.279,31"

console.log("Testing String:", testStr)

// Current Regex
const regex = /(-)?(\d{1,3}(?:\.\d{3})*,\d{2})/g
const matches = [...testStr.matchAll(regex)]

console.log("\n--- Current Regex Results ---")
matches.forEach((m, i) => console.log(`Match ${i}: ${m[0]}`))

// Analysis:
// If output is "5183,63", then we lost "2988".
// And we lost "3,63" actual value.

// New Strategy:
// Insert spaces between things that look like Doc and Value?
// Docs are usually integer-like. Values have ,XX.
// If we see `[digit][digit],[digit][digit]`, that's a value.
// `83,63` -> `3,63`?
// `2988518` + `3,63`.
// If I assume Bradesco formatting ...
// Maybe filtering RENTAB *via Doc ID*? 
// No, I need the value.

// HEURISTIC:
// RENTAB entries in this specific PDF seem to have sticky columns.
// Pattern: `FACILCRED*` followed by `[DOC][VALUE][BALANCE]` all stuck.
// `2988518` (7 digits) appears in all examples in debug file.
// `2988518` + `3,63` -> `29885183,63`.
// `2988518` + `0,03` -> `29885180,03`.
// `2988518` + `1,49` -> `29885181,49`.

// Fix:
// Pre-process line:
// If line contains `FACILCRED*`, look for `2988518`.
// Insert space after `2988518`.
// Also check if Value is stuck to Balance.
// `3,6334.279,31` -> `3,63` `34.279,31`.
// Regex `,\d{2}`.
// `3,63` ends at index X. `34...` starts at X+1.
// If there is no space between `\d` and `\d`, insert space?
// `3,63` `3` -> `3,63 3`.

function fixStickyLine(line: string): string {
    // 1. Fix Doc ID sticking (Specific to this file/bank pattern)
    // Bradesco Doc IDs are often 7 digits.
    // If we see [7 digits][digit],[digit][digit]
    line = line.replace(/(\d{7})(\d+,\d{2})/, '$1 $2')

    // 2. Fix Value sticking to Balance
    // Pattern: [comma][digit][digit][digit]
    // `3,6334` -> `3,63 34`
    // Regex: `(,\d{2})(\d)` -> `$1 $2`
    line = line.replace(/(,\d{2})(\d)/g, '$1 $2')

    return line
}

console.log("\n--- Fixed Line ---")
const fixed = fixStickyLine(testStr)
console.log(fixed)

const fixedMatches = [...fixed.matchAll(regex)]
console.log("\n--- Fixed Regex Results ---")
fixedMatches.forEach((m, i) => console.log(`Match ${i}: ${m[0]}`))
