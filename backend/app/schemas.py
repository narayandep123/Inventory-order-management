from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, condecimal, conint


PHONE_PATTERN = r"^(?:\+91[\s-]?)?[6-9]\d{9}$"


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=64)
    price: condecimal(gt=0, max_digits=10, decimal_places=2)
    quantity_in_stock: conint(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=64)
    price: Optional[condecimal(gt=0, max_digits=10, decimal_places=2)] = None
    quantity_in_stock: Optional[conint(ge=0)] = None


class ProductOut(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class CustomerBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr


class CustomerCreate(CustomerBase):
    phone_number: str = Field(min_length=10, max_length=16, pattern=PHONE_PATTERN)


class CustomerOut(CustomerBase):
    id: int
    phone_number: str = Field(min_length=1, max_length=30)

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: conint(gt=0)


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductOut

    model_config = ConfigDict(from_attributes=True)


class OrderOut(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    customer: CustomerOut
    items: list[OrderItemOut]

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[ProductOut]
