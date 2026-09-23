from fastapi import APIRouter, status

from app.schemas.lead import LeadCreate, LeadOut

router = APIRouter()


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(lead: LeadCreate) -> LeadOut:
    # TODO: сохранить в БД и отправить уведомление (app/services/notify.py)
    return LeadOut(**lead.model_dump(), id=0)
