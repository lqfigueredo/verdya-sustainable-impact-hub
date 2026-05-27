## Problema

O header renderiza 4 itens de menu via `t('nav.<key>')`: `library`, `events`, `community`, `newsletter`. A chave `nav.events` não existe em `src/locales/en.json` nem em `src/locales/pt.json`, então o menu mostra o texto cru `nav.events`.

## Correção

Adicionar a chave `events` no bloco `nav` dos dois arquivos de tradução:

- `src/locales/en.json` → `"events": "Events"`
- `src/locales/pt.json` → `"events": "Eventos"`

Sem outras alterações — os demais rótulos (`library`, `community`, `newsletter`, `profile`, `dashboard`, `admin`, `logout`) já estão definidos e corretos nos dois idiomas.
