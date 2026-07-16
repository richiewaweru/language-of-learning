def apply_tax(amount):
    rate = 0.16
    if amount <= 0:
        return 0
    return amount * rate
