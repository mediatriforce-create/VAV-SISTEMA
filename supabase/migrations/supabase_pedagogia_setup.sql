-- =========================================================================
-- MÓDULO PEDAGOGIA — Setup Completo (Fase 1)
-- Executar no SQL Editor do Supabase
-- =========================================================================

-- 1. Turmas
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                       -- Ex: "1º Ano A"
    year_group TEXT NOT NULL,                 -- Ex: "1º Ano", "2º Ano", etc.
    school_year INTEGER NOT NULL DEFAULT 2026,
    shift TEXT NOT NULL DEFAULT 'Manhã',      -- Manhã, Tarde, Integral
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Alunos
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    birth_date DATE,
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    photo_url TEXT,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Matrícula (aluno ↔ turma por ano letivo)
CREATE TABLE IF NOT EXISTS class_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active', -- active, transferred, inactive
    UNIQUE(class_id, student_id)
);

-- 4. Componentes curriculares
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,  -- Ex: "Português", "Matemática", "Ciências"
    description TEXT
);

-- Seed de componentes básicos
INSERT INTO subjects (name, description) VALUES
    ('Português', 'Língua Portuguesa e Alfabetização'),
    ('Matemática', 'Raciocínio lógico e numérico'),
    ('Ciências', 'Ciências da Natureza'),
    ('História', 'Ciências Humanas - História'),
    ('Geografia', 'Ciências Humanas - Geografia'),
    ('Artes', 'Expressão artística e cultural'),
    ('Educação Física', 'Atividade física e corporal'),
    ('Ensino Religioso', 'Formação de valores e espiritualidade')
ON CONFLICT (name) DO NOTHING;

-- 5. Turma ↔ Componente
CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE(class_id, subject_id)
);

-- 6. Sessão de aula (diário do dia)
CREATE TABLE IF NOT EXISTS lesson_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content_summary TEXT,                  -- Conteúdo ministrado
    bncc_skills TEXT,                      -- Habilidades BNCC (texto livre na Fase 1)
    observations TEXT,                     -- Observações pedagógicas
    attachments JSONB DEFAULT '[]',        -- [{drive_file_id, file_name, mime_type, web_view_link}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(class_id, date, subject_id)     -- Uma sessão por turma/dia/componente
);

-- 7. Frequência por aluno por sessão
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES lesson_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'present', -- present, absent, late
    note TEXT,
    UNIQUE(session_id, student_id)
);

-- =========================================================================
-- Índices de performance
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class ON class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_student ON class_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_class_date ON lesson_sessions(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);

-- =========================================================================
-- RLS (Row Level Security)
-- =========================================================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Função helper: Verifica se o user tem acesso pedagógico (professor da turma ou coordenação)
CREATE OR REPLACE FUNCTION is_pedagogia_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Coord. Pedagógica', 'Educadora', 'Estágio Pedagógico')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função helper: Verifica se user é coordenação (vê tudo)
CREATE OR REPLACE FUNCTION is_coordination()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Coord. Pedagógica')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CLASSES: Coordenação vê tudo, professora só suas turmas
CREATE POLICY "classes_select" ON classes FOR SELECT USING (
    is_coordination() OR teacher_id = auth.uid()
);
CREATE POLICY "classes_insert" ON classes FOR INSERT WITH CHECK (
    is_coordination() OR teacher_id = auth.uid()
);
CREATE POLICY "classes_update" ON classes FOR UPDATE USING (
    is_coordination() OR teacher_id = auth.uid()
);
CREATE POLICY "classes_delete" ON classes FOR DELETE USING (is_coordination());

-- STUDENTS: Qualquer um com acesso pedagógico pode ver/criar alunos
CREATE POLICY "students_select" ON students FOR SELECT USING (is_pedagogia_user());
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (is_pedagogia_user());
CREATE POLICY "students_update" ON students FOR UPDATE USING (is_pedagogia_user());

-- CLASS_MEMBERSHIPS: Segue permissão da turma
CREATE POLICY "memberships_select" ON class_memberships FOR SELECT USING (is_pedagogia_user());
CREATE POLICY "memberships_insert" ON class_memberships FOR INSERT WITH CHECK (is_coordination());
CREATE POLICY "memberships_update" ON class_memberships FOR UPDATE USING (is_coordination());
CREATE POLICY "memberships_delete" ON class_memberships FOR DELETE USING (is_coordination());

-- SUBJECTS: Todos com acesso pedagógico leem
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (is_pedagogia_user());
CREATE POLICY "subjects_manage" ON subjects FOR ALL USING (is_coordination());

-- CLASS_SUBJECTS
CREATE POLICY "class_subjects_select" ON class_subjects FOR SELECT USING (is_pedagogia_user());
CREATE POLICY "class_subjects_manage" ON class_subjects FOR ALL USING (is_coordination());

-- LESSON_SESSIONS: Professor da turma ou coordenação
CREATE POLICY "sessions_select" ON lesson_sessions FOR SELECT USING (
    is_coordination() OR teacher_id = auth.uid()
);
CREATE POLICY "sessions_insert" ON lesson_sessions FOR INSERT WITH CHECK (
    is_coordination() OR teacher_id = auth.uid()
);
CREATE POLICY "sessions_update" ON lesson_sessions FOR UPDATE USING (
    is_coordination() OR teacher_id = auth.uid()
);

-- ATTENDANCE_RECORDS: Segue a sessão
CREATE POLICY "attendance_select" ON attendance_records FOR SELECT USING (is_pedagogia_user());
CREATE POLICY "attendance_insert" ON attendance_records FOR INSERT WITH CHECK (is_pedagogia_user());
CREATE POLICY "attendance_update" ON attendance_records FOR UPDATE USING (is_pedagogia_user());
