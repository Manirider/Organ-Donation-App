import asyncio
import json
from pathlib import Path
from datetime import datetime, date
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models import (
    User, Role, Permission, OrganDonor, BloodDonor, Recipient,
    Hospital, BloodBank, BloodInventory, Location, DonorOrgan
)
from app.models.organ_donor import DonorType
from app.models.recipient import RequiredType, RecipientStatus
from app.core.security import get_password_hash


DATA_DIR = Path(__file__).parent


async def load_roles_and_permissions(db: AsyncSession):
    print("Loading roles and permissions...")

    permissions = [
        ("manage_all", "Full system management access"),
        ("verify_entities", "Verify hospitals, donors, recipients"),
        ("view_audit", "View audit logs"),
        ("manage_users", "Manage user accounts"),
        ("create_emergency", "Create emergency requests"),
        ("manage_matches", "Manage donor-recipient matches"),
        ("manage_inventory", "Manage blood bank inventory"),
        ("manage_own_profile", "Manage own profile"),
        ("update_consent", "Update donation consent"),
        ("view_waitlist", "View transplant waitlist"),
    ]

    for name, description in permissions:
        existing = await db.execute(select(Permission).where(Permission.name == name))
        if not existing.scalar_one_or_none():
            db.add(Permission(name=name, description=description))

    await db.flush()

    roles_config = {
        "admin": ["manage_all", "verify_entities", "view_audit", "manage_users", "create_emergency", "manage_matches"],
        "government_authority": ["verify_entities", "view_audit"],
        "hospital": ["verify_entities", "create_emergency", "manage_matches"],
        "blood_bank": ["manage_inventory"],
        "organ_donor": ["manage_own_profile", "update_consent"],
        "blood_donor": ["manage_own_profile", "update_consent"],
        "recipient": ["manage_own_profile", "view_waitlist"],
    }

    for role_name, perm_names in roles_config.items():
        existing = await db.execute(select(Role).where(Role.name == role_name))
        role = existing.scalar_one_or_none()

        if not role:
            role = Role(
                name=role_name, description=f"{role_name.replace('_', ' ').title()} role")
            db.add(role)
            await db.flush()

        for perm_name in perm_names:
            perm_result = await db.execute(select(Permission).where(Permission.name == perm_name))
            perm = perm_result.scalar_one_or_none()
            if perm and perm not in role.permissions:
                role.permissions.append(perm)

    await db.commit()
    print(
        f"✓ Loaded {len(roles_config)} roles and {len(permissions)} permissions")


async def load_sample_users(db: AsyncSession):
    print("Loading sample users...")

    with open(DATA_DIR / "sample_users.json") as f:
        users_data = json.load(f)

    count = 0
    for user_data in users_data:
        existing = await db.execute(select(User).where(User.email == user_data["email"]))
        if existing.scalar_one_or_none():
            continue

        user = User(
            id=uuid4(),
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            phone=user_data.get("phone"),
            is_active=True,
            is_verified=True
        )

        if user_data.get("date_of_birth"):
            user.date_of_birth = date.fromisoformat(user_data["date_of_birth"])
        if user_data.get("gender"):
            user.gender = user_data["gender"]

        role_result = await db.execute(select(Role).where(Role.name == user_data["role"]))
        role = role_result.scalar_one_or_none()
        if role:
            user.roles.append(role)

        db.add(user)
        await db.flush()

        if "organ_donor" in user_data:
            od = user_data["organ_donor"]
            donor = OrganDonor(
                id=uuid4(),
                user_id=user.id,
                blood_group=od["blood_group"],
                rh_factor=od["rh_factor"],
                donor_type=DonorType(od.get("donor_type", "living")),
                is_eligible=True,
                consent_given=True,
                consent_timestamp=datetime.utcnow()
            )
            db.add(donor)
            await db.flush()

            for organ_name in od.get("organs", []):
                organ = DonorOrgan(
                    donor_id=donor.id,
                    organ_name=organ_name,
                    hla_type=od.get("hla_type")
                )
                db.add(organ)

            if od.get("latitude") and od.get("longitude"):
                loc = Location(
                    entity_id=donor.id,
                    entity_type="organ_donor",
                    latitude=od["latitude"],
                    longitude=od["longitude"],
                    city=od.get("city", "Unknown"),
                    state=od.get("state", "Unknown")
                )
                db.add(loc)

        if "blood_donor" in user_data:
            bd = user_data["blood_donor"]
            donor = BloodDonor(
                id=uuid4(),
                user_id=user.id,
                blood_group=bd["blood_group"],
                rh_factor=bd["rh_factor"],
                weight_kg=bd.get("weight_kg"),
                hemoglobin_level=bd.get("hemoglobin_level"),
                is_available=True,
                is_eligible=True
            )
            db.add(donor)
            await db.flush()

            if bd.get("latitude") and bd.get("longitude"):
                loc = Location(
                    entity_id=donor.id,
                    entity_type="blood_donor",
                    latitude=bd["latitude"],
                    longitude=bd["longitude"],
                    city=bd.get("city", "Unknown"),
                    state=bd.get("state", "Unknown")
                )
                db.add(loc)

        if "recipient" in user_data:
            r = user_data["recipient"]
            recipient = Recipient(
                id=uuid4(),
                user_id=user.id,
                required_type=RequiredType(r["required_type"]),
                blood_group=r["blood_group"],
                rh_factor=r["rh_factor"],
                organ_needed=r.get("organ_needed"),
                units_needed=r.get("units_needed", 1),
                urgency_score=r["urgency_score"],
                medical_condition=r.get("medical_condition"),
                hla_type=r.get("hla_type"),
                status=RecipientStatus.ACTIVE
            )
            db.add(recipient)
            await db.flush()

            if r.get("latitude") and r.get("longitude"):
                loc = Location(
                    entity_id=recipient.id,
                    entity_type="recipient",
                    latitude=r["latitude"],
                    longitude=r["longitude"],
                    city=r.get("city", "Unknown"),
                    state=r.get("state", "Unknown")
                )
                db.add(loc)

        count += 1

    await db.commit()
    print(f"✓ Loaded {count} users")


