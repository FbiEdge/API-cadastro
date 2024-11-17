// Carregar as variáveis de ambiente
require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Configurar o cliente Supabase
const supabaseUrl = 'https://lgbbkatdqswozisagwvq.supabase.co'; // URL do seu projeto Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Substitua pela sua chave anônima completa
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json()); // Para analisar JSON no corpo das requisições

// Endpoint de cadastro
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        // Verificar se o usuário já existe
        const { data, error } = await supabase
            .from('users')
            .select('email')
            .eq('email', email);

        if (data && data.length > 0) {
            return res.status(400).json({ error: 'Usuário já cadastrado.' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir o usuário no banco de dados
        const { data: user, error: insertError } = await supabase
            .from('users')
            .insert([{ email, password: hashedPassword }])
            .single();

        if (insertError) {
            return res.status(500).json({ error: insertError.message });
        }

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        // Procurar o usuário no banco de dados
        const { data, error } = await supabase
            .from('users')
            .select('id, email, password')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        // Comparar a senha com a senha armazenada (hash)
        const match = await bcrypt.compare(password, data.password);
        if (!match) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        res.status(200).json({ message: 'Login bem-sucedido!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
