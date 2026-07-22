def first_or_default(values, default):
    if not len(values) == 0:
        return values[0]
    return default

