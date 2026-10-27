import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LeadCreate(BaseModel):
    """Заявка с формы на сайте."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=10, max_length=30)
    message: str = Field(default="", max_length=2000)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not re.fullmatch(r"\+?[0-9() -]+", value) or not 10 <= len(re.sub(r"\D", "", value)) <= 15:
            raise ValueError("Укажите телефон: от 10 до 15 цифр")
        return value


class LeadOut(LeadCreate):
    id: int
