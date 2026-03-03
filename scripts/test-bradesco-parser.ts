
// Mock of the parser logic from import-actions.ts
// We'll copy the function here to test it isolated.

interface ParsedTransaction {
    date: string
    description: string
    amount: number
    type: 'entrada' | 'saida'
    originalLine?: string
    isInitialBalance?: boolean
}

function parseBradesco(lines: string[]): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = []
    let currentDate: string | null = null
    let prefixDescription = ''

    const parseBrNumber = (str: string) => parseFloat(str.replace(/\./g, '').replace(',', '.'))

    for (const line of lines) {
        const cleanLine = line.trim()
        if (cleanLine.length < 3) continue

        // --- 1. IGNORE GARBAGE & HEADERS ---
        if (
            /^Extrato de/i.test(cleanLine) ||
            /^Agência/i.test(cleanLine) ||
            /Total Disponível/i.test(cleanLine) ||
            /Saldos Invest/i.test(cleanLine) ||
            /data\s+lançamento/i.test(cleanLine) ||
            cleanLine.includes('Ouvidoria') ||
            cleanLine.includes('Alô Bradesco') ||
            cleanLine.includes('RENTAB.INVEST') // The filter I added
        ) {
            console.log('Skipped (Filter):', cleanLine)
            continue
        }

        // --- 2. IGNORE FOOTER TOTALS ---
        if (/^Total\s/i.test(cleanLine)) {
            console.log('Skipped (Total):', cleanLine)
            continue
        }

        // --- 3. DATE HANDLING ---
        const dateMatch = cleanLine.match(/^(\d{2}\/\d{2}\/\d{4})/)
        if (dateMatch) {
            const [d, m, y] = dateMatch[1].split('/')
            currentDate = `${y}-${m}-${d}`
        }

        // --- 4. SALDO ANTERIOR ---
        if (cleanLine.toUpperCase().includes('SALDO ANTERIOR')) {
            const values = [...cleanLine.matchAll(/(-)?(\d{1,3}(?:\.\d{3})*,\d{2})/g)]
            if (values.length > 0) {
                const lastValue = values[values.length - 1]
                const amount = parseBrNumber(lastValue[2])
                const isNegative = lastValue[1] === '-'

                transactions.push({
                    date: currentDate || new Date().toISOString().split('T')[0],
                    description: 'Saldo Anterior (Importado)',
                    amount: Math.abs(amount),
                    type: isNegative ? 'saida' : 'entrada',
                    isInitialBalance: true,
                    originalLine: cleanLine
                })
            }
            continue
        }

        // --- 5. TRANSACTIONS ---
        if (!currentDate) continue

        const valueMatches = [...cleanLine.matchAll(/(-)?(\d{1,3}(?:\.\d{3})*,\d{2})/g)]

        if (valueMatches.length === 0) {
            if (!/data\s/i.test(cleanLine)) {
                prefixDescription += ' ' + cleanLine
            }
            continue
        }

        let transactionAmount = 0
        let isDebit = false
        let isValidTransaction = false

        if (valueMatches.length >= 2) {
            const transMatch = valueMatches[valueMatches.length - 2] // Penultimate
            transactionAmount = parseBrNumber(transMatch[2])
            isDebit = transMatch[1] === '-'
            isValidTransaction = true
        } else if (valueMatches.length === 1) {
            console.log('Skipped (Single Number):', cleanLine)
            continue
        }

        if (isValidTransaction) {
            let description = cleanLine
            if (dateMatch) description = description.replace(dateMatch[0], '')
            valueMatches.forEach(m => description = description.replace(m[0], ''))
            description = description.replace(/\b\d{4,20}\b/g, '')
            if (prefixDescription) {
                description = prefixDescription + ' ' + description
                prefixDescription = ''
            }
            description = description.trim().replace(/^-/, '').replace(/-$/, '').trim()

            if (description.length > 2) {
                transactions.push({
                    date: currentDate,
                    description: description,
                    amount: Math.abs(transactionAmount),
                    type: isDebit ? 'saida' : 'entrada',
                    originalLine: cleanLine
                })
            }
        }
    }

    return transactions
}

// MOCK DATA based on user screenshot
const mockPDFLines = [
    "Extrato de: Ag: 3646 | CC: 0007467-5 | Entre 01/01/2026 e 31/01/2026",
    "Data Lançamento Dcto. Crédito (R$) Débito (R$) Saldo (R$)",
    "31/12/2025 SALDO ANTERIOR 34.275,68",
    "05/01/2026 RENTAB.INVEST FACILCRED* 2988518 3,63 34.279,31",
    "PAGTO ELETRON COBRANCA",
    "INTERNET VAV 166 -60,00 34.219,31",
    "PAGTO ELETRON COBRANCA",
    "INTERMEDIACAO ESTAGIARIO 167 -210,00 34.009,31",
    "07/01/2026 RENTAB.INVEST FACILCRED* 2988518 0,03 31.067,89",
    "TARIFA BANCARIA",
    "TRANSF PGTO PIX 50126 -1,75 31.066,14",
    "Total 5,71 -4.760,27 29.521,12"
]

const result = parseBradesco(mockPDFLines)
console.log(JSON.stringify(result, null, 2))
