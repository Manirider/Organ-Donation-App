# AI-Powered Organ & Blood Donation Management Platform

A production-ready, ethical, and legally compliant healthcare platform for organ and blood donation management, featuring AI/ML-powered donor-recipient matching with explainable decisions.

## Features

### Core Functionality
- **Multi-Role System**: Organ donors, blood donors, recipients, hospitals, blood banks, and admin authorities
- **JWT Authentication**: Access tokens, refresh tokens, and OTP-based verification
- **Role-Based Access Control**: Fine-grained permissions for each user role
- **Audit Logging**: Complete audit trail for all critical actions

### AI/ML Capabilities
- **Intelligent Matching Engine**: Weighted scoring algorithm for donor-recipient matching
- **Explainable AI**: Transparent decision-making with factor breakdowns
- **Eligibility Classifier**: Donor screening based on health criteria
- **Success Predictor**: Transplant outcome probability estimation
- **Priority Scorer**: Fair recipient ranking based on medical urgency
- **Anomaly Detector**: Fraud and suspicious behavior detection

### Location Intelligence
- **Geo-Coordinate Storage**: Latitude/longitude for all entities
- **Haversine Distance**: Accurate distance calculations
- **Radius-Based Search**: Find nearby donors for emergencies
- **Travel Time Estimation**: Organ viability-aware logistics

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11 + FastAPI |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| ORM | SQLAlchemy 2.0 (async) |
| Auth | JWT + bcrypt + OTP |
| AI/ML | scikit-learn compatible algorithms |
| Deployment | Docker + Docker Compose |

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- Git

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd organ-donation-application

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up --build

# Access the API
# API Docs: http://localhost:8000/api/v1/docs
# Health Check: http://localhost:8000/health
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-ml.txt

# Set up database (requires PostgreSQL running)
# Update DATABASE_URL in .env

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/otp/request` | Request OTP |
| POST | `/api/v1/auth/otp/verify` | Verify OTP |
| GET | `/api/v1/auth/me` | Get current user |

### Organ Donors
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/organ-donors` | Register as organ donor |
| GET | `/api/v1/organ-donors/{id}` | Get donor details |
| PUT | `/api/v1/organ-donors/{id}` | Update donor profile |
| POST | `/api/v1/organ-donors/{id}/consent` | Give consent |
| DELETE | `/api/v1/organ-donors/{id}/consent` | Revoke consent |

### Blood Donors
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/blood-donors` | Register as blood donor |
| GET | `/api/v1/blood-donors/{id}` | Get donor details |
| PATCH | `/api/v1/blood-donors/{id}/availability` | Update availability |
| POST | `/api/v1/blood-donors/search` | Search nearby donors |

### AI Matching
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/matching/organ` | Find organ matches |
| POST | `/api/v1/matching/{id}/accept` | Accept a match |
| GET | `/api/v1/matching/{id}/explain` | Get AI explanation |

## Project Structure

```
organ-donation-application/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── api/v1/              # API endpoints
│   ├── core/                # Auth, RBAC, security
│   ├── db/                  # Database session
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── ml/                  # AI/ML engines
│   └── utils/               # Geo, compatibility
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── README.md
```

## AI Matching Algorithm

The matching engine uses a weighted scoring system:

| Factor | Weight | Description |
|--------|--------|-------------|
| Blood Compatibility | 25% | ABO/Rh matching |
| HLA Compatibility | 20% | Tissue typing match |
| Urgency Factor | 20% | Medical urgency (1-10) |
| Geographic Score | 15% | Distance-based ranking |
| Viability Score | 10% | Organ preservation time |
| Hospital Readiness | 10% | Transplant center capacity |

### Explainability

Every match includes:
- Factor-by-factor score breakdown
- Natural language explanations
- Bias and fairness checks
- Confidence scoring

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `JWT_SECRET_KEY` | JWT signing key | Required |
| `ENCRYPTION_KEY` | Medical data encryption | Required |

See `.env.example` for all configuration options.

## Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Short-lived access, long-lived refresh
- **Medical Data Encryption**: Fernet symmetric encryption
- **Rate Limiting**: Per-endpoint and per-IP limits
- **Audit Trail**: All actions logged with timestamps
- **RBAC**: Role-based permission system

## Compliance

- ✅ Explicit consent handling with timestamps
- ✅ Consent revocation support
- ✅ No financial transactions
- ✅ Data anonymization capabilities
- ✅ Government-grade audit logging
- ✅ Ethical, transparent AI decisions

## Testing

```bash
# Run tests
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=app --cov-report=html
```

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Built for academic excellence and real-world impact** 🏥
