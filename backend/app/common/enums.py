
from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "admin"
    USER = "user"


class Environment(str, Enum):
    PRODUCTION = "prod"
    STAGING = "stg"
    DEVELOPMENT = "dev"
