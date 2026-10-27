from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadOut

router = APIRouter()


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(lead: LeadCreate, session: Annotated[Session, Depends(get_session)]) -> LeadOut:
    record = Lead(**lead.model_dump())
    session.add(record)
    session.commit()
    return LeadOut(**lead.model_dump(), id=record.id)
