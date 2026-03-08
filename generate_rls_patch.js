const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'supabase', 'migrations');
const OUTPUT_FILE = path.join(__dirname, 'supabase_fix_all_rls_roles.sql');

const filesToProcess = [
    'setup_stage3_coordination.sql',
    'setup_stage4_communication.sql',
    'setup_stage5_google_drive.sql',
    'supabase_approval_submissions.sql',
    'supabase_coordination_notes_rls_fix.sql',
    'supabase_pedagogia_setup.sql'
];

let finalSql = '-- ==========================================\n-- RLS ROLE FIX SCRIPT\n-- ==========================================\n\n';

const roleReplacements = [
    { old: "'Coord. Geral', 'Presidente', 'Dir. Financeiro'", new: "'Coordenadora ADM', 'Presidência', 'Direção'" },
    { old: "'Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro'", new: "'Estagiário(a) de Comunicação', 'Coordenadora ADM', 'Presidência', 'Direção'" },
    { old: "'Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Coord. Pedagógica', 'Educadora', 'Estágio Pedagógico'", new: "'Coordenadora ADM', 'Presidência', 'Direção', 'Coordenação de Pedagogia', 'Educador', 'Estagiário(a) de Pedagogia'" },
    { old: "'Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Coord. Pedagógica'", new: "'Coordenadora ADM', 'Presidência', 'Direção', 'Coordenação de Pedagogia'" },
    { old: "'Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Estágio ADM'", new: "'Coordenadora ADM', 'Presidência', 'Direção', 'Estagiário(a) de ADM'" },
    { old: "profiles.role = 'Coord. Geral'", new: "profiles.role = 'Coordenadora ADM'" },
    { old: "'admin', 'coordenador', 'Coordenação', 'Administração', 'Coord. Geral', 'Direção', 'Diretor', 'Presidente'", new: "'Coordenadora ADM', 'Presidência', 'Direção'" }
];

filesToProcess.forEach(file => {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');

    // Find CREATE POLICY statements
    // This regex grabs 'CREATE POLICY "name"\n  ON table FOR action\n  USING/WITH CHECK (...);'
    const policyRegex = /create policy\s+"([^"]+)"\s*(?:on\s+([a-zA-Z0-9_\.]+))?.*?\;/gis;

    let match;
    while ((match = policyRegex.exec(content)) !== null) {
        let policyFullText = match[0];
        const policyName = match[1];

        // We need to infer the table name. Some use ON table, others use ON storage.objects
        let tableNameMatch = policyFullText.match(/on\s+([a-zA-Z0-9_\.]+)/i);
        let tableName = tableNameMatch ? tableNameMatch[1] : null;

        // If we can't find the table name, skip (or it might be a weird format)
        if (!tableName) continue;

        let modifiedText = policyFullText;
        let didModify = false;

        roleReplacements.forEach(rep => {
            if (modifiedText.includes(rep.old)) {
                modifiedText = modifiedText.split(rep.old).join(rep.new);
                didModify = true;
            }
        });

        // Handle generic cases if specific ones didn't trigger, just replace individual strings
        if (!didModify) {
            if (modifiedText.includes("'Coord. Geral'") || modifiedText.includes("'Presidente'") || modifiedText.includes("'Estágio ADM'") || modifiedText.includes("'Estágio Pedagógico'")) {
                modifiedText = modifiedText.replace(/'Coord\. Geral'/g, "'Coordenadora ADM'");
                modifiedText = modifiedText.replace(/'Presidente'/g, "'Presidência'");
                modifiedText = modifiedText.replace(/'Dir\. Financeiro'/g, "'Direção'");
                modifiedText = modifiedText.replace(/'Estágio ADM'/g, "'Estagiário(a) de ADM'");
                modifiedText = modifiedText.replace(/'Estágio Pedagógico'/g, "'Estagiário(a) de Pedagogia'");
                modifiedText = modifiedText.replace(/'Coord\. Pedagógica'/g, "'Coordenação de Pedagogia'");
                modifiedText = modifiedText.replace(/'Educadora'/g, "'Educador'");
                modifiedText = modifiedText.replace(/'Comunicação'/g, "'Estagiário(a) de Comunicação'");
                didModify = true;
            }
        }

        if (didModify) {
            finalSql += `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\n`;
            finalSql += modifiedText + '\n\n';
        }
    }
});

fs.writeFileSync(OUTPUT_FILE, finalSql);
console.log('Script gerado em ' + OUTPUT_FILE);
