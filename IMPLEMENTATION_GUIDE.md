# Guia de Implementação - Node Tech Challenge

Este guia fornece um roteiro passo-a-passo para implementar todos os requisitos do desafio técnico, desde o código inicial até a solução 100% completa.

## 🎯 Objetivo

Implementar uma API REST de reservas de acomodações com:

- Entidades Hotel e Apartment
- Validação de sobreposição de reservas (Hotels permitem, Apartments não)
- API para próxima data disponível
- Documentação Swagger completa
- Testes abrangentes
- Setup Docker funcional

---

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- Docker & Docker Compose
- Git

---

## 🚀 Fase 1: Setup Inicial

### 1.1 Git Repository Setup

```bash
# Criar repository no GitHub/GitLab
git init
git add .
git commit -m "First commit"  # Exatamente como especificado no README
git remote add origin <sua-url-do-repo>
git push -u origin main
```

### 1.2 Verificar Estrutura Base

- Confirmar que Fastify e MikroORM estão configurados
- Testar conexão com banco de dados
- Verificar que migrations básicas funcionam

---

## 🏗️ Fase 2: Problem #1 - Hotel e Apartment Entities

### 2.1 Criar Entidades

**src/entities/hotel.entity.ts**

```typescript
import { Entity, Property, PrimaryKey } from '@mikro-orm/core';

@Entity()
export class Hotel {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'decimal' })
  price!: number;

  @Property()
  location!: string;

  @Property()
  rooms: number;

  @Property({ nullable: true })
  amenities?: string;

  @Property({ nullable: true })
  starRating?: number;

  constructor(
    name: string,
    price: number,
    location: string,
    rooms: number,
    description?: string,
    amenities?: string,
    starRating?: number
  ) {
    this.name = name;
    this.price = price;
    this.location = location;
    this.rooms = rooms;
    this.description = description;
    this.amenities = amenities;
    this.starRating = starRating;
  }
}
```

**src/entities/apartment.entity.ts**

```typescript
import { Entity, Property, PrimaryKey } from '@mikro-orm/core';

@Entity()
export class Apartment {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'decimal' })
  price!: number;

  @Property()
  location!: string;

  @Property()
  bedrooms: number;

  @Property()
  bathrooms: number;

  @Property({ nullable: true })
  furnished?: boolean;

  @Property({ nullable: true })
  balcony?: boolean;

  constructor(
    name: string,
    price: number,
    location: string,
    bedrooms: number,
    bathrooms: number,
    description?: string,
    furnished?: boolean,
    balcony?: boolean
  ) {
    this.name = name;
    this.price = price;
    this.location = location;
    this.bedrooms = bedrooms;
    this.bathrooms = bathrooms;
    this.description = description;
    this.furnished = furnished;
    this.balcony = balcony;
  }
}
```

### 2.2 Criar Schemas de Validação

**src/schemas/hotel.schema.ts**

- Zod schema para validação de input
- JSON Schema para Swagger
- Response schema para documentação

**src/schemas/apartment.schema.ts**

- Mesma estrutura do hotel schema

### 2.3 Implementar Paginação

**src/schemas/pagination.schema.ts**

```typescript
import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

**src/utils/pagination.util.ts**

- Função genérica para paginar qualquer entidade
- Usar findAndCount do MikroORM

### 2.4 Criar Rotas CRUD

**src/routes/hotel.routes.ts**

- GET / (listagem paginada)
- GET /:id (buscar por ID)
- POST / (criar novo)

**src/routes/apartment.routes.ts**

- Mesma estrutura das rotas de hotel

### 2.5 Registrar Rotas no Server

**src/server.ts**

```typescript
server.register(hotelRoutes, { prefix: '/hotels' });
server.register(apartmentRoutes, { prefix: '/apartments' });
```

### 2.6 Gerar e Aplicar Migration

```bash
npm run generate-migration
npm run migration:up
```

### 2.7 Testes para Problem #1

- Testes unitários para entities
- Testes de integração para rotas
- Verificar paginação funciona

---

## 🔒 Fase 3: Problem #2 - Validação de Overlapping

### 3.1 Criar Utility de Validação

**src/utils/booking.util.ts**

```typescript
export async function allowsOverlappingBookings(
  em: EntityManager,
  accommodationId: number
): Promise<boolean> {
  // 1. Verificar se existe na tabela Hotel -> return true
  // 2. Verificar se existe na tabela Apartment -> return false
  // 3. Fallback: verificar nome contém "hotel" -> return baseado no nome
}

export async function validateBookingOverlap(
  em: EntityManager,
  accommodationId: number,
  dateRange: DateRange
): Promise<{ isValid: boolean; message?: string }> {
  // Usar allowsOverlappingBookings + buscar overlaps existentes
}
```

### 3.2 Integrar na Rota de Booking

**src/routes/booking.routes.ts**

```typescript
// No POST /, antes de criar booking:
const validationResult = await validateBookingOverlap(fastify.em, data.accommodationId, dateRange);
if (!validationResult.isValid) {
  return reply.status(400).send({ message: validationResult.message });
}
```

### 3.3 Testes para Problem #2

- Teste: Hotel permite overlapping
- Teste: Apartment NÃO permite overlapping
- Teste: Apartment permite não-overlapping

---

## 📅 Fase 4: Problem #3 - Next Available Date API

### 4.1 Criar Utility de Disponibilidade

**src/utils/availability.util.ts**

```typescript
export async function findNextAvailableDate(
  em: EntityManager,
  accommodationId: number,
  fromDate: Date
): Promise<Date | null> {
  // Para hotéis: return fromDate (sempre disponível)
  // Para apartments: iterar dias até encontrar sem booking
}

