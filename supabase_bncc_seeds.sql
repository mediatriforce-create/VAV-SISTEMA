-- =========================================================================
-- VAV CENTRAL - MÓDULO PEDAGOGIA
-- Carga inicial de Habilidades BNCC (Ensino Fundamental I: 1º ao 5º Ano)
-- =========================================================================

-- LÍNGUA PORTUGUESA
INSERT INTO public.bncc_skills (code, description, year_group) VALUES
('EF15LP01', 'Identificar a função social de textos que circulam em campos da vida social', '1º ao 5º Ano'),
('EF15LP02', 'Estabelecer expectativas em relação ao texto que vai ler', '1º ao 5º Ano'),
('EF15LP03', 'Localizar informações explícitas em textos', '1º ao 5º Ano'),
('EF15LP04', 'Identificar o efeito de sentido produzido pelo uso de recursos expressivos gráfico-visuais', '1º ao 5º Ano'),
('EF15LP05', 'Planejar, com a ajuda do professor, o texto que será produzido', '1º ao 5º Ano'),
('EF15LP06', 'Reler e revisar o texto produzido com a ajuda do professor e a colaboração dos colegas', '1º ao 5º Ano'),
('EF15LP07', 'Editar a versão final do texto, em colaboração com os colegas e com a ajuda do professor', '1º ao 5º Ano'),
('EF15LP09', 'Expressar-se em situações de intercâmbio oral com clareza, preocupando-se em ser compreendido pelo interlocutor', '1º ao 5º Ano'),
('EF15LP10', 'Escutar, com atenção, falas de professores e colegas', '1º ao 5º Ano'),
('EF15LP11', 'Reconhecer características da conversação espontânea presencial', '1º ao 5º Ano'),
('EF15LP12', 'Atribuir significado a aspectos não linguísticos (gestos, tom de voz) observados na fala', '1º ao 5º Ano'),
('EF15LP13', 'Identificar finalidades da interação oral em diferentes contextos comunicativos', '1º ao 5º Ano'),
('EF12LP01', 'Ler palavras novas com precisão na decodificação', '1º e 2º Ano'),
('EF12LP04', 'Ler e compreender, em colaboração com os colegas e com a ajuda do professor, listas e legendas', '1º e 2º Ano'),
('EF35LP01', 'Ler e compreender, silenciosamente e, em seguida, em voz alta, com autonomia e fluência, textos curtos', '3º ao 5º Ano'),
('EF35LP03', 'Identificar a ideia central do texto, demonstrando compreensão global', '3º ao 5º Ano'),
('EF35LP04', 'Inferir informações implícitas nos textos lidos', '3º ao 5º Ano'),
('EF35LP05', 'Inferir o sentido de palavras ou expressões desconhecidas em textos', '3º ao 5º Ano')
ON CONFLICT (code) DO NOTHING;

