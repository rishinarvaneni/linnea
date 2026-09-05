# Linnéa

### AI-Native Agentic Commerce & Revenue Growth Platform

> **Different AI interfaces. One commerce engine. Real revenue.**

Linnéa is an AI-native commerce platform that connects customers, merchants, and external AI agents through a unified and secure commerce infrastructure.

It combines conversational shopping, autonomous revenue agents, protocol-based AI commerce, payment orchestration, revenue recovery, and campaign automation into a single platform.

---

## 🚀 What is Linnéa?

Traditional e-commerce separates the customer experience, merchant analytics, marketing, and payment infrastructure.

Linnéa brings these capabilities together through an **AI-driven Commerce Engine**.

Customers can interact with an AI shopping agent using natural language:

> "Find me wireless headphones under ₹5,000."

Merchants can use specialized AI agents to:

- Analyze revenue
- Recover failed payments
- Identify abandoned carts
- Generate campaigns
- Discover upselling and cross-selling opportunities

External AI agents can also interact with the commerce system through protocol-based interfaces such as **MCP**.

The core principle is:

> **AI handles reasoning. The Commerce Engine handles deterministic commerce operations.**

---

# 🏗️ Architecture

![Linnéa Architecture](docs/architecture.png)

### High-Level Architecture

```mermaid
flowchart TB

    C[Customer<br/>Chat / Voice]
    B[AI Buyer Agent<br/>Google Gemini + LangChain]

    M[Merchant]
    AS[Agent Studio]

    RG[Revenue Growth Agent]
    RR[Revenue Recovery Agent]
    CO[Campaign Orchestrator]

    E[External AI Agents<br/>Claude / ChatGPT / Other Agents]
    P[Protocol Abstraction Layer]
    MCP[MCP]
    FUTURE[Future Protocols]

    INT[Commerce Intent]

    SEC[Policy & Security Layer]

    CE[Commerce Engine]

    PS[Product Service]
    CS[Cart Service]
    OS[Order Service]
    IS[Inventory Control]
    PAY[Payment Orchestration]
    RS[Recovery Service]
    CAS[Campaign Service]

    DB[(Prisma + SQLite)]

    R[Razorpay]
    WH[Razorpay Webhooks]

    C --> B
    B --> CE

    M --> AS
    AS --> RG
    AS --> RR
    AS --> CO

    RG --> CE
    RR --> CE
    CO --> CE

    E --> P
    P --> MCP
    P --> FUTURE
    MCP --> INT
    FUTURE --> INT
    INT --> CE

    SEC <--> CE

    CE --> PS
    CE --> CS
    CE --> OS
    CE --> IS
    CE --> PAY
    CE --> RS
    CE --> CAS

    CE <--> DB

    PAY --> R
    R --> WH
    WH --> CE