async def load_hospitals(db: AsyncSession):
    print("Loading hospitals...")

    with open(DATA_DIR / "sample_hospitals.json") as f:
        hospitals_data = json.load(f)

    count = 0
    for hosp_data in hospitals_data:
        existing = await db.execute(select(Hospital).where(Hospital.license_number == hosp_data["license_number"]))
        if existing.scalar_one_or_none():
            continue

        hospital = Hospital(
            id=uuid4(),
            name=hosp_data["name"],
            license_number=hosp_data["license_number"],
            address=hosp_data["address"],
            city=hosp_data["city"],
            state=hosp_data["state"],
            country=hosp_data.get("country", "India"),
            postal_code=hosp_data.get("postal_code"),
            phone=hosp_data["phone"],
            email=hosp_data["email"],
            emergency_phone=hosp_data.get("emergency_phone"),
            is_transplant_center=hosp_data.get("is_transplant_center", False),
            transplant_capabilities=hosp_data.get("transplant_capabilities"),
            bed_capacity=hosp_data.get("bed_capacity"),
            icu_beds=hosp_data.get("icu_beds"),
            readiness_score=hosp_data.get("readiness_score", 0.8),
            is_verified=True
        )
        db.add(hospital)
        await db.flush()

        if hosp_data.get("latitude") and hosp_data.get("longitude"):
            loc = Location(
                entity_id=hospital.id,
                entity_type="hospital",
                latitude=hosp_data["latitude"],
                longitude=hosp_data["longitude"],
                address=hosp_data["address"],
                city=hosp_data["city"],
                state=hosp_data["state"]
            )
            db.add(loc)

        count += 1

    await db.commit()
    print(f"✓ Loaded {count} hospitals")


async def load_blood_banks(db: AsyncSession):
    print("Loading blood banks...")

    with open(DATA_DIR / "sample_blood_banks.json") as f:
        banks_data = json.load(f)

    count = 0
    for bank_data in banks_data:
        existing = await db.execute(select(BloodBank).where(BloodBank.license_number == bank_data["license_number"]))
        if existing.scalar_one_or_none():
            continue

        blood_bank = BloodBank(
            id=uuid4(),
            name=bank_data["name"],
            license_number=bank_data["license_number"],
            address=bank_data["address"],
            city=bank_data["city"],
            state=bank_data["state"],
            country=bank_data.get("country", "India"),
            postal_code=bank_data.get("postal_code"),
            phone=bank_data["phone"],
            email=bank_data["email"],
            is_verified=True,
            is_active=True
        )
        db.add(blood_bank)
        await db.flush()

        if bank_data.get("latitude") and bank_data.get("longitude"):
            loc = Location(
                entity_id=blood_bank.id,
                entity_type="blood_bank",
                latitude=bank_data["latitude"],
                longitude=bank_data["longitude"],
                address=bank_data["address"],
                city=bank_data["city"],
                state=bank_data["state"]
            )
            db.add(loc)

        for inv in bank_data.get("inventory", []):
            inventory = BloodInventory(
                blood_bank_id=blood_bank.id,
                blood_group=inv["blood_group"],
                rh_factor=inv["rh_factor"],
                component_type="whole_blood",
                units_available=inv["units"],
                collection_date=date.today()
            )
            db.add(inventory)

        count += 1

    await db.commit()
    print(f"✓ Loaded {count} blood banks")


async def seed_database():
    print("\n" + "="*50)
    print("SEEDING DATABASE")
    print("="*50 + "\n")

    async with AsyncSessionLocal() as db:
        await load_roles_and_permissions(db)
        await load_sample_users(db)
        await load_hospitals(db)
        await load_blood_banks(db)

    print("\n" + "="*50)
    print("DATABASE SEEDING COMPLETE")
    print("="*50 + "\n")


if __name__ == "__main__":
    asyncio.run(seed_database())
