# MagicDreams Alpha

Versão enxuta e independente do MagicDreams. É uma aplicação estática: não usa Base44, servidor próprio, dependências npm, conta de usuário ou serviços externos.

## Executar

Na raiz do repositório, com Python instalado:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory alpha
```

Abra <http://127.0.0.1:8080>. Também é possível hospedar os quatro arquivos desta pasta em qualquer servidor estático.

## Recursos

- Navegação entre Ouvir, Compor, Piano, Biblioteca, Partituras, Galeria e Natal.
- Seis coleções públicas e as seis faixas de Canções de Ninar que estavam visíveis na consulta.
- Demonstração de áudio sintetizado localmente, controle de volume e timer.
- Piano por mouse, toque ou teclado; composição guardada no armazenamento local do navegador.
- Interface responsiva, controles rotulados e respeito à preferência de movimento reduzido.

## Limites dos dados

Os títulos e quantidades das coleções refletem a interface pública de <https://magicdreams.base44.app/>. A lista completa, gravações, imagens, partituras originais e conteúdo administrativo não estavam disponíveis publicamente durante a consulta; por isso não estão incluídos. Nenhuma API privada é acessada e nenhuma mídia original é copiada. A demonstração de áudio é sintetizada e não representa as gravações listadas.

Para completar o conteúdo, importe uma exportação autorizada do projeto original. Composições ficam somente no navegador e não são enviadas a terceiros.
