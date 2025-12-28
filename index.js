const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Porta configurada para o Render
const PORT = process.env.PORT || 10000;

// Configuração da conexão com suporte a Pooling e SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    // Adiciona um tempo de espera para evitar que o botão trave
    connectionTimeoutMillis: 10000 
});

app.use(express.json());
app.use(express.static('public'));

// ---------------------------------------------------------
// 1. ROTA PARA LISTAR
// ---------------------------------------------------------
app.get('/manutencoes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM v_proximas_manutencoes');
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar manutenções:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------
// 2. ROTA PARA CONCLUIR MANUTENÇÃO
// ---------------------------------------------------------
app.post('/concluir/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE cronograma_manutencao SET status = $1 WHERE id = $2', ['Concluído', id]);
    await pool.query(
      'INSERT INTO registros_manutencao (cronograma_id, tecnico_responsavel, descricao_servico) VALUES ($1, $2, $3)',
      [id, 'Sistema Web', 'Manutenção confirmada pelo painel']
    );
    console.log(`✅ Manutenção ID ${id} atualizada!`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro ao atualizar banco:", err.message);
    res.status(500).send(err.message);
  }
});

// ---------------------------------------------------------
// 3. ROTA PARA CADASTRAR NOVO EQUIPAMENTO
// ---------------------------------------------------------
app.post('/equipamentos', async (req, res) => {
  const { tag, local, tipo } = req.body;
  try {
    await pool.query(
      'INSERT INTO equipamentos (tag_identificacao, nome_sala, tipo_aparelho) VALUES ($1, $2, $3)',
      [tag, local, tipo]
    );
    console.log(`✅ Novo equipamento cadastrado: ${tag}`);
    res.sendStatus(201); 
  } catch (err) {
    console.error("❌ Erro ao cadastrar equipamento:", err.message);
    res.status(500).send(err.message);
  }
});

// Inicialização única do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta: ${PORT}`);
  console.log(`📡 Conexão com o banco configurada.`);
});