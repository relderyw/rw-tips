# Script para corrigir a visualização de mercados para usuários normais
with open('formularioApostas.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fazer as substituições
content = content.replace(
    '        mercadosLista.innerHTML = mercadosUsuario.length === 0',
    '        mercadosLista.innerHTML = mercados.length === 0'
).replace(
    '          : mercadosUsuario.map(mercado => `',
    '          : mercados.map(mercado => `'
)

# Salvar o arquivo modificado
with open('formularioApostas.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Arquivo corrigido com sucesso!")
print("Agora todos os usuários podem ver todos os mercados salvos.")
