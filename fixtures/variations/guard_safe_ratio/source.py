def safe_ratio(value):
    scale = 2.5
    if value < 0:
        return 0
    return value * scale
