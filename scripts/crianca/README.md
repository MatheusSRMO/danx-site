# Criança da história 3D

Personagem usado na história da estação (`components/three/Child.tsx`), arquivo `public/models/crianca.glb`.
É gerado fora do site, no Blender, com a extensão MPFB 2 (MakeHuman para Blender) e recursos do MakeHuman.

## Recursos e licenças

Todos os recursos usados são CC0 (domínio público):

| Item | Recurso | Pacote |
| --- | --- | --- |
| Corpo, alvos de forma e esqueleto `game_engine` | malha base do MakeHuman | MPFB / makehuman_system_assets |
| Pele | `young_caucasian_male` | makehuman_system_assets |
| Olhos, sobrancelhas, cílios | `high-poly`, `eyebrow001`, `eyelashes01` | makehuman_system_assets |
| Cabelo | `short01` | makehuman_system_assets |
| Camisa polo | `namuhekam_male_polo_shirt` | shirts01 |
| Bermuda | `cortu_cargo_pants`, cortada acima do joelho | pants01 |

A extensão MPFB é GPL, mas só roda aqui, como ferramenta; o que ela exporta com recursos CC0 é CC0.
O site não carrega código do MakeHuman.

## Como gerar de novo

1. Blender 4.2 e a extensão MPFB 2.0 (extensions.blender.org): `blender --command extension install-file -r user_default -e mpfb.zip`.
2. Pacotes de recursos (static.makehumancommunity.org): `makehuman_system_assets`, `shirts01`, `pants01`; extrair na pasta
   `data` do usuário da MPFB (`~/.config/blender/4.2/extensions/.user/user_default/mpfb/data`).
3. Gerar e exportar:

   ```sh
   blender -b --python build_child.py -- '{"out": "saida"}'
   blender -b saida/child.blend --python export_render.py -- '{"out": "saida", "render": false}'
   ```

4. Otimizar (texturas WebP, malha quantizada + meshopt; precisa de `@gltf-transform/core`, `@gltf-transform/functions`,
   `@gltf-transform/extensions`, `meshoptimizer` e `sharp`):

   ```sh
   node optimize.mjs saida/child.glb ../../public/models/crianca.glb '{"size":{"hair":512}}'
   ```

## O que os scripts fazem além do padrão do MakeHuman

- A polo e a bermuda não trazem grupo de deleção: usamos os de uma camiseta e de um short CC0 equivalentes, para a pele
  não atravessar a roupa.
- A calça cargo é cortada 6 cm acima do joelho (vira bermuda) e as canelas voltam para a malha do corpo.
- A cintura da bermuda é recolhida 8 mm para dentro da polo, para não aparecer pela barra.
- Morph `olhos` (fecha os dois olhos) no corpo e nos cílios: o teste de equilíbrio é feito de olhos fechados, e a
  criança pisca de vez em quando.
