# 🚀 Your Client Tracker

Sistema desenvolvido em **FastAPI** para gerenciamento e acompanhamento de clientes fitness que pratica musculação.

---

## 📌 Sobre o Projeto

O **Your Client Tracker** é uma API REST construída com FastAPI para auxiliar no controle e gerenciamento de clientes, permitindo criar, listar, atualizar e remover registros de forma simples e eficiente.

O projeto foi desenvolvido utilizando boas práticas de organização, validação de dados e integração com banco de dados relacional.

---

# 🛠️ Tecnologias Utilizadas

- Python 3.11+
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- SQLite / PostgreSQL
- Alembic (opcional para migrations)

---

# 📂 Estrutura do Projeto

```bash
your-client-tracker/
│
├── app/
│   ├── main.py
│   ├── models/
│   ├── schemas/
│   ├── routes/
│   ├── database/
│   └── services/
│
├── requirements.txt
├── README.md
└── .env
```

---

# ⚙️ Instalação

## 1️⃣ Clone o repositório

```bash
git clone https://github.com/warijunior/your-client-tracker.git
```

---

## 2️⃣ Acesse a pasta do projeto

```bash
cd your-client-tracker
```

---

## 3️⃣ Crie o ambiente virtual

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / MacOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 4️⃣ Instale as dependências

```bash
pip install -r requirements.txt
```

---

# ▶️ Executando o Projeto

```bash
uvicorn app.main:app --reload
```

Servidor disponível em:

```bash
http://127.0.0.1:8000
```

---

# 📖 Documentação Automática

O FastAPI gera documentação automaticamente:

## Swagger UI

```bash
http://127.0.0.1:8000/docs
```

## ReDoc

```bash
http://127.0.0.1:8000/redoc
```

---

# 📌 Funcionalidades

- ✅ Cadastro de clientes
- ✅ Listagem de clientes
- ✅ Atualização de dados
- ✅ Remoção de clientes
- ✅ Validação automática com Pydantic
- ✅ Estrutura escalável para APIs

---

# 🧪 Exemplo de Requisição

## Criar cliente

```http
POST /clients
```

### Body

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(81) 99999-9999"
}
```

---

# 🔒 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=sqlite:///./database.db
```

Exemplo PostgreSQL:

```env
DATABASE_URL=postgresql://usuario:senha@localhost/client_tracker
```

---

# 📦 Dependências

Caso queira instalar manualmente:

```bash
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv
```

---

# 🚀 Melhorias Futuras

- Autenticação JWT
- Controle de permissões
- Docker
- Testes automatizados
- Deploy em cloud
- Painel administrativo

---

# 👨‍💻 Autor

Desenvolvido por Maviael sousa santos Junior.

GitHub:
https://github.com/warijunior

---

# 📄 Licença

Este projeto está sob a licença MIT.
