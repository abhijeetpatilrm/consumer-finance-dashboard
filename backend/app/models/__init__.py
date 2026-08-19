"""Models package — import all models here so Alembic can detect them."""

from app.models.redemption import Redemption
from app.models.reward import Reward
from app.models.reward_catalogue import RewardCatalogue
from app.models.transaction import Transaction
from app.models.user import User
from app.models.user_coin_balance import UserCoinBalance

__all__ = ["User", "Transaction", "Reward", "Redemption", "RewardCatalogue", "UserCoinBalance"]
