def first_big(values):
    for value in values:
        if value > 100:
            return value
    return -1
