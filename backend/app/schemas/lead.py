from pydantic import BaseModel, Field


class LeadCreate(BaseModel):
    """Заявка с формы на сайте."""

    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=5, max_length=30)
    message: str = Field(default="", max_length=2000)


class LeadOut(LeadCreate):
    id: int
