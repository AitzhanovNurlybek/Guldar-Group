from fastapi import APIRouter, status

from app.core.database import get_session
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadOut

router = APIRouter()


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(lead: LeadCreate) -> LeadOut:
    # Open storage after body validation; malformed requests need no DB connection.
    with get_session() as session:
        record = Lead(**lead.model_dump())
        session.add(record)
        session.commit()
        return LeadOut(**lead.model_dump(), id=record.id)