-- MATEMÁTICA
INSERT INTO public.bncc_skills (code, description, year_group) VALUES
('EF01MA01', 'Utilizar números naturais como indicador de quantidade ou de ordem', '1º Ano'),
('EF01MA02', 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias', '1º Ano'),
('EF01MA03', 'Estimar e comparar quantidades de objetos de dois conjuntos', '1º Ano'),
('EF01MA05', 'Comparar números naturais de até duas ordens em situações cotidianas', '1º Ano'),
('EF02MA01', 'Comparar e ordenar números naturais (até a ordem de centenas)', '2º Ano'),
('EF02MA05', 'Construir fatos básicos da adição e utilizá-los em procedimentos de cálculo', '2º Ano'),
('EF02MA06', 'Resolver e elaborar problemas de adição e de subtração', '2º Ano'),
('EF03MA01', 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar', '3º Ano'),
('EF03MA05', 'Utilizar diferentes procedimentos de cálculo mental e escrito', '3º Ano'),
('EF03MA06', 'Resolver e elaborar problemas de adição e subtração com os significados de juntar e acrescentar', '3º Ano'),
('EF03MA07', 'Resolver e elaborar problemas de multiplicação', '3º Ano'),
('EF04MA01', 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar', '4º Ano'),
('EF04MA03', 'Resolver e elaborar problemas com números naturais envolvendo adição e subtração', '4º Ano'),
('EF04MA04', 'Utilizar as relações entre adição e subtração, bem como entre multiplicação e divisão', '4º Ano'),
('EF04MA05', 'Utilizar as propriedades das operações para desenvolver estratégias de cálculo', '4º Ano'),
('EF05MA01', 'Ler, escrever e ordenar números naturais até a ordem das centenas de milhar', '5º Ano'),
('EF05MA02', 'Ler, escrever e ordenar números racionais na forma decimal', '5º Ano'),
('EF05MA07', 'Resolver e elaborar problemas de adição e subtração com números naturais e com números racionais', '5º Ano'),
('EF05MA08', 'Resolver e elaborar problemas de multiplicação e divisão com números naturais', '5º Ano')
ON CONFLICT (code) DO NOTHING;

-- CIÊNCIAS
INSERT INTO public.bncc_skills (code, description, year_group) VALUES
('EF01CI01', 'Comparar características de diferentes materiais presentes em objetos de uso cotidiano', '1º Ano'),
('EF01CI02', 'Localizar, nomear e representar graficamente partes do corpo humano', '1º Ano'),
('EF02CI01', 'Identificar de que materiais (metais, madeira, vidro etc.) são feitos os objetos', '2º Ano'),
('EF02CI02', 'Propor o uso de diferentes materiais para a construção de objetos de uso cotidiano', '2º Ano'),
('EF03CI01', 'Produzir diferentes sons a partir da vibração de variados objetos', '3º Ano'),
('EF03CI04', 'Identificar características sobre o modo de vida dos animais', '3º Ano'),
('EF04CI01', 'Identificar misturas na vida diária', '4º Ano'),
('EF04CI02', 'Testar e relatar transformações nos materiais do dia a dia', '4º Ano'),
('EF05CI01', 'Explorar fenômenos da vida cotidiana que evidenciem propriedades físicas dos materiais', '5º Ano'),
('EF05CI06', 'Selecionar argumentos que justifiquem por que os sistemas digestório e respiratório são considerados corresponsáveis pelo processo de nutrição do organismo', '5º Ano')
ON CONFLICT (code) DO NOTHING;

-- GEOGRAFIA
INSERT INTO public.bncc_skills (code, description, year_group) VALUES
('EF01GE01', 'Descrever características observadas de seus lugares de vivência', '1º Ano'),
('EF02GE01', 'Descrever a história das migrações no bairro ou comunidade em que vive', '2º Ano'),
('EF03GE01', 'Identificar e comparar aspectos culturais dos grupos sociais de seus lugares de vivência', '3º Ano'),
('EF04GE01', 'Selecionar e elaborar em trabalhos de pesquisa que envolvam temas relevantes de natureza social', '4º Ano'),
('EF05GE01', 'Descrever e analisar dinâmicas populacionais na Unidade da Federação em que vive', '5º Ano')
ON CONFLICT (code) DO NOTHING;

-- HISTÓRIA
INSERT INTO public.bncc_skills (code, description, year_group) VALUES
('EF01HI01', 'Identificar aspectos do seu crescimento por meio do registro das lembranças particulares', '1º Ano'),
('EF02HI01', 'Reconhecer espaços de sociabilidade e identificar os motivos que aproximam e separam as pessoas', '2º Ano'),
('EF03HI01', 'Identificar os grupos populacionais que formam a cidade, o município e a região', '3º Ano'),
('EF04HI01', 'Reconhecer a história como resultado da ação do ser humano no tempo e no espaço', '4º Ano'),
('EF05HI01', 'Identificar os processos de formação das culturas e dos povos, relacionando-os com o espaço geográfico ocupado', '5º Ano')
ON CONFLICT (code) DO NOTHING;
