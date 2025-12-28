const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// A configuração inteligente da porta que você já fez
const PORT = process.env.PORT || 3000;

// Configuração da conexão com o Banco de Dados (Local ou Nuvem)
const pool = new Pool({
    // Se estiver na nuvem, usa a URL do Supabase. Se estiver no PC, usa os dados locais.
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/pmoc_v1',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


// ---------------------------------------------------------
// 1. ROTA PARA LISTAR
// ---------------------------------------------------------
app.get('/manutencoes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM v_proximas_manutencoes');
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar manutenções:", err.message);
    res.status(500).send("Erro no servidor ao buscar dados");
  }
});

// ---------------------------------------------------------
// 2. ROTA PARA CONCLUIR MANUTENÇÃO
// ---------------------------------------------------------
app.post('/concluir/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Atualiza o status
    await pool.query('UPDATE cronograma_manutencao SET status = $1 WHERE id = $2', ['Concluído', id]);
    
    // Cria registro no histórico
    await pool.query(
      'INSERT INTO registros_manutencao (cronograma_id, tecnico_responsavel, descricao_servico) VALUES ($1, $2, $3)',
      [id, 'Sistema Web', 'Manutenção confirmada pelo painel']
    );

    console.log(`✅ Manutenção ID ${id} atualizada com sucesso!`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro ao atualizar banco:", err.message);
    res.status(500).send("Erro ao salvar no banco de dados");
  }
});

// ---------------------------------------------------------
// 3. ROTA PARA CADASTRAR NOVO EQUIPAMENTO
// ---------------------------------------------------------
app.post('/equipamentos', async (req, res) => {
  const { tag, local, tipo } = req.body;
  try {
    // Ao inserir aqui, a TRIGGER do banco criará o cronograma automaticamente
    await pool.query(
      'INSERT INTO equipamentos (tag_identificacao, nome_sala, tipo_aparelho) VALUES ($1, $2, $3)',
      [tag, local, tipo]
    );
    console.log(`✅ Novo equipamento cadastrado: ${tag}`);
    res.sendStatus(201); 
  } catch (err) {
    console.error("❌ Erro ao cadastrar equipamento:", err.message);
    res.status(500).send("Erro ao cadastrar");
  }
});

/// ---------------------------------------------------------
// INICIALIZAÇÃO DO SERVIDOR (CORRIGIDO PARA O RENDER)
// ---------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta: ${PORT}`);
  console.log(`📡 Conexão com o banco configurada.`);
});