export async function getAvailabilityInfo(
  em: EntityManager,
  accommodationId: number,
  fromDate: Date,
  days?: number
) {
  // Retornar objeto completo com próxima data + bookings futuros
}
```

### 4.2 Criar Schema de Availability

**src/schemas/availability.schema.ts**

- Query parameters (date obrigatório, days opcional)
- Response schema para Swagger

### 4.3 Criar Rota de Availability

**src/routes/availability.routes.ts**

```typescript
GET /:id/next-available?date=YYYY-MM-DD&days=30
```

### 4.4 Registrar Rotas

```typescript
server.register(availabilityRoutes, { prefix: '/accommodations' });
```

### 4.5 Testes para Problem #3

- Hotel: sempre retorna data solicitada
- Apartment: retorna próxima data livre
- Casos de erro (accommodation não existe, data inválida)

---

## 📚 Fase 5: Documentação Swagger

### 5.1 Configurar Swagger

**src/server.ts**

```typescript
await server.register(swagger, {
  swagger: {
    info: {
      title: 'Accommodation Booking API',
      description: 'API completa para gerenciamento de acomodações e reservas',
      version: '1.0.0',
    },
    tags: [
      { name: 'Accommodations', description: 'Gerenciamento geral de acomodações' },
      { name: 'Hotels', description: 'Gerenciamento de hotéis' },
      { name: 'Apartments', description: 'Gerenciamento de apartamentos' },
      { name: 'Bookings', description: 'Gerenciamento de reservas' },
      { name: 'Availability', description: 'Consultas de disponibilidade' },
    ],
  },
});
```

### 5.2 Adicionar Schemas Detalhados

- Todos os endpoints devem ter description, tags, summary
- Response schemas com exemplos
- Error schemas padronizados

---

## 🧪 Fase 6: Testes Abrangentes

### 6.1 Estrutura de Testes

```
tests/
├── helpers/
│   ├── database.helper.ts
│   ├── test-server.helper.ts
│   └── test-data.factory.ts
├── unit/
│   └── entities/
├── integration/
│   ├── routes/
│   └── middleware/
└── setup.ts
```

### 6.2 Helpers de Teste

- Setup/cleanup de banco de dados
- Factory para dados de teste
- Server de teste com todas as rotas

### 6.3 Testes Essenciais

- **Unit**: Todas as entities
- **Integration**: Todas as rotas (CRUD + paginação)
- **Business Logic**: Overlap validation
- **API Features**: Next available date
- **Infrastructure**: Rate limiting, error handling

### 6.4 Configurar Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@entities/(.*)$': '<rootDir>/src/entities/$1',
  },
};
```

---

## 🐳 Fase 7: Docker & Produção

### 7.1 Testar Docker Setup

```bash
docker-compose up --build
curl http://localhost:8006/health
curl http://localhost:8006/documentation
```

### 7.2 Middleware de Produção

**src/middleware/error.middleware.ts**

- Error handler global

**src/middleware/logging.middleware.ts**

- Request logging

**src/middleware/rate-limit.middleware.ts**

- Rate limiting por IP

**src/middleware/validation.middleware.ts**

- Validação centralizada com Zod

### 7.3 Configuração de Ambiente

**src/config/env.config.ts**

- Variáveis de ambiente
- Configurações por ambiente (dev/prod)

---

## ✅ Fase 8: Verificação Final

### 8.1 Checklist de Requisitos

- [ ] Problem #1: Hotel/Apartment entities + endpoints
- [ ] Problem #2: Overlap validation (Hotels sim, Apartments não)
- [ ] Problem #3: Next available date API
- [ ] Swagger documentation completa
- [ ] Docker setup funcionando
- [ ] Todos os testes passando
- [ ] Build sem erros

### 8.2 Comandos de Verificação

```bash
npm run build          # Build sem erros
npm test               # Todos os testes passando
npm run lint           # Code style
docker-compose up      # Docker funcionando
```

### 8.3 Endpoints Funcionais

- `GET /accommodations` - Listagem paginada
- `POST /accommodations` - Criar accommodation
- `GET /hotels` - Listagem de hotéis
- `POST /hotels` - Criar hotel
- `GET /apartments` - Listagem de apartamentos
- `POST /apartments` - Criar apartment
- `GET /bookings` - Listagem de reservas
- `POST /bookings` - Criar reserva (com validação overlap)
- `GET /accommodations/:id/next-available` - Próxima data disponível
- `GET /documentation` - Swagger UI

---

## 🎯 Dicas Importantes

### Ordem de Implementação

1. **Sempre commit pequeno e frequente**
2. **Testar cada feature antes de prosseguir**
3. **Fazer migration após mudanças em entities**
4. **Rodar testes após cada mudança significativa**

### Padrões de Código

- Use TypeScript strict mode
- Siga convenções de naming consistentes
- Mantenha schemas Zod separados de entities
- Use utility functions para lógica de negócio

### Debugging

- Use logs estruturados (Pino)
- Teste rotas via curl ou Postman
- Use Swagger UI para explorar API
- Monitore logs do Docker

---

## 📈 Resultado Final

Seguindo este guia, você terá:

- ✅ API REST completa e funcional
- ✅ 61+ testes passando
- ✅ Documentação Swagger interativa
- ✅ Setup Docker pronto para produção
- ✅ Código limpo e bem estruturado
- ✅ Todos os requisitos do README atendidos

**Tempo estimado**: 8-12 horas de desenvolvimento focado

**Boa sorte e bom código!** 🚀
