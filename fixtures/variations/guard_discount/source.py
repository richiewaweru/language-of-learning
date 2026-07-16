def apply_discount(price):
    factor = 0.9
    if price <= 0:
        return 0
    return price * factor
